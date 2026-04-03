using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using EduManagement.Application.Common.Interfaces;
using EduManagement.Application.DTOs.VirtualClass;
using EduManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using EduManagement.Application.Common.Models;
using EduManagement.Application.Common.Exceptions;
using System.Text.RegularExpressions;
namespace EduManagement.Application.Features.VirtualClasses
{
    public class TeacherVirtualClassService
    {

        private readonly IAppDbContext _db;
        private readonly INotificationService _notificationService;

        public TeacherVirtualClassService(IAppDbContext db, INotificationService notificationService)
        {
            _db = db;
            _notificationService = notificationService;
        }
        public async Task<List<TeacherClassColorDto>> GetClassColorsAsync(int teacherId)
        {
            var data = await _db.TeacherClassColors
                .Where(x => x.TeacherId == teacherId)
                .Join(
                    _db.Classes,
                    color => color.ClassId,
                    cls => cls.ClassID,
                    (color, cls) => new TeacherClassColorDto
                    {
                        ClassId = color.ClassId,
                        ClassName = cls.ClassName,
                        ColorHex = color.ColorHex
                    }
                )
                .OrderBy(x => x.ClassName)
                .ToListAsync();

            return data;
        }

        private static bool IsValidHexColor(string color)
        {
            if (string.IsNullOrWhiteSpace(color)) return false;

            return Regex.IsMatch(color, "^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$");
        }

        public async Task UpsertClassColorAsync(int teacherId, UpsertTeacherClassColorRequest req)
        {
            if (req.ClassId <= 0)
                throw new ValidationException("ClassId không hợp lệ.");

            if (!IsValidHexColor(req.ColorHex))
                throw new ValidationException("Mã màu không hợp lệ. Ví dụ: #ff0000");

            var isAssigned = await _db.TeacherAssignments.AnyAsync(x =>
                x.TeacherId == teacherId &&
                x.ClassId == req.ClassId);

            if (!isAssigned)
                throw new ValidationException("Bạn không có quyền chọn màu cho lớp này.");

            var existing = await _db.TeacherClassColors.FirstOrDefaultAsync(x =>
                x.TeacherId == teacherId &&
                x.ClassId == req.ClassId);

            if (existing == null)
            {
                existing = new TeacherClassColor
                {
                    TeacherId = teacherId,
                    ClassId = req.ClassId,
                    ColorHex = req.ColorHex,
                    CreatedAtUtc = DateTime.UtcNow,
                    UpdatedAtUtc = DateTime.UtcNow
                };

                _db.TeacherClassColors.Add(existing);
            }
            else
            {
                existing.ColorHex = req.ColorHex;
                existing.UpdatedAtUtc = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
        }
        private static (DateTime startTime, DateTime endTime) BuildPeriodDateTime(DateTime studyDate, int period)
        {
            if (!PeriodTimeMap.TryGetValue(period, out var slot))
                throw new ValidationException("Tiết học không hợp lệ.");

            var date = studyDate.Date;
            var startTime = date.Add(slot.Start);
            var endTime = date.Add(slot.End);

            return (startTime, endTime);
        }
        private static void ValidateVirtualClassRequest(CreateVirtualClassRequest req)
        {
            if (req.ClassId <= 0)
                throw new ValidationException("Lớp không hợp lệ.");

            if (req.SubjectId <= 0)
                throw new ValidationException("Môn không hợp lệ.");

            if (string.IsNullOrWhiteSpace(req.MeetingUrl))
                throw new ValidationException("Vui lòng nhập link vào lớp.");

            if (req.Period < 1 || req.Period > 10)
                throw new ValidationException("Tiết học không hợp lệ.");

            if (req.StudyDate == default)
                throw new ValidationException("Ngày học không hợp lệ.");
        }

        private async Task EnsureNoDuplicateVirtualClassAsync(
    int teacherId,
    CreateVirtualClassRequest req,
    int? excludeId = null)
        {
            var studyDate = req.StudyDate.Date;

            var query = _db.VirtualClasses.Where(x =>
                x.TeacherId == teacherId &&
                x.ClassId == req.ClassId &&
                x.SubjectId == req.SubjectId &&
                x.StudyDate == studyDate &&
                x.Period == req.Period
            );

            if (excludeId.HasValue)
            {
                query = query.Where(x => x.VirtualClassID != excludeId.Value);
            }

            var exists = await query.AnyAsync();

            if (exists)
                throw new ValidationException("Đã tồn tại lớp học ảo trùng lớp, môn, ngày học và tiết.");
        }

        public async Task<int> CreateAsync(int teacherId, CreateVirtualClassRequest req)
        {
            ValidateVirtualClassRequest(req);

            var assignment = await _db.TeacherAssignments
                .FirstOrDefaultAsync(x =>
                    x.TeacherId == teacherId &&
                    x.ClassId == req.ClassId &&
                    x.SubjectId == req.SubjectId);

            if (assignment == null)
                throw new ValidationException("Bạn không được phân công lớp này.");

            await EnsureNoDuplicateVirtualClassAsync(teacherId, req);

            var (startTime, endTime) = BuildPeriodDateTime(req.StudyDate, req.Period);

            var vc = new VirtualClass
            {
                TeacherId = teacherId,
                ClassId = req.ClassId,
                SubjectId = req.SubjectId,
                MeetingUrl = req.MeetingUrl.Trim(),
                StudyDate = req.StudyDate.Date,
                Period = req.Period,
                StartTime = startTime,
                EndTime = endTime
            };

            _db.VirtualClasses.Add(vc);

            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                throw new ValidationException("Đã tồn tại lớp học ảo trùng lớp, môn, ngày học và tiết.");
            }

            // Case 1: luôn gửi thông báo "Lớp học ảo mới"
            await _notificationService.CreateVirtualClassCreatedNotificationsAsync(vc);

            // Case 3: nếu tạo muộn, đã qua mốc nhắc nhưng lớp chưa bắt đầu thì gửi reminder ngay
            var setting = await _notificationService.GetOrCreateSettingAsync();

            if (setting.VirtualClassReminderEnabled)
            {
                var offsets = _notificationService.ParseOffsets(setting.ReminderOffsetsCsv);
                var now = DateTime.Now;

                foreach (var offset in offsets)
                {
                    var reminderTime = vc.StartTime.AddMinutes(-offset);

                    if (now >= reminderTime && now < vc.StartTime)
                    {
                        await _notificationService.CreateVirtualClassReminderNotificationsAsync(vc, offset);
                    }
                }
            }

            return vc.VirtualClassID;
        }

        public async Task<PagedResult<VirtualClassListItemDto>> GetMineAsync(
    int teacherId,
    int page,
    int pageSize,
    string? sortBy,
    string? order)
        {
            page = page <= 0 ? 1 : page;
            pageSize = pageSize <= 0 ? 10 : Math.Min(pageSize, 100);

            var query =
                from vc in _db.VirtualClasses
                join c in _db.Classes on vc.ClassId equals c.ClassID
                join s in _db.Subjects on vc.SubjectId equals s.SubjectID
                where vc.TeacherId == teacherId
                select new VirtualClassListItemDto
                {
                    Id = vc.VirtualClassID,
                    ClassId = vc.ClassId,
                    SubjectId = vc.SubjectId,
                    ClassName = c.ClassName,
                    SubjectName = s.SubjectName,
                    MeetingUrl = vc.MeetingUrl,
                    StudyDate = vc.StudyDate,
                    Period = vc.Period,
                    StartTime = vc.StartTime,
                    EndTime = vc.EndTime,
                    CreatedAtUtc = vc.CreatedAtUtc
                };

            var isDesc = string.Equals(order, "desc", StringComparison.OrdinalIgnoreCase);

            query = (sortBy ?? "").Trim() switch
            {
                "className" => isDesc
                    ? query.OrderByDescending(x => x.ClassName)
                    : query.OrderBy(x => x.ClassName),

                "startTime" => isDesc
                    ? query.OrderByDescending(x => x.StartTime)
                    : query.OrderBy(x => x.StartTime),

                "status" => isDesc
    ? query.OrderByDescending(x =>
        DateTime.Now < x.StartTime ? 1 :
        (DateTime.Now > x.EndTime ? 3 : 2))
    : query.OrderBy(x =>
        DateTime.Now < x.StartTime ? 1 :
        (DateTime.Now > x.EndTime ? 3 : 2)),

                _ => query.OrderByDescending(x => x.StartTime)
            };

            var total = await query.CountAsync();

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<VirtualClassListItemDto>
            {
                Page = page,
                PageSize = pageSize,
                Total = total,
                Items = items
            };
        }

        public async Task DeleteAsync(int teacherId, int id)
        {
            var vc = await _db.VirtualClasses
                .FirstOrDefaultAsync(x => x.VirtualClassID == id && x.TeacherId == teacherId);

            if (vc == null)
                throw new ValidationException("Không tìm thấy lớp.");

            _db.VirtualClasses.Remove(vc);
            await _db.SaveChangesAsync();
        }

        public async Task<List<object>> GetMyClassesAsync(int teacherId)
        {
            var data = await (
                from ta in _db.TeacherAssignments
                join c in _db.Classes on ta.ClassId equals c.ClassID
                where ta.TeacherId == teacherId
                orderby c.ClassName
                select new
                {
                    id = c.ClassID,
                    name = c.ClassName,
                    year = c.ClassYear
                }
            )
            .Distinct()
            .ToListAsync();

            return data.Cast<object>().ToList();
        }

        public async Task<List<object>> GetMySubjectsAsync(int teacherId, int classId)
        {
            var data = await (
                from ta in _db.TeacherAssignments
                join s in _db.Subjects on ta.SubjectId equals s.SubjectID
                where ta.TeacherId == teacherId && ta.ClassId == classId
                orderby s.SubjectName
                select new
                {
                    id = s.SubjectID,
                    name = s.SubjectName
                }
            )
            .Distinct()
            .ToListAsync();

            return data.Cast<object>().ToList();
        }
        private static readonly Dictionary<int, (TimeSpan Start, TimeSpan End)> PeriodTimeMap = new()
{
    { 1, (new TimeSpan(7, 0, 0),  new TimeSpan(7, 45, 0)) },
    { 2, (new TimeSpan(7, 50, 0), new TimeSpan(8, 35, 0)) },
    { 3, (new TimeSpan(8, 50, 0), new TimeSpan(9, 35, 0)) },
    { 4, (new TimeSpan(9, 40, 0), new TimeSpan(10, 25, 0)) },
    { 5, (new TimeSpan(10, 30, 0), new TimeSpan(11, 15, 0)) },
    { 6, (new TimeSpan(13, 0, 0), new TimeSpan(13, 45, 0)) },
    { 7, (new TimeSpan(13, 50, 0), new TimeSpan(14, 35, 0)) },
    { 8, (new TimeSpan(14, 50, 0), new TimeSpan(15, 35, 0)) },
    { 9, (new TimeSpan(15, 40, 0), new TimeSpan(16, 25, 0)) },
    { 10, (new TimeSpan(16, 30, 0), new TimeSpan(17, 15, 0)) },
};
        public async Task UpdateAsync(int teacherId, int id, CreateVirtualClassRequest req)
        {
            ValidateVirtualClassRequest(req);

            var vc = await _db.VirtualClasses
                .FirstOrDefaultAsync(x => x.VirtualClassID == id && x.TeacherId == teacherId);

            if (vc == null)
                throw new ValidationException("Không tìm thấy lớp học.");

            var assignment = await _db.TeacherAssignments
                .FirstOrDefaultAsync(x =>
                    x.TeacherId == teacherId &&
                    x.ClassId == req.ClassId &&
                    x.SubjectId == req.SubjectId);

            if (assignment == null)
                throw new ValidationException("Bạn không được phân công lớp này.");

            await EnsureNoDuplicateVirtualClassAsync(teacherId, req, id);

            var (startTime, endTime) = BuildPeriodDateTime(req.StudyDate, req.Period);

            vc.ClassId = req.ClassId;
            vc.SubjectId = req.SubjectId;
            vc.MeetingUrl = req.MeetingUrl.Trim();
            vc.StudyDate = req.StudyDate.Date;
            vc.Period = req.Period;
            vc.StartTime = startTime;
            vc.EndTime = endTime;

            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                throw new ValidationException("Đã tồn tại lớp học ảo trùng lớp, môn, ngày học và tiết.");
            }
        }
    }
}
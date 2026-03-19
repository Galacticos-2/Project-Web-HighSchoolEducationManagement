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

namespace EduManagement.Application.Features.VirtualClasses
{
    public class TeacherVirtualClassService
    {
        private readonly IAppDbContext _db;

        public TeacherVirtualClassService(IAppDbContext db)
        {
            _db = db;
        }

        private static void ValidateVirtualClassTime(CreateVirtualClassRequest req)
        {
            if (req.StartTime >= req.EndTime)
                throw new ValidationException("Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.");
        }

        private async Task EnsureNoDuplicateVirtualClassAsync(
            int teacherId,
            CreateVirtualClassRequest req,
            int? excludeId = null)
        {
            var query = _db.VirtualClasses.Where(x =>
                x.TeacherId == teacherId &&
                x.ClassId == req.ClassId &&
                x.SubjectId == req.SubjectId &&
                x.StartTime == req.StartTime &&
                x.EndTime == req.EndTime
            );

            if (excludeId.HasValue)
            {
                query = query.Where(x => x.VirtualClassID != excludeId.Value);
            }

            var exists = await query.AnyAsync();

            if (exists)
                throw new ValidationException("Đã tồn tại lớp học ảo trùng lớp, môn và thời gian.");
        }

        public async Task<int> CreateAsync(int teacherId, CreateVirtualClassRequest req)
        {
            ValidateVirtualClassTime(req);

            var assignment = await _db.TeacherAssignments
                .FirstOrDefaultAsync(x =>
                    x.TeacherId == teacherId &&
                    x.ClassId == req.ClassId &&
                    x.SubjectId == req.SubjectId);

            if (assignment == null)
                throw new ValidationException("Bạn không được phân công lớp này.");

            await EnsureNoDuplicateVirtualClassAsync(teacherId, req);

            var vc = new VirtualClass
            {
                TeacherId = teacherId,
                ClassId = req.ClassId,
                SubjectId = req.SubjectId,
                MeetingUrl = req.MeetingUrl,
                StartTime = req.StartTime,
                EndTime = req.EndTime
            };

            _db.VirtualClasses.Add(vc);

            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                throw new ValidationException("Đã tồn tại lớp học ảo trùng lớp, môn và thời gian.");
            }

            return vc.VirtualClassID;
        }

        public async Task<PagedResult<VirtualClassListItemDto>> GetMineAsync(
            int teacherId,
            int page,
            int pageSize)
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
                    StartTime = vc.StartTime,
                    EndTime = vc.EndTime,
                    CreatedAtUtc = vc.CreatedAtUtc
                };

            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(x => x.StartTime)
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

        public async Task UpdateAsync(int teacherId, int id, CreateVirtualClassRequest req)
        {
            ValidateVirtualClassTime(req);

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

            vc.ClassId = req.ClassId;
            vc.SubjectId = req.SubjectId;
            vc.MeetingUrl = req.MeetingUrl;
            vc.StartTime = req.StartTime;
            vc.EndTime = req.EndTime;

            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                throw new ValidationException("Đã tồn tại lớp học ảo trùng lớp, môn và thời gian.");
            }
        }
    }
}
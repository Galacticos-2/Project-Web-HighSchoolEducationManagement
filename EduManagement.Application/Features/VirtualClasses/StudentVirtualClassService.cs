using System;
using System.Collections.Generic;
using System.Text;
using EduManagement.Application.Common.Interfaces;
using EduManagement.Application.DTOs.VirtualClass;
using Microsoft.EntityFrameworkCore;
using EduManagement.Application.Common.Models;
using System.Text.RegularExpressions;
using EduManagement.Application.Common.Exceptions;


namespace EduManagement.Application.Features.VirtualClasses
{
    public class StudentVirtualClassService
    {
        private readonly IAppDbContext _db;

        public StudentVirtualClassService(IAppDbContext db)
        {
            _db = db;
        }

        public async Task<PagedResult<VirtualClassListItemDto>> GetForStudentAsync(
            int studentId,
            int page,
            int pageSize,
            string? sortBy,
            string? order
        )
        {
            page = page <= 0 ? 1 : page;
            pageSize = pageSize <= 0 ? 10 : Math.Min(pageSize, 100);

            var student = await _db.Students
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.StudentID == studentId);

            if (student == null)
                throw new Exception($"Student {studentId} not found");

            if (student.ClassId == null)
            {
                return new PagedResult<VirtualClassListItemDto>
                {
                    Page = page,
                    PageSize = pageSize,
                    Total = 0,
                    Items = new List<VirtualClassListItemDto>()
                };
            }

            var classId = student.ClassId.Value;

            var query =
    from vc in _db.VirtualClasses
    join c in _db.Classes on vc.ClassId equals c.ClassID
    join s in _db.Subjects on vc.SubjectId equals s.SubjectID
    join t in _db.Teachers on vc.TeacherId equals t.TeacherID
    where vc.ClassId == classId
    select new VirtualClassListItemDto
    {
        Id = vc.VirtualClassID,
        ClassId = vc.ClassId,
        SubjectId = vc.SubjectId,
        ClassName = c.ClassName,
        SubjectName = s.SubjectName,
        TeacherName = t.TeacherName,
        MeetingUrl = vc.MeetingUrl,
        StudyDate = vc.StudyDate,
        Period = vc.Period,
        StartTime = vc.StartTime,
        EndTime = vc.EndTime,
        CreatedAtUtc = vc.CreatedAtUtc
    };

            var isDesc = string.Equals(order, "desc", StringComparison.OrdinalIgnoreCase);

            query = (sortBy ?? "").Trim().ToLower() switch
            {
                "classname" => isDesc
                    ? query.OrderByDescending(x => x.ClassName)
                    : query.OrderBy(x => x.ClassName),

                "subjectname" => isDesc
                    ? query.OrderByDescending(x => x.SubjectName)
                    : query.OrderBy(x => x.SubjectName),
                "teachername" => isDesc
    ? query.OrderByDescending(x => x.TeacherName)
    : query.OrderBy(x => x.TeacherName),
                "studydate" => isDesc
                    ? query.OrderByDescending(x => x.StudyDate)
                    : query.OrderBy(x => x.StudyDate),

                "period" => isDesc
                    ? query.OrderByDescending(x => x.Period)
                    : query.OrderBy(x => x.Period),

                "starttime" => isDesc
                    ? query.OrderByDescending(x => x.StartTime)
                    : query.OrderBy(x => x.StartTime),

                "endtime" => isDesc
                    ? query.OrderByDescending(x => x.EndTime)
                    : query.OrderBy(x => x.EndTime),

                "status" => isDesc
                    ? query.OrderByDescending(x =>
                        DateTime.Now < x.StartTime ? 1 :
                        (DateTime.Now > x.EndTime ? 3 : 2))
                    : query.OrderBy(x =>
                        DateTime.Now < x.StartTime ? 1 :
                        (DateTime.Now > x.EndTime ? 3 : 2)),

                _ => query.OrderBy(x => x.StartTime)
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


        private static bool IsValidHexColor(string color)
        {
            if (string.IsNullOrWhiteSpace(color)) return false;
            return Regex.IsMatch(color, "^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$");
        }

        public async Task<List<StudentSubjectColorDto>> GetSubjectColorsAsync(int studentId)
        {
            var student = await _db.Students
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.StudentID == studentId);

            if (student == null)
                throw new Exception($"Student {studentId} not found");

            if (student.ClassId == null)
                return new List<StudentSubjectColorDto>();

            var classId = student.ClassId.Value;

            var allowedSubjectIds = await (
                from vc in _db.VirtualClasses
                where vc.ClassId == classId
                select vc.SubjectId
            ).Distinct().ToListAsync();

            var data = await _db.StudentSubjectColors
                .Where(x => x.StudentId == studentId && allowedSubjectIds.Contains(x.SubjectId))
                .Join(
                    _db.Subjects,
                    color => color.SubjectId,
                    sub => sub.SubjectID,
                    (color, sub) => new StudentSubjectColorDto
                    {
                        SubjectId = color.SubjectId,
                        SubjectName = sub.SubjectName,
                        ColorHex = color.ColorHex
                    }
                )
                .OrderBy(x => x.SubjectName)
                .ToListAsync();

            return data;
        }

        public async Task UpsertSubjectColorAsync(int studentId, UpsertStudentSubjectColorRequest req)
        {
            if (req.SubjectId <= 0)
                throw new ValidationException("SubjectId không hợp lệ.");

            if (!IsValidHexColor(req.ColorHex))
                throw new ValidationException("Mã màu không hợp lệ. Ví dụ: #ff0000");

            var student = await _db.Students
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.StudentID == studentId);

            if (student == null)
                throw new ValidationException("Không tìm thấy học sinh.");

            if (student.ClassId == null)
                throw new ValidationException("Học sinh chưa được gán lớp.");

            var classId = student.ClassId.Value;

            var hasSubjectInSchedule = await _db.VirtualClasses.AnyAsync(x =>
                x.ClassId == classId &&
                x.SubjectId == req.SubjectId);

            if (!hasSubjectInSchedule)
                throw new ValidationException("Bạn không có quyền chọn màu cho môn này.");

            var existing = await _db.StudentSubjectColors.FirstOrDefaultAsync(x =>
                x.StudentId == studentId &&
                x.SubjectId == req.SubjectId);

            if (existing == null)
            {
                existing = new EduManagement.Domain.Entities.StudentSubjectColor
                {
                    StudentId = studentId,
                    SubjectId = req.SubjectId,
                    ColorHex = req.ColorHex,
                    CreatedAtUtc = DateTime.UtcNow,
                    UpdatedAtUtc = DateTime.UtcNow
                };

                _db.StudentSubjectColors.Add(existing);
            }
            else
            {
                existing.ColorHex = req.ColorHex;
                existing.UpdatedAtUtc = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
        }
    }
}
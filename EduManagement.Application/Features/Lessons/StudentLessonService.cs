using EduManagement.Application.Common.Interfaces;
using EduManagement.Application.DTOs.Common;
using EduManagement.Application.DTOs.Lessons;
using EduManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EduManagement.Application.Features.Lessons
{
    public class StudentLessonService
    {
        private readonly IAppDbContext _db;
        public StudentLessonService(IAppDbContext db) => _db = db;

        public async Task<PagedResult<LessonListItemDto>> GetLessonsForStudentAsync(
            int studentId,
            int page,
            int pageSize,
            string? q
        )
        {
            page = page <= 0 ? 1 : page;
            pageSize = pageSize <= 0 ? 10 : Math.Min(pageSize, 100);
            q = string.IsNullOrWhiteSpace(q) ? null : q.Trim();

            var student = await _db.Students.AsNoTracking()
                .FirstOrDefaultAsync(x => x.StudentID == studentId)
                ?? throw new Exception("Không tìm thấy học sinh.");

            if (student.ClassId == null)
                return new PagedResult<LessonListItemDto>
                {
                    Page = page,
                    PageSize = pageSize,
                    Total = 0,
                    Items = new List<LessonListItemDto>()
                };

            var classId = student.ClassId.Value;

            var query =
    from lesson in _db.Lessons.AsNoTracking()
    join ta in _db.TeacherAssignments.AsNoTracking()
        on new { lesson.TeacherId, lesson.ClassId, lesson.SubjectId }
        equals new { ta.TeacherId, ta.ClassId, ta.SubjectId }
    where lesson.Status == "Published"
          && ta.ClassId == classId
    select lesson;
            if (q != null)
            {
                query = query.Where(x =>
                    x.LessonTitle.Contains(q) ||
                    (x.LessonDescription != null && x.LessonDescription.Contains(q)));
            }
            if (q != null)
                query = query.Where(x => x.LessonTitle.Contains(q) ||
                    (x.LessonDescription != null && x.LessonDescription.Contains(q)));

            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(x => x.LessonID)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new LessonListItemDto
                {
                    Id = x.LessonID,
                    Title = x.LessonTitle,
                    Description = x.LessonDescription,
                    Status = x.Status,
                    FileName = x.FileName,
                    FileSize = x.FileSize,
                    ContentType = x.ContentType,
                    CreatedAtUtc = x.CreatedAtUtc.ToString("O"),
                })
                .ToListAsync();

            return new PagedResult<LessonListItemDto>
            {
                Page = page,
                PageSize = pageSize,
                Total = total,
                Items = items
            };
        }

        public async Task<Lesson> GetAllowedLessonForStudentAsync(int studentId, int lessonId)
        {
            var student = await _db.Students.AsNoTracking()
                .FirstOrDefaultAsync(x => x.StudentID == studentId)
                ?? throw new Exception("Không tìm thấy học sinh.");

            if (student.ClassId == null)
                throw new Exception("Học sinh chưa có lớp.");

            var classId = student.ClassId.Value;

            var lesson =
    await (
        from l in _db.Lessons
        join ta in _db.TeacherAssignments
            on new { l.TeacherId, l.ClassId, l.SubjectId }
            equals new { ta.TeacherId, ta.ClassId, ta.SubjectId }
        where l.LessonID == lessonId
              && l.Status == "Published"
              && ta.ClassId == classId
        select l
    ).FirstOrDefaultAsync()
    ?? throw new Exception("Bạn không có quyền với bài giảng này.");

            return lesson;
        }
    }
}
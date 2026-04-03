using EduManagement.Application.Common.Interfaces;
using EduManagement.Application.DTOs.Common;
using EduManagement.Application.DTOs.Lessons;
using EduManagement.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace EduManagement.Application.Features.Lessons
{
    public class TeacherLessonService
    {
        private readonly IAppDbContext _db;
        private readonly INotificationService _notificationService;

        public TeacherLessonService(IAppDbContext db, INotificationService notificationService)
        {
            _db = db;
            _notificationService = notificationService;
        }

        private static string Normalize(string input)
        {
            return input.Trim().ToLower();
        }

        public async Task<int> CreateAsync(
            int teacherId,
            CreateLessonRequest meta,
            IFormFile file,
            string storedFileName,
            string relativePath
        )
        {
            if (string.IsNullOrWhiteSpace(meta.Title))
                throw new Exception("Tên bài giảng không được trống.");

            var normalizedTitle = Normalize(meta.Title);

            var exists = await _db.Lessons
                .AnyAsync(x =>
                    x.TeacherId == teacherId &&
                    x.LessonTitle.ToLower().Trim() == normalizedTitle
                );

            if (exists)
                throw new Exception("Không được tạo 2 bài trùng nhau");

            if (file == null || file.Length <= 0)
                throw new Exception("Bạn chưa chọn file.");

            var assignment = await _db.TeacherAssignments
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.TeacherId == teacherId);

            if (assignment == null)
                throw new Exception("Bạn chưa được phân dạy lớp nào.");

            var lesson = new Lesson
            {
                LessonTitle = meta.Title.Trim(),
                LessonDescription = string.IsNullOrWhiteSpace(meta.Description) ? null : meta.Description.Trim(),
                TimeShouldLearn = NormalizeMinutes(meta.TimeShouldLearn),
                Status = string.IsNullOrWhiteSpace(meta.Status) ? "Draft" : meta.Status.Trim(),
                TeacherId = teacherId,
                ClassId = assignment.ClassId,
                SubjectId = assignment.SubjectId,
                FileName = file.FileName,
                StoredFileName = storedFileName,
                FilePath = relativePath,
                FileSize = file.Length,
                ContentType = file.ContentType,
                CreatedAtUtc = DateTime.UtcNow
            };

            _db.Lessons.Add(lesson);
            await _db.SaveChangesAsync();

            if (lesson.Status.Equals("Published", StringComparison.OrdinalIgnoreCase))
            {
                await _notificationService.CreateLessonUploadNotificationsAsync(lesson);
            }

            return lesson.LessonID;
        }

        public async Task<PagedResult<LessonListItemDto>> GetMyLessonsAsync(
            int teacherId,
            int page,
            int pageSize,
            string? status,
            string? q,
            string? sortBy,
            string? order
        )
        {
            page = page <= 0 ? 1 : page;
            pageSize = pageSize <= 0 ? 10 : Math.Min(pageSize, 100);

            status = string.IsNullOrWhiteSpace(status) ? null : status.Trim();
            q = string.IsNullOrWhiteSpace(q) ? null : q.Trim();

            var query = _db.Lessons.AsNoTracking()
                .Where(x => x.TeacherId == teacherId);

            if (status != null)
                query = query.Where(x => x.Status == status);

            if (q != null)
                query = query.Where(x => x.LessonTitle.ToLower().Contains(q.ToLower()));

            query = (sortBy?.Trim(), order?.Trim().ToLower()) switch
            {
                ("title", "asc") => query.OrderBy(x => x.LessonTitle),
                ("title", "desc") => query.OrderByDescending(x => x.LessonTitle),
                ("description", "asc") => query.OrderBy(x => x.LessonDescription),
                ("description", "desc") => query.OrderByDescending(x => x.LessonDescription),
                ("timeShouldLearn", "asc") => query.OrderBy(x => x.TimeShouldLearn),
                ("timeShouldLearn", "desc") => query.OrderByDescending(x => x.TimeShouldLearn),
                ("status", "asc") => query.OrderBy(x => x.Status),
                ("status", "desc") => query.OrderByDescending(x => x.Status),
                ("fileName", "asc") => query.OrderBy(x => x.FileName),
                ("fileName", "desc") => query.OrderByDescending(x => x.FileName),
                _ => query.OrderByDescending(x => x.LessonID)
            };

            var total = await query.CountAsync();

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new LessonListItemDto
                {
                    Id = x.LessonID,
                    Title = x.LessonTitle,
                    Description = x.LessonDescription,
                    TimeShouldLearn = x.TimeShouldLearn,
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

        public async Task<Lesson> GetOwnedLessonAsync(int teacherId, int lessonId)
        {
            var lesson = await _db.Lessons.FirstOrDefaultAsync(x => x.LessonID == lessonId)
                ?? throw new Exception("Không tìm thấy bài giảng.");

            if (lesson.TeacherId != teacherId)
                throw new Exception("Bạn không có quyền với bài giảng này.");

            return lesson;
        }

        public async Task UpdateAsync(
            int teacherId,
            int lessonId,
            CreateLessonRequest meta,
            IFormFile? file,
            string? storedFileName,
            string? relativePath
        )
        {
            var normalizedTitle = Normalize(meta.Title);

            var exists = await _db.Lessons
                .AnyAsync(x =>
                    x.TeacherId == teacherId &&
                    x.LessonID != lessonId &&
                    x.LessonTitle.ToLower().Trim() == normalizedTitle
                );

            if (exists)
                throw new Exception("Không được tạo 2 bài trùng nhau");

            var lesson = await GetOwnedLessonAsync(teacherId, lessonId);

            lesson.LessonTitle = meta.Title.Trim();
            lesson.LessonDescription = string.IsNullOrWhiteSpace(meta.Description) ? null : meta.Description.Trim();
            lesson.TimeShouldLearn = NormalizeMinutes(meta.TimeShouldLearn);

            var wasPublished = string.Equals(lesson.Status, "Published", StringComparison.OrdinalIgnoreCase);

            lesson.Status = string.IsNullOrWhiteSpace(meta.Status)
                ? "Draft"
                : meta.Status.Trim();

            if (file != null && file.Length > 0)
            {
                lesson.FileName = file.FileName;
                lesson.StoredFileName = storedFileName!;
                lesson.FilePath = relativePath!;
                lesson.FileSize = file.Length;
                lesson.ContentType = file.ContentType;
            }

            await _db.SaveChangesAsync();

            var isPublishedNow = string.Equals(lesson.Status, "Published", StringComparison.OrdinalIgnoreCase);

            if (!wasPublished && isPublishedNow)
            {
                await _notificationService.CreateLessonUploadNotificationsAsync(lesson);
            }
        }

        public async Task<string> DeleteAsync(int teacherId, int lessonId)
        {
            var lesson = await GetOwnedLessonAsync(teacherId, lessonId);

            var filePath = lesson.FilePath;
            _db.Lessons.Remove(lesson);
            await _db.SaveChangesAsync();

            return filePath;
        }

        private static string? NormalizeMinutes(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;

            var trimmed = value.Trim();

            if (!int.TryParse(trimmed, out var minutes))
                throw new Exception("Thời lượng dự kiến chỉ được nhập số.");

            if (minutes <= 0)
                throw new Exception("Thời lượng dự kiến phải lớn hơn 0.");

            return minutes.ToString();
        }
    }
}
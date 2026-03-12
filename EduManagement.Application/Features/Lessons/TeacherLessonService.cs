using System;
using System.Collections.Generic;
using System.Text;
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

        public TeacherLessonService(IAppDbContext db) => _db = db;

        //Create a new lesson for the teacher, return the new lesson's ID
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

            if (file == null || file.Length <= 0)
                throw new Exception("Bạn chưa chọn file.");

            // Lấy lớp + môn mà teacher được assign
            var assignment = await _db.TeacherAssignments
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.TeacherId == teacherId);

            if (assignment == null)
                throw new Exception("Bạn chưa được phân dạy lớp nào.");

            var lesson = new Lesson
            {
                LessonTitle = meta.Title.Trim(),
                LessonDescription = string.IsNullOrWhiteSpace(meta.Description) ? null : meta.Description.Trim(),
                TimeShouldLearn = string.IsNullOrWhiteSpace(meta.TimeShouldLearn) ? null : meta.TimeShouldLearn.Trim(),
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
            //Save to database
            _db.Lessons.Add(lesson);
            await _db.SaveChangesAsync();

            return lesson.LessonID;
        }
        //Get list of lessons of the teacher with pagination, filtering by status and searching by title/description
        public async Task<PagedResult<LessonListItemDto>> GetMyLessonsAsync(
            int teacherId,
            int page,
            int pageSize,
            string? status,
            string? q
        )
        {
            page = page <= 0 ? 1 : page;
            pageSize = pageSize <= 0 ? 10 : Math.Min(pageSize, 100);

            status = string.IsNullOrWhiteSpace(status) ? null : status.Trim();
            q = string.IsNullOrWhiteSpace(q) ? null : q.Trim();

            var query = _db.Lessons.AsNoTracking().Where(x => x.TeacherId == teacherId);

            if (status != null)
                query = query.Where(x => x.Status == status);

            if (q != null)
                query = query.Where(x => x.LessonTitle.Contains(q) || (x.LessonDescription != null && x.LessonDescription.Contains(q)));

            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(x => x.LessonID)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)

                //Convert to DTO
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
        //Get a lesson by ID, only if it belongs to the teacher
        public async Task<Lesson> GetOwnedLessonAsync(int teacherId, int lessonId)
        {
            var lesson = await _db.Lessons.FirstOrDefaultAsync(x => x.LessonID == lessonId)
                ?? throw new Exception("Không tìm thấy bài giảng.");

            if (lesson.TeacherId != teacherId)
                throw new Exception("Bạn không có quyền với bài giảng này.");

            return lesson;
        }
        //Update lesson metadata
        public async Task UpdateAsync(int teacherId, int lessonId, CreateLessonRequest meta)
        {
            var lesson = await GetOwnedLessonAsync(teacherId, lessonId);

            lesson.LessonTitle = meta.Title.Trim();

            lesson.LessonDescription = string.IsNullOrWhiteSpace(meta.Description)
                ? null
                : meta.Description.Trim();

            lesson.TimeShouldLearn = string.IsNullOrWhiteSpace(meta.TimeShouldLearn)
                ? null
                : meta.TimeShouldLearn.Trim();

            lesson.Status = string.IsNullOrWhiteSpace(meta.Status)
                ? "Draft"
                : meta.Status.Trim();

            await _db.SaveChangesAsync();
        }


        //Delete lesson
        public async Task<string> DeleteAsync(int teacherId, int lessonId)
        {
            var lesson = await GetOwnedLessonAsync(teacherId, lessonId);

            var filePath = lesson.FilePath;

            _db.Lessons.Remove(lesson);

            await _db.SaveChangesAsync();

            return filePath; //trả path để controller xóa file
        }
    }
}

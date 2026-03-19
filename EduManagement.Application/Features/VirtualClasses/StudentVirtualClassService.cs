using System;
using System.Collections.Generic;
using System.Text;
using EduManagement.Application.Common.Interfaces;
using EduManagement.Application.DTOs.VirtualClass;
using Microsoft.EntityFrameworkCore;
using EduManagement.Application.Common.Models;

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
            int pageSize
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
                where vc.ClassId == classId
                select new VirtualClassListItemDto
                {
                    Id = vc.VirtualClassID,
                    ClassName = c.ClassName,
                    SubjectName = s.SubjectName,
                    MeetingUrl = vc.MeetingUrl,
                    StartTime = vc.StartTime,
                    EndTime = vc.EndTime
                };

            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(x => x.StartTime)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var totalPages = (int)Math.Ceiling(total / (double)pageSize);

            return new PagedResult<VirtualClassListItemDto>
            {
                Page = page,
                PageSize = pageSize,
                Total = total,
                
                Items = items
            };
        }
    }
}
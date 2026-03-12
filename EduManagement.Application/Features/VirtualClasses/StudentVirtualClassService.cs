using System;
using System.Collections.Generic;
using System.Text;
using EduManagement.Application.Common.Interfaces;
using EduManagement.Application.DTOs.VirtualClass;
using Microsoft.EntityFrameworkCore;
namespace EduManagement.Application.Features.VirtualClasses
{
    public class StudentVirtualClassService
    {
        private readonly IAppDbContext _db;

        public StudentVirtualClassService(IAppDbContext db)
        {
            _db = db;
        }

        public async Task<List<VirtualClassListItemDto>> GetForStudentAsync(int studentId)
        {
            var student = await _db.Students
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.StudentID == studentId);

            if (student == null)
                throw new Exception($"Student {studentId} not found");

            if (student.ClassId == null)
                return new List<VirtualClassListItemDto>();

            var classId = student.ClassId.Value;

            return await (
                from vc in _db.VirtualClasses
                join c in _db.Classes on vc.ClassId equals c.ClassID
                join s in _db.Subjects on vc.SubjectId equals s.SubjectID
                where vc.ClassId == classId
                orderby vc.StartTime descending
                select new VirtualClassListItemDto
                {
                    Id = vc.VirtualClassID,
                    ClassName = c.ClassName,
                    SubjectName = s.SubjectName,
                    MeetingUrl = vc.MeetingUrl,
                    StartTime = vc.StartTime,
                    EndTime = vc.EndTime
                }
            ).ToListAsync();
        }
    }
}

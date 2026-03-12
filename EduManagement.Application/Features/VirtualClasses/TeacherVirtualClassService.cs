using System;
using System.Collections.Generic;
using System.Text;
using EduManagement.Application.Common.Interfaces;
using EduManagement.Application.DTOs.VirtualClass;
using EduManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
namespace EduManagement.Application.Features.VirtualClasses
{
    public class TeacherVirtualClassService
    {
        private readonly IAppDbContext _db;

        public TeacherVirtualClassService(IAppDbContext db)
        {
            _db = db;
        }

        public async Task<int> CreateAsync(int teacherId, CreateVirtualClassRequest req)
        {
            var assignment = await _db.TeacherAssignments
                .FirstOrDefaultAsync(x =>
                    x.TeacherId == teacherId &&
                    x.ClassId == req.ClassId &&
                    x.SubjectId == req.SubjectId);

            if (assignment == null)
                throw new Exception("Bạn không được phân công lớp này.");

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

            await _db.SaveChangesAsync();

            return vc.VirtualClassID;
        }

        public async Task<List<VirtualClassListItemDto>> GetMineAsync(int teacherId)
        {
            return await (
                from vc in _db.VirtualClasses
                join c in _db.Classes on vc.ClassId equals c.ClassID
                join s in _db.Subjects on vc.SubjectId equals s.SubjectID
                where vc.TeacherId == teacherId
                orderby vc.StartTime descending
                select new VirtualClassListItemDto
                {
                    Id = vc.VirtualClassID,
                    ClassName = c.ClassName,
                    SubjectName = s.SubjectName,
                    MeetingUrl = vc.MeetingUrl,
                    StartTime = vc.StartTime,
                    EndTime = vc.EndTime,
                    CreatedAtUtc = vc.CreatedAtUtc
                }
            ).ToListAsync();
        }

        public async Task DeleteAsync(int teacherId, int id)
        {
            var vc = await _db.VirtualClasses
                .FirstOrDefaultAsync(x => x.VirtualClassID == id && x.TeacherId == teacherId);

            if (vc == null)
                throw new Exception("Không tìm thấy lớp.");

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
            var vc = await _db.VirtualClasses
                .FirstOrDefaultAsync(x => x.VirtualClassID == id && x.TeacherId == teacherId);

            if (vc == null)
                throw new Exception("Không tìm thấy lớp học.");

            var assignment = await _db.TeacherAssignments
                .FirstOrDefaultAsync(x =>
                    x.TeacherId == teacherId &&
                    x.ClassId == req.ClassId &&
                    x.SubjectId == req.SubjectId);

            if (assignment == null)
                throw new Exception("Bạn không được phân công lớp này.");

            vc.ClassId = req.ClassId;
            vc.SubjectId = req.SubjectId;
            vc.MeetingUrl = req.MeetingUrl;
            vc.StartTime = req.StartTime;
            vc.EndTime = req.EndTime;

            await _db.SaveChangesAsync();
        }
    }
}

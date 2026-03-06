using EduManagement.Application.Common.Interfaces;
using EduManagement.Application.DTOs.Admin;
using EduManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EduManagement.Application.Features.AdminApproval;

public class AdminAssignmentService
{
    private readonly IAppDbContext _db;

    public AdminAssignmentService(IAppDbContext db)
    {
        _db = db;
    }

    public async Task AssignAsync(AssignTeacherRequest req)
    {
        if (req.ClassIds == null || !req.ClassIds.Any())
            throw new Exception("Chưa chọn lớp.");

        var teacherExists = await _db.Teachers.AnyAsync(x => x.TeacherID == req.TeacherId);
        if (!teacherExists)
            throw new Exception("Teacher không tồn tại.");

        var subjectExists = await _db.Subjects.AnyAsync(x => x.SubjectID == req.SubjectId);
        if (!subjectExists)
            throw new Exception("Subject không tồn tại.");

        foreach (var classId in req.ClassIds)
        {
            var exists = await _db.TeacherAssignments.AnyAsync(x =>
                x.TeacherId == req.TeacherId &&
                x.ClassId == classId &&
                x.SubjectId == req.SubjectId
            );

            if (exists) continue;

            _db.TeacherAssignments.Add(new TeacherAssignment
            {
                TeacherId = req.TeacherId,
                ClassId = classId,
                SubjectId = req.SubjectId,
                CreatedAtUtc = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync();
    }
}
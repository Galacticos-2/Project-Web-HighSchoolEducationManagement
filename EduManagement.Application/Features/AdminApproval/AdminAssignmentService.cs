using EduManagement.Application.Common.Interfaces;
using EduManagement.Application.DTOs.Admin;
using EduManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EduManagement.Application.Features.AdminApproval;

public class AdminAssignmentService
{
    private readonly IUnitOfWork _uow;

    public AdminAssignmentService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task AssignAsync(AssignTeacherRequest req)
    {
        if (req.ClassIds == null || !req.ClassIds.Any())
            throw new Exception("Chưa chọn lớp.");

        var teacherExists = await _uow.Teachers.AnyAsync(x => x.TeacherID == req.TeacherId);
        if (!teacherExists)
            throw new Exception("Teacher không tồn tại.");

        var subjectExists = await _uow.Subjects.AnyAsync(x => x.SubjectID == req.SubjectId);
        if (!subjectExists)
            throw new Exception("Subject không tồn tại.");

        foreach (var classId in req.ClassIds)
        {
            var exists = await _uow.TeacherAssignments.AnyAsync(x =>
                x.TeacherId == req.TeacherId &&
                x.ClassId == classId &&
                x.SubjectId == req.SubjectId
            );

            if (exists) continue;

            await _uow.TeacherAssignments.AddAsync(new TeacherAssignment
            {
                TeacherId = req.TeacherId,
                ClassId = classId,
                SubjectId = req.SubjectId,
                CreatedAtUtc = DateTime.UtcNow
            });
        }

        await _uow.SaveChangesAsync();
    }
}
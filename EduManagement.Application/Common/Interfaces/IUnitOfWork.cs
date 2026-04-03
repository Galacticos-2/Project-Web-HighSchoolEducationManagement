using EduManagement.Domain.Entities;

namespace EduManagement.Application.Common.Interfaces;

public interface IUnitOfWork
{
    IGenericRepository<Admin> Admins { get; }
    IGenericRepository<Teacher> Teachers { get; }
    IGenericRepository<Student> Students { get; }
    IGenericRepository<Class> Classes { get; }
    IGenericRepository<Subject> Subjects { get; }
    IGenericRepository<PendingAccount> PendingAccounts { get; }
    IGenericRepository<TeacherAssignment> TeacherAssignments { get; }
    IGenericRepository<Lesson> Lessons { get; }
    IGenericRepository<VirtualClass> VirtualClasses { get; }
    IGenericRepository<Notification> Notifications { get; }
    IGenericRepository<NotificationSetting> NotificationSettings { get; }
    IGenericRepository<StudentSubjectColor> StudentSubjectColors { get; }
    IGenericRepository<TeacherClassColor> TeacherClassColors { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
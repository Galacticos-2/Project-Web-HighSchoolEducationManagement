using EduManagement.Application.Common.Interfaces;
using EduManagement.Domain.Entities;
using EduManagement.Infrastructure.Persistence.Repositories;

namespace EduManagement.Infrastructure.Persistence;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;

    public UnitOfWork(AppDbContext context)
    {
        _context = context;

        Admins = new GenericRepository<Admin>(_context);
        Teachers = new GenericRepository<Teacher>(_context);
        Students = new GenericRepository<Student>(_context);
        Classes = new GenericRepository<Class>(_context);
        Subjects = new GenericRepository<Subject>(_context);
        PendingAccounts = new GenericRepository<PendingAccount>(_context);
        TeacherAssignments = new GenericRepository<TeacherAssignment>(_context);
        Lessons = new GenericRepository<Lesson>(_context);
        VirtualClasses = new GenericRepository<VirtualClass>(_context);
        Notifications = new GenericRepository<Notification>(_context);
        NotificationSettings = new GenericRepository<NotificationSetting>(_context);
        StudentSubjectColors = new GenericRepository<StudentSubjectColor>(_context);
        TeacherClassColors = new GenericRepository<TeacherClassColor>(_context);
    }

    public IGenericRepository<Admin> Admins { get; }
    public IGenericRepository<Teacher> Teachers { get; }
    public IGenericRepository<Student> Students { get; }
    public IGenericRepository<Class> Classes { get; }
    public IGenericRepository<Subject> Subjects { get; }
    public IGenericRepository<PendingAccount> PendingAccounts { get; }
    public IGenericRepository<TeacherAssignment> TeacherAssignments { get; }
    public IGenericRepository<Lesson> Lessons { get; }
    public IGenericRepository<VirtualClass> VirtualClasses { get; }
    public IGenericRepository<Notification> Notifications { get; }
    public IGenericRepository<NotificationSetting> NotificationSettings { get; }
    public IGenericRepository<StudentSubjectColor> StudentSubjectColors { get; }
    public IGenericRepository<TeacherClassColor> TeacherClassColors { get; }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => _context.SaveChangesAsync(cancellationToken);
}
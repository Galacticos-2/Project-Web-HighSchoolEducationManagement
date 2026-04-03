using System;
using System.Collections.Generic;
using System.Text;

using EduManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;


namespace EduManagement.Application.Common.Interfaces;

public interface IAppDbContext
{
    // Khai báo DbSet cho các entity
    public DbSet<VirtualClass> VirtualClasses { get; }
    DbSet<Subject> Subjects { get; }
    DbSet<Admin> Admins { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<NotificationSetting> NotificationSettings { get; }
    DbSet<Teacher> Teachers { get; }
    DbSet<Student> Students { get; }
    DbSet<StudentSubjectColor> StudentSubjectColors { get; }
    DbSet<TeacherAssignment> TeacherAssignments { get; }
    DbSet<PendingAccount> PendingAccounts { get; }
    DbSet<Class> Classes { get; }
    DbSet<TeacherClassColor> TeacherClassColors { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    public DbSet<Lesson> Lessons { get; }
}

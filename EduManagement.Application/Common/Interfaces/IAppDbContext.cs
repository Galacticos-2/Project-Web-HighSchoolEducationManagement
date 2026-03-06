using System;
using System.Collections.Generic;
using System.Text;

using EduManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using EduManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;


namespace EduManagement.Application.Common.Interfaces;

public interface IAppDbContext
{
    // Khai báo DbSet cho các entity
    DbSet<Subject> Subjects { get; }
    DbSet<Admin> Admins { get; }
    DbSet<Teacher> Teachers { get; }
    DbSet<Student> Students { get; }
    DbSet<TeacherAssignment> TeacherAssignments { get; }
    DbSet<PendingAccount> PendingAccounts { get; }
    DbSet<Class> Classes { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    public DbSet<Lesson> Lessons { get; }
}

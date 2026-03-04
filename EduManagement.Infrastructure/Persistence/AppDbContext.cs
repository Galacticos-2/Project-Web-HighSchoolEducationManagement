using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text;
using EduManagement.Application.Common.Interfaces;

using EduManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
namespace EduManagement.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Admin> Admins => Set<Admin>();
    public DbSet<Teacher> Teachers => Set<Teacher>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<PendingAccount> PendingAccounts => Set<PendingAccount>();
    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<Class> Classes => Set<Class>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Map table names đúng theo ERD
        modelBuilder.Entity<Admin>().ToTable("Admin").HasKey(x => x.AdminID);
        modelBuilder.Entity<Teacher>().ToTable("Teacher").HasKey(x => x.TeacherID);
        modelBuilder.Entity<Student>().ToTable("Student").HasKey(x => x.StudentID);

        modelBuilder.Entity<Admin>().Property(x => x.AdminName).HasMaxLength(100).IsRequired();
        modelBuilder.Entity<Admin>().Property(x => x.AdminEmail).HasMaxLength(150).IsRequired();
        modelBuilder.Entity<Admin>().Property(x => x.AdminPassword).HasMaxLength(200).IsRequired();

        modelBuilder.Entity<Teacher>().Property(x => x.TeacherName).HasMaxLength(100).IsRequired();
        modelBuilder.Entity<Teacher>().Property(x => x.TeacherEmail).HasMaxLength(150).IsRequired();
        modelBuilder.Entity<Teacher>().Property(x => x.TeacherPassword).HasMaxLength(200).IsRequired();

        modelBuilder.Entity<Student>().Property(x => x.StudentName).HasMaxLength(100).IsRequired();
        modelBuilder.Entity<Student>().Property(x => x.StudentEmail).HasMaxLength(150).IsRequired();
        modelBuilder.Entity<Student>().Property(x => x.StudentPassword).HasMaxLength(200).IsRequired();

        // Unique email để login không bị trùng
        modelBuilder.Entity<Admin>().HasIndex(x => x.AdminEmail).IsUnique();
        modelBuilder.Entity<Teacher>().HasIndex(x => x.TeacherEmail).IsUnique();
        modelBuilder.Entity<Student>().HasIndex(x => x.StudentEmail).IsUnique();

        modelBuilder.Entity<Class>().ToTable("Class").HasKey(x => x.ClassID); // hoặc ClassId tuỳ entity
        modelBuilder.Entity<Class>().Property(x => x.ClassName).HasMaxLength(100).IsRequired();
        modelBuilder.Entity<Class>().Property(x => x.ClassYear).HasMaxLength(50).IsRequired();
        // Quan hệ 1 Class - nhiều Students
        modelBuilder.Entity<Student>()
            .HasOne(s => s.Class)
            .WithMany(c => c.Students)
            .HasForeignKey(s => s.ClassId) // đúng property bạn thêm
            .OnDelete(DeleteBehavior.Restrict);

        // PendingAccount lưu ClassId để admin thấy lúc duyệt
        modelBuilder.Entity<PendingAccount>()
            .Property(x => x.ClassId)
            .IsRequired(false);
        modelBuilder.Entity<Teacher>()
    .Property(x => x.IsApproved)
    .HasDefaultValue(false);

        modelBuilder.Entity<Student>()
            .Property(x => x.IsApproved)
            .HasDefaultValue(false);
        modelBuilder.Entity<PendingAccount>().ToTable("PendingAccount").HasKey(x => x.PendingAccountID);

        modelBuilder.Entity<PendingAccount>().Property(x => x.Role).HasMaxLength(20).IsRequired();
        modelBuilder.Entity<PendingAccount>().Property(x => x.FullName).HasMaxLength(100).IsRequired();
        modelBuilder.Entity<PendingAccount>().Property(x => x.Email).HasMaxLength(150).IsRequired();
        modelBuilder.Entity<PendingAccount>().Property(x => x.PasswordHash).HasMaxLength(200).IsRequired();

        // unique email trong bảng pending để không spam
        modelBuilder.Entity<PendingAccount>().HasIndex(x => x.Email).IsUnique();
        modelBuilder.Entity<Lesson>().ToTable("Lesson").HasKey(x => x.LessonID);

        modelBuilder.Entity<Lesson>().Property(x => x.LessonTitle).HasMaxLength(200).IsRequired();
        modelBuilder.Entity<Lesson>().Property(x => x.Status).HasMaxLength(20).IsRequired();

        modelBuilder.Entity<Lesson>().Property(x => x.FileName).HasMaxLength(255).IsRequired();
        modelBuilder.Entity<Lesson>().Property(x => x.StoredFileName).HasMaxLength(255).IsRequired();
        modelBuilder.Entity<Lesson>().Property(x => x.FilePath).HasMaxLength(500).IsRequired();
        modelBuilder.Entity<Lesson>().Property(x => x.ContentType).HasMaxLength(100).IsRequired();
    }
}

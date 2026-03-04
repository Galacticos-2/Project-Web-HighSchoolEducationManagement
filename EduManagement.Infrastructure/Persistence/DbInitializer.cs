using EduManagement.Application.Common.Interfaces;
using EduManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace EduManagement.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task SeedAdminAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();

        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        // Migrate database
        await db.Database.MigrateAsync();
        if (!await db.Classes.AnyAsync())
        {
            db.Classes.AddRange(
                new Class { ClassName = "10A1", ClassYear = "2024-2027" },
                new Class { ClassName = "10A2", ClassYear = "2024-2027" },
                new Class { ClassName = "11A1", ClassYear = "2023-2026" }
            );

            await db.SaveChangesAsync();
        }
        // Nếu đã có admin thì không tạo nữa
        if (await db.Admins.AnyAsync())
            return;

        var admin = new Admin
        {
            AdminName = "Super Admin",
            AdminEmail = "admin@gmail.com",
            AdminPassword = hasher.Hash("adminaa"),
            AdminBirthday = null,
            AdminPhoneNumber = null
        };

        db.Admins.Add(admin);
        await db.SaveChangesAsync();
    }
}
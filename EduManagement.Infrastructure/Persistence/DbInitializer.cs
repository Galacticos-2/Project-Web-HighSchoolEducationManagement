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

        // ===== Seed / Update Classes =====
        var classes = new List<Class>
        {
            new Class { ClassName = "10A1", ClassYear = "2019-2020" },
            new Class { ClassName = "10A2", ClassYear = "2019-2020" },
            new Class { ClassName = "10A3", ClassYear = "2019-2020" },
            new Class { ClassName = "10A4", ClassYear = "2019-2020" },
            new Class { ClassName = "10A5", ClassYear = "2019-2020" },
            new Class { ClassName = "11A1", ClassYear = "2019-2020" },
            new Class { ClassName = "11A2", ClassYear = "2019-2020" },
            new Class { ClassName = "11A3", ClassYear = "2019-2020" },
            new Class { ClassName = "11A4", ClassYear = "2019-2020" },
            new Class { ClassName = "11A5", ClassYear = "2019-2022" },
            new Class { ClassName = "12A1", ClassYear = "2019-2020" },
            new Class { ClassName = "12A2", ClassYear = "2019-2020" },
            new Class { ClassName = "12A3", ClassYear = "2019-2020" },
            new Class { ClassName = "12A4", ClassYear = "2019-2020" },
            new Class { ClassName = "12A5", ClassYear = "2019-2020" }
        };

        foreach (var cls in classes)
        {
            var existing = await db.Classes
                .FirstOrDefaultAsync(x => x.ClassName == cls.ClassName);

            if (existing == null)
            {
                db.Classes.Add(cls); // nếu chưa có thì thêm
            }
            else
            {
                existing.ClassYear = cls.ClassYear; // nếu có rồi thì update
            }
        }

        await db.SaveChangesAsync();


        // ===== Seed / Update Subjects =====
        var subjects = new List<Subject>
{
    new Subject { SubjectName = "Tiếng Anh" },
    new Subject { SubjectName = "Toán" },
    new Subject { SubjectName = "Ngữ Văn" },
    new Subject { SubjectName = "Vật Lí" },
    new Subject { SubjectName = "Hóa Học" }
};

        foreach (var subject in subjects)
        {
            var existing = await db.Subjects
                .FirstOrDefaultAsync(x => x.SubjectName == subject.SubjectName);

            if (existing == null)
            {
                db.Subjects.Add(subject); // nếu chưa có thì thêm
            }
        }

        await db.SaveChangesAsync();
        // ===== Seed Admin =====
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
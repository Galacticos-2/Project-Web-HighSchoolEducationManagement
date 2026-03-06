using EduManagement.Application.Common.Interfaces;
using EduManagement.Application.DTOs.Admin;
using EduManagement.Application.DTOs.Common;
using EduManagement.Domain.Entities;
using EduManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EduManagement.Application.Features.AdminApproval;

public class AdminApprovalService
{
    private readonly IAppDbContext _db;
    public AdminApprovalService(IAppDbContext db) => _db = db;

    public async Task<List<PendingAccountDto>> GetPendingAsync()
    {
        return await (
            from p in _db.PendingAccounts.AsNoTracking()
            join c in _db.Classes.AsNoTracking() on p.ClassId equals c.ClassID into gj
            from c in gj.DefaultIfEmpty()
            orderby p.CreatedAtUtc descending
            select new PendingAccountDto
            {
                Role = p.Role,
                Id = p.PendingAccountID,
                FullName = p.FullName,
                Email = p.Email,
                BirthDate = p.BirthDate,
                PhoneNumber = p.PhoneNumber,
                IsApproved = false,

                ClassId = p.ClassId,
                ClassName = c != null ? c.ClassName : null
            }
        ).ToListAsync();
    }
    public async Task ApproveAsync(int pendingId)
    {
        var p = await _db.PendingAccounts.FirstOrDefaultAsync(x => x.PendingAccountID == pendingId)
            ?? throw new Exception("Không tìm thấy đơn đăng ký.");

        var role = (p.Role ?? "").Trim();

        if (role == "Teacher")
        {
            _db.Teachers.Add(new Teacher
            {
                TeacherName = p.FullName,
                TeacherBirthday = p.BirthDate,
                TeacherEmail = p.Email,
                TeacherPassword = p.PasswordHash,
                TeacherPhoneNumber = p.PhoneNumber,
                IsApproved = true
            });
        }
        else if (role == "Student")
        {
            if (p.ClassId == null || p.ClassId <= 0)
                throw new Exception("Đơn đăng ký học sinh thiếu thông tin lớp.");

            // (khuyến nghị) check lớp tồn tại
            var classExists = await _db.Classes.AnyAsync(c => c.ClassID == p.ClassId.Value);
            if (!classExists) throw new Exception("Lớp học không tồn tại.");

            _db.Students.Add(new Student
            {
                StudentName = p.FullName,
                StudentBirthday = p.BirthDate,
                StudentEmail = p.Email,
                StudentPassword = p.PasswordHash,
                PhoneNumber = p.PhoneNumber,
                IsApproved = true,

                // ✅ NEW
                ClassId = p.ClassId
            });
        }
        else
        {
            throw new Exception("Role không hợp lệ.");
        }

        _db.PendingAccounts.Remove(p);
        await _db.SaveChangesAsync();
    }

    public async Task RejectAsync(int pendingId)
    {
        var p = await _db.PendingAccounts.FirstOrDefaultAsync(x => x.PendingAccountID == pendingId)
            ?? throw new Exception("Không tìm thấy đơn đăng ký.");

        _db.PendingAccounts.Remove(p);
        await _db.SaveChangesAsync();
    }

    public async Task<AdminDashboardSummaryDto> GetSummaryAsync()
    {
        return new AdminDashboardSummaryDto
        {
            AdminCount = await _db.Admins.CountAsync(),
            TeacherCount = await _db.Teachers.CountAsync(),
            StudentCount = await _db.Students.CountAsync(),
            PendingCount = await _db.PendingAccounts.CountAsync(),
        };
    }

    public async Task<PagedResult<AccountListItemDto>> GetAccountsAsync(
        string role,
        int page = 1,
        int pageSize = 10,
        string? q = null
    )
    {
        page = page <= 0 ? 1 : page;
        pageSize = pageSize <= 0 ? 10 : Math.Min(pageSize, 100);

        q = string.IsNullOrWhiteSpace(q) ? null : q.Trim();

        if (role == UserRole.Admin)
        {
            var query = _db.Admins.AsNoTracking();

            if (q != null)
                query = query.Where(x => x.AdminName.Contains(q) || x.AdminEmail.Contains(q));

            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(x => x.AdminID)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new AccountListItemDto
                {
                    Role = UserRole.Admin,
                    Id = x.AdminID,
                    FullName = x.AdminName,
                    Email = x.AdminEmail,
                    PhoneNumber = x.AdminPhoneNumber == null ? "" : x.AdminPhoneNumber.ToString(),
                    IsApproved = null
                })
                .ToListAsync();

            return new PagedResult<AccountListItemDto>
            {
                Page = page,
                PageSize = pageSize,
                Total = total,
                Items = items
            };
        }

        if (role == UserRole.Teacher)
        {
            var query = _db.Teachers.AsNoTracking();

            if (q != null)
                query = query.Where(x => x.TeacherName.Contains(q) || x.TeacherEmail.Contains(q));

            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(x => x.TeacherID)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new AccountListItemDto
                {
                    Role = UserRole.Teacher,
                    Id = x.TeacherID,
                    FullName = x.TeacherName,
                    Email = x.TeacherEmail,
                    PhoneNumber = x.TeacherPhoneNumber == null ? "" : x.TeacherPhoneNumber.ToString(),
                    IsApproved = x.IsApproved,

                    AssignedClasses = _db.TeacherAssignments
                        .Where(a => a.TeacherId == x.TeacherID)
                        .Join(
                            _db.Classes,
                            a => a.ClassId,
                            c => c.ClassID,
                            (a, c) => c.ClassName
                        )
                        .Distinct()
                        .ToList(),
                    AssignedSubjects = _db.TeacherAssignments
                        .Where(a => a.TeacherId == x.TeacherID)
                        .Join(
                            _db.Subjects,
                            a => a.SubjectId,
                            s => s.SubjectID,
                            (a, s) => s.SubjectName
                        )
            .Distinct()
            .ToList()

                })
                .ToListAsync();

            return new PagedResult<AccountListItemDto>
            {
                Page = page,
                PageSize = pageSize,
                Total = total,
                Items = items
            };
        }

        if (role == UserRole.Student)
        {
            var query =
                from s in _db.Students.AsNoTracking()
                join c in _db.Classes.AsNoTracking() on s.ClassId equals c.ClassID into gj
                from c in gj.DefaultIfEmpty()
                select new { s, c };

            if (q != null)
                query = query.Where(x => x.s.StudentName.Contains(q) || x.s.StudentEmail.Contains(q));

            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(x => x.s.StudentID)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new AccountListItemDto
                {
                    Role = UserRole.Student,
                    Id = x.s.StudentID,
                    FullName = x.s.StudentName,
                    Email = x.s.StudentEmail,
                    PhoneNumber = x.s.PhoneNumber == null ? "" : x.s.PhoneNumber.ToString(),
                    IsApproved = x.s.IsApproved,

                    ClassId = x.s.ClassId,
                    ClassName = x.c != null ? x.c.ClassName : null
                })
                .ToListAsync();

            return new PagedResult<AccountListItemDto>
            {
                Page = page,
                PageSize = pageSize,
                Total = total,
                Items = items
            };
        }

        throw new Exception("Role không hợp lệ.");
    }
}
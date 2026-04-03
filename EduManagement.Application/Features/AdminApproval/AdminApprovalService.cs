using EduManagement.Application.Common.Interfaces;
using EduManagement.Application.DTOs.Admin;
using EduManagement.Application.DTOs.Common;
using EduManagement.Domain.Entities;
using EduManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EduManagement.Application.Features.AdminApproval;

public class AdminApprovalService
{
    private readonly IUnitOfWork _uow;
    public AdminApprovalService(IUnitOfWork uow) => _uow = uow;

    public async Task<List<PendingAccountDto>> GetPendingAsync()
    {
        return await (
            from p in _uow.PendingAccounts.Query().AsNoTracking()
            join c in _uow.Classes.Query().AsNoTracking() on p.ClassId equals c.ClassID into gj
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
        var p = await _uow.PendingAccounts.FirstOrDefaultAsync(x => x.PendingAccountID == pendingId)
            ?? throw new Exception("Không tìm thấy đơn đăng ký.");

        var role = (p.Role ?? "").Trim();

        if (role == "Teacher")
        {
            await _uow.Teachers.AddAsync(new Teacher
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
            var classExists = await _uow.Classes.AnyAsync(c => c.ClassID == p.ClassId.Value);
            if (!classExists) throw new Exception("Lớp học không tồn tại.");

            await _uow.Students.AddAsync(new Student
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

        _uow.PendingAccounts.Remove(p);
        await _uow.SaveChangesAsync();
    }

    public async Task RejectAsync(int pendingId)
    {
        var p = await _uow.PendingAccounts.FirstOrDefaultAsync(x => x.PendingAccountID == pendingId)
            ?? throw new Exception("Không tìm thấy đơn đăng ký.");

        _uow.PendingAccounts.Remove(p);
        await _uow.SaveChangesAsync();
    }

    public async Task<AdminDashboardSummaryDto> GetSummaryAsync()
    {
        return new AdminDashboardSummaryDto
        {
            AdminCount = await _uow.Admins.CountAsync(),
            TeacherCount = await _uow.Teachers.CountAsync(),
            StudentCount = await _uow.Students.CountAsync(),
            PendingCount = await _uow.PendingAccounts.CountAsync(),
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
            var query = _uow.Admins.Query().AsNoTracking();

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
                    PhoneNumber = x.AdminPhoneNumber ?? "",
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
            var query = _uow.Teachers.Query().AsNoTracking();

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
                    PhoneNumber = x.TeacherPhoneNumber ?? "",
                    IsApproved = x.IsApproved,

                    AssignedClasses = _uow.TeacherAssignments.Query()
    .Where(a => a.TeacherId == x.TeacherID)
    .Join(
        _uow.Classes.Query(),
                            a => a.ClassId,
                            c => c.ClassID,
                            (a, c) => c.ClassName
                        )
                        .Distinct()
                        .ToList(),
                    AssignedSubjects = _uow.TeacherAssignments.Query()
    .Where(a => a.TeacherId == x.TeacherID)
    .Join(
        _uow.Subjects.Query(),
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
    from s in _uow.Students.Query().AsNoTracking()
    join c in _uow.Classes.Query().AsNoTracking() on s.ClassId equals c.ClassID into gj
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
                    PhoneNumber = x.s.PhoneNumber ?? "",
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
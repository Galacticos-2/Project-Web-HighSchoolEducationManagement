using EduManagement.Application.Common.Interfaces;
using EduManagement.Application.DTOs.Auth;
using EduManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using EduManagement.Application.Common.Exceptions;
namespace EduManagement.Application.Features.Auth;

public class AuthService
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _jwt;

    public AuthService(IAppDbContext db, IPasswordHasher hasher, IJwtTokenService jwt)
    {
        _db = db;
        _hasher = hasher;
        _jwt = jwt;
    }

    public async Task RegisterAsync(RegisterRequest req)
    {
        if (req.Password != req.ConfirmPassword)
            throw new ValidationException("Mật khẩu xác nhận không khớp.");

        var role = req.Role?.Trim();
        if (role != "Teacher" && role != "Student")
            throw new ValidationException("Role không hợp lệ. Chỉ Teacher hoặc Student.");

        // ✅ CHÈN NGAY Ở ĐÂY: Student bắt buộc chọn lớp
        if (role == "Student")
        {
            if (req.ClassId == null || req.ClassId <= 0)
                throw new ValidationException("Vui lòng chọn lớp học.");

            // nhớ: IAppDbContext phải có DbSet<Class> Classes
            var classExists = await _db.Classes.AnyAsync(c => c.ClassID == req.ClassId.Value);
            if (!classExists) throw new ValidationException("Lớp học không tồn tại.");
        }

        // check email không được trùng ở bất kỳ bảng nào + bảng pending
        var exists =
            await _db.Admins.AnyAsync(x => x.AdminEmail == req.Email) ||
            await _db.Teachers.AnyAsync(x => x.TeacherEmail == req.Email) ||
            await _db.Students.AnyAsync(x => x.StudentEmail == req.Email) ||
            await _db.PendingAccounts.AnyAsync(x => x.Email == req.Email);

        if (exists) throw new ValidationException("Email đã tồn tại.");

        var hash = _hasher.Hash(req.Password);

        var pending = new PendingAccount
        {
            Role = role,
            FullName = req.FullName,
            BirthDate = req.BirthDate,
            Email = req.Email,
            PhoneNumber = int.TryParse(req.PhoneNumber, out var p) ? p : null,
            PasswordHash = hash,
            CreatedAtUtc = DateTime.UtcNow,

            // ✅ ĐẶT Ở ĐÂY: trong object PendingAccount
            ClassId = (role == "Student") ? req.ClassId : null
        };

        _db.PendingAccounts.Add(pending);
        await _db.SaveChangesAsync();
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest req)
    {
        // 1) Admin
        var admin = await _db.Admins.FirstOrDefaultAsync(x => x.AdminEmail == req.Email);
        if (admin != null)
        {
            if (!_hasher.Verify(req.Password, admin.AdminPassword))
                throw new ValidationException("Sai email hoặc mật khẩu.");

            var (token, exp) = _jwt.CreateToken(admin.AdminID, "Admin", admin.AdminName, admin.AdminEmail);
            return new AuthResponse { AccessToken = token, ExpiresAtUtc = exp, Role = "Admin", FullName = admin.AdminName };
        }

        // 2) Teacher
        var teacher = await _db.Teachers.FirstOrDefaultAsync(x => x.TeacherEmail == req.Email);
        if (teacher != null)
        {
            if (!teacher.IsApproved) throw new ValidationException("Tài khoản đang chờ admin duyệt.");

            if (!_hasher.Verify(req.Password, teacher.TeacherPassword))
                throw new ValidationException("Sai email hoặc mật khẩu.");

            var (token, exp) = _jwt.CreateToken(teacher.TeacherID, "Teacher", teacher.TeacherName, teacher.TeacherEmail);
            return new AuthResponse { AccessToken = token, ExpiresAtUtc = exp, Role = "Teacher", FullName = teacher.TeacherName };
        }

        // 3) Student
        var student = await _db.Students.FirstOrDefaultAsync(x => x.StudentEmail == req.Email);
        if (student != null)
        {
            if (!student.IsApproved) throw new ValidationException("Tài khoản đang chờ admin duyệt.");

            if (!_hasher.Verify(req.Password, student.StudentPassword))
                throw new ValidationException("Sai email hoặc mật khẩu.");

            var (token, exp) = _jwt.CreateToken(student.StudentID, "Student", student.StudentName, student.StudentEmail);
            return new AuthResponse { AccessToken = token, ExpiresAtUtc = exp, Role = "Student", FullName = student.StudentName };
        }

        // ✅ Nếu email đang nằm trong PendingAccount thì báo đúng trạng thái
        var pending = await _db.PendingAccounts.FirstOrDefaultAsync(x => x.Email == req.Email);
        if (pending != null)
            throw new ValidationException("Tài khoản đang chờ admin duyệt.");

        throw new ValidationException("Sai email hoặc mật khẩu.");
    }

    public async Task<UserProfileDto> GetMyProfileAsync(string role, string email)
    {
        role = role?.Trim() ?? "";
        email = email?.Trim() ?? "";

        if (string.IsNullOrWhiteSpace(role) || string.IsNullOrWhiteSpace(email))
            throw new ValidationException("Thiếu role hoặc email trong token.");

        // 1) Admin
        // 1) Admin
        if (role == "Admin")
        {
            var admin = await _db.Admins.AsNoTracking()
                .FirstOrDefaultAsync(x => x.AdminEmail == email);

            if (admin == null) throw new NotFoundException("Không tìm thấy admin.");

            return new UserProfileDto
            {
                Id = admin.AdminID,
                Role = "Admin",
                FullName = admin.AdminName,
                Email = admin.AdminEmail,
                PhoneNumber = admin.AdminPhoneNumber,
                BirthDate = admin.AdminBirthday
            };
        }

        // 2) Teacher
        if (role == "Teacher")
        {
            var teacher = await _db.Teachers.AsNoTracking()
                .FirstOrDefaultAsync(x => x.TeacherEmail == email);

            if (teacher == null) throw new NotFoundException("Không tìm thấy giáo viên.");

            // NOTE: bạn phải sửa 2 dòng dưới nếu entity Teacher của bạn đặt tên khác
            // Ví dụ: TeacherPhoneNumber, TeacherBirthDate,...
            int? phone = null;
            DateTime? birth = null;

            // Nếu Teacher của bạn có field đúng tên thì mở comment và chỉnh:
            // phone = teacher.TeacherPhone;
            // birth = teacher.TeacherBirthDate;

            return new UserProfileDto
            {
                Id = teacher.TeacherID,
                Role = "Teacher",
                FullName = teacher.TeacherName,
                Email = teacher.TeacherEmail,
                PhoneNumber = teacher.TeacherPhoneNumber,
                BirthDate = teacher.TeacherBirthday
            };
        }

        // 3) Student
        if (role == "Student")
        {
            var student = await _db.Students.AsNoTracking()
                .FirstOrDefaultAsync(x => x.StudentEmail == email);

            if (student == null) throw new NotFoundException("Không tìm thấy học sinh.");

            int? phone = null;
            DateTime? birth = null;

            // Nếu Student của bạn có field đúng tên thì mở comment và chỉnh:
            // phone = student.StudentPhone;
            // birth = student.StudentBirthDate;

            return new UserProfileDto
            {
                Id = student.StudentID,
                Role = "Student",
                FullName = student.StudentName,
                Email = student.StudentEmail,
                PhoneNumber = student.PhoneNumber,
                BirthDate = student.StudentBirthday
            };
        }

        throw new ValidationException("Role không hợp lệ.");
    }

    public async Task<UserProfileDto> UpdateProfileAsync(int userId, string role, UpdateProfileRequest req)
    {
        role = role?.Trim() ?? "";

        // ADMIN
        if (role == "Admin")
        {
            var admin = await _db.Admins.FirstOrDefaultAsync(x => x.AdminID == userId);
            if (admin == null) throw new NotFoundException("Không tìm thấy admin.");

            admin.AdminName = req.FullName;
            
            admin.AdminPhoneNumber = req.PhoneNumber;
            admin.AdminBirthday = req.BirthDate;

            await _db.SaveChangesAsync();

            return new UserProfileDto
            {
                Id = admin.AdminID,
                Role = "Admin",
                FullName = admin.AdminName,
                
                PhoneNumber = admin.AdminPhoneNumber,
                BirthDate = admin.AdminBirthday
            };
        }

        // TEACHER
        if (role == "Teacher")
        {
            var teacher = await _db.Teachers.FirstOrDefaultAsync(x => x.TeacherID == userId);
            if (teacher == null) throw new NotFoundException("Không tìm thấy giáo viên.");

            teacher.TeacherName = req.FullName;
            
            teacher.TeacherPhoneNumber = req.PhoneNumber;
            teacher.TeacherBirthday = req.BirthDate;

            await _db.SaveChangesAsync();

            return new UserProfileDto
            {
                Id = teacher.TeacherID,
                Role = "Teacher",
                FullName = teacher.TeacherName,
                
                PhoneNumber = teacher.TeacherPhoneNumber,
                BirthDate = teacher.TeacherBirthday
            };
        }

        // STUDENT
        if (role == "Student")
        {
            var student = await _db.Students.FirstOrDefaultAsync(x => x.StudentID == userId);
            if (student == null) throw new NotFoundException("Không tìm thấy học sinh.");

            student.StudentName = req.FullName;
            
            student.PhoneNumber = req.PhoneNumber;
            student.StudentBirthday = req.BirthDate;

            await _db.SaveChangesAsync();

            return new UserProfileDto
            {
                Id = student.StudentID,
                Role = "Student",
                FullName = student.StudentName,
                
                PhoneNumber = student.PhoneNumber,
                BirthDate = student.StudentBirthday
            };
        }

        throw new ValidationException("Role không hợp lệ.");
    }
}
using EduManagement.Application.Common.Interfaces;
using EduManagement.Application.DTOs.Auth;
using EduManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using EduManagement.Application.Common.Exceptions;
namespace EduManagement.Application.Features.Auth;

public class AuthService
{
    private readonly IUnitOfWork _uow;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _jwt;

    public AuthService(IUnitOfWork uow, IPasswordHasher hasher, IJwtTokenService jwt)
    {
        _uow = uow;
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

        AuthValidators.ValidateBirthDate(req.BirthDate);
        AuthValidators.ValidateVietnamesePhone(req.PhoneNumber);

        if (role == "Student")
        {
            if (req.ClassId == null || req.ClassId <= 0)
                throw new ValidationException("Vui lòng chọn lớp học.");

            var classExists = await _uow.Classes.AnyAsync(c => c.ClassID == req.ClassId.Value);
            if (!classExists) throw new ValidationException("Lớp học không tồn tại.");
        }

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
            PhoneNumber = AuthValidators.NormalizeVietnamesePhoneForStorage(req.PhoneNumber),
            PasswordHash = hash,
            CreatedAtUtc = DateTime.UtcNow,
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
            return new AuthResponse { AccessToken = token, ExpiresAtUtc = exp, Role = "Admin", FullName = admin.AdminName, AvatarURL = admin.AvatarURL };
        }

        // 2) Teacher
        var teacher = await _db.Teachers.FirstOrDefaultAsync(x => x.TeacherEmail == req.Email);
        if (teacher != null)
        {
            if (!teacher.IsApproved) throw new ValidationException("Tài khoản đang chờ admin duyệt.");

            if (!_hasher.Verify(req.Password, teacher.TeacherPassword))
                throw new ValidationException("Sai email hoặc mật khẩu.");

            var (token, exp) = _jwt.CreateToken(teacher.TeacherID, "Teacher", teacher.TeacherName, teacher.TeacherEmail);
            return new AuthResponse { AccessToken = token, ExpiresAtUtc = exp, Role = "Teacher", FullName = teacher.TeacherName, AvatarURL = teacher.AvatarURL };
        }

        // 3) Student
        var student = await _db.Students.FirstOrDefaultAsync(x => x.StudentEmail == req.Email);
        if (student != null)
        {
            if (!student.IsApproved) throw new ValidationException("Tài khoản đang chờ admin duyệt.");

            if (!_hasher.Verify(req.Password, student.StudentPassword))
                throw new ValidationException("Sai email hoặc mật khẩu.");

            var (token, exp) = _jwt.CreateToken(student.StudentID, "Student", student.StudentName, student.StudentEmail);
            return new AuthResponse { AccessToken = token, ExpiresAtUtc = exp, Role = "Student", FullName = student.StudentName, AvatarURL = student.AvatarURL };
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
                BirthDate = admin.AdminBirthday,
                AvatarURL = admin.AvatarURL
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
                BirthDate = teacher.TeacherBirthday,
                AvatarURL = teacher.AvatarURL
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
                BirthDate = student.StudentBirthday,
                AvatarURL = student.AvatarURL
            };
        }

        throw new ValidationException("Role không hợp lệ.");
    }

    public async Task<UserProfileDto> UpdateProfileAsync(int userId, string role, UpdateProfileRequest req)
    {
        role = role?.Trim() ?? "";

        if (string.IsNullOrWhiteSpace(req.FullName))
            throw new ValidationException("Vui lòng nhập họ tên.");

        AuthValidators.ValidateBirthDate(req.BirthDate);

        // ADMIN
        if (role == "Admin")
        {
            var admin = await _db.Admins.FirstOrDefaultAsync(x => x.AdminID == userId);
            if (admin == null) throw new NotFoundException("Không tìm thấy admin.");

            AuthValidators.ValidateVietnamesePhone(req.PhoneNumber);

            admin.AdminPhoneNumber = AuthValidators.NormalizeVietnamesePhoneForStorage(req.PhoneNumber!);
            admin.AdminName = req.FullName;
            admin.AdminBirthday = req.BirthDate;

            await _db.SaveChangesAsync();

            return new UserProfileDto
            {
                Id = admin.AdminID,
                Role = "Admin",
                FullName = admin.AdminName,
                Email = admin.AdminEmail,
                PhoneNumber = admin.AdminPhoneNumber,
                BirthDate = admin.AdminBirthday,
                AvatarURL = admin.AvatarURL
            };
        }

        // TEACHER
        if (role == "Teacher")
        {
            var teacher = await _db.Teachers.FirstOrDefaultAsync(x => x.TeacherID == userId);
            if (teacher == null) throw new NotFoundException("Không tìm thấy giáo viên.");

            AuthValidators.ValidateVietnamesePhone(req.PhoneNumber);

            teacher.TeacherPhoneNumber = AuthValidators.NormalizeVietnamesePhoneForStorage(req.PhoneNumber!);
            teacher.TeacherName = req.FullName;
            teacher.TeacherBirthday = req.BirthDate;

            await _db.SaveChangesAsync();

            return new UserProfileDto
            {
                Id = teacher.TeacherID,
                Role = "Teacher",
                FullName = teacher.TeacherName,
                Email = teacher.TeacherEmail,
                PhoneNumber = teacher.TeacherPhoneNumber,
                BirthDate = teacher.TeacherBirthday,
                AvatarURL = teacher.AvatarURL
            };
        }

        // STUDENT
        if (role == "Student")
        {
            var student = await _db.Students.FirstOrDefaultAsync(x => x.StudentID == userId);
            if (student == null) throw new NotFoundException("Không tìm thấy học sinh.");

            AuthValidators.ValidateVietnamesePhone(req.PhoneNumber);

            student.PhoneNumber = AuthValidators.NormalizeVietnamesePhoneForStorage(req.PhoneNumber!);
            student.StudentName = req.FullName;
            student.StudentBirthday = req.BirthDate;

            await _db.SaveChangesAsync();

            return new UserProfileDto
            {
                Id = student.StudentID,
                Role = "Student",
                FullName = student.StudentName,
                Email = student.StudentEmail,
                PhoneNumber = student.PhoneNumber,
                BirthDate = student.StudentBirthday,
                AvatarURL = student.AvatarURL
            };
        }

        throw new ValidationException("Role không hợp lệ.");
    }
    private static string? GetOldAvatarUrlByRole(string role, Admin? admin, Teacher? teacher, Student? student)
    {
        return role switch
        {
            "Admin" => admin?.AvatarURL,
            "Teacher" => teacher?.AvatarURL,
            "Student" => student?.AvatarURL,
            _ => null
        };
    }

    private static void DeleteOldAvatarFile(string? oldAvatarUrl, string webRootPath)
    {
        if (string.IsNullOrWhiteSpace(oldAvatarUrl))
            return;

        // Chỉ cho phép xóa file nằm trong /uploads/avatars/
        const string avatarFolderUrlPrefix = "/uploads/avatars/";
        if (!oldAvatarUrl.StartsWith(avatarFolderUrlPrefix, StringComparison.OrdinalIgnoreCase))
            return;

        // Bỏ query string nếu có, ví dụ ?t=...
        var cleanUrl = oldAvatarUrl.Split('?', StringSplitOptions.RemoveEmptyEntries)[0];

        var fileName = Path.GetFileName(cleanUrl);
        if (string.IsNullOrWhiteSpace(fileName))
            return;

        var fullPath = Path.Combine(webRootPath, "uploads", "avatars", fileName);

        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }
    }
    public async Task<UserProfileDto> UploadAvatarAsync(
    int userId,
    string role,
    IFormFile file,
    string webRootPath)
    {
        role = role?.Trim() ?? "";

        if (file == null || file.Length == 0)
            throw new ValidationException("Vui lòng chọn ảnh.");

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!allowedExtensions.Contains(ext))
            throw new ValidationException("Chỉ chấp nhận file ảnh JPG, JPEG, PNG hoặc WEBP.");

        if (file.Length > 10 * 1024 * 1024)
            throw new ValidationException("Ảnh không được vượt quá 10MB.");

        var avatarFolder = Path.Combine(webRootPath, "uploads", "avatars");
        if (!Directory.Exists(avatarFolder))
            Directory.CreateDirectory(avatarFolder);

        // Lấy user theo role trước để biết avatar cũ là gì
        Admin? admin = null;
        Teacher? teacher = null;
        Student? student = null;

        if (role == "Admin")
        {
            admin = await _db.Admins.FirstOrDefaultAsync(x => x.AdminID == userId);
            if (admin == null) throw new NotFoundException("Không tìm thấy admin.");
        }
        else if (role == "Teacher")
        {
            teacher = await _db.Teachers.FirstOrDefaultAsync(x => x.TeacherID == userId);
            if (teacher == null) throw new NotFoundException("Không tìm thấy giáo viên.");
        }
        else if (role == "Student")
        {
            student = await _db.Students.FirstOrDefaultAsync(x => x.StudentID == userId);
            if (student == null) throw new NotFoundException("Không tìm thấy học sinh.");
        }
        else
        {
            throw new ValidationException("Role không hợp lệ.");
        }

        var oldAvatarUrl = GetOldAvatarUrlByRole(role, admin, teacher, student);

        var uniqueFileName = $"{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(avatarFolder, uniqueFileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var newAvatarUrl = $"/uploads/avatars/{uniqueFileName}";

        try
        {
            if (role == "Admin" && admin != null)
            {
                admin.AvatarURL = newAvatarUrl;
                await _db.SaveChangesAsync();

                DeleteOldAvatarFile(oldAvatarUrl, webRootPath);

                return new UserProfileDto
                {
                    Id = admin.AdminID,
                    Role = "Admin",
                    FullName = admin.AdminName,
                    Email = admin.AdminEmail,
                    PhoneNumber = admin.AdminPhoneNumber,
                    BirthDate = admin.AdminBirthday,
                    AvatarURL = admin.AvatarURL
                };
            }

            if (role == "Teacher" && teacher != null)
            {
                teacher.AvatarURL = newAvatarUrl;
                await _db.SaveChangesAsync();

                DeleteOldAvatarFile(oldAvatarUrl, webRootPath);

                return new UserProfileDto
                {
                    Id = teacher.TeacherID,
                    Role = "Teacher",
                    FullName = teacher.TeacherName,
                    Email = teacher.TeacherEmail,
                    PhoneNumber = teacher.TeacherPhoneNumber,
                    BirthDate = teacher.TeacherBirthday,
                    AvatarURL = teacher.AvatarURL
                };
            }

            if (role == "Student" && student != null)
            {
                student.AvatarURL = newAvatarUrl;
                await _db.SaveChangesAsync();

                DeleteOldAvatarFile(oldAvatarUrl, webRootPath);

                return new UserProfileDto
                {
                    Id = student.StudentID,
                    Role = "Student",
                    FullName = student.StudentName,
                    Email = student.StudentEmail,
                    PhoneNumber = student.PhoneNumber,
                    BirthDate = student.StudentBirthday,
                    AvatarURL = student.AvatarURL
                };
            }

            throw new ValidationException("Role không hợp lệ.");
        }
        catch
        {
            // Nếu DB save lỗi thì xóa file mới vừa upload để tránh file rác
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }

            throw;
        }
    }
}
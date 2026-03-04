using System;
using System.Collections.Generic;
using System.Text;

namespace EduManagement.Application.DTOs.Auth;

public class RegisterRequest
{
    public string FullName { get; set; } = default!;
    public DateTime? BirthDate { get; set; }
    public string PhoneNumber { get; set; } = default!;
    public string Email { get; set; } = default!;

    // "Teacher" hoặc "Student"
    public string Role { get; set; } = default!;

    public string Password { get; set; } = default!;
    public string ConfirmPassword { get; set; } = default!;
    public int? ClassId { get; set; }
}

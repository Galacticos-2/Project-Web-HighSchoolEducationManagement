using System;
using System.Collections.Generic;
using System.Text;

namespace EduManagement.Application.DTOs.Admin;

public class PendingAccountDto
{
    // "Teacher" | "Student"
    public string Role { get; set; } = default!;
    public int Id { get; set; }

    public string FullName { get; set; } = default!;
    public string Email { get; set; } = default!;
    public DateTime? BirthDate { get; set; }
    public string? PhoneNumber { get; set; }

    public bool IsApproved { get; set; }
    public int? ClassId { get; set; }
    public string? ClassName { get; set; }
}

using System;
using System.Collections.Generic;
using System.Text;

namespace EduManagement.Domain.Entities;

public class PendingAccount
{
    public int PendingAccountID { get; set; }

    // "Teacher" | "Student"
    public string Role { get; set; } = default!;

    public string FullName { get; set; } = default!;
    public DateTime? BirthDate { get; set; }
    public string Email { get; set; } = default!;
    public int? PhoneNumber { get; set; }

    // lưu hash luôn cho an toàn
    public string PasswordHash { get; set; } = default!;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public int? ClassId { get; set; }
}
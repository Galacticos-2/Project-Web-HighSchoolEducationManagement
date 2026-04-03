using System;
using System.Collections.Generic;
using System.Text;

namespace EduManagement.Domain.Entities;

public class Admin
{
    public int AdminID { get; set; }
    public string AdminName { get; set; } = default!;
    public DateTime? AdminBirthday { get; set; }
    public string AdminEmail { get; set; } = default!; 
    public string AdminPassword { get; set; } = default!; //lưu Hash
    public string? AdminPhoneNumber { get; set; }

    // (Tùy chọn) duyệt tài khoản admin thường luôn true
    // public bool IsApproved { get; set; } = true;
    public string? AvatarURL { get; set; }
}

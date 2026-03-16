using System;
using System.Collections.Generic;
using System.Text;

namespace EduManagement.Application.DTOs.Auth;

public class UpdateProfileRequest
{
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public int? PhoneNumber { get; set; }
    public DateTime? BirthDate { get; set; }
}

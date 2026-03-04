using System;
using System.Collections.Generic;
using System.Text;

namespace EduManagement.Application.DTOs.Auth;

public class AuthResponse
{
    public string AccessToken { get; set; } = default!;
    public DateTime ExpiresAtUtc { get; set; }
    public string Role { get; set; } = default!;
    public string FullName { get; set; } = default!;
}

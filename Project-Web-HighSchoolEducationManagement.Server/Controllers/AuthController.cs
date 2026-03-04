using System.Security.Claims;
using EduManagement.Application.DTOs.Auth;
using EduManagement.Application.Features.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Project_Web_HighSchoolEducationManagement.Server.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;
    public AuthController(AuthService auth) => _auth = auth;

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest req)
    {
        await _auth.RegisterAsync(req);
        return Ok(new { message = "Đăng kí thành công." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        var res = await _auth.LoginAsync(req);
        return Ok(res);
    }

    // ✅ NEW: GET api/auth/me
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        // Lấy email + role từ JWT claims
        var email =
            User.FindFirstValue(ClaimTypes.Email) ??
            User.FindFirstValue("email");

        var role =
            User.FindFirstValue(ClaimTypes.Role) ??
            User.FindFirstValue("role");

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(role))
            return Unauthorized(new { message = "Token thiếu email/role claims." });

        var dto = await _auth.GetMyProfileAsync(role, email);
        return Ok(dto);
    }
}
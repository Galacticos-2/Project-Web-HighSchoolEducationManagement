using System.Security.Claims;
using EduManagement.Application.DTOs.Auth;
using EduManagement.Application.Features.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
namespace Project_Web_HighSchoolEducationManagement.Server.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;
    private readonly IWebHostEnvironment _env;
    public AuthController(AuthService auth, IWebHostEnvironment env)
    {
        _auth = auth;
        _env = env;
    }

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

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(UpdateProfileRequest req)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var role =
            User.FindFirstValue(ClaimTypes.Role) ??
            User.FindFirstValue("role");

        if (!int.TryParse(userIdStr, out var userId))
            return Unauthorized(new { message = "Token thiếu userId." });

        var dto = await _auth.UpdateProfileAsync(userId, role!, req);
        return Ok(dto);
    }

    [Authorize]
    [HttpPost("upload-avatar")]
    public async Task<IActionResult> UploadAvatar(IFormFile file)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var role =
            User.FindFirstValue(ClaimTypes.Role) ??
            User.FindFirstValue("role");

        if (!int.TryParse(userIdStr, out var userId))
            return Unauthorized(new { message = "Token thiếu userId." });

        if (file == null)
            return BadRequest(new { message = "Không tìm thấy file upload." });

        var dto = await _auth.UploadAvatarAsync(userId, role!, file, _env.WebRootPath);
        return Ok(dto);
    }
}
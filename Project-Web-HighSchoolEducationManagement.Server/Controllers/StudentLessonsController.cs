using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using EduManagement.Application.Features.Lessons;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Project_Web_HighSchoolEducationManagement.Server.Controllers;

[ApiController]
[Route("api/student/lessons")]
public class StudentLessonsController : ControllerBase
{
    private readonly StudentLessonService _svc;
    private readonly IWebHostEnvironment _env;

    public StudentLessonsController(StudentLessonService svc, IWebHostEnvironment env)
    {
        _svc = svc;
        _env = env;
    }

    private int GetUserIdOrThrow()
    {
        var raw =
            User.FindFirstValue(JwtRegisteredClaimNames.Sub) ??
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub") ??
            User.FindFirstValue("nameid");

        if (string.IsNullOrWhiteSpace(raw) || !int.TryParse(raw, out var id))
            throw new Exception("Token thiếu claim userId (sub/nameid).");

        return id;
    }

    [Authorize(Roles = "Student")]
    [HttpGet("listMine")]
    public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? q = null)
    {
        var studentId = GetUserIdOrThrow();
        var data = await _svc.GetLessonsForStudentAsync(studentId, page, pageSize, q);
        return Ok(data);
    }

    [Authorize(Roles = "Student")]
    [HttpGet("{id:int}/download")]
    public async Task<IActionResult> Download(int id)
    {
        var studentId = GetUserIdOrThrow();
        var lesson = await _svc.GetAllowedLessonForStudentAsync(studentId, id);

        var abs = Path.Combine(_env.WebRootPath, lesson.FilePath.Replace("/", Path.DirectorySeparatorChar.ToString()));
        if (!System.IO.File.Exists(abs))
            return NotFound(new { message = "Không tìm thấy file trên server." });

        return PhysicalFile(abs, lesson.ContentType, lesson.FileName);
    }
}
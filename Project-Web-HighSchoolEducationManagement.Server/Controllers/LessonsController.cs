using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using EduManagement.Application.Features.Lessons;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Project_Web_HighSchoolEducationManagement.Server.Controllers;

[ApiController]
[Route("api/lessons")]
public class LessonsController : ControllerBase
{
    private readonly TeacherLessonService _svc;
    private readonly IWebHostEnvironment _env;

    public LessonsController(TeacherLessonService svc, IWebHostEnvironment env)
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

    // Teacher download chính bài của mình
    [Authorize(Roles = "Teacher")]
    [HttpGet("{id:int}/download")]
    public async Task<IActionResult> Download(int id)
    {
        var teacherId = GetUserIdOrThrow();
        //Find lesson data in database 
        var lesson = await _svc.GetOwnedLessonAsync(teacherId, id);
        //Create absolute path, check file existence, return file stream
        var abs = Path.Combine(_env.WebRootPath, lesson.FilePath.Replace("/", Path.DirectorySeparatorChar.ToString()));
        if (!System.IO.File.Exists(abs))
            return NotFound(new { message = "Không tìm thấy file trên server." });

        return PhysicalFile(abs, lesson.ContentType, lesson.FileName);
    }

}
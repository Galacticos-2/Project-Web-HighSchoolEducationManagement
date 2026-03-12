//Teacher controll lesson(list lessons, upload a new lesson)

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using EduManagement.Application.DTOs.Lessons;
using EduManagement.Application.Features.Lessons;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Project_Web_HighSchoolEducationManagement.Server.Controllers;

[ApiController]
[Route("api/teacher/lessons")]
[Authorize(Roles = "Teacher")]
public class TeacherLessonsController : ControllerBase
{
    private readonly TeacherLessonService _svc;
    private readonly IWebHostEnvironment _env;

    public TeacherLessonsController(TeacherLessonService svc, IWebHostEnvironment env)
    {
        _svc = svc;
        _env = env;
    }

    private int GetTeacherId()
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

    [HttpGet("listMine")]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? status = null,
        [FromQuery] string? q = null
    )
    {
        var teacherId = GetTeacherId();
        var data = await _svc.GetMyLessonsAsync(teacherId, page, pageSize, status, q);
        return Ok(data);
    }

    [HttpPost("createnewlesson")]
    [RequestSizeLimit(50_000_000)] // 50MB
    //Teacher upload a new lesson (file + metadata) on system, then save the file path and metadata to database
    public async Task<IActionResult> Create([FromForm] CreateLessonRequest meta, [FromForm] IFormFile file)
    {
        var teacherId = GetTeacherId();

        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Bạn chưa chọn file." });

        // chỉ cho pdf/word (tuỳ bạn)
        var okTypes = new[]
        {
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        };
        if (!okTypes.Contains(file.ContentType))
            return BadRequest(new { message = "Chỉ hỗ trợ PDF/DOC/DOCX." });

        var webRoot = _env.WebRootPath;
        //If wwwroot folder doesn't exist, create it in content root because _env.ContentRootPath get the root path of the application
        if (string.IsNullOrWhiteSpace(webRoot))
        {
            webRoot = Path.Combine(_env.ContentRootPath, "wwwroot");
        }

        Directory.CreateDirectory(webRoot);

        var uploadsDir = Path.Combine(webRoot, "uploads", "lessons");
        Directory.CreateDirectory(uploadsDir);

        var ext = Path.GetExtension(file.FileName);
        //Create a random file name to avoid conflicts
        var storedFileName = $"{Guid.NewGuid():N}{ext}";
        var absPath = Path.Combine(uploadsDir, storedFileName);
        //Save file to wwwroot/uploads/lessons/
        await using (var stream = System.IO.File.Create(absPath))
        {
            await file.CopyToAsync(stream);
        }
        //Create relative path to save in database
        var relativePath = Path.Combine("uploads", "lessons", storedFileName).Replace("\\", "/");
        //Call Service to save metadata and file path to database, return new lesson id
        var newId = await _svc.CreateAsync(teacherId, meta, file, storedFileName, relativePath);

        return Ok(new { id = newId, message = "Đã tạo bài giảng." });
    }
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromForm] CreateLessonRequest meta)
    {
        var teacherId = GetTeacherId();

        await _svc.UpdateAsync(teacherId, id, meta);

        return Ok(new { message = "Đã cập nhật bài giảng." });
    }
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var teacherId = GetTeacherId();

        var relativePath = await _svc.DeleteAsync(teacherId, id);

        //xóa file vật lý
        if (!string.IsNullOrWhiteSpace(relativePath))
        {
            var absPath = Path.Combine(_env.WebRootPath, relativePath);

            if (System.IO.File.Exists(absPath))
                System.IO.File.Delete(absPath);
        }

        return Ok(new { message = "Đã xóa bài giảng." });
    }
}
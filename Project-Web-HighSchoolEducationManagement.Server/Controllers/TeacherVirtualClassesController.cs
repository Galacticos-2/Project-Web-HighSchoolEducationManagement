using System.Security.Claims;
using EduManagement.Application.DTOs.VirtualClass;
using EduManagement.Application.Features.VirtualClasses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Project_Web_HighSchoolEducationManagement.Server.Controllers;

[ApiController]
[Route("api/teacher/virtual-classes")]
[Authorize(Roles = "Teacher")]
public class TeacherVirtualClassesController : ControllerBase
{
    private readonly TeacherVirtualClassService _svc;

    public TeacherVirtualClassesController(TeacherVirtualClassService svc)
    {
        _svc = svc;
    }

    private int GetTeacherId()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(id, out var teacherId))
            throw new Exception("Invalid teacher id in token");

        return teacherId;
    }

    [HttpGet]
    public async Task<IActionResult> GetMine()
    {
        try
        {
            var teacherId = GetTeacherId();
            var data = await _svc.GetMineAsync(teacherId);
            return Ok(data);
        }
        catch (Exception ex)
        {
            return Ok(ex.ToString());
        }
    }
    [HttpGet("debug")]
    public IActionResult Debug()
    {
        return Ok(User.Claims.Select(c => new { c.Type, c.Value }));
    }
    [HttpPost]
    public async Task<IActionResult> Create(CreateVirtualClassRequest req)
    {
        var teacherId = GetTeacherId();

        var id = await _svc.CreateAsync(teacherId, req);

        return Ok(new { id });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var teacherId = GetTeacherId();

            await _svc.DeleteAsync(teacherId, id);

            return Ok(new { message = "Deleted" });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("classes")]
    public async Task<IActionResult> GetMyClasses()
    {
        var teacherId = GetTeacherId();

        var data = await _svc.GetMyClassesAsync(teacherId);

        return Ok(data);
    }

    [HttpGet("subjects")]
    public async Task<IActionResult> GetMySubjects(int classId)
    {
        var teacherId = GetTeacherId();

        var data = await _svc.GetMySubjectsAsync(teacherId, classId);

        return Ok(data);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, CreateVirtualClassRequest req)
    {
        try
        {
            var teacherId = GetTeacherId();

            await _svc.UpdateAsync(teacherId, id, req);

            return Ok(new { message = "Updated" });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
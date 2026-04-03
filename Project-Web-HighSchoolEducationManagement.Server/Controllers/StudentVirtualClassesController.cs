using System.Security.Claims;
using EduManagement.Application.Features.VirtualClasses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EduManagement.Application.DTOs.VirtualClass;
namespace Project_Web_HighSchoolEducationManagement.Server.Controllers
{
    [ApiController]
    [Route("api/student/virtual-classes")]
    [Authorize(Roles = "Student")]
    public class StudentVirtualClassesController : ControllerBase
    {
        private readonly StudentVirtualClassService _svc;

        public StudentVirtualClassesController(StudentVirtualClassService svc)
        {
            _svc = svc;
        }

        private int GetStudentId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(raw))
                throw new Exception("Token missing NameIdentifier");

            if (!int.TryParse(raw, out var id))
                throw new Exception("Invalid student id");

            return id;
        }

        [HttpGet]
        public async Task<IActionResult> GetMine(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortBy = null,
            [FromQuery] string? order = null
        )
        {
            var studentId = GetStudentId();

            var data = await _svc.GetForStudentAsync(studentId, page, pageSize, sortBy, order);

            return Ok(data);
        }

        [HttpGet("debug")]
        public IActionResult Debug()
        {
            return Ok(User.Claims.Select(c => new { c.Type, c.Value }));
        }

        [HttpGet("subject-colors")]
        public async Task<IActionResult> GetSubjectColors()
        {
            try
            {
                var studentId = GetStudentId();
                var data = await _svc.GetSubjectColorsAsync(studentId);
                return Ok(data);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message,
                    detail = ex.InnerException?.Message
                });
            }
        }

        [HttpPut("subject-colors")]
        public async Task<IActionResult> UpsertSubjectColor([FromBody] UpsertStudentSubjectColorRequest req)
        {
            try
            {
                var studentId = GetStudentId();
                await _svc.UpsertSubjectColorAsync(studentId, req);
                return Ok(new { message = "Saved" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    
}
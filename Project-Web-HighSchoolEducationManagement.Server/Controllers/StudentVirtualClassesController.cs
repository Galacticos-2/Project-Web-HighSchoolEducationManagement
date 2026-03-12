using System.Security.Claims;
using EduManagement.Application.Features.VirtualClasses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
        [HttpGet]
        public async Task<IActionResult> GetMine()
        {
            try
            {
                var studentId = GetStudentId();
                var data = await _svc.GetForStudentAsync(studentId);

                return Ok(data);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }


        [HttpGet("debug")]
        public IActionResult Debug()
        {
            return Ok(User.Claims.Select(c => new { c.Type, c.Value }));
        }
    }
}

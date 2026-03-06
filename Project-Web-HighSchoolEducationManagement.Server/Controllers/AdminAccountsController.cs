using EduManagement.Application.DTOs.Admin;
using EduManagement.Application.Features.AdminApproval;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Project_Web_HighSchoolEducationManagement.Server.Controllers;

[ApiController]
[Route("api/admin/accounts")]
[Authorize(Roles = "Admin")]
public class AdminAccountsController : ControllerBase
{
    private readonly AdminApprovalService _svc;
    public AdminAccountsController(AdminApprovalService svc) => _svc = svc;

    [HttpGet("summary")]
    public async Task<IActionResult> Summary()
    {
        var data = await _svc.GetSummaryAsync();
        return Ok(data);
    }

    // role=Admin|Teacher|Student, q optional
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string role,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? q = null
    )
    {
        var data = await _svc.GetAccountsAsync(role, page, pageSize, q);
        return Ok(data);
    }

    // ===== pending đã có =====
    [HttpGet("pending")]
    public async Task<IActionResult> GetPending()
    {
        var data = await _svc.GetPendingAsync();
        return Ok(data);
    }

    [HttpPost("approve")]
    public async Task<IActionResult> Approve([FromQuery] int pendingId)
    {
        await _svc.ApproveAsync(pendingId);
        return Ok(new { message = "Đã duyệt tài khoản." });
    }

    [HttpPost("reject")]
    public async Task<IActionResult> Reject([FromQuery] int pendingId)
    {
        await _svc.RejectAsync(pendingId);
        return Ok(new { message = "Đã từ chối và xóa đơn đăng ký." });
    }

    [HttpPost("assign")]
    public async Task<IActionResult> AssignTeacher(
    [FromBody] AssignTeacherRequest req,
    [FromServices] AdminAssignmentService svc)
    {
        await svc.AssignAsync(req);
        return Ok(new { message = "Phân công giảng dạy thành công." });
    }
}
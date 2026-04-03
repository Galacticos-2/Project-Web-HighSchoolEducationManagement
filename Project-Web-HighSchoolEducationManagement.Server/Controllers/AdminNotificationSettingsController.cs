using EduManagement.Application.Common.Interfaces;
using EduManagement.Application.DTOs.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Project_Web_HighSchoolEducationManagement.Server.Services;

namespace Project_Web_HighSchoolEducationManagement.Server.Controllers
{
    [ApiController]
    [Route("api/admin/notification-settings")]
    [Authorize(Roles = "Admin")]
    public class AdminNotificationSettingsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public AdminNotificationSettingsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var data = await _notificationService.GetSettingDtoAsync();
            return Ok(data);
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] UpdateNotificationSettingRequest req)
        {
            var data = await _notificationService.UpdateSettingAsync(req);
            return Ok(data);
        }
    }
}
using EduManagement.Application.Common.Interfaces;
using Project_Web_HighSchoolEducationManagement.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Project_Web_HighSchoolEducationManagement.Server.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly ICurrentUserService _currentUser;

        public NotificationsController(
    INotificationService notificationService,
    ICurrentUserService currentUser)
        {
            _notificationService = notificationService;
            _currentUser = currentUser;
        }

        [HttpGet("mine")]
        public async Task<IActionResult> Mine([FromQuery] int take = 20)
        {
            if (!_currentUser.IsAuthenticated || _currentUser.UserId == null || string.IsNullOrWhiteSpace(_currentUser.Role))
                return Unauthorized();

            var items = await _notificationService.GetMyNotificationsAsync(
                _currentUser.Role!,
                _currentUser.UserId.Value,
                take);

            var unreadCount = await _notificationService.GetUnreadCountAsync(
                _currentUser.Role!,
                _currentUser.UserId.Value);

            return Ok(new
            {
                unreadCount,
                items
            });
        }
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (!_currentUser.IsAuthenticated || _currentUser.UserId == null || string.IsNullOrWhiteSpace(_currentUser.Role))
                return Unauthorized();

            await _notificationService.DeleteMyNotificationAsync(
                _currentUser.Role!,
                _currentUser.UserId.Value,
                id);

            return Ok(new { message = "Đã xóa thông báo." });
        }
        [HttpPost("{id:int}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            if (!_currentUser.IsAuthenticated || _currentUser.UserId == null || string.IsNullOrWhiteSpace(_currentUser.Role))
                return Unauthorized();

            await _notificationService.MarkAsReadAsync(
                _currentUser.Role!,
                _currentUser.UserId.Value,
                id);

            return Ok(new { message = "Đã đánh dấu đã đọc." });
        }
    }
}
using EduManagement.Application.DTOs.Notifications;
using EduManagement.Domain.Entities;

namespace EduManagement.Application.Common.Interfaces
{
    public interface INotificationService
    {
        Task<NotificationSetting> GetOrCreateSettingAsync();
        Task<NotificationSettingDto> GetSettingDtoAsync();
        Task<NotificationSettingDto> UpdateSettingAsync(UpdateNotificationSettingRequest req);

        List<int> ParseOffsets(string csv);

        Task<List<NotificationDto>> GetMyNotificationsAsync(string role, int userId, int take = 20);
        Task<int> GetUnreadCountAsync(string role, int userId);
        Task MarkAsReadAsync(string role, int userId, int notificationId);
        Task DeleteMyNotificationAsync(string role, int userId, int notificationId);

        Task CreateLessonUploadNotificationsAsync(Lesson lesson);
        Task CreateVirtualClassReminderNotificationsAsync(VirtualClass vc, int minutesBefore);
        Task CreateVirtualClassCreatedNotificationsAsync(VirtualClass vc);
    }
}
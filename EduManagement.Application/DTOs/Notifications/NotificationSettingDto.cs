namespace EduManagement.Application.DTOs.Notifications
{
    public class NotificationSettingDto
    {
        public bool LessonUploadEnabled { get; set; }
        public bool VirtualClassReminderEnabled { get; set; }
        public List<int> ReminderMinutesBefore { get; set; } = new();
        public string UpdatedAtUtc { get; set; } = default!;
    }
}
namespace EduManagement.Application.DTOs.Notifications
{
    public class UpdateNotificationSettingRequest
    {
        public bool LessonUploadEnabled { get; set; }
        public bool VirtualClassReminderEnabled { get; set; }
        public List<int> ReminderMinutesBefore { get; set; } = new();
    }
}
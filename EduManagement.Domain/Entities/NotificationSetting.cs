namespace EduManagement.Domain.Entities
{
    public class NotificationSetting
    {
        public int NotificationSettingID { get; set; }

        public bool LessonUploadEnabled { get; set; } = true;
        public bool VirtualClassReminderEnabled { get; set; } = true;

        
        public string ReminderOffsetsCsv { get; set; } = "30";

        public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    }
}
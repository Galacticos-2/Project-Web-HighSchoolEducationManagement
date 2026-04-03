namespace EduManagement.Domain.Entities
{
    public class Notification
    {
        public int NotificationID { get; set; }

        // Người nhận
        public string ReceiverRole { get; set; } = default!;   // Admin / Teacher / Student
        public int ReceiverUserId { get; set; }

        // Nội dung
        public string Title { get; set; } = default!;
        public string Message { get; set; } = default!;
        public string Type { get; set; } = default!; // LessonUploaded / VirtualClassReminder
        public string? NavigationUrl { get; set; }

        // Gắn nguồn phát sinh
        public string? SourceType { get; set; } // Lesson / VirtualClass
        public int? SourceId { get; set; }

        // dùng cho reminder lớp ảo
        public int? ReminderMinutesBefore { get; set; }

        // chống gửi trùng
        public string DedupKey { get; set; } = default!;

        // trạng thái
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime? ReadAtUtc { get; set; }
    }
}
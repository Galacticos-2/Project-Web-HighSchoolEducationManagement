namespace EduManagement.Application.DTOs.Notifications
{
    public class NotificationDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = default!;
        public string Message { get; set; } = default!;
        public string Type { get; set; } = default!;
        public string? NavigationUrl { get; set; }
        public bool IsRead { get; set; }
        public string CreatedAtUtc { get; set; } = default!;
    }
}
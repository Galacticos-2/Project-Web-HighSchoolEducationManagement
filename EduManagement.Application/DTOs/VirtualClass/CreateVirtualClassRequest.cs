namespace EduManagement.Application.DTOs.VirtualClass
{
    public class CreateVirtualClassRequest
    {
        public int ClassId { get; set; }

        public int SubjectId { get; set; }

        public string MeetingUrl { get; set; } = default!;
        // 2 = T2 ... 7 = T7
        public int DayOfWeek { get; set; }

        // Chỉ chọn ngày học, không nhập giờ nữa
        public DateTime StudyDate { get; set; }

        // Tiết từ 1 -> 10
        public int Period { get; set; }
    }
}
namespace EduManagement.Application.DTOs.VirtualClass
{
    public class VirtualClassListItemDto
    {
        public int Id { get; set; }

        public string ClassName { get; set; } = default!;

        public string SubjectName { get; set; } = default!;
        public string TeacherName { get; set; } = default!;

        public string MeetingUrl { get; set; } = default!;

        public DateTime StudyDate { get; set; }

        public int Period { get; set; }

        public DateTime StartTime { get; set; }

        public DateTime? EndTime { get; set; }
        public int DayOfWeek { get; set; }

        public DateTime CreatedAtUtc { get; set; }

        public int ClassId { get; set; }

        public int SubjectId { get; set; }
    }
}
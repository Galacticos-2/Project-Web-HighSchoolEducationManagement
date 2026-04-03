namespace EduManagement.Application.DTOs.VirtualClass
{
    public class StudentSubjectColorDto
    {
        public int SubjectId { get; set; }
        public string SubjectName { get; set; } = default!;
        public string ColorHex { get; set; } = "#2f80ed";
    }
}
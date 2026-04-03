namespace EduManagement.Application.DTOs.VirtualClass
{
    public class TeacherClassColorDto
    {
        public int ClassId { get; set; }
        public string ClassName { get; set; } = default!;
        public string ColorHex { get; set; } = "#2f80ed";
    }
}
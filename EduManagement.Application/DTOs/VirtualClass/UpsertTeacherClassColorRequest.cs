namespace EduManagement.Application.DTOs.VirtualClass
{
    public class UpsertTeacherClassColorRequest
    {
        public int ClassId { get; set; }
        public string ColorHex { get; set; } = "#2f80ed";
    }
}
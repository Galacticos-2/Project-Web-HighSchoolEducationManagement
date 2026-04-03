namespace EduManagement.Application.DTOs.VirtualClass
{
    public class UpsertStudentSubjectColorRequest
    {
        public int SubjectId { get; set; }
        public string ColorHex { get; set; } = "#2f80ed";
    }
}
using System;

namespace EduManagement.Domain.Entities
{
    public class StudentSubjectColor
    {
        public int StudentSubjectColorID { get; set; }

        public int StudentId { get; set; }
        public Student? Student { get; set; }

        public int SubjectId { get; set; }
        public Subject? Subject { get; set; }

        public string ColorHex { get; set; } = "#2f80ed";

        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    }
}
using System;

namespace EduManagement.Domain.Entities
{
    public class TeacherClassColor
    {
        public int TeacherClassColorID { get; set; }

        public int TeacherId { get; set; }
        public Teacher? Teacher { get; set; }

        public int ClassId { get; set; }
        public Class? Class { get; set; }

        public string ColorHex { get; set; } = "#2f80ed";

        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    }
}
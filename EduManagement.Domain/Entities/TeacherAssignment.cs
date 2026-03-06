using System;
using System.Collections.Generic;
using System.Text;

namespace EduManagement.Domain.Entities
{
    public class TeacherAssignment
    {
        public int TeacherAssignmentID { get; set; }

        public int TeacherId { get; set; }
        public Teacher? Teacher { get; set; }

        public int ClassId { get; set; }
        public Class? Class { get; set; }
        public int SubjectId { get; set; }
        public Subject? Subject { get; set; }
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    }
}

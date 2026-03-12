using System;
using System.Collections.Generic;
using System.Text;

namespace EduManagement.Domain.Entities
{
    public class VirtualClass
    {
        public int VirtualClassID { get; set; }

        public int TeacherId { get; set; }
        public Teacher? Teacher { get; set; }

        public int ClassId { get; set; }
        public Class? Class { get; set; }

        public int SubjectId { get; set; }
        public Subject? Subject { get; set; }

        public string MeetingUrl { get; set; } = default!;

        public DateTime StartTime { get; set; }

        public DateTime EndTime { get; set; }

        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    }
}

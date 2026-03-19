using System;
using System.Collections.Generic;
using System.Text;

namespace EduManagement.Application.DTOs.VirtualClass
{
    public class VirtualClassListItemDto
    {
        public int Id { get; set; }

        public string ClassName { get; set; } = default!;

        public string SubjectName { get; set; } = default!;

        public string MeetingUrl { get; set; } = default!;

        public DateTime StartTime { get; set; }

        public DateTime? EndTime { get; set; }

        public DateTime CreatedAtUtc { get; set; }

        public int ClassId { get; set; }
        public int SubjectId { get; set; }
    }
}

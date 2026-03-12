using System;
using System.Collections.Generic;
using System.Text;

namespace EduManagement.Application.DTOs.VirtualClass
{
    public class CreateVirtualClassRequest
    {
        public int ClassId { get; set; }

        public int SubjectId { get; set; }

        public string MeetingUrl { get; set; } = default!;

        public DateTime StartTime { get; set; }

        public DateTime EndTime { get; set; }
    }
}

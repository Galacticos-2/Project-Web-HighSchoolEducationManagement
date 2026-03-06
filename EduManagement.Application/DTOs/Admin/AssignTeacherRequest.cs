using System;
using System.Collections.Generic;
using System.Text;

namespace EduManagement.Application.DTOs.Admin
{
    public class AssignTeacherRequest
    {
        public int TeacherId { get; set; }

        public int SubjectId { get; set; }

        public List<int> ClassIds { get; set; } = new();
    }
}

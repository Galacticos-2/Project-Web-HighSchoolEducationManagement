using System;
using System.Collections.Generic;
using System.Text;

namespace EduManagement.Application.DTOs.Lessons
{
    public class CreateLessonRequest
    {
        public string Title { get; set; } = default!;
        public string? Description { get; set; }
        public string? TimeShouldLearn { get; set; }
        public string Status { get; set; } = "Draft";
    }
}

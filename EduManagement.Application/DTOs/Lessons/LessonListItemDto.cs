using System;
using System.Collections.Generic;
using System.Text;

namespace EduManagement.Application.DTOs.Lessons
{
    public class LessonListItemDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = default!;
        public string? Description { get; set; }
        public string Status { get; set; } = default!;
        public string FileName { get; set; } = default!;
        public long FileSize { get; set; }
        public string ContentType { get; set; } = default!;
        public string CreatedAtUtc { get; set; } = default!;
    }
}


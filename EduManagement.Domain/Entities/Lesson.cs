using System;
using System.Collections.Generic;
using System.Text;

namespace EduManagement.Domain.Entities
{
    public class Lesson
    {
       

    
        public int LessonID { get; set; }
        public string LessonTitle { get; set; } = default!;
        public string LessonDescription { get; set; } = default!;
        public string TimeShouldLearn { get; set; } = default!;

        // Gắn theo nghiệp vụ
        public int TeacherId { get; set; }               // lấy từ JWT (sub)
        public int ClassId { get; set; }     
        public int SubjectId { get; set; }
        public string Status { get; set; } = "Draft";    // Draft/Published/Hidden...
        public Class? Class { get; set; }
        public Subject? Subject { get; set; }
        // File metadata
        public string FileName { get; set; } = default!;
        public string StoredFileName { get; set; } = default!;
        public string FilePath { get; set; } = default!;   // ví dụ: uploads/lessons/abc.pdf (relative to wwwroot)
        public long FileSize { get; set; }
        public string ContentType { get; set; } = default!;

        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    }

}


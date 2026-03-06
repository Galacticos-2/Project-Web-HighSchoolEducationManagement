using System;
using System.Collections.Generic;
using System.Text;

namespace EduManagement.Domain.Entities
{
    public class Subject
    {
        public int SubjectID { get; set; }

        public string SubjectName { get; set; } = default!;
    }
}

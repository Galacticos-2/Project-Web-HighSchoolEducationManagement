using System;
using System.Collections.Generic;
using System.Text;

namespace EduManagement.Domain.Entities
{
    public class Class
    {
        public int ClassID { get; set; }
        public string ClassName { get; set; } = default!;
      
        public string ClassYear { get; set; } = default!;
        public ICollection<Student> Students { get; set; } = new List<Student>();
    }
}

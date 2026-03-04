using System;
using System.Collections.Generic;
using System.Text;

namespace EduManagement.Application.DTOs.Admin
{
    public class AdminDashboardSummaryDto
    {
        public int AdminCount { get; set; }
        public int TeacherCount { get; set; }
        public int StudentCount { get; set; }
        public int PendingCount { get; set; }
    }
}

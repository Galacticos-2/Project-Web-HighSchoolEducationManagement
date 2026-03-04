using System;
using System.Collections.Generic;
using System.Text;

namespace EduManagement.Application.DTOs.Admin
{
    public class AccountListItemDto
    {
        public int Id { get; set; }            // hoặc int nếu DB bạn dùng int
        public string Email { get; set; } = "";
        public string FullName { get; set; } = "";
        public string PhoneNumber { get; set; } 
        public string Role { get; set; } = "";  // "Student"/"Teacher"/"Admin"
        public bool? IsApproved { get; set; } // trạng thái duyệt
    }
}

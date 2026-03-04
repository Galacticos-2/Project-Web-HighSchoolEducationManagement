using System;
using System.Collections.Generic;
using System.Text;

namespace EduManagement.Domain.Entities;

public class Teacher
{
    public int TeacherID { get; set; }
    public string TeacherName { get; set; } = default!;
    public DateTime? TeacherBirthday { get; set; }
    public string TeacherEmail { get; set; } = default!;
    public string TeacherPassword { get; set; } = default!; //lưu Hash
    public int? TeacherPhoneNumber { get; set; }

    //admin phải duyệt thì mới xài được
    public bool IsApproved { get; set; } = false; 
}

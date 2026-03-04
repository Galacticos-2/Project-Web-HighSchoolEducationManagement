using System;
using System.Collections.Generic;
using System.Text;

namespace EduManagement.Domain.Entities;

public class Student
{
    public int StudentID { get; set; }
    public string StudentName { get; set; } = default!;
    public DateTime? StudentBirthday { get; set; }
    public string StudentEmail { get; set; } = default!;
    public string StudentPassword { get; set; } = default!; // lưu HASH
    public int? PhoneNumber { get; set; }
    public bool IsApproved { get; set; } = false;
    public int? ClassId { get; set; }
    public Class? Class { get; set; }
}

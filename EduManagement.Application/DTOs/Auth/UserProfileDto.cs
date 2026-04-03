namespace EduManagement.Application.DTOs.Auth;

public class UserProfileDto
{
    public int Id { get; set; }
    public string Role { get; set; } = "";
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";

    // optional
    public string? PhoneNumber { get; set; }
    public DateTime? BirthDate { get; set; }
    public string? AvatarURL { get; set; }
}
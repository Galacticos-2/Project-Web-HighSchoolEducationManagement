namespace EduManagement.Application.Common.Interfaces
{
    public interface ICurrentUserService
    {
        int? UserId { get; }
        string? Role { get; }
        string? FullName { get; }
        bool IsAuthenticated { get; }
    }
}
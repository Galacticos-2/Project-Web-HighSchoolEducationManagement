using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using EduManagement.Application.Common.Interfaces;

namespace Project_Web_HighSchoolEducationManagement.Server.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

        public int? UserId
        {
            get
            {
                var raw =
                    User?.FindFirstValue(JwtRegisteredClaimNames.Sub) ??
                    User?.FindFirstValue(ClaimTypes.NameIdentifier) ??
                    User?.FindFirstValue("sub") ??
                    User?.FindFirstValue("nameid");

                return int.TryParse(raw, out var id) ? id : null;
            }
        }

        public string? Role => User?.FindFirstValue(ClaimTypes.Role);

        public string? FullName => User?.FindFirst("fullName")?.Value;

        public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;
    }
}
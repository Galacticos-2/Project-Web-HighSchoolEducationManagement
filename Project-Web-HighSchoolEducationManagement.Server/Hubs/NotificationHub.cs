using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Project_Web_HighSchoolEducationManagement.Server.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var user = Context.User;

            var role = user?.FindFirstValue(ClaimTypes.Role);
            var rawId =
                user?.FindFirstValue(JwtRegisteredClaimNames.Sub) ??
                user?.FindFirstValue(ClaimTypes.NameIdentifier) ??
                user?.FindFirstValue("sub") ??
                user?.FindFirstValue("nameid");

            if (!string.IsNullOrWhiteSpace(role) && int.TryParse(rawId, out var userId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, BuildUserGroup(role, userId));
            }

            await base.OnConnectedAsync();
        }

        public static string BuildUserGroup(string role, int userId)
            => $"user:{role}:{userId}";
    }
}
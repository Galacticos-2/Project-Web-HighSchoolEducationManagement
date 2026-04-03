using EduManagement.Application.Common.Interfaces;
using EduManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Project_Web_HighSchoolEducationManagement.Server.Services;

namespace Project_Web_HighSchoolEducationManagement.Server.BackgroundServices
{
    public class VirtualClassReminderBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<VirtualClassReminderBackgroundService> _logger;

        public VirtualClassReminderBackgroundService(
            IServiceScopeFactory scopeFactory,
            ILogger<VirtualClassReminderBackgroundService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                    var setting = await notificationService.GetOrCreateSettingAsync();
                    if (setting.VirtualClassReminderEnabled)
                    {
                        var offsets = notificationService.ParseOffsets(setting.ReminderOffsetsCsv);

                        // app của bạn đang dùng StartTime theo giờ local, không phải UTC
                        var now = DateTime.Now;
                        var windowEnd = now.AddSeconds(70);

                        foreach (var offset in offsets)
                        {
                            var targetStartMin = now.AddMinutes(offset);
                            var targetStartMax = windowEnd.AddMinutes(offset);

                            var dueClasses = await db.VirtualClasses
                                .Where(x => x.StartTime >= targetStartMin && x.StartTime <= targetStartMax)
                                .ToListAsync(stoppingToken);

                            foreach (var vc in dueClasses)
                            {
                                await notificationService.CreateVirtualClassReminderNotificationsAsync(vc, offset);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi chạy reminder lớp học ảo.");
                }

                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
        }
    }
}
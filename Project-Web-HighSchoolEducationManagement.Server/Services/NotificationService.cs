using EduManagement.Application.Common.Interfaces;
using EduManagement.Application.DTOs.Notifications;
using EduManagement.Domain.Entities;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Project_Web_HighSchoolEducationManagement.Server.Hubs;

namespace Project_Web_HighSchoolEducationManagement.Server.Services
{
    public class NotificationService : INotificationService
    {
        private readonly IAppDbContext _db;
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationService(
            IAppDbContext db,
            IHubContext<NotificationHub> hubContext)
        {
            _db = db;
            _hubContext = hubContext;
        }

        public async Task<NotificationSetting> GetOrCreateSettingAsync()
        {
            var setting = await _db.NotificationSettings.FirstOrDefaultAsync();
            if (setting != null) return setting;

            setting = new NotificationSetting
            {
                LessonUploadEnabled = true,
                VirtualClassReminderEnabled = true,
                ReminderOffsetsCsv = "30",
                UpdatedAtUtc = DateTime.UtcNow
            };

            _db.NotificationSettings.Add(setting);
            await _db.SaveChangesAsync();

            return setting;
        }
        //Chuyển chuỗi thành số nguyên, lọc ra những số hợp lệ, sắp xếp và lấy 5 phần tử lớn nhất
        public List<int> ParseOffsets(string csv)
        {
            return (csv ?? "")
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(x => x.Trim())
                .Where(x => int.TryParse(x, out _))
                .Select(int.Parse)
                .Where(x => x > 0)
                .Distinct()
                .OrderByDescending(x => x)
                .Take(5)
                .ToList();
        }

        public async Task<NotificationSettingDto> GetSettingDtoAsync()
        {
            var setting = await GetOrCreateSettingAsync();

            return new NotificationSettingDto
            {
                LessonUploadEnabled = setting.LessonUploadEnabled,
                VirtualClassReminderEnabled = setting.VirtualClassReminderEnabled,
                ReminderMinutesBefore = ParseOffsets(setting.ReminderOffsetsCsv),
                UpdatedAtUtc = setting.UpdatedAtUtc.ToString("O")
            };
        }

        public async Task<NotificationSettingDto> UpdateSettingAsync(UpdateNotificationSettingRequest req)
        {
            if (req.ReminderMinutesBefore == null)
                req.ReminderMinutesBefore = new List<int>();

            var clean = req.ReminderMinutesBefore
                .Where(x => x > 0)
                .Distinct()
                .OrderByDescending(x => x)
                .Take(5)
                .ToList();

            var setting = await GetOrCreateSettingAsync();
            setting.LessonUploadEnabled = req.LessonUploadEnabled;
            setting.VirtualClassReminderEnabled = req.VirtualClassReminderEnabled;
            setting.ReminderOffsetsCsv = string.Join(",", clean);
            setting.UpdatedAtUtc = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return await GetSettingDtoAsync();
        }
        public async Task DeleteMyNotificationAsync(string role, int userId, int notificationId)
        {
            var item = await _db.Notifications.FirstOrDefaultAsync(x =>
                x.NotificationID == notificationId &&
                x.ReceiverRole == role &&
                x.ReceiverUserId == userId);

            if (item == null) throw new Exception("Không tìm thấy thông báo.");

            _db.Notifications.Remove(item);
            await _db.SaveChangesAsync();

            await PushUnreadToGroupMembersAsync(role, new List<int> { userId });
        }
        public async Task<List<NotificationDto>> GetMyNotificationsAsync(string role, int userId, int take = 20)
        {
            var rows = await _db.Notifications.AsNoTracking()
                .Where(x => x.ReceiverRole == role && x.ReceiverUserId == userId)
                .OrderByDescending(x => x.CreatedAtUtc)
                .Take(take)
                .ToListAsync();

            return rows.Select(x => new NotificationDto
            {
                Id = x.NotificationID,
                Title = x.Title,
                Message = x.Message,
                Type = x.Type,
                NavigationUrl = x.NavigationUrl,
                IsRead = x.IsRead,
                CreatedAtUtc = DateTime.SpecifyKind(x.CreatedAtUtc, DateTimeKind.Utc).ToString("O")
            }).ToList();
        }

        public async Task<int> GetUnreadCountAsync(string role, int userId)
        {
            return await _db.Notifications
                .CountAsync(x => x.ReceiverRole == role && x.ReceiverUserId == userId && !x.IsRead);
        }

        public async Task MarkAsReadAsync(string role, int userId, int notificationId)
        {
            var item = await _db.Notifications.FirstOrDefaultAsync(x =>
                x.NotificationID == notificationId &&
                x.ReceiverRole == role &&
                x.ReceiverUserId == userId);

            if (item == null) throw new Exception("Không tìm thấy thông báo.");

            if (!item.IsRead)
            {
                item.IsRead = true;
                item.ReadAtUtc = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
        }

        public async Task CreateLessonUploadNotificationsAsync(Lesson lesson)
        {
            var setting = await GetOrCreateSettingAsync();
            if (!setting.LessonUploadEnabled) return;

            var className = await _db.Classes
                .Where(x => x.ClassID == lesson.ClassId)
                .Select(x => x.ClassName)
                .FirstOrDefaultAsync() ?? $"Lớp {lesson.ClassId}";

            var subjectName = await _db.Subjects
                .Where(x => x.SubjectID == lesson.SubjectId)
                .Select(x => x.SubjectName)
                .FirstOrDefaultAsync() ?? $"Môn {lesson.SubjectId}";

            var students = await _db.Students.AsNoTracking()
                .Where(x => x.ClassId == lesson.ClassId)
                .Select(x => new { x.StudentID })
                .ToListAsync();

            foreach (var student in students)
            {
                var dedupKey = $"lesson-upload:{lesson.LessonID}:Student:{student.StudentID}";
                var exists = await _db.Notifications.AnyAsync(x => x.DedupKey == dedupKey);
                if (exists) continue;

                var notification = new Notification
                {
                    ReceiverRole = "Student",
                    ReceiverUserId = student.StudentID,
                    Title = "Bài giảng mới",
                    Message = $"{subjectName} - {className}: giáo viên vừa đăng bài giảng \"{lesson.LessonTitle}\".",
                    Type = "LessonUploaded",
                    NavigationUrl = "/student/lessons",
                    SourceType = "Lesson",
                    SourceId = lesson.LessonID,
                    DedupKey = dedupKey,
                    CreatedAtUtc = DateTime.UtcNow
                };

                _db.Notifications.Add(notification);
            }

            await _db.SaveChangesAsync();
            await PushUnreadToGroupMembersAsync("Student", students.Select(x => x.StudentID).ToList());
        }

        public async Task CreateVirtualClassReminderNotificationsAsync(VirtualClass vc, int minutesBefore)
        {
            var setting = await GetOrCreateSettingAsync();
            if (!setting.VirtualClassReminderEnabled) return;

            var className = await _db.Classes
                .Where(x => x.ClassID == vc.ClassId)
                .Select(x => x.ClassName)
                .FirstOrDefaultAsync() ?? $"Lớp {vc.ClassId}";

            var subjectName = await _db.Subjects
                .Where(x => x.SubjectID == vc.SubjectId)
                .Select(x => x.SubjectName)
                .FirstOrDefaultAsync() ?? $"Môn {vc.SubjectId}";

            var teacherNotificationKey = $"virtual-reminder:{vc.VirtualClassID}:Teacher:{vc.TeacherId}:{minutesBefore}";
            if (!await _db.Notifications.AnyAsync(x => x.DedupKey == teacherNotificationKey))
            {
                _db.Notifications.Add(new Notification
                {
                    ReceiverRole = "Teacher",
                    ReceiverUserId = vc.TeacherId,
                    Title = "Sắp đến giờ lớp học ảo",
                    Message = $"{subjectName} - {className} sẽ bắt đầu sau {minutesBefore} phút.",
                    Type = "VirtualClassReminder",
                    NavigationUrl = "/teacher/virtual-class",
                    SourceType = "VirtualClass",
                    SourceId = vc.VirtualClassID,
                    ReminderMinutesBefore = minutesBefore,
                    DedupKey = teacherNotificationKey,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }

            var students = await _db.Students.AsNoTracking()
                .Where(x => x.ClassId == vc.ClassId)
                .Select(x => x.StudentID)
                .ToListAsync();

            foreach (var studentId in students)
            {
                var dedupKey = $"virtual-reminder:{vc.VirtualClassID}:Student:{studentId}:{minutesBefore}";
                var exists = await _db.Notifications.AnyAsync(x => x.DedupKey == dedupKey);
                if (exists) continue;

                _db.Notifications.Add(new Notification
                {
                    ReceiverRole = "Student",
                    ReceiverUserId = studentId,
                    Title = "Sắp đến giờ lớp học ảo",
                    Message = $"{subjectName} - {className} sẽ bắt đầu sau {minutesBefore} phút.",
                    Type = "VirtualClassReminder",
                    NavigationUrl = "/student/virtual-class",
                    SourceType = "VirtualClass",
                    SourceId = vc.VirtualClassID,
                    ReminderMinutesBefore = minutesBefore,
                    DedupKey = dedupKey,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync();

            await PushUnreadToGroupMembersAsync("Teacher", new List<int> { vc.TeacherId });
            await PushUnreadToGroupMembersAsync("Student", students);
        }

        private async Task PushUnreadToGroupMembersAsync(string role, List<int> userIds)
        {
            foreach (var userId in userIds.Distinct())
            {
                var latestRows = await _db.Notifications.AsNoTracking()
                    .Where(x => x.ReceiverRole == role && x.ReceiverUserId == userId)
                    .OrderByDescending(x => x.CreatedAtUtc)
                    .Take(20)
                    .ToListAsync();

                var latest = latestRows.Select(x => new NotificationDto
                {
                    Id = x.NotificationID,
                    Title = x.Title,
                    Message = x.Message,
                    Type = x.Type,
                    NavigationUrl = x.NavigationUrl,
                    IsRead = x.IsRead,
                    CreatedAtUtc = DateTime.SpecifyKind(x.CreatedAtUtc, DateTimeKind.Utc).ToString("O")
                }).ToList();

                var unreadCount = await _db.Notifications.CountAsync(x =>
                    x.ReceiverRole == role &&
                    x.ReceiverUserId == userId &&
                    !x.IsRead);

                await _hubContext.Clients
                    .Group(NotificationHub.BuildUserGroup(role, userId))
                    .SendAsync("notification:refresh", new
                    {
                        unreadCount,
                        items = latest
                    });
            }
        }

        public async Task CreateVirtualClassCreatedNotificationsAsync(VirtualClass vc)
        {
            var className = await _db.Classes
                .Where(x => x.ClassID == vc.ClassId)
                .Select(x => x.ClassName)
                .FirstOrDefaultAsync() ?? $"Lớp {vc.ClassId}";

            var subjectName = await _db.Subjects
                .Where(x => x.SubjectID == vc.SubjectId)
                .Select(x => x.SubjectName)
                .FirstOrDefaultAsync() ?? $"Môn {vc.SubjectId}";

            var teacherKey = $"virtual-created:{vc.VirtualClassID}:Teacher:{vc.TeacherId}";
            if (!await _db.Notifications.AnyAsync(x => x.DedupKey == teacherKey))
            {
                _db.Notifications.Add(new Notification
                {
                    ReceiverRole = "Teacher",
                    ReceiverUserId = vc.TeacherId,
                    Title = "Lớp học ảo mới",
                    Message = $"{subjectName} - {className}: lớp học ảo đã được tạo.",
                    Type = "VirtualClassCreated",
                    NavigationUrl = "/teacher/virtual-class",
                    SourceType = "VirtualClass",
                    SourceId = vc.VirtualClassID,
                    DedupKey = teacherKey,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }

            var students = await _db.Students.AsNoTracking()
                .Where(x => x.ClassId == vc.ClassId)
                .Select(x => x.StudentID)
                .ToListAsync();

            foreach (var studentId in students)
            {
                var dedupKey = $"virtual-created:{vc.VirtualClassID}:Student:{studentId}";
                if (await _db.Notifications.AnyAsync(x => x.DedupKey == dedupKey)) continue;

                _db.Notifications.Add(new Notification
                {
                    ReceiverRole = "Student",
                    ReceiverUserId = studentId,
                    Title = "Lớp học ảo mới",
                    Message = $"{subjectName} - {className}: giáo viên vừa tạo lớp học ảo mới.",
                    Type = "VirtualClassCreated",
                    NavigationUrl = "/student/virtual-class",
                    SourceType = "VirtualClass",
                    SourceId = vc.VirtualClassID,
                    DedupKey = dedupKey,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync();
            await PushUnreadToGroupMembersAsync("Teacher", new List<int> { vc.TeacherId });
            await PushUnreadToGroupMembersAsync("Student", students);
        }
    }
}
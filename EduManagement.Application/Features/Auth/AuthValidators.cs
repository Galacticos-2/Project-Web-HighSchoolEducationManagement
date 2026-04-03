using System.Text.RegularExpressions;
using EduManagement.Application.Common.Exceptions;

namespace EduManagement.Application.Features.Auth
{
    public static class AuthValidators
    {
        private static readonly Regex VietnameseMobileRegex =
            new(@"^(?:0|84|\+84)(?:3|5|7|8|9)\d{8}$", RegexOptions.Compiled);

        public static string? NormalizeVietnamesePhone(string? input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return null;

            var cleaned = Regex.Replace(input, @"[\s\.\-\(\)]", "");
            return cleaned;
        }

        public static void ValidateVietnamesePhone(string? input)
        {
            if (string.IsNullOrWhiteSpace(input))
                throw new ValidationException("Vui lòng nhập SĐT.");

            var normalized = NormalizeVietnamesePhone(input)!;

            if (!VietnameseMobileRegex.IsMatch(normalized))
                throw new ValidationException("SĐT không hợp lệ. Chỉ chấp nhận số di động Việt Nam.");
        }

        public static string NormalizeVietnamesePhoneForStorage(string input)
        {
            var normalized = NormalizeVietnamesePhone(input);

            if (string.IsNullOrWhiteSpace(normalized))
                throw new ValidationException("Vui lòng nhập SĐT.");

            if (!VietnameseMobileRegex.IsMatch(normalized))
                throw new ValidationException("SĐT không hợp lệ. Chỉ chấp nhận số di động Việt Nam.");

            if (normalized.StartsWith("+84"))
                return normalized.Substring(1);

            if (normalized.StartsWith("0"))
                return "84" + normalized.Substring(1);

            return normalized;
        }

        public static void ValidateBirthDate(DateTime? birthDate)
        {
            if (birthDate == null)
                throw new ValidationException("Vui lòng chọn ngày sinh.");

            var today = DateTime.Today;
            var dob = birthDate.Value.Date;

            if (dob > today)
                throw new ValidationException("Ngày sinh không được lớn hơn ngày hiện tại.");

            var age = today.Year - dob.Year;
            if (dob > today.AddYears(-age))
                age--;

            if (age < 14)
                throw new ValidationException("Người dùng phải từ 14 tuổi trở lên.");

            if (age > 65)
                throw new ValidationException("Tuổi không được lớn hơn 65.");
        }
    }
}
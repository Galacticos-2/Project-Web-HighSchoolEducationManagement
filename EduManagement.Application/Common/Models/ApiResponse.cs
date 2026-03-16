namespace EduManagement.Application.Common.Models
{
    public class ApiResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = "";
        public object? Data { get; set; }

        public static ApiResponse Ok(object? data = null)
        {
            return new ApiResponse
            {
                Success = true,
                Data = data
            };
        }

        public static ApiResponse Fail(string message)
        {
            return new ApiResponse
            {
                Success = false,
                Message = message
            };
        }
    }
}
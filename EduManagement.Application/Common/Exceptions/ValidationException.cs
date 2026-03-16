using System.Net;

namespace EduManagement.Application.Common.Exceptions
{
    public class ValidationException : AppException
    {
        public ValidationException(string message)
            : base(message, HttpStatusCode.BadRequest)
        {
        }
    }
}
using System.Net;
using System.Text.Json;
using EduManagement.Application.Common.Exceptions;
using EduManagement.Application.Common.Models;
using Serilog;

namespace Project_Web_HighSchoolEducationManagement.Server.Middlewares
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;

        public ExceptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (AppException ex)
            {
                Log.Warning(ex, "Application exception");

                context.Response.StatusCode = (int)ex.StatusCode;
                context.Response.ContentType = "application/json";

                var response = ApiResponse.Fail(ex.Message);

                var json = JsonSerializer.Serialize(response);
                await context.Response.WriteAsync(json);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Unhandled exception");

                context.Response.StatusCode = 500;
                context.Response.ContentType = "application/json";

                var response = ApiResponse.Fail("Lỗi hệ thống.");

                var json = JsonSerializer.Serialize(response);
                await context.Response.WriteAsync(json);
            }
        }
    }
}
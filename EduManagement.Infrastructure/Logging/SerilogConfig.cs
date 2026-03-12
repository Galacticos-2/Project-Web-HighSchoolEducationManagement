using System;
using System.Collections.Generic;
using System.Text;
using Serilog;
namespace EduManagement.Infrastructure.Logging
{
    public static class SerilogConfig
    {
        public static void Configure()
        {
            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Information()
                .WriteTo.Console()
                .WriteTo.File(
                    "logs/log-.txt",
                    rollingInterval: RollingInterval.Day
                )
                .CreateLogger();
        }
    }
}

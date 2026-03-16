using System.Text;
using System.Text.Json;
using EduManagement.Application.Common.Interfaces;
using EduManagement.Application.Features.AdminApproval;
using EduManagement.Application.Features.Auth;
using EduManagement.Application.Features.Lessons;
using EduManagement.Application.Features.VirtualClasses;
using EduManagement.Infrastructure.Identity;
using EduManagement.Infrastructure.Logging;
using EduManagement.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Project_Web_HighSchoolEducationManagement.Server.Middlewares;
using Serilog;
namespace Project_Web_HighSchoolEducationManagement.Server
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // =========================
            // 1) Add services
            // =========================

            // DbContext
            builder.Services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(
                    builder.Configuration.GetConnectionString("DefaultConnection")));

            builder.Services.AddScoped<IAppDbContext>(sp =>
                sp.GetRequiredService<AppDbContext>());
            SerilogConfig.Configure();

            

            builder.Host.UseSerilog();
            // JWT Authentication
            var jwt = builder.Configuration.GetSection("Jwt");

            builder.Services
                .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateIssuerSigningKey = true,
                        ValidateLifetime = true,
                        ValidIssuer = jwt["Issuer"],
                        ValidAudience = jwt["Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(jwt["Key"]!))
                    };
                });

            builder.Services.AddAuthorization();

            // CORS (cho React dev)
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowClient", policy =>
                    policy.AllowAnyHeader()
                          .AllowAnyMethod()
                          .SetIsOriginAllowed(_ => true));
            });

            // Dependency Injection
            builder.Services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
            builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
            builder.Services.AddScoped<AuthService>();
            builder.Services.AddScoped<EduManagement.Application.Features.AdminApproval.AdminApprovalService>();

            builder.Services.AddScoped<AdminAssignmentService>();
            builder.Services.AddScoped<StudentLessonService>();
            builder.Services.AddScoped<TeacherLessonService>();
            builder.Services.AddScoped<TeacherVirtualClassService>();
            builder.Services.AddScoped<StudentVirtualClassService>();
            // Controllers + Swagger
            builder.Services.AddControllers()
.AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "API", Version = "v1" });

                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Description = "Nhập: Bearer {token}"
                });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });
            builder.Services.AddScoped<EduManagement.Application.Features.Lessons.TeacherLessonService>();
            var app = builder.Build();
            app.UseMiddleware<ExceptionMiddleware>();
            app.UseSerilogRequestLogging();

            // =========================
            // Seed DB: migrate + create default admin
            // =========================
            await DbInitializer.SeedAdminAsync(app.Services);

            // =========================
            // 2) Middleware pipeline
            // =========================

            app.UseDefaultFiles();
            app.UseStaticFiles();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseCors("AllowClient");

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();
            app.MapFallbackToFile("/index.html");

            await app.RunAsync();
            Log.Information("Application started");
        }
    }
}
using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitCustomAuth : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Admin",
                columns: table => new
                {
                    AdminID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AdminName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    AdminBirthday = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AdminEmail = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    AdminPassword = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    AdminPhoneNumber = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Admin", x => x.AdminID);
                });

            migrationBuilder.CreateTable(
                name: "Student",
                columns: table => new
                {
                    StudentID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StudentName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    StudentBirthday = table.Column<DateTime>(type: "datetime2", nullable: true),
                    StudentEmail = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    StudentPassword = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    PhoneNumber = table.Column<int>(type: "int", nullable: true),
                    IsApproved = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Student", x => x.StudentID);
                });

            migrationBuilder.CreateTable(
                name: "Teacher",
                columns: table => new
                {
                    TeacherID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TeacherName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    TeacherBirthday = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TeacherEmail = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    TeacherPassword = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    TeacherPhoneNumber = table.Column<int>(type: "int", nullable: true),
                    IsApproved = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Teacher", x => x.TeacherID);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Admin_AdminEmail",
                table: "Admin",
                column: "AdminEmail",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Student_StudentEmail",
                table: "Student",
                column: "StudentEmail",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Teacher_TeacherEmail",
                table: "Teacher",
                column: "TeacherEmail",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Admin");

            migrationBuilder.DropTable(
                name: "Student");

            migrationBuilder.DropTable(
                name: "Teacher");
        }
    }
}

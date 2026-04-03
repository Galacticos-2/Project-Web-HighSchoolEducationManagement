using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UploadProfileImage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvatarURL",
                table: "Teacher",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AvatarURL",
                table: "Student",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AvatarURL",
                table: "Admin",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvatarURL",
                table: "Teacher");

            migrationBuilder.DropColumn(
                name: "AvatarURL",
                table: "Student");

            migrationBuilder.DropColumn(
                name: "AvatarURL",
                table: "Admin");
        }
    }
}

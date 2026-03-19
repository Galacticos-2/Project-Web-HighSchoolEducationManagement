using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueIndexForVirtualClass : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_VirtualClass_TeacherId",
                table: "VirtualClass");

            migrationBuilder.CreateIndex(
                name: "IX_VirtualClass_TeacherId_ClassId_SubjectId_StartTime_EndTime",
                table: "VirtualClass",
                columns: new[] { "TeacherId", "ClassId", "SubjectId", "StartTime", "EndTime" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_VirtualClass_TeacherId_ClassId_SubjectId_StartTime_EndTime",
                table: "VirtualClass");

            migrationBuilder.CreateIndex(
                name: "IX_VirtualClass_TeacherId",
                table: "VirtualClass",
                column: "TeacherId");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Changeendtimestarttimeintoperiod : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_VirtualClass_TeacherId_ClassId_SubjectId_StartTime_EndTime",
                table: "VirtualClass");

            migrationBuilder.AddColumn<int>(
                name: "Period",
                table: "VirtualClass",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "StudyDate",
                table: "VirtualClass",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_VirtualClass_TeacherId_ClassId_SubjectId_StudyDate_Period",
                table: "VirtualClass",
                columns: new[] { "TeacherId", "ClassId", "SubjectId", "StudyDate", "Period" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_VirtualClass_TeacherId_ClassId_SubjectId_StudyDate_Period",
                table: "VirtualClass");

            migrationBuilder.DropColumn(
                name: "Period",
                table: "VirtualClass");

            migrationBuilder.DropColumn(
                name: "StudyDate",
                table: "VirtualClass");

            migrationBuilder.CreateIndex(
                name: "IX_VirtualClass_TeacherId_ClassId_SubjectId_StartTime_EndTime",
                table: "VirtualClass",
                columns: new[] { "TeacherId", "ClassId", "SubjectId", "StartTime", "EndTime" },
                unique: true);
        }
    }
}

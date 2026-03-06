using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSubject : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SubjectId",
                table: "TeacherAssignment",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Subject",
                columns: table => new
                {
                    SubjectID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SubjectName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Subject", x => x.SubjectID);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TeacherAssignment_SubjectId",
                table: "TeacherAssignment",
                column: "SubjectId");

            migrationBuilder.AddForeignKey(
                name: "FK_TeacherAssignment_Subject_SubjectId",
                table: "TeacherAssignment",
                column: "SubjectId",
                principalTable: "Subject",
                principalColumn: "SubjectID",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TeacherAssignment_Subject_SubjectId",
                table: "TeacherAssignment");

            migrationBuilder.DropTable(
                name: "Subject");

            migrationBuilder.DropIndex(
                name: "IX_TeacherAssignment_SubjectId",
                table: "TeacherAssignment");

            migrationBuilder.DropColumn(
                name: "SubjectId",
                table: "TeacherAssignment");
        }
    }
}

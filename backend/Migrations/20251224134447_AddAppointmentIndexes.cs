using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddAppointmentIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Appointments_DoctorId",
                table: "appointments",
                column: "doctorId");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_UserId",
                table: "appointments",
                column: "userId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Appointments_DoctorId",
                table: "appointments");

            migrationBuilder.DropIndex(
                name: "IX_Appointments_UserId",
                table: "appointments");
        }
    }
}

using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddDoctorTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // users tablosu zaten var, sadece doctors oluşturuyoruz (IF NOT EXISTS ile)
            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS `doctors` (
                    `id` int NOT NULL AUTO_INCREMENT,
                    `name` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `expertise` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `gender` longtext CHARACTER SET utf8mb4 NOT NULL,
                    CONSTRAINT `PK_doctors` PRIMARY KEY (`id`)
                ) CHARACTER SET=utf8mb4;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Sadece doctors tablosunu sil
            migrationBuilder.DropTable(
                name: "doctors");
        }
    }
}

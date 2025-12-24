using Microsoft.EntityFrameworkCore;
using Models;

namespace Services
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {

        }

        public DbSet<UserModel> users { get; set; }
        public DbSet<DoctorModel> doctors { get; set; }
        public DbSet<AppointmentModel> appointments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Performance indexes
            modelBuilder.Entity<AppointmentModel>()
                .HasIndex(a => a.doctorId)
                .HasDatabaseName("IX_Appointments_DoctorId");

            modelBuilder.Entity<AppointmentModel>()
                .HasIndex(a => a.userId)
                .HasDatabaseName("IX_Appointments_UserId");
        }
    }
}
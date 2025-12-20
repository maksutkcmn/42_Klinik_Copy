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
    }
}
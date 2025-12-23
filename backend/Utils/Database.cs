using Models;
using Services;
using Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Utils
{
    public class Database
    {
        private readonly AppDbContext context;

        public Database(AppDbContext _context)
        {
            context = _context;
        }

        public async Task<UserModel?> GetUser(string value, UserSearchType searchType)
        {
            return searchType switch
            {
                UserSearchType.Phone => await context.users.FirstOrDefaultAsync(u => u.phone == value),
                UserSearchType.Email => await context.users.FirstOrDefaultAsync(u => u.email == value),
                UserSearchType.Id => await context.users.FirstOrDefaultAsync(u => u.id.ToString() == value),
                _ => null
            };
        }

        public async Task<DoctorModel?> CreateDoctor(DoctorModel doctor)
        {
            await context.doctors.AddAsync(doctor);

            int rowsAffected = await context.SaveChangesAsync();

            if (rowsAffected == 0)
                return null;

            var response = await context.doctors.FindAsync(doctor.id);

            return response;
        }

        public async Task<DoctorModel?> GetDoctor(int id)
        {
            return await context.doctors.FirstOrDefaultAsync(u => u.id == id);
        }

        public async Task<List<DoctorModel>> GetDoctors()
        {
            return await context.doctors.ToListAsync();
        }

        public async Task<List<DoctorModel>> GetDoctorsByExpertise(string expertise)
        {
            return await context.doctors.Where(u => u.expertise == expertise).ToListAsync();
        }

        public async Task<AppointmentModel?> CreateAppointment(AppointmentModel appointment)
        {
            await context.appointments.AddAsync(appointment);

            int rowsAffected = await context.SaveChangesAsync();

            if (rowsAffected == 0)
                return null;

            var response = await context.appointments.FindAsync(appointment.id);

            return response;
        }

        public async Task<List<AppointmentModel>> GetAppoinments(string userId)
        {
            return await context.appointments.Where(u => u.userId.ToString() == userId).ToListAsync();
        }

        public async Task<AppointmentModel?> GetAppoinment(int id)
        {
            return await context.appointments.FirstOrDefaultAsync(u => u.id == id);
        }

        public async Task DeleteAppoinment(AppointmentModel appointment)
        {
            context.appointments.Remove(appointment);
            await context.SaveChangesAsync();
        }
    }
}
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

        public async Task<DoctorModel?> CreateAppointment(AppointmentModel appointment)
        {
            await context.appointments.AddAsync(appointment);

            int rowsAffected = await context.SaveChangesAsync();

            if (rowsAffected == 0)
                return null;

            var response = await context.doctors.FindAsync(appointment.id);

            return response;
        }
    }
}
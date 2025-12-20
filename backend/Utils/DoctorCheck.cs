using Microsoft.EntityFrameworkCore;
using Models;
using Services;

namespace Utils;

public class DoctorCheck
{
    private readonly AppDbContext context;

    public DoctorCheck(AppDbContext _context)
    {
        context = _context;
    }

    public async Task<AppointmentModel?> CheckAppointment(int doctorId, string time, string date)
    {
        var response = await context.appointments.FirstOrDefaultAsync(u => u.doctorId == doctorId && u.time == time && u.date == date);

        return response;
    }
}
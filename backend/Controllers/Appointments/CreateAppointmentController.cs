using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models;
using Services;
using Utils;

namespace Controllers;

[ApiController]
[Route("/api/add/appointment")]
public class CreateAppointmentController : ControllerBase
{
    private readonly Database context;
    private readonly DoctorCheck doctorCheck;
    private readonly IRedisService redisService;

    public CreateAppointmentController(Database _context, DoctorCheck _doctorCheck, IRedisService _redisService)
    {
        context = _context;
        doctorCheck = _doctorCheck;
        redisService = _redisService;
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateAppointment([FromBody] AppointmentModel appointment)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (string.IsNullOrWhiteSpace(appointment.date) || string.IsNullOrWhiteSpace(appointment.time))
                return BadRequest(new {message = "Date or time is not nullable"});

            var isExists = await doctorCheck.CheckAppointment(appointment.doctorId, appointment.time, appointment.date);

            if (isExists != null)
                return BadRequest(new {message = "This appointment is full"});

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized(new { message = "Invalid user ID" });

            appointment.userId = userId;

            var response = await context.CreateAppointment(appointment);

            await redisService.DeleteByPatternAsync("appointments:*");
            await redisService.DeleteAsync($"appointments:user:{userId}");

            return Ok(new
            {
                status = "True",
                message = "Appointment Created",
                response
            });
        }
        catch (System.Exception e)
        {
            return StatusCode(500, new
            {
                message = "Server Error",
                error = e.Message
            });
        }
    }
}


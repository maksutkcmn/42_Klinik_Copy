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
        // Generate unique lock key for this specific appointment slot
        var lockKey = $"appointment:lock:{appointment.doctorId}:{appointment.date}:{appointment.time}";
        var lockValue = Guid.NewGuid().ToString();
        var lockExpiration = TimeSpan.FromSeconds(30);

        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (string.IsNullOrWhiteSpace(appointment.date) || string.IsNullOrWhiteSpace(appointment.time))
                return BadRequest(new {message = "Date or time is not nullable"});

            // Try to acquire distributed lock
            var lockAcquired = await redisService.AcquireLockAsync(lockKey, lockValue, lockExpiration);

            if (!lockAcquired)
            {
                return Conflict(new
                {
                    message = "This appointment slot is currently being processed by another user. Please try again."
                });
            }

            try
            {
                // Double-check appointment availability within the lock
                var isExists = await doctorCheck.CheckAppointment(appointment.doctorId, appointment.time, appointment.date);

                if (isExists != null)
                    return BadRequest(new {message = "This appointment is full"});

                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                    return Unauthorized(new { message = "Invalid user ID" });

                appointment.userId = userId;

                var response = await context.CreateAppointment(appointment);

                // Invalidate appointment caches
                await redisService.DeleteByPatternAsync("appointments:*");
                await redisService.DeleteAsync($"appointments:user:{userId}");

                return Ok(new
                {
                    status = "True",
                    message = "Appointment Created",
                    response
                });
            }
            finally
            {
                // Always release the lock
                await redisService.ReleaseLockAsync(lockKey, lockValue);
            }
        }
        catch (System.Exception e)
        {
            // Ensure lock is released even on error
            await redisService.ReleaseLockAsync(lockKey, lockValue);

            return StatusCode(500, new
            {
                message = "Server Error",
                error = e.Message
            });
        }
    }
}


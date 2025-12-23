using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Services;
using Utils;

namespace Controllers;

[ApiController]
[Route("/api/delete/appointment/{id}")]
public class DeleteAppointmentController : ControllerBase
{
    private readonly Database context;
    private readonly IRedisService redisService;

    public DeleteAppointmentController(Database _context, IRedisService _redisService)
    {
        context = _context;
        redisService = _redisService;
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteAppointment(int id)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new {message = "User not authenticated"});

            var appointment = await context.GetAppoinment(id);

            if (appointment == null)
                return NotFound(new {message = "Appointment not found"});

            if (appointment.userId.ToString() != userId)
                return StatusCode(403, new {message = "This Appointment not your"});

            await context.DeleteAppoinment(appointment);

            // Invalidate appointment caches
            await redisService.DeleteByPatternAsync("appointments:*");
            await redisService.DeleteAsync($"appointments:user:{userId}");

            return Ok(new
            {
                status = "True",
                message = "Appointment deleted"
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
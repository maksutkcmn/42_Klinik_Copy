using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Utils;

namespace Controllers;


[ApiController]
[Route("/api/get/appointments")]
public class GetAppointmentsController : ControllerBase
{
    private readonly Database context;

    public GetAppointmentsController(Database _context)
    {
        context = _context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAppointments()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new {message = "User not authenticated"});
            }

            var user = await context.GetUser(userId, Enums.UserSearchType.Id);

            var appointments = await context.GetAppoinments(userId);

            if (appointments.Count == 0)
            {
                return NotFound(new {message = "User not have a appointment"});
            }

            return Ok(new
            {
                status = "True",
                message = "Process Succesfuly",
                appointments
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
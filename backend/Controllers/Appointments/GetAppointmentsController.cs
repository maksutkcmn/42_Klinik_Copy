using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Services;
using Utils;

namespace Controllers;


[ApiController]
[Route("/api/get/appointments")]
public class GetAppointmentsController : ControllerBase
{
    private readonly Database context;
    private readonly IRedisService redisService;
    private readonly IConfiguration configuration;

    public GetAppointmentsController(Database _context, IRedisService _redisService, IConfiguration _configuration)
    {
        context = _context;
        redisService = _redisService;
        configuration = _configuration;
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

            var cacheKey = $"appointments:user:{userId}";
            var expirationDays = configuration.GetValue<int>("Redis:DefaultExpirationDays");

            var cachedAppointments = await redisService.GetAsync<List<object>>(cacheKey);

            if (cachedAppointments != null)
            {
                return Ok(new
                {
                    status = "True",
                    message = "Process Succesfuly",
                    appointments = cachedAppointments,
                    fromCache = true
                });
            }

            var user = await context.GetUser(userId, Enums.UserSearchType.Id);

            var appointments = await context.GetAppoinments(userId);

            if (appointments.Count == 0)
            {
                return NotFound(new {message = "User not have a appointment"});
            }

            await redisService.SetAsync(cacheKey, appointments, TimeSpan.FromDays(expirationDays));

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
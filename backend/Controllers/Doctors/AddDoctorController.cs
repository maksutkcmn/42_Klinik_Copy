using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models;
using Services;
using Utils;

namespace Controllers;

[ApiController]
[Route("/api/add/doctor")]
public class AddDoctorController : ControllerBase
{
    private readonly Database context;
    private readonly IRedisService redisService;

    public AddDoctorController(Database _context, IRedisService _redisService)
    {
        context = _context;
        redisService = _redisService;
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> AddDoctor([FromBody] DoctorModel doctor)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (string.IsNullOrWhiteSpace(doctor.expertise) || string.IsNullOrWhiteSpace(doctor.name) 
                || string.IsNullOrWhiteSpace(doctor.gender))
            {
                return BadRequest(new {message = "Bad Input"});
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var user = await context.GetUser(userId, Enums.UserSearchType.Id);

            if (user == null)
            {
                return Unauthorized(new { message = "User not found" });
            }

            if (user.role != "admin")
            {
                return StatusCode(403, new { message = "Only admins can add doctors" });
            }

            var response = await context.CreateDoctor(doctor);

            await redisService.DeleteByPatternAsync("doctors:*");
            if (response?.id != null)
            {
                await redisService.DeleteAsync($"doctor:{response.id}");
            }

            return Ok(new
            {
                status = "True",
                message = "Doctor created",
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
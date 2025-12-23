using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services;
using Utils;

namespace Controllers;

[ApiController]
[Route("/api/get")]
public class GetDoctorController : ControllerBase
{
    private readonly Database context;
    private readonly IRedisService redisService;
    private readonly IConfiguration configuration;

    public GetDoctorController(Database _context, IRedisService _redisService, IConfiguration _configuration)
    {
        context = _context;
        redisService = _redisService;
        configuration = _configuration;
    }

    [HttpGet("doctor/{id}")]
    [Authorize]
    public async Task<IActionResult> GetDoctor(int id)
    {
        try
        {
            var cacheKey = $"doctor:{id}";
            var expirationDays = configuration.GetValue<int>("Redis:DefaultExpirationDays");

            // Try to get from cache first
            var cachedDoctor = await redisService.GetAsync<object>(cacheKey);

            if (cachedDoctor != null)
            {
                return Ok(new
                {
                    status = "True",
                    message = "Doctor Found",
                    doctor = cachedDoctor,
                    fromCache = true
                });
            }

            // If not in cache, get from database
            var doctor = await context.GetDoctor(id);

            if (doctor == null)
                return NotFound(new {message = "Doctor not Found"});

            // Cache the result for 7 days
            await redisService.SetAsync(cacheKey, doctor, TimeSpan.FromDays(expirationDays));

            return Ok(new
            {
                status = "True",
                message = "Doctor Found",
                doctor
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

    [HttpGet("doctor")]
    [Authorize]
    public async Task<IActionResult> GetDoctors()
    {
        try
        {
            var cacheKey = "doctors:all";
            var expirationDays = configuration.GetValue<int>("Redis:DefaultExpirationDays");

            // Try to get from cache first
            var cachedDoctors = await redisService.GetAsync<List<object>>(cacheKey);

            if (cachedDoctors != null)
            {
                return Ok(new
                {
                    status = "True",
                    message = "Doctor Found",
                    doctor = cachedDoctors,
                    fromCache = true
                });
            }

            // If not in cache, get from database
            var doctor = await context.GetDoctors();

            if (doctor.Count == 0)
                return NotFound(new {message = "Doctors not Found"});

            // Cache the result for 7 days
            await redisService.SetAsync(cacheKey, doctor, TimeSpan.FromDays(expirationDays));

            return Ok(new
            {
                status = "True",
                message = "Doctor Found",
                doctor
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
    
    [HttpGet("doctor/expertise/{expertise}")]
    [Authorize]
    public async Task<IActionResult> GetDoctorsByExpertise(string expertise)
    {
        try
        {
            var cacheKey = $"doctors:expertise:{expertise}";
            var expirationDays = configuration.GetValue<int>("Redis:DefaultExpirationDays");

            // Try to get from cache first
            var cachedDoctors = await redisService.GetAsync<List<object>>(cacheKey);

            if (cachedDoctors != null)
            {
                return Ok(new
                {
                    status = "True",
                    message = "Doctor Found",
                    doctor = cachedDoctors,
                    fromCache = true
                });
            }

            // If not in cache, get from database
            var doctor = await context.GetDoctorsByExpertise(expertise);

            if (doctor.Count == 0)
                return NotFound(new {message = "Doctors not Found"});

            // Cache the result for 7 days
            await redisService.SetAsync(cacheKey, doctor, TimeSpan.FromDays(expirationDays));

            return Ok(new
            {
                status = "True",
                message = "Doctor Found",
                doctor
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
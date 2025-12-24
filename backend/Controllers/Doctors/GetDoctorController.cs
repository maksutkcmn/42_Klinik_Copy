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

            var doctor = await context.GetDoctor(id);

            if (doctor == null)
                return NotFound(new {message = "Doctor not Found"});

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

            var doctor = await context.GetDoctors();

            if (doctor.Count == 0)
                return NotFound(new {message = "Doctors not Found"});

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

            var doctor = await context.GetDoctorsByExpertise(expertise);

            if (doctor.Count == 0)
                return NotFound(new {message = "Doctors not Found"});

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

    [HttpGet("doctor/appointments/{doctorid}")]
    [Authorize]
    public async Task<IActionResult> GetDoctorAppointments(int doctorid)
    {
        try
        {
            var cacheKey = $"appointments:doctor:{doctorid}";
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

            var appointments = await context.GetAppoinmentsByDoctorId(doctorid);

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
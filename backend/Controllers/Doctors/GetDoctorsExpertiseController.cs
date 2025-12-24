using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services;
using Utils;

namespace Controllers;


[ApiController]
[Route("/api/get/doctors/expertise")]
public class GetDoctorsExpertiseController : ControllerBase
{
    private readonly Database context;
    private readonly IRedisService redisService;
    private readonly IConfiguration configuration;

    public GetDoctorsExpertiseController(Database _context, IRedisService _redisService, IConfiguration _configuration)
    {
        context = _context;
        redisService = _redisService;
        configuration = _configuration;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetDoctorsExpertise()
    {
        try
        {
            var cacheKey = "doctors:expertises:all";
            var expirationDays = configuration.GetValue<int>("Redis:DefaultExpirationDays");

            var cachedExpertises = await redisService.GetAsync<object>(cacheKey);

            if (cachedExpertises != null)
            {
                return Ok(new
                {
                    status = "True",
                    message = "Process Succesfuly",
                    expertises = cachedExpertises,
                    fromCache = true
                });
            }
            var doctors = await context.GetDoctors();

            if (doctors.Count == 0)
                return NotFound(new {message = "Doctors Not Found"});

            Dictionary<string, bool> isHave = new Dictionary<string, bool>();

            for (int i = 0; i < doctors.Count; i++)
            {
                if (isHave.TryGetValue(doctors[i].expertise!, out bool value))
                    continue;
                else
                    isHave.Add(doctors[i].expertise!, true);
            }
            var expertises = isHave.Keys;

            await redisService.SetAsync(cacheKey, expertises, TimeSpan.FromDays(expirationDays));

            return Ok(new
            {
                status = "True",
                message = "Process Succesfuly",
                expertises
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
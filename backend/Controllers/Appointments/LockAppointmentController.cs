using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services;

namespace Controllers;

[ApiController]
[Route("/api/appointment/lock")]
public class LockAppointmentController : ControllerBase
{
    private readonly IRedisService redisService;

    public LockAppointmentController(IRedisService _redisService)
    {
        redisService = _redisService;
    }

    [HttpPost("acquire")]
    [Authorize]
    public async Task<IActionResult> AcquireLock([FromBody] LockRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (request.doctorId <= 0 || string.IsNullOrWhiteSpace(request.date) || string.IsNullOrWhiteSpace(request.time))
            return BadRequest(new { message = "doctorId, date and time are required" });

        var lockKey = $"appointment:lock:{request.doctorId}:{request.date}:{request.time}";
        var lockValue = Guid.NewGuid().ToString();
        var lockExpiration = TimeSpan.FromSeconds(30);

        try
        {
            var lockAcquired = await redisService.AcquireLockAsync(lockKey, lockValue, lockExpiration);

            if (!lockAcquired)
            {
                return Conflict(new
                {
                    message = "This appointment slot is currently being processed by another user. Please try again.",
                    lockAcquired = false
                });
            }

            return Ok(new
            {
                message = "Lock acquired successfully",
                lockAcquired = true,
                lockKey = lockKey,
                lockValue = lockValue,
                expiresInSeconds = 30
            });
        }
        catch (Exception e)
        {
            return StatusCode(500, new
            {
                message = "Server Error",
                error = e.Message
            });
        }
    }

    [HttpPost("release")]
    [Authorize]
    public async Task<IActionResult> ReleaseLock([FromBody] ReleaseLockRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (string.IsNullOrWhiteSpace(request.lockKey) || string.IsNullOrWhiteSpace(request.lockValue))
            return BadRequest(new { message = "lockKey and lockValue are required" });

        try
        {
            var released = await redisService.ReleaseLockAsync(request.lockKey, request.lockValue);

            if (!released)
            {
                return BadRequest(new
                {
                    message = "Failed to release lock. Lock may have already expired or been released.",
                    lockReleased = false
                });
            }

            return Ok(new
            {
                message = "Lock released successfully",
                lockReleased = true
            });
        }
        catch (Exception e)
        {
            return StatusCode(500, new
            {
                message = "Server Error",
                error = e.Message
            });
        }
    }
}

public class LockRequest
{
    public int doctorId { get; set; }
    public string? date { get; set; }
    public string? time { get; set; }
}

public class ReleaseLockRequest
{
    public string? lockKey { get; set; }
    public string? lockValue { get; set; }
}

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Services;

namespace Controllers;

[ApiController]
[Route("/api/get/user")]
public class GetUserController : ControllerBase
{
    private readonly AppDbContext context;

    public GetUserController(AppDbContext _context)
    {
        context = _context;
    }

    [HttpGet("role")]
    [Authorize]
    public async Task<IActionResult> GetUserRole()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var userRole = await context.users.Where(u => u.id.ToString() == userId).Select(u => u.role).FirstOrDefaultAsync();

            if (userRole == null)
                return NotFound(new {message = "User role not found"});
            
            return Ok(new
            {
                status = "True",
                message = "User role found",
                userRole
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
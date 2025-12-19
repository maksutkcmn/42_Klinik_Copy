using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using Services;
using BCrypt.Net;

namespace Controllers;


[ApiController]
[Route("api/[controller]")]
public class RegisterController : ControllerBase
{

    private readonly AppDbContext context;

    public RegisterController(AppDbContext _context)
    {
        context =_context;
    }

    [HttpPost]
    public async Task<IActionResult> Register([FromBody] UserModel user)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            
            if (string.IsNullOrWhiteSpace(user.name) || string.IsNullOrWhiteSpace(user.surname) || string.IsNullOrWhiteSpace(user.email) 
                || string.IsNullOrWhiteSpace(user.password) || string.IsNullOrWhiteSpace(user.phone))
            {
                return BadRequest(new {message = "Everything is Required"});
            }

            var existingEmail = await context.users.FirstOrDefaultAsync(u => u.email == user.email);
            var existingPhone = await context.users.FirstOrDefaultAsync(u => u.phone == user.phone);

            if (existingEmail != null || existingPhone != null)
            {
                return BadRequest(new {message = "This Email or Phone is already existing"});
            }
            user.password = BCrypt.Net.BCrypt.HashPassword(user.password, 10);

            await context.users.AddAsync(user);

            int rowsAffected = await context.SaveChangesAsync();

            if (rowsAffected == 0)
            {
                return BadRequest(new {message = "User Create Failure"});
            }

            var response = await context.users.FindAsync(user.id);

            return Ok(new
            {    
                status = "True",
                message = "User Create Succesfuly",
                user = new
                {
                    response?.name,
                    response?.surname,
                    response?.email,
                    response?.phone,
                }
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
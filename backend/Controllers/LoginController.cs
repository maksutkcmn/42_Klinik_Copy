using Microsoft.AspNetCore.Mvc;
using Models;
using Services;
using Utils;
using Enums;

namespace Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LoginController : ControllerBase
    {
        private readonly JwtService jwtService;
        private readonly Database context;

        public LoginController(JwtService _jwtService, Database _context)
        {
            jwtService = _jwtService;
            context = _context;
        }

        [HttpPost]
        public async Task<IActionResult> Login([FromBody] LoginModel login)
        {
            try
            {    
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                if (string.IsNullOrWhiteSpace(login.phone) || string.IsNullOrWhiteSpace(login.password))
                    return BadRequest(new {message = "Phone and Password is Required"});

                var user = await context.GetUser(login.phone, UserSearchType.Phone);

                if (user == null)
                    return BadRequest(new {message = "User not Found"});

                if (!BCrypt.Net.BCrypt.Verify(login.password, user.password))
                    return BadRequest(new {message = "Password or Phone dont match"});
                
                var jwtToken = jwtService.GenerateToken(user.id.ToString(), login.phone!);
                
                return Ok(new
                {
                    status = "True",
                    message = "Login Succesfuly",
                    jwtToken
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
}
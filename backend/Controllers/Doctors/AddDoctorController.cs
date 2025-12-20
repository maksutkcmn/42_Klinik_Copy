using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models;
using Utils;

namespace Controllers;

[ApiController]
[Route("/api/add/doctor")]
public class AddDoctorController : ControllerBase
{
    private readonly Database context;

    public AddDoctorController(Database _context)
    {
        context = _context;
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

            var response = await context.CreateDoctor(doctor);

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
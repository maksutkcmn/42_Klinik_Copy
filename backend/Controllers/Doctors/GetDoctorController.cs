using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Utils;

namespace Controllers;

[ApiController]
[Route("/api/get")]
public class GetDoctorController : ControllerBase
{
    private readonly Database context;

    public GetDoctorController(Database _context)
    {
        context = _context;
    }

    [HttpGet("doctor/{id}")]
    [Authorize]
    public async Task<IActionResult> GetDoctor(int id)
    {
        try
        {
            var doctor = await context.GetDoctor(id);

            if (doctor == null)
                return NotFound(new {message = "Doctor not Found"});
            
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
            var doctor = await context.GetDoctors();

            if (doctor.Count == 0)
                return NotFound(new {message = "Doctors not Found"});
            
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
            var doctor = await context.GetDoctorsByExpertise(expertise);
    
            if (doctor.Count == 0)
                return NotFound(new {message = "Doctors not Found"});
            
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
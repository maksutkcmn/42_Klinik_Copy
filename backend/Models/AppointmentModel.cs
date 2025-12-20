using System.ComponentModel.DataAnnotations;

namespace Models;

public class AppointmentModel
{
    public int id  { get; set; }
    
    public int userId  { get; set; }

    [Required(ErrorMessage = "doctorId is Required")]
    public int doctorId  { get; set; }

    [Required(ErrorMessage = "Time is Required")]
    public string? time { get; set; }

    [Required(ErrorMessage = "Date is Required")]
    public string? date { get; set; }
}
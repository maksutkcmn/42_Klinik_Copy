using System.ComponentModel.DataAnnotations;

namespace Models;

public class DoctorModel
{
    [Key]
    public int id { get; set; }
    
    [Required(ErrorMessage = "Name is Required")]
    public string? name { get; set; }

    [Required(ErrorMessage = "Expertise is Required")]
    public string? expertise { get; set; }

    [Required(ErrorMessage = "Gender is Required")]
    public string? gender { get; set; }
}
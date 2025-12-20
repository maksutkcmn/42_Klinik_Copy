using System.ComponentModel.DataAnnotations;

namespace Models
{
    public class UserModel
    {
        [Key]
        public int id { get; set; }

        [Required(ErrorMessage = "Name is Required")]
        public string? name { get; set;}

        [Required(ErrorMessage = "Surname is Required")]
        public string? surname { get; set;}

        [Required(ErrorMessage = "Email is Required")]
        public string? email { get; set;}

        [Required(ErrorMessage = "Phone is Required")]
        public string? phone { get; set;}

        [Required(ErrorMessage = "Password is Required")]
        public string? password { get; set;}

        public string? role { get; set;}
    }

    public class LoginModel
    {
        [Required(ErrorMessage = "Phone is Required")]
        public string? phone { get; set; }

        [Required(ErrorMessage = "Password is Required")]
        public string? password { get; set; }
    }
}
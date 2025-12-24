using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Services;
using Utils;
using DotNetEnv;

// .env dosyasını yükle
Env.Load();

var builder = WebApplication.CreateBuilder(args);

// .env değerlerini configuration'a override et
builder.Configuration["ConnectionStrings:DefaultConnection"] =
    $"Server={Environment.GetEnvironmentVariable("DB_SERVER") ?? "localhost"};" +
    $"Database={Environment.GetEnvironmentVariable("DB_NAME") ?? "klinik"};" +
    $"User={Environment.GetEnvironmentVariable("DB_USER") ?? "root"};" +
    $"Password={Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "1234"};";

builder.Configuration["JwtSettings:SecretKey"] = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? "BuCokGizliBirAnahtarOlmaliEnAz32KarakterUzunlugunda";
builder.Configuration["JwtSettings:Issuer"] = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "KlinikAPI";
builder.Configuration["JwtSettings:Audience"] = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "KlinikClient";
builder.Configuration["JwtSettings:ExpirationMinutes"] = Environment.GetEnvironmentVariable("JWT_EXPIRATION_MINUTES") ?? "60";

builder.Configuration["Redis:Enabled"] = Environment.GetEnvironmentVariable("REDIS_ENABLED") ?? "true";
builder.Configuration["Redis:ConnectionString"] = Environment.GetEnvironmentVariable("REDIS_CONNECTION_STRING") ?? "localhost:6379";
builder.Configuration["Redis:DefaultExpirationDays"] = Environment.GetEnvironmentVariable("REDIS_DEFAULT_EXPIRATION_DAYS") ?? "7";

builder.Services.AddOpenApi();

builder.Services.AddControllers();

// DI
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<Database>();
builder.Services.AddScoped<DoctorCheck>();
builder.Services.AddSingleton<IRedisService, RedisService>();

var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!)),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))
    ));

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
   });
});

var app = builder.Build();

// Database migration otomatik uygulama
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate(); // Migration'ları otomatik uygula
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowAll");
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

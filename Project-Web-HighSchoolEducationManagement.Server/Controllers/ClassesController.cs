using EduManagement.Application.Common.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Project_Web_HighSchoolEducationManagement.Server.Controllers;

[ApiController]
[Route("api/classes")]
public class ClassesController : ControllerBase
{
    private readonly IAppDbContext _db;
    public ClassesController(IAppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var data = await _db.Classes
            .AsNoTracking()
            .OrderBy(x => x.ClassName)
            .Select(x => new { id = x.ClassID, name = x.ClassName, year = x.ClassYear })
            .ToListAsync();

        return Ok(data);
    }
}
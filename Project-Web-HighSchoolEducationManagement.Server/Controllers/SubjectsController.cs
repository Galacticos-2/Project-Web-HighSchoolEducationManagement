using EduManagement.Application.Common.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Project_Web_HighSchoolEducationManagement.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SubjectsController : ControllerBase
{
    private readonly IAppDbContext _db;

    public SubjectsController(IAppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _db.Subjects
            .Select(x => new
            {
                id = x.SubjectID,
                name = x.SubjectName
            })
            .ToListAsync();

        return Ok(list);
    }
}
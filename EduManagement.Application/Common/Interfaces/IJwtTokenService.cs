using System;
using System.Collections.Generic;
using System.Text;

namespace EduManagement.Application.Common.Interfaces;

public interface IJwtTokenService
{
    (string token, DateTime expiresAtUtc) CreateToken(int userId, string role, string fullName, string email);
}

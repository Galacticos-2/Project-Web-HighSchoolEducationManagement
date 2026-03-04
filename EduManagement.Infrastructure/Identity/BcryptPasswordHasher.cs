using System;
using System.Collections.Generic;
using System.Text;

using BCrypt.Net;
using EduManagement.Application.Common.Interfaces;

namespace EduManagement.Infrastructure.Identity;

public class BcryptPasswordHasher : IPasswordHasher
{
    public string Hash(string plain) => BCrypt.Net.BCrypt.HashPassword(plain);
    public bool Verify(string plain, string hash) => BCrypt.Net.BCrypt.Verify(plain, hash);
}

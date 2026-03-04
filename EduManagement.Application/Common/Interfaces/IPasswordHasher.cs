using System;
using System.Collections.Generic;
using System.Text;

namespace EduManagement.Application.Common.Interfaces;

public interface IPasswordHasher
{
    string Hash(string plain);
    bool Verify(string plain, string hash);
}
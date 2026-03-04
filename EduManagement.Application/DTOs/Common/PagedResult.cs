using System;
using System.Collections.Generic;
using System.Text;

namespace EduManagement.Application.DTOs.Common
{
    public class PagedResult<T>
    {
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int Total { get; set; }
        public List<T> Items { get; set; } = new();
    }
}

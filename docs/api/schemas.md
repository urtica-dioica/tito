# 📋 API Schemas Reference

This document provides detailed information about all API request and response schemas used in the TITO HR Management System.

## 🔐 Authentication Schemas

### Login Request Schema
```json
{
  "type": "object",
  "required": ["username", "password"],
  "properties": {
    "username": {
      "type": "string",
      "minLength": 3,
      "maxLength": 100,
      "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      "description": "User email address"
    },
    "password": {
      "type": "string",
      "minLength": 8,
      "maxLength": 128,
      "description": "User password"
    }
  }
}
```

### Login Response Schema
```json
{
  "type": "object",
  "required": ["success", "data"],
  "properties": {
    "success": {
      "type": "boolean",
      "description": "Request success status"
    },
    "data": {
      "type": "object",
      "required": ["token", "refreshToken", "user", "expiresIn"],
      "properties": {
        "token": {
          "type": "string",
          "description": "JWT access token"
        },
        "refreshToken": {
          "type": "string",
          "description": "JWT refresh token"
        },
        "user": {
          "$ref": "#/definitions/User"
        },
        "expiresIn": {
          "type": "integer",
          "description": "Token expiration time in seconds"
        }
      }
    }
  }
}
```

### Refresh Token Request Schema
```json
{
  "type": "object",
  "required": ["refreshToken"],
  "properties": {
    "refreshToken": {
      "type": "string",
      "description": "JWT refresh token"
    }
  }
}
```

### Forgot Password Request Schema
```json
{
  "type": "object",
  "required": ["email"],
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "description": "User email address"
    }
  }
}
```

## 👤 User Schemas

### User Schema
```json
{
  "type": "object",
  "required": ["id", "username", "role"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "User unique identifier"
    },
    "username": {
      "type": "string",
      "description": "User email address"
    },
    "role": {
      "type": "string",
      "enum": ["hr", "department_head", "employee"],
      "description": "User role"
    },
    "permissions": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "User permissions"
    }
  }
}
```

## 👥 Employee Schemas

### Employee Schema
```json
{
  "type": "object",
  "required": ["id", "name", "email", "position", "department_id", "hire_date", "base_salary", "employment_type", "status"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Employee unique identifier"
    },
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 100,
      "description": "Employee full name"
    },
    "email": {
      "type": "string",
      "format": "email",
      "description": "Employee email address"
    },
    "position": {
      "type": "string",
      "minLength": 2,
      "maxLength": 100,
      "description": "Employee job position"
    },
    "department_id": {
      "type": "string",
      "format": "uuid",
      "description": "Department identifier"
    },
    "department": {
      "$ref": "#/definitions/Department"
    },
    "hire_date": {
      "type": "string",
      "format": "date",
      "description": "Employee hire date"
    },
    "base_salary": {
      "type": "number",
      "minimum": 10000,
      "maximum": 1000000,
      "description": "Employee base salary"
    },
    "employment_type": {
      "type": "string",
      "enum": ["regular", "contractual", "jo"],
      "description": "Employment type"
    },
    "status": {
      "type": "string",
      "enum": ["active", "inactive", "terminated", "on_leave"],
      "description": "Employee status"
    },
    "phone": {
      "type": "string",
      "pattern": "^\\+?[1-9]\\d{1,14}$",
      "description": "Employee phone number"
    },
    "address": {
      "type": "string",
      "maxLength": 500,
      "description": "Employee address"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "description": "Creation timestamp"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time",
      "description": "Last update timestamp"
    }
  }
}
```

### Create Employee Request Schema
```json
{
  "type": "object",
  "required": ["name", "email", "position", "department_id", "hire_date", "base_salary", "employment_type"],
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 100,
      "description": "Employee full name"
    },
    "email": {
      "type": "string",
      "format": "email",
      "description": "Employee email address"
    },
    "position": {
      "type": "string",
      "minLength": 2,
      "maxLength": 100,
      "description": "Employee job position"
    },
    "department_id": {
      "type": "string",
      "format": "uuid",
      "description": "Department identifier"
    },
    "hire_date": {
      "type": "string",
      "format": "date",
      "description": "Employee hire date"
    },
    "base_salary": {
      "type": "number",
      "minimum": 10000,
      "maximum": 1000000,
      "description": "Employee base salary"
    },
    "employment_type": {
      "type": "string",
      "enum": ["regular", "contractual", "jo"],
      "description": "Employment type"
    },
    "phone": {
      "type": "string",
      "pattern": "^\\+?[1-9]\\d{1,14}$",
      "description": "Employee phone number"
    },
    "address": {
      "type": "string",
      "maxLength": 500,
      "description": "Employee address"
    }
  }
}
```

### Update Employee Request Schema
```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 100,
      "description": "Employee full name"
    },
    "email": {
      "type": "string",
      "format": "email",
      "description": "Employee email address"
    },
    "position": {
      "type": "string",
      "minLength": 2,
      "maxLength": 100,
      "description": "Employee job position"
    },
    "department_id": {
      "type": "string",
      "format": "uuid",
      "description": "Department identifier"
    },
    "base_salary": {
      "type": "number",
      "minimum": 10000,
      "maximum": 1000000,
      "description": "Employee base salary"
    },
    "employment_type": {
      "type": "string",
      "enum": ["regular", "contractual", "jo"],
      "description": "Employment type"
    },
    "status": {
      "type": "string",
      "enum": ["active", "inactive", "terminated", "on_leave"],
      "description": "Employee status"
    },
    "phone": {
      "type": "string",
      "pattern": "^\\+?[1-9]\\d{1,14}$",
      "description": "Employee phone number"
    },
    "address": {
      "type": "string",
      "maxLength": 500,
      "description": "Employee address"
    }
  }
}
```

## 🏢 Department Schemas

### Department Schema
```json
{
  "type": "object",
  "required": ["id", "name", "description", "created_at"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Department unique identifier"
    },
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 100,
      "description": "Department name"
    },
    "description": {
      "type": "string",
      "maxLength": 500,
      "description": "Department description"
    },
    "head": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid",
          "description": "Department head user ID"
        },
        "name": {
          "type": "string",
          "description": "Department head name"
        },
        "email": {
          "type": "string",
          "format": "email",
          "description": "Department head email"
        }
      }
    },
    "employee_count": {
      "type": "integer",
      "minimum": 0,
      "description": "Number of employees in department"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "description": "Creation timestamp"
    }
  }
}
```

### Create Department Request Schema
```json
{
  "type": "object",
  "required": ["name"],
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 100,
      "description": "Department name"
    },
    "description": {
      "type": "string",
      "maxLength": 500,
      "description": "Department description"
    },
    "head_id": {
      "type": "string",
      "format": "uuid",
      "description": "Department head user ID"
    }
  }
}
```

## 💰 Payroll Schemas

### Payroll Schema
```json
{
  "type": "object",
  "required": ["id", "employee", "period", "base_salary", "total_hours", "gross_pay", "deductions", "benefits", "net_pay", "status"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Payroll unique identifier"
    },
    "employee": {
      "type": "object",
      "required": ["id", "name", "position"],
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid",
          "description": "Employee ID"
        },
        "name": {
          "type": "string",
          "description": "Employee name"
        },
        "position": {
          "type": "string",
          "description": "Employee position"
        }
      }
    },
    "period": {
      "type": "string",
      "pattern": "^\\d{4}-\\d{2}$",
      "description": "Payroll period (YYYY-MM)"
    },
    "base_salary": {
      "type": "number",
      "minimum": 0,
      "description": "Employee base salary"
    },
    "total_hours": {
      "type": "number",
      "minimum": 0,
      "description": "Total worked hours"
    },
    "overtime_hours": {
      "type": "number",
      "minimum": 0,
      "description": "Overtime hours"
    },
    "gross_pay": {
      "type": "number",
      "minimum": 0,
      "description": "Gross pay amount"
    },
    "deductions": {
      "type": "number",
      "minimum": 0,
      "description": "Total deductions"
    },
    "benefits": {
      "type": "number",
      "minimum": 0,
      "description": "Total benefits"
    },
    "net_pay": {
      "type": "number",
      "minimum": 0,
      "description": "Net pay amount"
    },
    "status": {
      "type": "string",
      "enum": ["draft", "processed", "paid"],
      "description": "Payroll status"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "description": "Creation timestamp"
    }
  }
}
```

### Generate Payroll Request Schema
```json
{
  "type": "object",
  "required": ["period"],
  "properties": {
    "period": {
      "type": "string",
      "pattern": "^\\d{4}-\\d{2}$",
      "description": "Payroll period (YYYY-MM)"
    },
    "employee_ids": {
      "type": "array",
      "items": {
        "type": "string",
        "format": "uuid"
      },
      "description": "Array of employee IDs to process (empty array processes all employees)"
    }
  }
}
```

## ⏰ Attendance Schemas

### Attendance Schema
```json
{
  "type": "object",
  "required": ["id", "employee_id", "date", "status"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Attendance unique identifier"
    },
    "employee_id": {
      "type": "string",
      "format": "uuid",
      "description": "Employee ID"
    },
    "date": {
      "type": "string",
      "format": "date",
      "description": "Attendance date"
    },
    "clock_in": {
      "type": "string",
      "pattern": "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$",
      "description": "Clock in time (HH:MM:SS)"
    },
    "clock_out": {
      "type": "string",
      "pattern": "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$",
      "description": "Clock out time (HH:MM:SS)"
    },
    "total_hours": {
      "type": "number",
      "minimum": 0,
      "maximum": 24,
      "description": "Total worked hours"
    },
    "status": {
      "type": "string",
      "enum": ["present", "late", "partial", "absent"],
      "description": "Attendance status"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "description": "Creation timestamp"
    }
  }
}
```

### Clock In Request Schema
```json
{
  "type": "object",
  "required": ["employee_id", "selfie_image"],
  "properties": {
    "employee_id": {
      "type": "string",
      "format": "uuid",
      "description": "Employee ID"
    },
    "selfie_image": {
      "type": "string",
      "description": "Base64 encoded selfie image"
    }
  }
}
```

### Clock Out Request Schema
```json
{
  "type": "object",
  "required": ["employee_id", "selfie_image"],
  "properties": {
    "employee_id": {
      "type": "string",
      "format": "uuid",
      "description": "Employee ID"
    },
    "selfie_image": {
      "type": "string",
      "description": "Base64 encoded selfie image"
    }
  }
}
```

## 📋 Leave Schemas

### Leave Schema
```json
{
  "type": "object",
  "required": ["id", "type", "start_date", "end_date", "reason", "status"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Leave unique identifier"
    },
    "employee": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid",
          "description": "Employee ID"
        },
        "name": {
          "type": "string",
          "description": "Employee name"
        },
        "position": {
          "type": "string",
          "description": "Employee position"
        }
      }
    },
    "type": {
      "type": "string",
      "enum": ["vacation", "sick", "maternity", "other"],
      "description": "Leave type"
    },
    "start_date": {
      "type": "string",
      "format": "date",
      "description": "Leave start date"
    },
    "end_date": {
      "type": "string",
      "format": "date",
      "description": "Leave end date"
    },
    "reason": {
      "type": "string",
      "maxLength": 500,
      "description": "Leave reason"
    },
    "status": {
      "type": "string",
      "enum": ["pending", "approved", "rejected"],
      "description": "Leave status"
    },
    "approved_by": {
      "type": "string",
      "description": "Approved by user name"
    },
    "approved_at": {
      "type": "string",
      "format": "date-time",
      "description": "Approval timestamp"
    },
    "rejected_by": {
      "type": "string",
      "description": "Rejected by user name"
    },
    "rejected_at": {
      "type": "string",
      "format": "date-time",
      "description": "Rejection timestamp"
    },
    "comments": {
      "type": "string",
      "maxLength": 500,
      "description": "Approval/rejection comments"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "description": "Creation timestamp"
    }
  }
}
```

### Submit Leave Request Schema
```json
{
  "type": "object",
  "required": ["type", "start_date", "end_date", "reason"],
  "properties": {
    "type": {
      "type": "string",
      "enum": ["vacation", "sick", "maternity", "other"],
      "description": "Leave type"
    },
    "start_date": {
      "type": "string",
      "format": "date",
      "description": "Leave start date"
    },
    "end_date": {
      "type": "string",
      "format": "date",
      "description": "Leave end date"
    },
    "reason": {
      "type": "string",
      "maxLength": 500,
      "description": "Leave reason"
    }
  }
}
```

### Approve Leave Request Schema
```json
{
  "type": "object",
  "properties": {
    "comments": {
      "type": "string",
      "maxLength": 500,
      "description": "Approval comments"
    }
  }
}
```

### Reject Leave Request Schema
```json
{
  "type": "object",
  "required": ["reason"],
  "properties": {
    "reason": {
      "type": "string",
      "maxLength": 500,
      "description": "Rejection reason"
    }
  }
}
```

## 📊 Dashboard Schemas

### HR Dashboard Schema
```json
{
  "type": "object",
  "required": ["totalEmployees", "totalDepartments", "pendingRequests", "recentActivities"],
  "properties": {
    "totalEmployees": {
      "type": "integer",
      "minimum": 0,
      "description": "Total number of employees"
    },
    "totalDepartments": {
      "type": "integer",
      "minimum": 0,
      "description": "Total number of departments"
    },
    "pendingRequests": {
      "type": "integer",
      "minimum": 0,
      "description": "Number of pending requests"
    },
    "recentActivities": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "type", "description", "timestamp"],
        "properties": {
          "id": {
            "type": "string",
            "description": "Activity ID"
          },
          "type": {
            "type": "string",
            "description": "Activity type"
          },
          "description": {
            "type": "string",
            "description": "Activity description"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time",
            "description": "Activity timestamp"
          }
        }
      }
    },
    "statistics": {
      "type": "object",
      "properties": {
        "attendanceRate": {
          "type": "number",
          "minimum": 0,
          "maximum": 100,
          "description": "Overall attendance rate percentage"
        },
        "leaveRequests": {
          "type": "integer",
          "minimum": 0,
          "description": "Number of leave requests this month"
        },
        "payrollProcessed": {
          "type": "integer",
          "minimum": 0,
          "description": "Number of payroll periods processed"
        }
      }
    }
  }
}
```

## 📄 Pagination Schemas

### Pagination Schema
```json
{
  "type": "object",
  "required": ["page", "limit", "total", "pages"],
  "properties": {
    "page": {
      "type": "integer",
      "minimum": 1,
      "description": "Current page number"
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "description": "Items per page"
    },
    "total": {
      "type": "integer",
      "minimum": 0,
      "description": "Total number of items"
    },
    "pages": {
      "type": "integer",
      "minimum": 0,
      "description": "Total number of pages"
    }
  }
}
```

## ❌ Error Schemas

### Error Response Schema
```json
{
  "type": "object",
  "required": ["success", "message"],
  "properties": {
    "success": {
      "type": "boolean",
      "description": "Request success status (always false for errors)"
    },
    "message": {
      "type": "string",
      "description": "Error description"
    },
    "errors": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Detailed error messages"
    },
    "code": {
      "type": "string",
      "description": "Error code"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "Error timestamp"
    }
  }
}
```

### Validation Error Schema
```json
{
  "type": "object",
  "required": ["success", "message", "errors", "code"],
  "properties": {
    "success": {
      "type": "boolean",
      "description": "Request success status (always false)"
    },
    "message": {
      "type": "string",
      "description": "Validation error description"
    },
    "errors": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Field validation errors"
    },
    "code": {
      "type": "string",
      "enum": ["VALIDATION_ERROR"],
      "description": "Error code"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "Error timestamp"
    }
  }
}
```

## 🔍 Query Parameter Schemas

### Employee Query Parameters Schema
```json
{
  "type": "object",
  "properties": {
    "page": {
      "type": "integer",
      "minimum": 1,
      "default": 1,
      "description": "Page number"
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "default": 20,
      "description": "Items per page"
    },
    "search": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "description": "Search term for name or email"
    },
    "department_id": {
      "type": "string",
      "format": "uuid",
      "description": "Filter by department ID"
    },
    "status": {
      "type": "string",
      "enum": ["active", "inactive", "terminated", "on_leave"],
      "description": "Filter by employee status"
    },
    "employment_type": {
      "type": "string",
      "enum": ["regular", "contractual", "jo"],
      "description": "Filter by employment type"
    },
    "sort": {
      "type": "string",
      "enum": ["name", "email", "hire_date", "created_at"],
      "default": "created_at",
      "description": "Sort field"
    },
    "order": {
      "type": "string",
      "enum": ["asc", "desc"],
      "default": "desc",
      "description": "Sort order"
    }
  }
}
```

### Attendance Query Parameters Schema
```json
{
  "type": "object",
  "properties": {
    "start_date": {
      "type": "string",
      "format": "date",
      "description": "Start date filter"
    },
    "end_date": {
      "type": "string",
      "format": "date",
      "description": "End date filter"
    },
    "page": {
      "type": "integer",
      "minimum": 1,
      "default": 1,
      "description": "Page number"
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "default": 20,
      "description": "Items per page"
    }
  }
}
```

## 📱 Kiosk Schemas

### QR Scan Request Schema
```json
{
  "type": "object",
  "required": ["qr_code"],
  "properties": {
    "qr_code": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "description": "QR code string"
    }
  }
}
```

### QR Scan Response Schema
```json
{
  "type": "object",
  "required": ["success", "data"],
  "properties": {
    "success": {
      "type": "boolean",
      "description": "Request success status"
    },
    "data": {
      "type": "object",
      "required": ["employee"],
      "properties": {
        "employee": {
          "type": "object",
          "required": ["id", "name", "position", "department"],
          "properties": {
            "id": {
              "type": "string",
              "format": "uuid",
              "description": "Employee ID"
            },
            "name": {
              "type": "string",
              "description": "Employee name"
            },
            "position": {
              "type": "string",
              "description": "Employee position"
            },
            "department": {
              "type": "string",
              "description": "Department name"
            }
          }
        }
      }
    }
  }
}
```

## 🏥 Health Check Schemas

### Health Check Response Schema
```json
{
  "type": "object",
  "required": ["success", "data"],
  "properties": {
    "success": {
      "type": "boolean",
      "description": "Request success status"
    },
    "data": {
      "type": "object",
      "required": ["status", "timestamp", "version", "uptime"],
      "properties": {
        "status": {
          "type": "string",
          "enum": ["healthy", "unhealthy"],
          "description": "System health status"
        },
        "timestamp": {
          "type": "string",
          "format": "date-time",
          "description": "Health check timestamp"
        },
        "version": {
          "type": "string",
          "description": "API version"
        },
        "uptime": {
          "type": "integer",
          "minimum": 0,
          "description": "System uptime in seconds"
        }
      }
    }
  }
}
```

### Database Health Check Response Schema
```json
{
  "type": "object",
  "required": ["success", "data"],
  "properties": {
    "success": {
      "type": "boolean",
      "description": "Request success status"
    },
    "data": {
      "type": "object",
      "required": ["status", "response_time", "active_connections"],
      "properties": {
        "status": {
          "type": "string",
          "enum": ["connected", "disconnected"],
          "description": "Database connection status"
        },
        "response_time": {
          "type": "integer",
          "minimum": 0,
          "description": "Database response time in milliseconds"
        },
        "active_connections": {
          "type": "integer",
          "minimum": 0,
          "description": "Number of active database connections"
        }
      }
    }
  }
}
```

---

**Last Updated**: January 27, 2025  
**API Version**: v1  
**Status**: ✅ **PRODUCTION READY**


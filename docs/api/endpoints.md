# 📡 API Endpoints Reference

This document provides detailed information about all available API endpoints in the TITO HR Management System.

## 🔐 Authentication Endpoints

### POST /auth/login
Authenticate user and receive JWT token.

**URL**: `/api/v1/auth/login`  
**Method**: `POST`  
**Authentication**: None  
**Rate Limit**: 10 requests per minute per IP

#### Request Body
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "hr@company.com",
      "role": "hr",
      "permissions": ["read", "write", "admin"]
    },
    "expiresIn": 86400
  }
}
```

**Error (401)**:
```json
{
  "success": false,
  "message": "Invalid credentials",
  "code": "INVALID_CREDENTIALS"
}
```

#### Example
```bash
curl -X POST https://api.tito-hr.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "hr@company.com",
    "password": "securepassword"
  }'
```

---

### POST /auth/refresh
Refresh JWT token using refresh token.

**URL**: `/api/v1/auth/refresh`  
**Method**: `POST`  
**Authentication**: None  
**Rate Limit**: 20 requests per minute per IP

#### Request Body
```json
{
  "refreshToken": "string (required)"
}
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

**Error (401)**:
```json
{
  "success": false,
  "message": "Invalid refresh token",
  "code": "INVALID_REFRESH_TOKEN"
}
```

---

### POST /auth/logout
Logout user and invalidate token.

**URL**: `/api/v1/auth/logout`  
**Method**: `POST`  
**Authentication**: Required  
**Rate Limit**: 100 requests per hour per user

#### Headers
```
Authorization: Bearer <token>
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### POST /auth/forgot-password
Request password reset.

**URL**: `/api/v1/auth/forgot-password`  
**Method**: `POST`  
**Authentication**: None  
**Rate Limit**: 5 requests per hour per IP

#### Request Body
```json
{
  "email": "string (required)"
}
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

## 👥 HR Management Endpoints

### GET /hr/dashboard
Get HR dashboard data and statistics.

**URL**: `/api/v1/hr/dashboard`  
**Method**: `GET`  
**Authentication**: Required (HR role)  
**Rate Limit**: 100 requests per hour per user

#### Headers
```
Authorization: Bearer <token>
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "totalEmployees": 150,
    "totalDepartments": 8,
    "pendingRequests": 12,
    "recentActivities": [
      {
        "id": "activity-1",
        "type": "employee_created",
        "description": "New employee John Doe added",
        "timestamp": "2024-01-27T10:30:00Z"
      }
    ],
    "statistics": {
      "attendanceRate": 95.5,
      "leaveRequests": 8,
      "payrollProcessed": 1
    }
  }
}
```

---

### GET /hr/employees
Get list of all employees.

**URL**: `/api/v1/hr/employees`  
**Method**: `GET`  
**Authentication**: Required (HR role)  
**Rate Limit**: 1000 requests per hour per user

#### Headers
```
Authorization: Bearer <token>
```

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 20, max: 100) |
| `search` | string | No | Search term for name or email |
| `department_id` | string | No | Filter by department ID |
| `status` | string | No | Filter by status (active, inactive, terminated) |
| `employment_type` | string | No | Filter by employment type (regular, contractual, jo) |
| `sort` | string | No | Sort field (name, email, hire_date, created_at) |
| `order` | string | No | Sort order (asc, desc) |

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "employees": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe",
        "email": "john.doe@company.com",
        "position": "Senior Developer",
        "department": {
          "id": "dept-1",
          "name": "Engineering"
        },
        "status": "active",
        "employment_type": "regular",
        "hire_date": "2024-01-15",
        "base_salary": 75000,
        "created_at": "2024-01-15T09:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

---

### POST /hr/employees
Create new employee.

**URL**: `/api/v1/hr/employees`  
**Method**: `POST`  
**Authentication**: Required (HR role)  
**Rate Limit**: 100 requests per hour per user

#### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Request Body
```json
{
  "name": "string (required, min: 2, max: 100)",
  "email": "string (required, valid email)",
  "position": "string (required, min: 2, max: 100)",
  "department_id": "string (required, valid UUID)",
  "hire_date": "string (required, ISO date)",
  "base_salary": "number (required, min: 10000, max: 1000000)",
  "employment_type": "string (required, enum: regular, contractual, jo)",
  "phone": "string (optional, valid phone number)",
  "address": "string (optional, max: 500)"
}
```

#### Response
**Success (201)**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john.doe@company.com",
    "position": "Senior Developer",
    "department_id": "dept-1",
    "hire_date": "2024-01-15",
    "base_salary": 75000,
    "employment_type": "regular",
    "status": "active",
    "created_at": "2024-01-27T10:30:00Z"
  }
}
```

**Error (400)**:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Email is required",
    "Invalid email format"
  ],
  "code": "VALIDATION_ERROR"
}
```

---

### GET /hr/employees/{id}
Get specific employee details.

**URL**: `/api/v1/hr/employees/{id}`  
**Method**: `GET`  
**Authentication**: Required (HR role)  
**Rate Limit**: 1000 requests per hour per user

#### Headers
```
Authorization: Bearer <token>
```

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Employee UUID |

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john.doe@company.com",
    "position": "Senior Developer",
    "department": {
      "id": "dept-1",
      "name": "Engineering"
    },
    "hire_date": "2024-01-15",
    "base_salary": 75000,
    "employment_type": "regular",
    "status": "active",
    "phone": "+1-555-0123",
    "address": "123 Main St, City, State",
    "created_at": "2024-01-15T09:00:00Z",
    "updated_at": "2024-01-27T10:30:00Z"
  }
}
```

**Error (404)**:
```json
{
  "success": false,
  "message": "Employee not found",
  "code": "RESOURCE_NOT_FOUND"
}
```

---

### PUT /hr/employees/{id}
Update employee information.

**URL**: `/api/v1/hr/employees/{id}`  
**Method**: `PUT`  
**Authentication**: Required (HR role)  
**Rate Limit**: 100 requests per hour per user

#### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Employee UUID |

#### Request Body
```json
{
  "name": "string (optional, min: 2, max: 100)",
  "email": "string (optional, valid email)",
  "position": "string (optional, min: 2, max: 100)",
  "department_id": "string (optional, valid UUID)",
  "base_salary": "number (optional, min: 10000, max: 1000000)",
  "employment_type": "string (optional, enum: regular, contractual, jo)",
  "status": "string (optional, enum: active, inactive, terminated, on_leave)",
  "phone": "string (optional, valid phone number)",
  "address": "string (optional, max: 500)"
}
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john.doe@company.com",
    "position": "Senior Developer",
    "department_id": "dept-1",
    "base_salary": 80000,
    "employment_type": "regular",
    "status": "active",
    "updated_at": "2024-01-27T10:30:00Z"
  }
}
```

---

### DELETE /hr/employees/{id}
Delete employee.

**URL**: `/api/v1/hr/employees/{id}`  
**Method**: `DELETE`  
**Authentication**: Required (HR role)  
**Rate Limit**: 50 requests per hour per user

#### Headers
```
Authorization: Bearer <token>
```

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Employee UUID |

#### Response
**Success (200)**:
```json
{
  "success": true,
  "message": "Employee deleted successfully"
}
```

**Error (409)**:
```json
{
  "success": false,
  "message": "Cannot delete employee with active records",
  "code": "CONFLICT"
}
```

---

## 🏢 Department Management Endpoints

### GET /hr/departments
Get list of all departments.

**URL**: `/api/v1/hr/departments`  
**Method**: `GET`  
**Authentication**: Required (HR role)  
**Rate Limit**: 1000 requests per hour per user

#### Headers
```
Authorization: Bearer <token>
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "dept-1",
      "name": "Engineering",
      "description": "Software development team",
      "head": {
        "id": "user-1",
        "name": "Jane Smith",
        "email": "jane.smith@company.com"
      },
      "employee_count": 25,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /hr/departments
Create new department.

**URL**: `/api/v1/hr/departments`  
**Method**: `POST`  
**Authentication**: Required (HR role)  
**Rate Limit**: 100 requests per hour per user

#### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Request Body
```json
{
  "name": "string (required, min: 2, max: 100)",
  "description": "string (optional, max: 500)",
  "head_id": "string (optional, valid UUID)"
}
```

#### Response
**Success (201)**:
```json
{
  "success": true,
  "data": {
    "id": "dept-2",
    "name": "Marketing",
    "description": "Marketing and communications team",
    "head_id": "user-2",
    "created_at": "2024-01-27T10:30:00Z"
  }
}
```

---

## 💰 Payroll Management Endpoints

### GET /hr/payroll
Get payroll records.

**URL**: `/api/v1/hr/payroll`  
**Method**: `GET`  
**Authentication**: Required (HR role)  
**Rate Limit**: 1000 requests per hour per user

#### Headers
```
Authorization: Bearer <token>
```

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | string | No | Payroll period (YYYY-MM) |
| `employee_id` | string | No | Filter by employee ID |
| `status` | string | No | Filter by status (draft, processed, paid) |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 20) |

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "payrolls": [
      {
        "id": "payroll-1",
        "employee": {
          "id": "emp-1",
          "name": "John Doe",
          "position": "Senior Developer"
        },
        "period": "2024-01",
        "base_salary": 75000,
        "total_hours": 176,
        "overtime_hours": 8,
        "gross_pay": 7500,
        "deductions": 1500,
        "benefits": 500,
        "net_pay": 6500,
        "status": "processed",
        "created_at": "2024-01-27T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

---

### POST /hr/payroll/generate
Generate payroll for specified period.

**URL**: `/api/v1/hr/payroll/generate`  
**Method**: `POST`  
**Authentication**: Required (HR role)  
**Rate Limit**: 10 requests per hour per user

#### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Request Body
```json
{
  "period": "string (required, format: YYYY-MM)",
  "employee_ids": "array (optional, if empty processes all employees)"
}
```

#### Response
**Success (201)**:
```json
{
  "success": true,
  "data": {
    "id": "payroll-period-1",
    "period": "2024-01",
    "employee_count": 150,
    "total_amount": 1125000,
    "status": "processed",
    "created_at": "2024-01-27T10:30:00Z"
  }
}
```

---

## 👤 Employee Self-Service Endpoints

### GET /employee/profile
Get employee profile information.

**URL**: `/api/v1/employee/profile`  
**Method**: `GET`  
**Authentication**: Required (Employee role)  
**Rate Limit**: 1000 requests per hour per user

#### Headers
```
Authorization: Bearer <token>
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "id": "emp-1",
    "name": "John Doe",
    "email": "john.doe@company.com",
    "position": "Senior Developer",
    "department": {
      "id": "dept-1",
      "name": "Engineering"
    },
    "hire_date": "2024-01-15",
    "base_salary": 75000,
    "employment_type": "regular",
    "status": "active"
  }
}
```

---

### GET /employee/attendance
Get employee attendance records.

**URL**: `/api/v1/employee/attendance`  
**Method**: `GET`  
**Authentication**: Required (Employee role)  
**Rate Limit**: 1000 requests per hour per user

#### Headers
```
Authorization: Bearer <token>
```

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `start_date` | string | No | Start date filter (ISO date) |
| `end_date` | string | No | End date filter (ISO date) |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 20) |

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "attendance": [
      {
        "id": "att-1",
        "date": "2024-01-27",
        "clock_in": "09:00:00",
        "clock_out": "17:00:00",
        "total_hours": 8,
        "status": "present"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 30,
      "pages": 2
    }
  }
}
```

---

### GET /employee/paystubs
Get employee paystubs.

**URL**: `/api/v1/employee/paystubs`  
**Method**: `GET`  
**Authentication**: Required (Employee role)  
**Rate Limit**: 1000 requests per hour per user

#### Headers
```
Authorization: Bearer <token>
```

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | string | No | Payroll period filter (YYYY-MM) |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 20) |

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "paystubs": [
      {
        "id": "paystub-1",
        "period": "2024-01",
        "base_salary": 75000,
        "total_hours": 176,
        "overtime_hours": 8,
        "gross_pay": 7500,
        "deductions": 1500,
        "benefits": 500,
        "net_pay": 6500,
        "created_at": "2024-01-27T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 12,
      "pages": 1
    }
  }
}
```

---

### GET /employee/leaves
Get employee leave records.

**URL**: `/api/v1/employee/leaves`  
**Method**: `GET`  
**Authentication**: Required (Employee role)  
**Rate Limit**: 1000 requests per hour per user

#### Headers
```
Authorization: Bearer <token>
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "leave-1",
      "type": "vacation",
      "start_date": "2024-02-01",
      "end_date": "2024-02-05",
      "reason": "Family vacation",
      "status": "approved",
      "approved_by": "Jane Smith",
      "created_at": "2024-01-20T10:30:00Z"
    }
  ]
}
```

---

### POST /employee/leaves
Submit leave request.

**URL**: `/api/v1/employee/leaves`  
**Method**: `POST`  
**Authentication**: Required (Employee role)  
**Rate Limit**: 10 requests per hour per user

#### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Request Body
```json
{
  "type": "string (required, enum: vacation, sick, maternity, other)",
  "start_date": "string (required, ISO date)",
  "end_date": "string (required, ISO date)",
  "reason": "string (required, max: 500)"
}
```

#### Response
**Success (201)**:
```json
{
  "success": true,
  "data": {
    "id": "leave-2",
    "type": "vacation",
    "start_date": "2024-02-01",
    "end_date": "2024-02-05",
    "reason": "Family vacation",
    "status": "pending",
    "created_at": "2024-01-27T10:30:00Z"
  }
}
```

---

## 👥 Department Head Endpoints

### GET /department-head/employees
Get department employees.

**URL**: `/api/v1/department-head/employees`  
**Method**: `GET`  
**Authentication**: Required (Department Head role)  
**Rate Limit**: 1000 requests per hour per user

#### Headers
```
Authorization: Bearer <token>
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "emp-1",
      "name": "John Doe",
      "email": "john.doe@company.com",
      "position": "Senior Developer",
      "hire_date": "2024-01-15",
      "status": "active"
    }
  ]
}
```

---

### GET /department-head/leaves/pending
Get pending leave requests.

**URL**: `/api/v1/department-head/leaves/pending`  
**Method**: `GET`  
**Authentication**: Required (Department Head role)  
**Rate Limit**: 1000 requests per hour per user

#### Headers
```
Authorization: Bearer <token>
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "leave-1",
      "employee": {
        "id": "emp-1",
        "name": "John Doe",
        "position": "Senior Developer"
      },
      "type": "vacation",
      "start_date": "2024-02-01",
      "end_date": "2024-02-05",
      "reason": "Family vacation",
      "status": "pending",
      "created_at": "2024-01-20T10:30:00Z"
    }
  ]
}
```

---

### PUT /department-head/leaves/{id}/approve
Approve leave request.

**URL**: `/api/v1/department-head/leaves/{id}/approve`  
**Method**: `PUT`  
**Authentication**: Required (Department Head role)  
**Rate Limit**: 100 requests per hour per user

#### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Leave request UUID |

#### Request Body
```json
{
  "comments": "string (optional, max: 500)"
}
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "id": "leave-1",
    "status": "approved",
    "approved_by": "Jane Smith",
    "approved_at": "2024-01-27T10:30:00Z",
    "comments": "Approved for family vacation"
  }
}
```

---

### PUT /department-head/leaves/{id}/reject
Reject leave request.

**URL**: `/api/v1/department-head/leaves/{id}/reject`  
**Method**: `PUT`  
**Authentication**: Required (Department Head role)  
**Rate Limit**: 100 requests per hour per user

#### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Leave request UUID |

#### Request Body
```json
{
  "reason": "string (required, max: 500)"
}
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "id": "leave-1",
    "status": "rejected",
    "rejected_by": "Jane Smith",
    "rejected_at": "2024-01-27T10:30:00Z",
    "reason": "Insufficient leave balance"
  }
}
```

---

## 📱 Kiosk Endpoints

### POST /kiosk/scan
Scan QR code for employee identification.

**URL**: `/api/v1/kiosk/scan`  
**Method**: `POST`  
**Authentication**: None  
**Rate Limit**: 500 requests per hour per IP

#### Request Body
```json
{
  "qr_code": "string (required)"
}
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "employee": {
      "id": "emp-1",
      "name": "John Doe",
      "position": "Senior Developer",
      "department": "Engineering"
    }
  }
}
```

**Error (404)**:
```json
{
  "success": false,
  "message": "Employee not found",
  "code": "RESOURCE_NOT_FOUND"
}
```

---

### POST /kiosk/clock-in
Clock in employee.

**URL**: `/api/v1/kiosk/clock-in`  
**Method**: `POST`  
**Authentication**: None  
**Rate Limit**: 500 requests per hour per IP

#### Request Body
```json
{
  "employee_id": "string (required, valid UUID)",
  "selfie_image": "string (required, base64 encoded image)"
}
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "attendance": {
      "id": "att-1",
      "employee_id": "emp-1",
      "date": "2024-01-27",
      "clock_in": "09:00:00",
      "status": "clocked_in"
    }
  }
}
```

**Error (409)**:
```json
{
  "success": false,
  "message": "Employee already clocked in today",
  "code": "CONFLICT"
}
```

---

### POST /kiosk/clock-out
Clock out employee.

**URL**: `/api/v1/kiosk/clock-out`  
**Method**: `POST`  
**Authentication**: None  
**Rate Limit**: 500 requests per hour per IP

#### Request Body
```json
{
  "employee_id": "string (required, valid UUID)",
  "selfie_image": "string (required, base64 encoded image)"
}
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "attendance": {
      "id": "att-1",
      "employee_id": "emp-1",
      "date": "2024-01-27",
      "clock_in": "09:00:00",
      "clock_out": "17:00:00",
      "total_hours": 8,
      "status": "present"
    }
  }
}
```

**Error (404)**:
```json
{
  "success": false,
  "message": "No clock-in record found for today",
  "code": "RESOURCE_NOT_FOUND"
}
```

---

## 📊 System Endpoints

### GET /health
Health check endpoint.

**URL**: `/api/v1/health`  
**Method**: `GET`  
**Authentication**: None  
**Rate Limit**: 1000 requests per hour per IP

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-27T10:30:00Z",
    "version": "1.0.0",
    "uptime": 86400
  }
}
```

---

### GET /health/database
Database health check.

**URL**: `/api/v1/health/database`  
**Method**: `GET`  
**Authentication**: None  
**Rate Limit**: 1000 requests per hour per IP

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "status": "connected",
    "response_time": 15,
    "active_connections": 5
  }
}
```

---

**Last Updated**: January 27, 2025  
**API Version**: v1  
**Status**: ✅ **PRODUCTION READY**


# 📚 TITO HR Management System - API Documentation

Welcome to the comprehensive API documentation for the TITO HR Management System. This documentation provides detailed information about all available API endpoints, authentication methods, request/response formats, and usage examples.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Request/Response Formats](#requestresponse-formats)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)
- [SDKs and Libraries](#sdks-and-libraries)

## 🚀 Getting Started

### Base URL
```
Production: https://api.tito-hr.com/v1
Development: http://localhost:3000/api/v1
```

### API Version
The current API version is **v1**. All endpoints are prefixed with `/api/v1/`.

### Content Type
All API requests and responses use `application/json` content type.

### Character Encoding
All API requests and responses use UTF-8 character encoding.

## 🔐 Authentication

The TITO HR API uses JWT (JSON Web Token) based authentication. All protected endpoints require a valid JWT token in the Authorization header.

### Authentication Flow

1. **Login**: Send credentials to `/api/v1/auth/login`
2. **Receive Token**: Get JWT token in response
3. **Use Token**: Include token in Authorization header for subsequent requests
4. **Refresh Token**: Use refresh token to get new access token when needed

### Authorization Header Format
```
Authorization: Bearer <your-jwt-token>
```

### Example Authentication Request
```bash
curl -X POST https://api.tito-hr.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your-username",
    "password": "your-password"
  }'
```

### Example Authentication Response
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "username": "your-username",
      "role": "hr",
      "permissions": ["read", "write", "admin"]
    },
    "expiresIn": 86400
  }
}
```

## 📡 API Endpoints

### Authentication Endpoints

#### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "string",
    "refreshToken": "string",
    "user": {
      "id": "string",
      "username": "string",
      "role": "string",
      "permissions": ["string"]
    },
    "expiresIn": "number"
  }
}
```

#### POST /auth/refresh
Refresh JWT token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "string",
    "expiresIn": "number"
  }
}
```

#### POST /auth/logout
Logout user and invalidate token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### HR Management Endpoints

#### GET /hr/dashboard
Get HR dashboard data and statistics.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEmployees": "number",
    "totalDepartments": "number",
    "pendingRequests": "number",
    "recentActivities": [
      {
        "id": "string",
        "type": "string",
        "description": "string",
        "timestamp": "string"
      }
    ]
  }
}
```

#### GET /hr/employees
Get list of all employees.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search term
- `department_id` (optional): Filter by department
- `status` (optional): Filter by status

**Response:**
```json
{
  "success": true,
  "data": {
    "employees": [
      {
        "id": "string",
        "name": "string",
        "email": "string",
        "position": "string",
        "department": {
          "id": "string",
          "name": "string"
        },
        "status": "string",
        "hireDate": "string"
      }
    ],
    "pagination": {
      "page": "number",
      "limit": "number",
      "total": "number",
      "pages": "number"
    }
  }
}
```

#### POST /hr/employees
Create new employee.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "position": "string",
  "department_id": "string",
  "hire_date": "string",
  "base_salary": "number",
  "employment_type": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "position": "string",
    "department_id": "string",
    "hire_date": "string",
    "base_salary": "number",
    "employment_type": "string",
    "created_at": "string"
  }
}
```

#### GET /hr/employees/{id}
Get specific employee details.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "position": "string",
    "department": {
      "id": "string",
      "name": "string"
    },
    "hire_date": "string",
    "base_salary": "number",
    "employment_type": "string",
    "status": "string",
    "created_at": "string",
    "updated_at": "string"
  }
}
```

#### PUT /hr/employees/{id}
Update employee information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "position": "string",
  "department_id": "string",
  "base_salary": "number",
  "employment_type": "string",
  "status": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "position": "string",
    "department_id": "string",
    "base_salary": "number",
    "employment_type": "string",
    "status": "string",
    "updated_at": "string"
  }
}
```

#### DELETE /hr/employees/{id}
Delete employee.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Employee deleted successfully"
}
```

### Department Management Endpoints

#### GET /hr/departments
Get list of all departments.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "head": {
        "id": "string",
        "name": "string",
        "email": "string"
      },
      "employee_count": "number",
      "created_at": "string"
    }
  ]
}
```

#### POST /hr/departments
Create new department.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "head_id": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "head_id": "string",
    "created_at": "string"
  }
}
```

### Payroll Management Endpoints

#### GET /hr/payroll
Get payroll records.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `period` (optional): Payroll period
- `employee_id` (optional): Filter by employee
- `status` (optional): Filter by status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "employee": {
        "id": "string",
        "name": "string",
        "position": "string"
      },
      "period": "string",
      "base_salary": "number",
      "total_hours": "number",
      "overtime_hours": "number",
      "gross_pay": "number",
      "deductions": "number",
      "benefits": "number",
      "net_pay": "number",
      "status": "string",
      "created_at": "string"
    }
  ]
}
```

#### POST /hr/payroll/generate
Generate payroll for specified period.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "period": "string",
  "employee_ids": ["string"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "period": "string",
    "employee_count": "number",
    "total_amount": "number",
    "status": "string",
    "created_at": "string"
  }
}
```

### Employee Self-Service Endpoints

#### GET /employee/profile
Get employee profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "position": "string",
    "department": {
      "id": "string",
      "name": "string"
    },
    "hire_date": "string",
    "base_salary": "number",
    "employment_type": "string",
    "status": "string"
  }
}
```

#### GET /employee/attendance
Get employee attendance records.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `start_date` (optional): Start date filter
- `end_date` (optional): End date filter
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "attendance": [
      {
        "id": "string",
        "date": "string",
        "clock_in": "string",
        "clock_out": "string",
        "total_hours": "number",
        "status": "string"
      }
    ],
    "pagination": {
      "page": "number",
      "limit": "number",
      "total": "number",
      "pages": "number"
    }
  }
}
```

#### GET /employee/paystubs
Get employee paystubs.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `period` (optional): Payroll period filter
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "paystubs": [
      {
        "id": "string",
        "period": "string",
        "base_salary": "number",
        "total_hours": "number",
        "overtime_hours": "number",
        "gross_pay": "number",
        "deductions": "number",
        "benefits": "number",
        "net_pay": "number",
        "created_at": "string"
      }
    ],
    "pagination": {
      "page": "number",
      "limit": "number",
      "total": "number",
      "pages": "number"
    }
  }
}
```

#### GET /employee/leaves
Get employee leave records.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "type": "string",
      "start_date": "string",
      "end_date": "string",
      "reason": "string",
      "status": "string",
      "approved_by": "string",
      "created_at": "string"
    }
  ]
}
```

#### POST /employee/leaves
Submit leave request.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "type": "string",
  "start_date": "string",
  "end_date": "string",
  "reason": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "type": "string",
    "start_date": "string",
    "end_date": "string",
    "reason": "string",
    "status": "pending",
    "created_at": "string"
  }
}
```

### Department Head Endpoints

#### GET /department-head/employees
Get department employees.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "position": "string",
      "hire_date": "string",
      "status": "string"
    }
  ]
}
```

#### GET /department-head/leaves/pending
Get pending leave requests.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "employee": {
        "id": "string",
        "name": "string",
        "position": "string"
      },
      "type": "string",
      "start_date": "string",
      "end_date": "string",
      "reason": "string",
      "status": "string",
      "created_at": "string"
    }
  ]
}
```

#### PUT /department-head/leaves/{id}/approve
Approve leave request.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "comments": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "status": "approved",
    "approved_by": "string",
    "approved_at": "string",
    "comments": "string"
  }
}
```

#### PUT /department-head/leaves/{id}/reject
Reject leave request.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reason": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "status": "rejected",
    "rejected_by": "string",
    "rejected_at": "string",
    "reason": "string"
  }
}
```

### Kiosk Endpoints

#### POST /kiosk/scan
Scan QR code for employee identification.

**Request Body:**
```json
{
  "qr_code": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "employee": {
      "id": "string",
      "name": "string",
      "position": "string",
      "department": "string"
    }
  }
}
```

#### POST /kiosk/clock-in
Clock in employee.

**Request Body:**
```json
{
  "employee_id": "string",
  "selfie_image": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "attendance": {
      "id": "string",
      "employee_id": "string",
      "date": "string",
      "clock_in": "string",
      "status": "string"
    }
  }
}
```

#### POST /kiosk/clock-out
Clock out employee.

**Request Body:**
```json
{
  "employee_id": "string",
  "selfie_image": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "attendance": {
      "id": "string",
      "employee_id": "string",
      "date": "string",
      "clock_in": "string",
      "clock_out": "string",
      "total_hours": "number",
      "status": "string"
    }
  }
}
```

## 📝 Request/Response Formats

### Request Format
All API requests should include:
- **Content-Type**: `application/json`
- **Authorization**: `Bearer <token>` (for protected endpoints)

### Response Format
All API responses follow this standard format:

```json
{
  "success": "boolean",
  "data": "object|array",
  "message": "string",
  "errors": ["string"],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

### Field Types
- **string**: Text value
- **number**: Numeric value (integer or decimal)
- **boolean**: true or false
- **array**: List of items
- **object**: Key-value pairs
- **date**: ISO 8601 date format (YYYY-MM-DD)
- **datetime**: ISO 8601 datetime format (YYYY-MM-DDTHH:mm:ssZ)

## ❌ Error Handling

### HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **409**: Conflict
- **422**: Unprocessable Entity
- **429**: Too Many Requests
- **500**: Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    "Detailed error message 1",
    "Detailed error message 2"
  ],
  "code": "ERROR_CODE",
  "timestamp": "2024-01-27T10:30:00Z"
}
```

### Common Error Codes
- **INVALID_CREDENTIALS**: Invalid username or password
- **TOKEN_EXPIRED**: JWT token has expired
- **INSUFFICIENT_PERMISSIONS**: User lacks required permissions
- **VALIDATION_ERROR**: Request validation failed
- **RESOURCE_NOT_FOUND**: Requested resource not found
- **DUPLICATE_RESOURCE**: Resource already exists
- **RATE_LIMIT_EXCEEDED**: Too many requests

## ⚡ Rate Limiting

### Rate Limits
- **General API**: 1000 requests per hour per user
- **Authentication**: 10 requests per minute per IP
- **File Upload**: 100 requests per hour per user
- **Kiosk Operations**: 500 requests per hour per IP

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1643284800
```

### Rate Limit Exceeded Response
```json
{
  "success": false,
  "message": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 3600
}
```

## 💡 Examples

### Complete Employee Management Flow

#### 1. Login
```bash
curl -X POST https://api.tito-hr.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "hr@company.com",
    "password": "securepassword"
  }'
```

#### 2. Create Department
```bash
curl -X POST https://api.tito-hr.com/v1/hr/departments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Engineering",
    "description": "Software development team",
    "head_id": "user-uuid"
  }'
```

#### 3. Create Employee
```bash
curl -X POST https://api.tito-hr.com/v1/hr/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@company.com",
    "position": "Senior Developer",
    "department_id": "dept-uuid",
    "hire_date": "2024-01-15",
    "base_salary": 75000,
    "employment_type": "regular"
  }'
```

#### 4. Generate Payroll
```bash
curl -X POST https://api.tito-hr.com/v1/hr/payroll/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "period": "2024-01",
    "employee_ids": ["employee-uuid"]
  }'
```

### Employee Self-Service Flow

#### 1. Employee Login
```bash
curl -X POST https://api.tito-hr.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john.doe@company.com",
    "password": "employeepassword"
  }'
```

#### 2. View Profile
```bash
curl -X GET https://api.tito-hr.com/v1/employee/profile \
  -H "Authorization: Bearer <token>"
```

#### 3. Submit Leave Request
```bash
curl -X POST https://api.tito-hr.com/v1/employee/leaves \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "type": "vacation",
    "start_date": "2024-02-01",
    "end_date": "2024-02-05",
    "reason": "Family vacation"
  }'
```

#### 4. View Paystubs
```bash
curl -X GET https://api.tito-hr.com/v1/employee/paystubs \
  -H "Authorization: Bearer <token>"
```

### Kiosk Operations Flow

#### 1. Scan QR Code
```bash
curl -X POST https://api.tito-hr.com/v1/kiosk/scan \
  -H "Content-Type: application/json" \
  -d '{
    "qr_code": "employee-qr-code-123"
  }'
```

#### 2. Clock In
```bash
curl -X POST https://api.tito-hr.com/v1/kiosk/clock-in \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "employee-uuid",
    "selfie_image": "base64-encoded-image"
  }'
```

#### 3. Clock Out
```bash
curl -X POST https://api.tito-hr.com/v1/kiosk/clock-out \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "employee-uuid",
    "selfie_image": "base64-encoded-image"
  }'
```

## 🔧 SDKs and Libraries

### JavaScript/Node.js
```bash
npm install tito-hr-api
```

```javascript
const TitoHR = require('tito-hr-api');

const client = new TitoHR({
  baseURL: 'https://api.tito-hr.com/v1',
  apiKey: 'your-api-key'
});

// Login
const auth = await client.auth.login({
  username: 'user@company.com',
  password: 'password'
});

// Get employees
const employees = await client.hr.employees.list({
  page: 1,
  limit: 20
});
```

### Python
```bash
pip install tito-hr-api
```

```python
from tito_hr import TitoHR

client = TitoHR(
    base_url='https://api.tito-hr.com/v1',
    api_key='your-api-key'
)

# Login
auth = client.auth.login(
    username='user@company.com',
    password='password'
)

# Get employees
employees = client.hr.employees.list(
    page=1,
    limit=20
)
```

### PHP
```bash
composer require tito-hr/api
```

```php
use TitoHR\Api\Client;

$client = new Client([
    'base_url' => 'https://api.tito-hr.com/v1',
    'api_key' => 'your-api-key'
]);

// Login
$auth = $client->auth->login([
    'username' => 'user@company.com',
    'password' => 'password'
]);

// Get employees
$employees = $client->hr->employees->list([
    'page' => 1,
    'limit' => 20
]);
```

## 📞 Support

For API support and questions:
- **Email**: api-support@tito-hr.com
- **Documentation**: https://docs.tito-hr.com
- **Status Page**: https://status.tito-hr.com
- **GitHub**: https://github.com/tito-hr/api

---

**Last Updated**: January 27, 2025  
**API Version**: v1  
**Status**: ✅ **PRODUCTION READY**


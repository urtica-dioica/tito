# 📚 TITO HR Management System - API Reference

## 🎯 **Overview**

Complete reference for all TITO HR Management System API endpoints. This document provides detailed information about each endpoint including request/response formats, authentication requirements, and usage examples.

## 📋 **Table of Contents**

- [Base Information](#base-information)
- [Authentication Endpoints](#authentication-endpoints)
- [HR Management Endpoints](#hr-management-endpoints)
- [Attendance Management Endpoints](#attendance-management-endpoints)
- [Time Correction Endpoints](#time-correction-endpoints)
- [Overtime Request Endpoints](#overtime-request-endpoints)
- [Leave Management Endpoints](#leave-management-endpoints)
- [Payroll Management Endpoints](#payroll-management-endpoints)
- [Department Head Management Endpoints](#department-head-management-endpoints)
- [Redis Management Endpoints](#redis-management-endpoints)
- [System Endpoints](#system-endpoints)
- [Error Responses](#error-responses)
- [Common HTTP Status Codes](#common-http-status-codes)
- [Rate Limiting](#rate-limiting)
- [Pagination](#pagination)

---

## 🔧 **Base Information**

- **Base URL**: `http://localhost:3000`
- **API Version**: `v1`
- **Content Type**: `application/json`
- **Authentication**: JWT Bearer Token

---

## 🔐 **Authentication Endpoints**

### **Login**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "hr"
    }
  }
}
```

### **Refresh Token**
```http
POST /api/v1/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **Logout**
```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

---

## 👥 **HR Management Endpoints**

### **Employees**

#### **List Employees**
```http
GET /api/v1/hr/employees?page=1&limit=10&status=active
Authorization: Bearer <access_token>
```

#### **Create Employee**
```http
POST /api/v1/hr/employees
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "userId": "uuid",
  "departmentId": "uuid",
  "position": "Software Developer",
  "employmentType": "regular",
  "hireDate": "2025-01-01",
  "baseSalary": 50000
}
```

#### **Get Employee**
```http
GET /api/v1/hr/employees/:id
Authorization: Bearer <access_token>
```

#### **Update Employee**
```http
PUT /api/v1/hr/employees/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "position": "Senior Software Developer",
  "baseSalary": 60000
}
```

#### **Delete Employee**
```http
DELETE /api/v1/hr/employees/:id
Authorization: Bearer <access_token>
```

### **Departments**

#### **List Departments**
```http
GET /api/v1/hr/departments?page=1&limit=10
Authorization: Bearer <access_token>
```

#### **Create Department**
```http
POST /api/v1/hr/departments
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Engineering",
  "description": "Software development team",
  "departmentHeadUserId": "uuid"
}
```

#### **Get Department**
```http
GET /api/v1/hr/departments/:id
Authorization: Bearer <access_token>
```

#### **Update Department**
```http
PUT /api/v1/hr/departments/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Software Engineering",
  "description": "Updated description"
}
```

#### **Delete Department**
```http
DELETE /api/v1/hr/departments/:id
Authorization: Bearer <access_token>
```

### **System Settings**

#### **List System Settings**
```http
GET /api/v1/hr/system/settings
Authorization: Bearer <access_token>
```

#### **Create System Setting**
```http
POST /api/v1/hr/system/settings
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "settingKey": "max_attendance_hours",
  "settingValue": "12",
  "description": "Maximum daily attendance hours"
}
```

### **ID Cards**

#### **List ID Cards**
```http
GET /api/v1/hr/id-cards?page=1&limit=10
Authorization: Bearer <access_token>
```

#### **Create ID Card**
```http
POST /api/v1/hr/id-cards
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "employeeId": "uuid",
  "expiryDate": "2026-12-31"
}
```

---

## ⏰ **Attendance Management Endpoints**

### **QR Code Verification (Public)**
```http
POST /api/v1/attendance/verify-qr
Content-Type: application/json

{
  "qrCodeHash": "hash_string"
}
```

### **Attendance Status**
```http
GET /api/v1/attendance/status
Authorization: Bearer <access_token>
```

### **Clock In**
```http
POST /api/v1/attendance/clock-in
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "qrCodeHash": "hash_string",
  "selfieImagePath": "/path/to/selfie.jpg",
  "timestamp": "2025-09-04T10:00:00Z"
}
```

### **Clock Out**
```http
POST /api/v1/attendance/clock-out
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "qrCodeHash": "hash_string",
  "timestamp": "2025-09-04T18:00:00Z"
}
```

### **Attendance History**
```http
GET /api/v1/attendance/history?startDate=2025-09-01&endDate=2025-09-30
Authorization: Bearer <access_token>
```

---

## 🕐 **Time Correction Endpoints**

### **List Time Corrections**
```http
GET /api/v1/time-corrections?page=1&limit=10&status=pending
Authorization: Bearer <access_token>
```

### **Create Time Correction**
```http
POST /api/v1/time-corrections
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "requestDate": "2025-09-04",
  "sessionType": "clock_in",
  "requestedTime": "2025-09-04T09:00:00Z",
  "reason": "Forgot to clock in"
}
```

### **Approve Time Correction**
```http
POST /api/v1/time-corrections/:id/approve
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "comments": "Approved by department head"
}
```

---

## ⏱️ **Overtime Request Endpoints**

### **List Overtime Requests**
```http
GET /api/v1/overtime?page=1&limit=10&status=approved
Authorization: Bearer <access_token>
```

### **Create Overtime Request**
```http
POST /api/v1/overtime
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "requestDate": "2025-09-04",
  "startTime": "2025-09-04T18:00:00Z",
  "endTime": "2025-09-04T22:00:00Z",
  "requestedHours": 4,
  "reason": "Project deadline"
}
```

### **Approve Overtime Request**
```http
POST /api/v1/overtime/:id/approve
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "comments": "Approved for project completion"
}
```

---

## 🏖️ **Leave Management Endpoints**

### **List Leave Requests**
```http
GET /api/v1/leaves?page=1&limit=10&status=pending
Authorization: Bearer <access_token>
```

### **Create Leave Request**
```http
POST /api/v1/leaves
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "leaveType": "vacation",
  "startDate": "2025-09-15",
  "endDate": "2025-09-17",
  "totalDays": 3,
  "reason": "Family vacation"
}
```

### **Approve Leave Request**
```http
POST /api/v1/leaves/:id/approve
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "comments": "Approved by HR"
}
```

### **Leave Balance**
```http
GET /api/v1/leaves/balance?year=2025
Authorization: Bearer <access_token>
```

---

## 💰 **Payroll Management Endpoints**

### **Payroll Periods**

#### **List Payroll Periods**
```http
GET /api/v1/payroll/periods?page=1&limit=10&status=draft
Authorization: Bearer <access_token>
```

#### **Create Payroll Period**
```http
POST /api/v1/payroll/periods
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "periodName": "September 2025",
  "startDate": "2025-09-01",
  "endDate": "2025-09-30",
  "status": "draft"
}
```

#### **Generate Payroll Records**
```http
POST /api/v1/payroll/periods/:id/generate
Authorization: Bearer <access_token>
```

### **Payroll Records**

#### **List Payroll Records**
```http
GET /api/v1/payroll/records?page=1&limit=10&payrollPeriodId=uuid
Authorization: Bearer <access_token>
```

#### **Approve Payroll Record**
```http
POST /api/v1/payroll/records/:id/approve
Authorization: Bearer <access_token>
```

#### **Mark Payroll as Paid**
```http
POST /api/v1/payroll/records/:id/mark-paid
Authorization: Bearer <access_token>
```

### **Deduction Types**

#### **List Deduction Types**
```http
GET /api/v1/payroll/deduction-types?page=1&limit=10&isActive=true
Authorization: Bearer <access_token>
```

#### **Create Deduction Type**
```http
POST /api/v1/payroll/deduction-types
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Tax Deduction",
  "description": "Income tax deduction",
  "percentage": 15.0,
  "isActive": true
}
```

---

## 👨‍💼 **Department Head Management Endpoints**

### **Dashboard**
```http
GET /api/v1/department-head/dashboard
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "department": {
      "id": "uuid",
      "name": "Engineering",
      "description": "Software development team",
      "employeeCount": 25
    },
    "pendingRequests": {
      "timeCorrections": 3,
      "overtime": 2,
      "leaves": 1,
      "total": 6
    },
    "recentActivity": [
      {
        "type": "time_correction",
        "employeeName": "John Doe",
        "date": "2025-09-04",
        "status": "pending"
      }
    ],
    "attendanceSummary": {
      "presentToday": 20,
      "absentToday": 3,
      "lateToday": 2
    }
  }
}
```

### **Department Employees**
```http
GET /api/v1/department-head/employees?page=1&limit=10&status=active&search=john
Authorization: Bearer <access_token>
```

### **Employee Details**
```http
GET /api/v1/department-head/employees/:id
Authorization: Bearer <access_token>
```

### **Pending Requests**
```http
GET /api/v1/department-head/requests/pending?type=time_correction&page=1&limit=10
Authorization: Bearer <access_token>
```

### **Request History**
```http
GET /api/v1/department-head/requests/history?type=leave&page=1&limit=10&status=approved
Authorization: Bearer <access_token>
```

### **Department Statistics**
```http
GET /api/v1/department-head/stats?period=month
Authorization: Bearer <access_token>
```

### **Attendance Summary**
```http
GET /api/v1/department-head/attendance/summary?startDate=2025-09-01&endDate=2025-09-30
Authorization: Bearer <access_token>
```

### **Payroll Summary**
```http
GET /api/v1/department-head/payroll/summary?periodId=uuid&page=1&limit=10
Authorization: Bearer <access_token>
```

---

## 🔧 **Redis Management Endpoints**

### **Redis Health Check (Public)**
```http
GET /api/v1/redis/health
```

### **Redis Statistics**
```http
GET /api/v1/redis/stats
Authorization: Bearer <access_token>
```

### **Redis Connection Test (Public)**
```http
GET /api/v1/redis/test
```

### **Cache Management**
```http
GET /api/v1/redis/keys
Authorization: Bearer <access_token>
```

```http
POST /api/v1/redis/cache/:key
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "value": "cached_data",
  "ttl": 3600
}
```

---

## 🏥 **System Endpoints**

### **Health Check**
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2025-09-04T10:00:00Z",
  "uptime": 3600,
  "environment": "development",
  "services": {
    "database": "healthy|unhealthy",
    "redis": "healthy|unhealthy"
  },
  "version": "1.0.0",
  "message": "Server status message"
}
```

### **API Information**
```http
GET /
```

**Response:**
```json
{
  "message": "TITO HR Management System API",
  "version": "1.0.0",
  "timestamp": "2025-09-04T10:00:00Z",
  "endpoints": {
    "auth": "/api/v1/auth",
    "redis": "/api/v1/redis",
    "hr": {
      "employees": "/api/v1/hr/employees",
      "departments": "/api/v1/hr/departments",
      "system": "/api/v1/hr/system",
      "idCards": "/api/v1/hr/id-cards"
    },
    "attendance": "/api/v1/attendance",
    "timeCorrections": "/api/v1/time-corrections",
    "overtime": "/api/v1/overtime",
    "leaves": "/api/v1/leaves",
    "payroll": "/api/v1/payroll",
    "health": "/health"
  }
}
```

---

## ❌ **Error Responses**

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "requestId": "req_1234567890_abcdef",
  "timestamp": "2025-09-04T10:00:00Z"
}
```

---

## 📊 **Common HTTP Status Codes**

- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **409**: Conflict
- **422**: Unprocessable Entity
- **500**: Internal Server Error
- **503**: Service Unavailable

---

## 🚦 **Rate Limiting**

The API implements Redis-based rate limiting:

- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 5 requests per 15 minutes
- **User-specific limits**: 1000 requests per hour
- **Department-specific limits**: 5000 requests per hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 📄 **Pagination**

List endpoints support pagination:

```
GET /api/v1/endpoint?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

---

**Last Updated**: January 2025  
**API Version**: 1.0.0  
**System Version**: 1.0.0  
**Status**: ✅ **PRODUCTION READY - ALL ENDPOINTS TESTED**
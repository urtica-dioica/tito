# 🔌 API Overview

## Overview

The TITO HR Management System provides a comprehensive RESTful API that enables seamless integration with the frontend application and supports all HR management operations.

## API Statistics

- **Total Endpoints**: 80+ endpoints
- **API Version**: v1
- **Base URL**: `http://localhost:5000/api`
- **Authentication**: JWT Bearer Token
- **Response Format**: JSON
- **Status**: ✅ **Production Ready**

## Authentication

### **JWT Token Authentication**
```http
Authorization: Bearer <jwt_token>
```

### **Token Endpoints**
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

## API Categories

### **👥 Employee Management**
- **Employee CRUD** - Create, read, update, delete employees
- **Employee Search** - Advanced search and filtering
- **Employee Import** - Bulk employee import
- **Employee Export** - Data export capabilities

### **⏰ Attendance Management**
- **Time Tracking** - Clock in/out operations
- **Attendance Records** - View attendance history
- **Time Corrections** - Submit and manage corrections
- **Overtime Requests** - Overtime request management

### **💰 Payroll Management**
- **Payroll Processing** - Calculate and process payroll
- **Payroll Records** - View payroll history
- **Benefits Management** - Employee benefits
- **Deductions Management** - Employee deductions

### **📋 Leave Management**
- **Leave Requests** - Submit and manage leave requests
- **Leave Balances** - View leave balances
- **Leave Approvals** - Approve/reject leave requests
- **Leave History** - Leave request history

### **🏢 Department Management**
- **Department CRUD** - Department operations
- **Department Heads** - Assign department heads
- **Employee Transfers** - Move employees between departments
- **Department Reports** - Department-specific reports

### **📊 Request Management**
- **Time Corrections** - Time correction requests
- **Overtime Requests** - Overtime request management
- **Approval Workflow** - Request approval process
- **Request History** - Complete request history

### **👤 User Management**
- **User CRUD** - User account management
- **Role Management** - Assign and manage roles
- **Permission Management** - Set user permissions
- **User Activity** - Track user activities

### **⚙️ System Management**
- **Settings** - System configuration
- **Audit Logs** - System activity logs
- **Backup/Restore** - Data backup operations
- **Health Checks** - System health monitoring

## Response Format

### **Success Response**
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

### **Error Response**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": "Additional error details"
  }
}
```

## HTTP Status Codes

- **200 OK** - Successful request
- **201 Created** - Resource created successfully
- **400 Bad Request** - Invalid request data
- **401 Unauthorized** - Authentication required
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

## Rate Limiting

- **Rate Limit**: 1000 requests per hour per IP
- **Burst Limit**: 100 requests per minute
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

## Pagination

### **Request Parameters**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `sort` - Sort field
- `order` - Sort order (asc/desc)

### **Response Format**
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

## Filtering & Search

### **Query Parameters**
- `search` - General search term
- `filter` - Field-specific filters
- `date_from` - Start date filter
- `date_to` - End date filter

### **Example**
```http
GET /api/employees?search=john&filter[department]=engineering&page=1&limit=20
```

## File Upload

### **Supported Formats**
- **Images**: JPG, PNG, GIF
- **Documents**: PDF, DOC, DOCX
- **CSV**: Employee bulk import

### **Upload Endpoint**
```http
POST /api/upload
Content-Type: multipart/form-data
```

## WebSocket Support

### **Real-time Updates**
- **Connection**: `ws://localhost:5000/ws`
- **Authentication**: JWT token in connection
- **Events**: Attendance updates, request notifications

## API Documentation

### **Interactive Documentation**
- **Swagger UI**: `http://localhost:5000/api-docs`
- **OpenAPI Spec**: `http://localhost:5000/api-docs.json`

### **Postman Collection**
- **Collection**: Available in `/docs/postman/`
- **Environment**: Development and production environments

## Testing

### **Test Endpoints**
- **Health Check**: `GET /api/health`
- **Database Check**: `GET /api/health/db`
- **Version Info**: `GET /api/version`

### **Test Data**
- **Seed Data**: Available via `/api/test/seed`
- **Reset Data**: Available via `/api/test/reset`

## Security

### **Authentication**
- **JWT Tokens** - Secure token-based authentication
- **Token Expiry** - 24-hour token lifetime
- **Refresh Tokens** - Automatic token refresh

### **Authorization**
- **Role-Based Access** - Granular permission system
- **Resource-Level Permissions** - Fine-grained access control
- **API Key Support** - Alternative authentication method

### **Data Protection**
- **Input Validation** - Comprehensive data validation
- **SQL Injection Prevention** - Parameterized queries
- **XSS Protection** - Cross-site scripting prevention
- **CORS Configuration** - Cross-origin resource sharing

## Performance

### **Optimization Features**
- **Response Caching** - Intelligent response caching
- **Database Indexing** - Optimized database queries
- **Connection Pooling** - Efficient database connections
- **Compression** - Response compression

### **Monitoring**
- **Response Times** - API response time monitoring
- **Error Rates** - Error rate tracking
- **Usage Statistics** - API usage analytics
- **Performance Metrics** - Detailed performance data

## Error Handling

### **Error Categories**
- **Validation Errors** - Input validation failures
- **Authentication Errors** - Authentication failures
- **Authorization Errors** - Permission denials
- **Business Logic Errors** - Application-specific errors
- **System Errors** - Server and database errors

### **Error Recovery**
- **Retry Logic** - Automatic retry for transient errors
- **Fallback Mechanisms** - Graceful degradation
- **Circuit Breakers** - Prevent cascade failures
- **Health Checks** - System health monitoring

## Integration

### **Third-party Integrations**
- **Email Services** - SMTP integration
- **File Storage** - Cloud storage integration
- **Payment Gateways** - Payment processing
- **External APIs** - Third-party service integration

### **Webhook Support**
- **Event Notifications** - Real-time event notifications
- **Custom Webhooks** - Configurable webhook endpoints
- **Retry Logic** - Webhook delivery retry
- **Security** - Webhook signature verification

---

*Last Updated: January 2025 | Version: 1.0.0*

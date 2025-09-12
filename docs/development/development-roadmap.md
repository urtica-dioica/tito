# 🚀 TITO HR Management System - Development Roadmap

## 📋 **Table of Contents**
1. [Server Architecture Overview](#server-architecture-overview)
2. [Folder Structure](#folder-structure)
3. [Technology Stack](#technology-stack)
4. [Implementation Phases](#implementation-phases)
5. [API Endpoints Design](#api-endpoints-design)
6. [Database Integration](#database-integration)
7. [Security Implementation](#security-implementation)
8. [Testing Strategy](#testing-strategy)
9. [Deployment & Production](#deployment--production)

---

## 🏗️ **Server Architecture Overview**

### **System Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React/TS)    │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Redis Cache   │
                       │   (Sessions)    │
                       └─────────────────┘
```

### **Core Principles**
- **RESTful API Design**: Clean, predictable endpoints
- **Role-Based Access Control**: Secure endpoint protection
- **Data Validation**: Input sanitization and validation
- **Error Handling**: Comprehensive error responses
- **Performance**: Caching and query optimization
- **Security**: JWT authentication, rate limiting, CORS

---

## 📁 **Folder Structure**

```
server/
├── src/
│   ├── config/
│   │   ├── database.ts          # Database connection config
│   │   ├── redis.ts             # Redis connection config
│   │   ├── email.ts             # Email service config
│   │   ├── jwt.ts               # JWT configuration
│   │   └── environment.ts       # Environment variables
│   │
│   ├── controllers/
│   │   ├── auth/
│   │   │   ├── authController.ts
│   │   │   └── authMiddleware.ts
│   │   ├── hr/
│   │   │   ├── employeeController.ts
│   │   │   ├── departmentController.ts
│   │   │   ├── payrollController.ts
│   │   │   └── systemController.ts
│   │   ├── department-head/
│   │   │   ├── approvalController.ts
│   │   │   └── departmentController.ts
│   │   ├── employee/
│   │   │   ├── attendanceController.ts
│   │   │   ├── requestController.ts
│   │   │   └── profileController.ts
│   │   └── kiosk/
│   │       └── kioskController.ts
│   │
│   ├── services/
│   │   ├── auth/
│   │   │   ├── authService.ts
│   │   │   ├── jwtService.ts
│   │   │   └── passwordService.ts
│   │   ├── hr/
│   │   │   ├── employeeService.ts
│   │   │   ├── departmentService.ts
│   │   │   ├── payrollService.ts
│   │   │   └── idCardService.ts
│   │   ├── attendance/
│   │   │   ├── attendanceService.ts
│   │   │   ├── timeCorrectionService.ts
│   │   │   └── overtimeService.ts
│   │   ├── leave/
│   │   │   ├── leaveService.ts
│   │   │   └── leaveBalanceService.ts
│   │   └── notification/
│   │       ├── emailService.ts
│   │       └── notificationService.ts
│   │
│   ├── models/
│   │   ├── auth/
│   │   │   ├── User.ts
│   │   │   └── Session.ts
│   │   ├── hr/
│   │   │   ├── Employee.ts
│   │   │   ├── Department.ts
│   │   │   └── Payroll.ts
│   │   ├── attendance/
│   │   │   ├── AttendanceRecord.ts
│   │   │   ├── AttendanceSession.ts
│   │   │   └── TimeCorrection.ts
│   │   ├── leave/
│   │   │   ├── Leave.ts
│   │   │   └── LeaveBalance.ts
│   │   └── shared/
│   │       ├── BaseModel.ts
│   │       └── AuditLog.ts
│   │
│   ├── routes/
│   │   ├── auth/
│   │   │   ├── authRoutes.ts
│   │   │   └── passwordRoutes.ts
│   │   ├── hr/
│   │   │   ├── employeeRoutes.ts
│   │   │   ├── departmentRoutes.ts
│   │   │   ├── payrollRoutes.ts
│   │   │   └── systemRoutes.ts
│   │   ├── department-head/
│   │   │   ├── approvalRoutes.ts
│   │   │   └── departmentRoutes.ts
│   │   ├── employee/
│   │   │   ├── attendanceRoutes.ts
│   │   │   ├── requestRoutes.ts
│   │   │   └── profileRoutes.ts
│   │   └── kiosk/
│   │       └── kioskRoutes.ts
│   │
│   ├── middleware/
│   │   ├── auth/
│   │   │   ├── authenticate.ts
│   │   │   ├── authorize.ts
│   │   │   └── validateRole.ts
│   │   ├── validation/
│   │   │   ├── requestValidator.ts
│   │   │   └── schemaValidator.ts
│   │   ├── security/
│   │   │   ├── rateLimiter.ts
│   │   │   ├── cors.ts
│   │   │   └── helmet.ts
│   │   └── utility/
│   │       ├── errorHandler.ts
│   │       ├── logger.ts
│   │       └── upload.ts
│   │
│   ├── utils/
│   │   ├── database/
│   │   │   ├── connection.ts
│   │   │   ├── migrations.ts
│   │   │   └── seeds.ts
│   │   ├── helpers/
│   │   │   ├── dateUtils.ts
│   │   │   ├── validationUtils.ts
│   │   │   └── fileUtils.ts
│   │   ├── constants/
│   │   │   ├── roles.ts
│   │   │   ├── statuses.ts
│   │   │   └── messages.ts
│   │   └── types/
│   │       ├── express.ts
│   │       ├── database.ts
│   │       └── api.ts
│   │
│   ├── database/
│   │   ├── migrations/
│   │   │   ├── 001_initial_schema.sql
│   │   │   ├── 002_add_audit_logs.sql
│   │   │   └── 003_add_new_features.sql
│   │   ├── seeds/
│   │   │   ├── 001_initial_data.sql
│   │   │   └── 002_test_data.sql
│   │   └── queries/
│   │       ├── employeeQueries.ts
│   │       ├── attendanceQueries.ts
│   │       └── payrollQueries.ts
│   │
│   └── app.ts                 # Express app setup
│
├── tests/
│   ├── unit/
│   │   ├── controllers/
│   │   ├── services/
│   │   └── middleware/
│   ├── integration/
│   │   ├── auth/
│   │   ├── hr/
│   │   └── employee/
│   └── e2e/
│       ├── auth/
│       ├── workflows/
│       └── api/
│
├── docs/
│   ├── api/
│   │   ├── auth.md
│   │   ├── hr.md
│   │   ├── employee.md
│   │   └── kiosk.md
│   ├── database/
│   │   ├── schema.md
│   │   └── queries.md
│   └── deployment/
│       ├── production.md
│       └── docker.md
│
├── scripts/
│   ├── setup.sh              # Initial setup script
│   ├── migrate.sh            # Database migration script
│   ├── seed.sh               # Database seeding script
│   └── deploy.sh             # Deployment script
│
├── package.json
├── tsconfig.json
├── nodemon.json
├── .env.example
├── .env
├── .gitignore
└── README.md
```

---

## 🛠️ **Technology Stack**

### **Core Technologies**
```
Runtime: Node.js 18+ LTS
Language: TypeScript 5+
Framework: Express.js 4+
Database: PostgreSQL 15+
Cache: Redis 7+
```

### **Key Dependencies**
```json
{
  "express": "^4.18.2",
  "typescript": "^5.0.0",
  "pg": "^8.11.0",
  "redis": "^4.6.0",
  "jsonwebtoken": "^9.0.0",
  "bcryptjs": "^2.4.3",
  "joi": "^17.9.0",
  "multer": "^1.4.5",
  "nodemailer": "^6.9.0",
  "express-rate-limit": "^6.7.0",
  "helmet": "^7.0.0",
  "cors": "^2.8.5",
  "winston": "^3.10.0",
  "jest": "^29.5.0",
  "supertest": "^6.3.3"
}
```

### **Development Tools**
```
Linting: ESLint + Prettier
Testing: Jest + Supertest
Process Manager: PM2
Documentation: Swagger/OpenAPI
Monitoring: Winston + Morgan
```

---

## 🚀 **Implementation Phases**

### **Phase 1: Foundation & Setup (Week 1)**
**Goal**: Basic server structure and database connection

#### **Week 1 Tasks**
1. **Project Setup**
   - Initialize Node.js project with TypeScript
   - Set up folder structure
   - Configure ESLint, Prettier, and TypeScript
   - Set up environment configuration

2. **Database Foundation**
   - Set up PostgreSQL connection
   - Implement database connection pooling
   - Create basic database utilities
   - Set up Redis connection

3. **Basic Express Setup**
   - Configure Express with middleware
   - Set up basic error handling
   - Implement logging system
   - Configure CORS and security headers

4. **Authentication Foundation**
   - Set up JWT configuration
   - Implement basic user model
   - Create authentication middleware
   - Set up password hashing

#### **Deliverables**
- ✅ Basic Express server running
- ✅ Database connections established
- ✅ Basic authentication structure
- ✅ Project structure complete

### **Phase 2: Core Models & Authentication (Week 2)**
**Goal**: Complete authentication system and basic models

#### **Week 2 Tasks**
1. **User Management**
   - Complete User model with roles
   - Implement user CRUD operations
   - Set up role-based access control
   - Create user validation schemas

2. **Authentication System**
   - Complete login/logout endpoints
   - Implement JWT token management
   - Set up refresh token system
   - Add password reset functionality

3. **Basic Models**
   - Employee model
   - Department model
   - Basic validation schemas
   - Database query utilities

4. **Security Implementation**
   - Rate limiting
   - Input validation
   - SQL injection prevention
   - XSS protection

#### **Deliverables**
- ✅ Complete authentication system
- ✅ User management endpoints
- ✅ Basic security measures
- ✅ Core models implemented

### **Phase 3: HR Management System (Week 3)**
**Goal**: Complete HR admin functionality

#### **Week 3 Tasks**
1. **Employee Management**
   - Complete employee CRUD operations
   - Employee ID generation
   - Department assignment
   - Employment status management

2. **Department Management**
   - Department CRUD operations
   - Department head assignment
   - Employee department relationships
   - Department statistics

3. **System Settings**
   - Configuration management
   - System parameters
   - Audit logging setup
   - Basic reporting

4. **ID Card System**
   - QR code generation
   - ID card creation
   - Expiry management
   - Department-based organization

#### **Deliverables**
- ✅ Complete employee management
- ✅ Department management system
- ✅ System configuration
- ✅ ID card generation

### **Phase 4: Attendance & Request System (Week 4)**
**Goal**: Attendance tracking and request management

#### **Week 4 Tasks**
1. **Attendance System**
   - Clock in/out functionality
   - Session management
   - Selfie verification
   - Attendance calculations

2. **Time Correction System**
   - Request submission
   - Approval workflow
   - Automatic updates
   - Audit trail

3. **Overtime System**
   - Overtime requests
   - Approval workflow
   - Automatic session creation
   - Leave accrual

4. **Leave Management**
   - Leave requests
   - Approval workflow
   - Leave balance tracking
   - Overtime conversion

#### **Deliverables**
- ✅ Complete attendance system
- ✅ Time correction workflow
- ✅ Overtime management
- ✅ Leave management system

### **Phase 5: Payroll & Advanced Features (Week 5)**
**Goal**: Payroll system and advanced functionality

#### **Week 5 Tasks**
1. **Payroll System**
   - Payroll period creation
   - Employee payroll calculation
   - Deduction management
   - Approval workflow

2. **Advanced Features**
   - Selfie cleanup automation
   - Report generation
   - Data export functionality
   - Performance optimization

3. **Integration Testing**
   - End-to-end workflow testing
   - Performance testing
   - Security testing
   - Error handling validation

#### **Deliverables**
- ✅ Complete payroll system
- ✅ Advanced features implemented
- ✅ System integration complete
- ✅ Performance optimized

### **Phase 6: Testing & Documentation (Week 6)**
**Goal**: Comprehensive testing and documentation

#### **Week 6 Tasks**
1. **Testing**
   - Unit test coverage
   - Integration testing
   - End-to-end testing
   - Performance testing

2. **Documentation**
   - API documentation
   - Database documentation
   - Deployment guides
   - User manuals

3. **Production Preparation**
   - Environment configuration
   - Security hardening
   - Monitoring setup
   - Deployment scripts

#### **Deliverables**
- ✅ Complete test coverage
- ✅ Comprehensive documentation
- ✅ Production-ready system
- ✅ Deployment automation

---

## 🔌 **API Endpoints Design**

### **Authentication Routes**
```typescript
POST   /api/auth/login              # User login
POST   /api/auth/logout             # User logout
POST   /api/auth/refresh            # Refresh JWT token
POST   /api/auth/forgot-password    # Password reset request
POST   /api/auth/reset-password     # Password reset
POST   /api/auth/change-password    # Change password
```

### **HR Routes**
```typescript
// Employee Management
GET    /api/hr/employees            # List all employees
POST   /api/hr/employees            # Create new employee
GET    /api/hr/employees/:id        # Get employee details
PUT    /api/hr/employees/:id        # Update employee
DELETE /api/hr/employees/:id        # Delete employee
POST   /api/hr/employees/:id/id-card # Generate ID card

// Department Management
GET    /api/hr/departments          # List all departments
POST   /api/hr/departments          # Create department
PUT    /api/hr/departments/:id      # Update department
DELETE /api/hr/departments/:id      # Delete department

// Payroll Management
GET    /api/hr/payrolls             # List payroll periods
POST   /api/hr/payrolls             # Create payroll period
GET    /api/hr/payrolls/:id         # Get payroll details
PUT    /api/hr/payrolls/:id         # Update payroll
POST   /api/hr/payrolls/:id/send    # Send for review

// System Settings
GET    /api/hr/settings             # Get system settings
PUT    /api/hr/settings             # Update system settings
```

### **Department Head Routes**
```typescript
// Department Management
GET    /api/dept/employees          # List department employees
GET    /api/dept/employees/:id      # Get employee details

// Request Approvals
GET    /api/dept/requests           # List pending requests
PUT    /api/dept/requests/:id       # Approve/reject request
GET    /api/dept/requests/history   # Request history

// Payroll Review
GET    /api/dept/payrolls           # List pending payrolls
POST   /api/dept/payrolls/:id/approve # Approve payroll
```

### **Employee Routes**
```typescript
// Profile Management
GET    /api/employee/profile         # Get profile
PUT    /api/employee/profile         # Update profile

// Attendance
GET    /api/employee/attendance      # Get attendance history
POST   /api/employee/attendance/clock-in  # Clock in
POST   /api/employee/attendance/clock-out # Clock out

// Requests
POST   /api/employee/requests/time-correction # Submit time correction
POST   /api/employee/requests/overtime      # Submit overtime request
POST   /api/employee/requests/leave         # Submit leave request
GET    /api/employee/requests               # Get request history

// Payroll
GET    /api/employee/payrolls       # Get payslips
GET    /api/employee/payrolls/:id   # Get payslip details
```

### **Kiosk Routes**
```typescript
POST   /api/kiosk/scan              # Process QR code scan
POST   /api/kiosk/selfie            # Capture selfie
POST   /api/kiosk/clock-in          # Complete clock in
POST   /api/kiosk/clock-out         # Complete clock out
GET    /api/kiosk/status            # Get kiosk status
```

---

## 🗄️ **Database Integration**

### **Connection Management**
```typescript
// Database connection with pooling
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Redis connection
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  password: process.env.REDIS_PASSWORD,
});
```

### **Query Optimization**
```typescript
// Prepared statements for security
const getEmployeeById = async (id: string) => {
  const query = 'SELECT * FROM employees WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Transaction support for complex operations
const createEmployeeWithUser = async (employeeData: any, userData: any) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const userResult = await client.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [userData.email, userData.passwordHash, userData.firstName, userData.lastName, userData.role]
    );
    
    const employeeResult = await client.query(
      'INSERT INTO employees (user_id, department_id, position, employment_type, hire_date, base_salary) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [userResult.rows[0].id, employeeData.departmentId, employeeData.position, employeeData.employmentType, employeeData.hireDate, employeeData.baseSalary]
    );
    
    await client.query('COMMIT');
    return { userId: userResult.rows[0].id, employeeId: employeeResult.rows[0].id };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
```

---

## 🔒 **Security Implementation**

### **Authentication Middleware**
```typescript
// JWT authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded as JwtPayload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Role-based authorization
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};
```

### **Input Validation**
```typescript
// Request validation using Joi
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// Employee creation validation schema
export const createEmployeeSchema = Joi.object({
  email: Joi.string().email().required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  departmentId: Joi.string().uuid().required(),
  position: Joi.string().min(2).max(100).required(),
  employmentType: Joi.string().valid('regular', 'contractual', 'jo').required(),
  hireDate: Joi.date().max('now').required(),
  baseSalary: Joi.number().positive().required()
});
```

---

## 🧪 **Testing Strategy**

### **Testing Pyramid**
```
E2E Tests (10%)
├── Complete user workflows
├── API integration testing
└── Performance testing

Integration Tests (20%)
├── Service layer testing
├── Database integration
└── External service mocking

Unit Tests (70%)
├── Controller testing
├── Service logic testing
├── Utility function testing
└── Middleware testing
```

### **Test Structure**
```typescript
// Unit test example
describe('EmployeeService', () => {
  describe('createEmployee', () => {
    it('should create employee with valid data', async () => {
      const employeeData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        departmentId: 'uuid-here',
        position: 'Developer',
        employmentType: 'regular',
        hireDate: new Date(),
        baseSalary: 50000
      };

      const result = await employeeService.createEmployee(employeeData);
      
      expect(result).toHaveProperty('id');
      expect(result.email).toBe(employeeData.email);
    });

    it('should throw error for invalid email', async () => {
      const invalidData = { ...employeeData, email: 'invalid-email' };
      
      await expect(employeeService.createEmployee(invalidData))
        .rejects.toThrow('Invalid email format');
    });
  });
});
```

---

## 🚀 **Deployment & Production**

### **Environment Configuration**
```typescript
// Production environment setup
export const config = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'tito_hr',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  }
};
```

### **Production Considerations**
1. **Security**
   - HTTPS enforcement
   - Security headers (Helmet)
   - Rate limiting
   - Input sanitization

2. **Performance**
   - Database connection pooling
   - Redis caching
   - Query optimization
   - Load balancing

3. **Monitoring**
   - Log aggregation
   - Performance metrics
   - Error tracking
   - Health checks

4. **Scalability**
   - Horizontal scaling
   - Database sharding
   - Microservices architecture
   - Container orchestration

---

## 📊 **Success Metrics**

### **Performance Targets**
- **Response Time**: < 200ms for 95% of requests
- **Throughput**: Handle 1000+ concurrent users
- **Uptime**: 99.9% availability
- **Error Rate**: < 0.1% error rate

### **Quality Metrics**
- **Test Coverage**: > 90% code coverage
- **Security**: Zero critical vulnerabilities
- **Documentation**: 100% API documentation
- **Performance**: Pass all load tests

---

## 🎯 **Next Steps**

### **Immediate Actions (This Week)**
1. **Set up project structure** following the folder layout
2. **Initialize Node.js project** with TypeScript
3. **Configure database connections** (PostgreSQL + Redis)
4. **Set up basic Express server** with middleware

### **Week 1 Goals**
- ✅ Complete project setup
- ✅ Database connections working
- ✅ Basic Express server running
- ✅ Authentication foundation

### **Week 2 Goals**
- ✅ Complete authentication system
- ✅ User management endpoints
- ✅ Basic security measures
- ✅ Core models implemented

**This plan provides a comprehensive roadmap for building a production-ready, scalable HR management system backend that perfectly aligns with your frontend specifications and database schema.**
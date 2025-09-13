# 🏗️ TITO HR Management System - Project Structure

## 🎯 **Overview**

This document provides a comprehensive overview of the TITO HR Management System project structure, organized according to the system rules and best practices.

## 📁 **Root Directory Structure**

```
tito/
├── 📚 docs/                    # Centralized documentation
├── 🧪 tests/                   # Centralized testing
├── 🗄️ database/               # Database schemas and migrations
├── 💻 client/                  # Frontend application
├── 🖥️ server/                 # Backend application
├── 📋 README.md               # Main project README
├── 📊 PROJECT_STRUCTURE.md    # This file
├── 🔧 SYSTEM_RULES_CHANGELOG.md
└── 🧪 SYSTEM_RULES_VALIDATION_PLAN.md
```

---

## 📚 **Documentation Structure** (`/docs/`)

### **System Overview** (`/docs/overview/`)
Core system specifications and mathematical formulations.

```
overview/
├── PRECISE_ATTENDANCE_SYSTEM.md      # Attendance calculation rules
├── PAYROLL-COMPUTATION.md            # Payroll calculation formulas
├── ATTENDANCE_HOURS_CALCULATION.md   # Detailed calculation logic
├── PAYROLL_ATTENDANCE_INTEGRATION.md # Integration specifications
└── attendance-management.md          # Complete attendance system
```

### **API Documentation** (`/docs/api/`)
Complete API reference and integration guides.

```
api/
├── api-reference.md                  # Complete API reference
├── api-overview.md                   # API overview and auth
├── error-handling.md                 # Error codes and handling
└── integration.md                    # Integration guidelines
```

### **User Guides** (`/docs/guides/`)
User-specific documentation and guides.

```
guides/
├── system-overview.md                # Complete system overview
├── frontend-specification.md         # Frontend specifications
├── implementation-guide.md           # Implementation guidelines
├── user-guides/                      # End-user documentation
│   └── hr-admin-guide.md            # HR administrator guide
└── admin-guides/                     # System administrator guides
    ├── DATABASE_ATTENDANCE_BACKUP.md
    └── EMPLOYEE_BULK_UPLOAD_GUIDE.md
```

### **Architecture Documentation** (`/docs/architecture/`)
System architecture and design documentation.

```
architecture/
└── system-architecture.md            # Complete system architecture
```

### **Database Documentation** (`/docs/database/`)
Database schema and management documentation.

```
database/
└── database-schema.md                # Database schema reference
```

### **Deployment Documentation** (`/docs/deployment/`)
Installation, deployment, and operations guides.

```
deployment/
├── installation.md                   # System installation guide
├── deployment-guide.md               # Production deployment
└── production.md                     # Production environment setup
```

### **Development Documentation** (`/docs/development/`)
Developer resources and guidelines.

```
development/
├── contribution-guidelines.md        # How to contribute
├── development-roadmap.md            # Development roadmap
├── development-setup.md              # Development environment
├── testing-guide.md                  # Testing guidelines
├── environment-configuration.md      # Environment setup
├── components/                       # Component documentation
│   ├── features.md
│   ├── layout.md
│   ├── overview.md
│   └── shared.md
└── guides/                           # Developer guides
    ├── design-patterns.md
    ├── frontend-specification.md
    ├── implementation-guide.md
    └── system-overview.md
```

---

## 🧪 **Testing Structure** (`/tests/`)

### **Unit Tests** (`/tests/unit/`)
Individual component testing.

```
unit/
├── services/                         # Service layer tests
│   ├── attendance/                   # Attendance service tests
│   ├── payroll/                      # Payroll service tests
│   ├── leave/                        # Leave service tests
│   └── employee/                     # Employee service tests
├── models/                           # Data model tests
├── utils/                            # Utility function tests
└── middleware/                       # Middleware tests
```

### **Integration Tests** (`/tests/integration/`)
Component interaction testing.

```
integration/
├── api/                              # API endpoint tests
├── database/                         # Database integration tests
└── services/                         # Service integration tests
```

### **End-to-End Tests** (`/tests/e2e/`)
Complete workflow testing.

```
e2e/
├── workflows/                        # Business workflow tests
├── user-roles/                       # Role-specific tests
└── kiosk/                           # Kiosk interface tests
```

### **Performance Tests** (`/tests/performance/`)
Load and stress testing.

```
performance/
├── load/                             # Load testing
├── stress/                           # Stress testing
└── scalability/                      # Scalability testing
```

### **Security Tests** (`/tests/security/`)
Security vulnerability testing.

```
security/
├── authentication/                   # Auth testing
├── authorization/                    # Permission testing
└── data-protection/                  # Data security testing
```

### **Test Support** (`/tests/fixtures/`, `/tests/helpers/`, `/tests/config/`)
Test data and utilities.

```
fixtures/                             # Test data files
helpers/                              # Test utility functions
config/                               # Test configuration
```

---

## 🗄️ **Database Structure** (`/database/`)

### **Database Management**
```
database/
├── schemas/                          # Database schemas
│   └── main-schema.sql              # Main database schema
├── migrations/                       # Database migrations
├── seeds/                           # Database seed data
└── backups/                         # Database backups
```

---

## 💻 **Frontend Structure** (`/client/`)

### **React/TypeScript Application**
```
client/
├── public/                          # Static assets
├── src/                             # Source code
│   ├── components/                  # React components
│   │   ├── common/                  # Common components
│   │   ├── features/                # Feature components
│   │   ├── hr/                      # HR-specific components
│   │   ├── kiosk/                   # Kiosk components
│   │   ├── layout/                  # Layout components
│   │   └── shared/                  # Shared components
│   ├── pages/                       # Page components
│   ├── services/                    # API services
│   ├── hooks/                       # Custom React hooks
│   ├── utils/                       # Utility functions
│   ├── types/                       # TypeScript types
│   ├── constants/                   # Application constants
│   └── styles/                      # Global styles
├── tests/                           # Frontend tests
└── docs/                            # Frontend documentation
```

---

## 🖥️ **Backend Structure** (`/server/`)

### **Node.js/Express Application**
```
server/
├── src/                             # Source code
│   ├── controllers/                 # Request handlers
│   │   ├── auth/                    # Authentication controllers
│   │   ├── hr/                      # HR controllers
│   │   ├── attendance/              # Attendance controllers
│   │   ├── payroll/                 # Payroll controllers
│   │   └── leave/                   # Leave controllers
│   ├── services/                    # Business logic
│   │   ├── auth/                    # Authentication services
│   │   ├── hr/                      # HR services
│   │   ├── attendance/              # Attendance services
│   │   ├── payroll/                 # Payroll services
│   │   └── leave/                   # Leave services
│   ├── models/                      # Data models
│   │   ├── user/                    # User models
│   │   ├── employee/                # Employee models
│   │   ├── attendance/              # Attendance models
│   │   ├── payroll/                 # Payroll models
│   │   └── leave/                   # Leave models
│   ├── middleware/                  # Express middleware
│   │   ├── auth/                    # Authentication middleware
│   │   ├── validation/              # Validation middleware
│   │   └── error/                   # Error handling middleware
│   ├── utils/                       # Utility functions
│   │   ├── attendanceHoursCalculator.ts
│   │   ├── payrollDataTransformer.ts
│   │   └── validation/
│   ├── config/                      # Configuration files
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── constants/
│   └── types/                       # TypeScript types
├── tests/                           # Backend tests
├── docs/                            # Backend documentation
├── scripts/                         # Utility scripts
├── uploads/                         # File uploads
└── logs/                            # Application logs
```

---

## 📋 **Configuration Files**

### **Root Level**
```
tito/
├── .gitignore                       # Git ignore rules
├── .env.example                     # Environment variables example
├── package.json                     # Root package.json
└── README.md                        # Main project README
```

### **Client Configuration**
```
client/
├── package.json                     # Frontend dependencies
├── tsconfig.json                    # TypeScript configuration
├── vite.config.ts                   # Vite configuration
├── tailwind.config.js               # Tailwind CSS configuration
├── eslint.config.js                 # ESLint configuration
└── postcss.config.js                # PostCSS configuration
```

### **Server Configuration**
```
server/
├── package.json                     # Backend dependencies
├── tsconfig.json                    # TypeScript configuration
├── jest.config.js                   # Jest test configuration
├── nodemon.json                     # Nodemon configuration
└── .env                             # Environment variables
```

---

## 🎯 **Key Principles**

### **1. Separation of Concerns**
- **Frontend**: User interface and client-side logic
- **Backend**: Business logic and data processing
- **Database**: Data storage and management
- **Documentation**: Centralized and organized
- **Testing**: Comprehensive and structured

### **2. Modular Organization**
- **Components**: Reusable and well-organized
- **Services**: Business logic separation
- **Models**: Data structure definitions
- **Utils**: Shared utility functions
- **Types**: TypeScript type definitions

### **3. Documentation Standards**
- **Centralized**: All documentation in `/docs/`
- **Organized**: Clear folder structure
- **Comprehensive**: Complete coverage
- **Maintained**: Updated with code changes

### **4. Testing Standards**
- **Centralized**: All tests in `/tests/`
- **Organized**: Clear test structure
- **Comprehensive**: Multiple test types
- **Automated**: CI/CD integration

### **5. Code Quality**
- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent formatting
- **Testing**: Comprehensive coverage

---

## 🚀 **Getting Started**

### **Development Setup**
1. **Clone Repository**: `git clone <repository-url>`
2. **Install Dependencies**: `npm install`
3. **Setup Database**: Follow database setup guide
4. **Configure Environment**: Copy `.env.example` to `.env`
5. **Start Development**: `npm run dev`

### **Documentation**
1. **Read Main README**: Start with root `README.md`
2. **System Overview**: Check `/docs/overview/`
3. **API Reference**: Review `/docs/api/`
4. **User Guides**: Follow `/docs/guides/`

### **Testing**
1. **Run Tests**: `npm test`
2. **Check Coverage**: `npm run test:coverage`
3. **Review Test Structure**: Check `/tests/README.md`

---

## 📊 **Project Statistics**

- **Total Files**: 200+ files
- **Documentation**: 50+ markdown files
- **Tests**: 100+ test files
- **Components**: 50+ React components
- **Services**: 20+ backend services
- **API Endpoints**: 100+ endpoints
- **Database Tables**: 20+ tables

---

**Last Updated**: January 27, 2025  
**Project Version**: 1.0.0  
**Status**: ✅ **PRODUCTION READY**  
**Structure**: ✅ **FULLY ORGANIZED**

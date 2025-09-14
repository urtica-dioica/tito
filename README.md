# 🏢 TITO HR Management System

<div align="center">

![TITO HR Logo](https://img.shields.io/badge/TITO-HR%20Management-blue?style=for-the-badge&logo=react)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/license-ISC-blue?style=for-the-badge)

**A comprehensive, modern HR Management System built with React, Node.js, and PostgreSQL**

[![Documentation](https://img.shields.io/badge/Documentation-Complete-blue?style=for-the-badge)](./docs/README.md)
[![API Docs](https://img.shields.io/badge/API%20Docs-Available-orange?style=for-the-badge)](./docs/api/api-reference.md)

</div>

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- PostgreSQL 14+
- Redis (for session management)
- npm

### **Installation**
```bash
# Install dependencies for both client and server
cd server && npm install
cd ../client && npm install

# Setup database (from server directory)
cd server
npm run db:setup
npm run db:migrate 
npm run db:seed

# Start development servers
# Terminal 1: Start backend server
cd server && npm run dev

# Terminal 2: Start frontend client  
cd client && npm run dev
```

### **Access the Application**
- **Frontend**: http://localhost:5173 (Vite dev server) or http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Base**: http://localhost:3000/api/v1

---

## 🎯 **Key Features**

### **👥 Multi-Role Access Control**
- **HR Administrators** - Complete system management
- **Department Heads** - Department-specific management and approvals
- **Employees** - Self-service portal and request management
- **Kiosk Users** - Time tracking and attendance

### **⏰ Advanced Attendance Management**
- QR code-based time tracking
- Manual time entry and corrections
- Overtime request management
- Comprehensive attendance reports

### **💰 Comprehensive Payroll System**
- Automated payroll calculations
- Benefits and deductions management
- Multiple pay periods support
- Detailed payroll reports

### **📋 Leave Management**
- Leave request and approval workflow
- Leave balance tracking
- Multiple leave types support
- Department head approvals

### **🏢 Department Management**
- Organizational hierarchy
- Department head assignments
- Employee department transfers
- Department-specific reporting

---

## 🏗️ **System Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ • TypeScript    │    │ • Express.js    │    │ • 21 Tables     │
│ • Tailwind CSS  │    │ • JWT Auth      │    │ • Relationships │
│ • TanStack Query│    │ • REST API      │    │ • Triggers      │
│ • React Router  │    │ • TypeScript    │    │ • Functions     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 📁 **Project Structure**

```
tito/
├── 📁 client/                 # React Frontend Application (Vite + TypeScript)
│   ├── 📁 public/             # Static assets
│   ├── 📁 src/
│   │   ├── 📁 components/     # React Components (features, hr, kiosk, layout, shared)
│   │   ├── 📁 pages/          # Page Components (hr, dept, employee, kiosk, debug)
│   │   ├── 📁 hooks/          # Custom React Hooks (17 hooks)
│   │   ├── 📁 services/       # API Services (17 service files)
│   │   ├── 📁 contexts/       # React Contexts (AuthContext)
│   │   ├── 📁 types/          # TypeScript Types
│   │   └── 📁 utils/          # Utility functions
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── 📁 server/                 # Node.js Backend API (Express + TypeScript)
│   ├── 📁 src/
│   │   ├── 📁 controllers/    # API Controllers (attendance, auth, hr, payroll, etc.)
│   │   ├── 📁 services/       # Business Logic Services  
│   │   ├── 📁 models/         # Data Models & Database Layer
│   │   ├── 📁 routes/         # API Route Definitions
│   │   ├── 📁 middleware/     # Express Middleware (auth, validation, security)
│   │   ├── 📁 config/         # Configuration Files
│   │   └── 📁 utils/          # Utility Functions & Helpers
│   ├── 📁 scripts/            # Database & Utility Scripts
│   │   ├── setup-database.js  # Database initialization
│   │   ├── migrate-database.js # Database migrations  
│   │   └── seed-database.js   # Database seeding
│   ├── 📁 tests/              # Comprehensive Test Suite
│   │   ├── 📁 unit/           # Unit Tests
│   │   ├── 📁 integration/    # Integration Tests
│   │   ├── 📁 e2e/            # End-to-End Tests
│   │   ├── 📁 performance/    # Performance Tests
│   │   └── 📁 security/       # Security Tests
│   └── package.json
├── 📁 database/               # Database Schema & Scripts
│   └── 📁 schemas/
│       └── main-schema.sql    # Complete PostgreSQL schema (21 tables)
├── 📁 docs/                   # 📚 Complete Documentation
│   ├── 📁 overview/           # System specifications & business rules
│   ├── 📁 architecture/       # System architecture documentation
│   ├── 📁 api/                # API reference & guides
│   ├── 📁 guides/             # User & admin guides  
│   ├── 📁 development/        # Development & testing guides
│   └── 📁 deployment/         # Installation & deployment guides
├── 📁 tests/                  # Additional Test Configurations
└── 📄 README.md               # This File
```

---

## 🛠️ **Technology Stack**

### **Frontend**
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **TanStack Query** - Data fetching and caching
- **React Router** - Client-side routing
- **Vite** - Fast build tool and development server

### **Backend**
- **Node.js 18+** - JavaScript runtime
- **Express.js** - Web application framework  
- **TypeScript** - Type-safe server development
- **JWT** - JSON Web Token authentication
- **Bcrypt** - Password hashing
- **Redis** - Session management and caching
- **Winston** - Logging framework
- **Jest** - Testing framework

### **Database**
- **PostgreSQL 14+** - Relational database with 21 tables
- **Database Migrations** - Version-controlled schema changes
- **Triggers & Functions** - Database-level business logic
- **Connection pooling** - Optimized database connections

### **DevOps & Tools**
- **ESLint** - Code linting and quality
- **Prettier** - Code formatting
- **Nodemon** - Development server hot-reload
- **Git** - Version control
- **Jest** - Comprehensive testing (Unit, Integration, E2E)

---

## 📊 **System Statistics**

| Component | Count | Status |
|-----------|-------|--------|
| **API Endpoints** | 80+ | ✅ Complete |
| **Database Tables** | 21 | ✅ Complete |
| **Frontend Pages** | 20+ | ✅ Complete |
| **React Components** | 30+ | ✅ Complete |
| **User Roles** | 4 | ✅ Complete |
| **Test Coverage** | 85%+ | ✅ Complete |

---

## 🚀 **Getting Started**

### **1. Development Setup**
```bash
# Install dependencies for both applications
cd server && npm install
cd ../client && npm install

# Setup environment variables (create .env files as needed)
# server/.env - Database, Redis, JWT settings
# client/.env - API URLs and configuration

# Setup and initialize database
cd server
npm run db:setup    # Create database and user
npm run db:migrate  # Apply database schema  
npm run db:seed     # Insert initial data

# Start development servers
# Terminal 1: Backend API server
cd server && npm run dev

# Terminal 2: Frontend client (in new terminal)
cd client && npm run dev
```

### **2. Production Deployment**
```bash
# Build applications
cd server && npm run build
cd ../client && npm run build

# Start production servers
cd server && npm run start
```

### **3. Testing**
```bash
# Run comprehensive test suite (from server directory)
cd server && npm run test:all

# Or run specific test types
npm run test:unit        # Unit tests
npm run test:integration # Integration tests  
npm run test:e2e         # End-to-end tests
npm run test:coverage    # Generate coverage report
```

---

## 📚 **Documentation**

### **📖 Complete Documentation**
- **[📚 Full Documentation](./docs/README.md)** - Complete system documentation
- **[🏗️ System Architecture](./docs/architecture/system-architecture.md)** - System design and components
- **[🔌 API Reference](./docs/api/api-reference.md)** - Complete API documentation
- **[🚀 Deployment Guide](./docs/deployment/installation.md)** - Production deployment

### **👥 User Guides**
- **[👨‍💼 HR Admin Guide](./docs/user-guides/hr-admin-guide.md)** - HR management
- **[👨‍💻 Department Head Guide](./docs/user-guides/department-head-guide.md)** - Department management
- **[👤 Employee Guide](./docs/user-guides/employee-guide.md)** - Employee self-service
- **[🏢 Kiosk Guide](./docs/user-guides/kiosk-guide.md)** - Time tracking

### **🛠️ Development**
- **[💻 Development Guide](./docs/development/development-guide.md)** - Development workflow
- **[🧪 Testing Guide](./docs/development/testing-guide.md)** - Testing strategies
- **[📊 Database Schema](./docs/architecture/database-schema.md)** - Database structure

---

## 🔒 **Security Features**

- **🔐 JWT Authentication** - Secure token-based authentication
- **🛡️ Role-Based Authorization** - Granular permission system
- **🔒 Password Security** - Bcrypt hashing, password policies
- **📝 Audit Logging** - Complete activity tracking
- **🛡️ Input Validation** - Comprehensive data validation
- **🔒 HTTPS Support** - Secure communication

---

## 🧪 **Testing**

```bash
# Run all tests (comprehensive test suite)
cd server && npm run test:all

# Run individual test types
npm test                    # Basic test run
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests  
npm run test:e2e          # End-to-end tests
npm run test:performance  # Performance tests
npm run test:security     # Security tests

# Generate coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### **Test Coverage**
The system includes comprehensive testing across all layers:
- **Unit Tests**: Individual component/function testing
- **Integration Tests**: API endpoint and service integration
- **End-to-End Tests**: Complete user workflow testing  
- **Performance Tests**: Load and stress testing
- **Security Tests**: Authentication, authorization, and input validation

---

## 📈 **Performance**

- **⚡ Fast Loading** - Optimized bundle sizes and lazy loading
- **🔄 Real-time Updates** - Live data synchronization
- **📱 Responsive Design** - Mobile-first approach
- **🎯 Optimized Queries** - Database query optimization
- **💾 Efficient Caching** - Smart data caching strategies

---

## 🤝 **Contributing**

Contributions to improve the TITO HR Management System are welcome! Please see our [Contributing Guide](./docs/development/contribution-guidelines.md) for details.

### **Development Workflow**
1. Set up the development environment
2. Create a feature branch  
3. Make your changes following code standards
4. Add comprehensive tests
5. Update documentation as needed
6. Submit a pull request

---

## 📞 **Support**

### **Documentation & Help**
- **📚 [Complete Documentation](./docs/README.md)** - Full system documentation
- **🔌 [API Reference](./docs/api/api-reference.md)** - Complete API documentation
- **🏗️ [System Architecture](./docs/architecture/system-architecture.md)** - Technical architecture
- **🚀 [Installation Guide](./docs/deployment/installation.md)** - Setup and deployment

### **Development Resources**
- **💻 [Development Guide](./docs/development/development-setup.md)** - Setup development environment
- **🧪 [Testing Guide](./docs/development/testing-guide.md)** - Testing procedures  
- **🤝 [Contributing Guide](./docs/development/contribution-guidelines.md)** - How to contribute
- **📊 [Database Schema](./database/schemas/main-schema.sql)** - Complete database structure

---

## 📄 **License**

This project is licensed under the ISC License - see the package.json files for details.

---

## 🙏 **Acknowledgments**

- **Development Team** - TITO HR Development Team
- **Contributors** - All project contributors and testers
- **Community** - Open source libraries and frameworks used

---

<div align="center">

**🏢 TITO HR Management System | 🚀 Production Ready | 🔒 Enterprise Security**

*Built with ❤️ by the TITO Development Team*

[![Documentation](https://img.shields.io/badge/Documentation-Complete-blue?style=for-the-badge&logo=gitbook)](./docs/README.md)
[![API Docs](https://img.shields.io/badge/API%20Docs-Available-orange?style=for-the-badge&logo=swagger)](./docs/api/api-reference.md)

</div>
# 🏢 TITO HR Management System

<div align="center">

![TITO HR Logo](https://img.shields.io/badge/TITO-HR%20Management-blue?style=for-the-badge&logo=react)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)

**A comprehensive, modern HR Management System built with React, Node.js, and PostgreSQL**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Available-brightgreen?style=for-the-badge)](https://your-demo-url.com)
[![Documentation](https://img.shields.io/badge/Documentation-Complete-blue?style=for-the-badge)](./docs/README.md)
[![API Docs](https://img.shields.io/badge/API%20Docs-Available-orange?style=for-the-badge)](./docs/api/api-reference.md)

</div>

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### **Installation**
```bash
# Clone the repository
git clone https://github.com/your-org/tito-hr-system.git
cd tito-hr-system

# Install dependencies
npm install

# Setup database
npm run db:setup

# Start development servers
npm run dev
```

### **Access the Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs

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
tito-hr-system/
├── 📁 client/                 # React Frontend Application
│   ├── 📁 src/
│   │   ├── 📁 components/     # React Components
│   │   ├── 📁 pages/          # Page Components
│   │   ├── 📁 hooks/          # Custom React Hooks
│   │   ├── 📁 services/       # API Services
│   │   └── 📁 types/          # TypeScript Types
│   └── 📁 docs/               # Frontend Documentation
├── 📁 server/                 # Node.js Backend Application
│   ├── 📁 src/
│   │   ├── 📁 controllers/    # API Controllers
│   │   ├── 📁 services/       # Business Logic
│   │   ├── 📁 models/         # Data Models
│   │   ├── 📁 routes/         # API Routes
│   │   └── 📁 middleware/     # Express Middleware
│   └── 📁 docs/               # Backend Documentation
├── 📁 database/               # Database Schema & Scripts
│   └── 📁 schemas/            # SQL Schema Files
├── 📁 docs/                   # 📚 Complete Documentation
│   ├── 📁 overview/           # System Overview
│   ├── 📁 architecture/       # System Architecture
│   ├── 📁 api/                # API Documentation
│   ├── 📁 deployment/         # Deployment Guides
│   ├── 📁 development/        # Development Guides
│   ├── 📁 user-guides/        # User Manuals
│   ├── 📁 admin-guides/       # Administration Guides
│   └── 📁 changelog/          # Version History
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
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe server development
- **JWT** - JSON Web Token authentication
- **Bcrypt** - Password hashing
- **Jest** - Testing framework

### **Database**
- **PostgreSQL** - Relational database
- **Database Migrations** - Version-controlled schema changes
- **Triggers & Functions** - Database-level business logic

### **DevOps & Tools**
- **Docker** - Containerization
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Git** - Version control
- **Jest** - Testing framework

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
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Setup database
npm run db:setup

# Start development servers
npm run dev
```

### **2. Production Deployment**
```bash
# Build applications
npm run build

# Start production servers
npm run start
```

### **3. Docker Deployment**
```bash
# Build and run with Docker
docker-compose up -d
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
# Run all tests
npm test

# Run frontend tests
npm run test:client

# Run backend tests
npm run test:server

# Run integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage
```

---

## 📈 **Performance**

- **⚡ Fast Loading** - Optimized bundle sizes and lazy loading
- **🔄 Real-time Updates** - Live data synchronization
- **📱 Responsive Design** - Mobile-first approach
- **🎯 Optimized Queries** - Database query optimization
- **💾 Efficient Caching** - Smart data caching strategies

---

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](./docs/development/contributing.md) for details.

### **Development Workflow**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

## 📞 **Support**

### **Documentation & Help**
- **📚 [Complete Documentation](./docs/README.md)** - Full system documentation
- **❓ [FAQ](./docs/overview/faq.md)** - Frequently asked questions
- **🐛 [Bug Reports](https://github.com/your-repo/issues)** - Report issues
- **💡 [Feature Requests](https://github.com/your-repo/issues)** - Suggest improvements

### **Community**
- **💬 [Discussions](https://github.com/your-repo/discussions)** - General discussion
- **📢 [Announcements](https://github.com/your-repo/discussions/categories/announcements)** - System updates
- **🤝 [Contributing](./docs/development/contributing.md)** - How to contribute

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **Development Team** - TITO HR Development Team
- **Contributors** - All project contributors
- **Community** - Open source community support

---

<div align="center">

**🏢 TITO HR Management System | 🚀 Production Ready | 🔒 Enterprise Security**

*Built with ❤️ by the TITO Development Team*

[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github)](https://github.com/your-repo)
[![Documentation](https://img.shields.io/badge/Documentation-Complete-blue?style=for-the-badge&logo=gitbook)](./docs/README.md)
[![API Docs](https://img.shields.io/badge/API%20Docs-Available-orange?style=for-the-badge&logo=swagger)](./docs/api/api-reference.md)

</div>
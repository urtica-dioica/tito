# 🛠️ TITO HR Management System - Development Setup Guide

## 🎯 **Overview**

This guide provides step-by-step instructions for setting up the TITO HR Management System development environment. Follow these instructions to get the system running locally on your machine.

## 📋 **Table of Contents**

- [Prerequisites](#prerequisites)
- [System Requirements](#system-requirements)
- [Installation Steps](#installation-steps)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Redis Setup](#redis-setup)
- [Running the Application](#running-the-application)
- [Verification](#verification)
- [Development Tools](#development-tools)
- [Troubleshooting](#troubleshooting)

---

## 📋 **Prerequisites**

### **Required Software**
- **Node.js**: Version 18.x or higher
- **npm**: Version 8.x or higher
- **PostgreSQL**: Version 13.x or higher
- **Redis**: Version 6.x or higher
- **Git**: Latest version

### **Recommended Tools**
- **VS Code**: With TypeScript and ESLint extensions
- **Postman**: For API testing
- **pgAdmin**: For database management
- **Redis Desktop Manager**: For Redis management

---

## 💻 **System Requirements**

### **Minimum Requirements**
- **RAM**: 4GB
- **Storage**: 2GB available space
- **CPU**: 2 cores
- **OS**: Windows 10+, macOS 10.15+, or Ubuntu 18.04+

### **Recommended Requirements**
- **RAM**: 8GB or more
- **Storage**: 5GB available space
- **CPU**: 4 cores or more
- **OS**: Latest version of your preferred OS

---

## 🚀 **Installation Steps**

### **1. Clone the Repository**
```bash
# Clone the repository
git clone <repository-url>
cd tito-hr-system/server

# Verify you're in the correct directory
ls -la
```

### **2. Install Dependencies**
```bash
# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

### **3. Verify Node.js Version**
```bash
# Check Node.js version
node --version
# Should be 18.x or higher

# Check npm version
npm --version
# Should be 8.x or higher
```

---

## ⚙️ **Environment Configuration**

### **1. Create Environment File**
```bash
# Copy the example environment file
cp .env.example .env

# Edit the environment file
nano .env  # or use your preferred editor
```

### **2. Configure Environment Variables**
```bash
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://tito_user:password@localhost:5432/tito_hr
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tito_hr
DB_USER=tito_user
DB_PASSWORD=password

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your-development-jwt-secret-key
JWT_REFRESH_SECRET=your-development-refresh-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=10

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log
```

---

## 🗄️ **Database Setup**

### **1. Install PostgreSQL**

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS (using Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
- Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

### **2. Create Database and User**
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE tito_hr;
CREATE USER tito_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE tito_hr TO tito_user;
\q
```

### **3. Apply Database Schema**
```bash
# Apply the database schema
npm run db:migrate

# This will:
# 1. Connect to the tito_hr database
# 2. Apply the schema from database/schemas/main-schema.sql
# 3. Create all tables, indexes, and constraints
# 4. Verify the setup
```

### **4. Seed Initial Data**
```bash
# Run the seed file (if available)
npm run db:seed

# Or manually:
psql -h localhost -U tito_user -d tito_hr -f database/seeds/001_initial_data.sql

# Verify data was inserted
psql -h localhost -U tito_user -d tito_hr -c "SELECT * FROM users;"
```

### **5. Database Management Commands**
```bash
# Complete database setup (database + schema + seed)
npm run db:reset

# Individual commands:
npm run db:setup    # Create database and user only
npm run db:migrate  # Apply schema only
npm run db:seed     # Seed data only

# Verify tables were created
psql -h localhost -U tito_user -d tito_hr -c "\dt"
```

---

## 🔴 **Redis Setup**

### **1. Install Redis**

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**macOS (using Homebrew):**
```bash
brew install redis
brew services start redis
```

**Windows:**
- Download and install from [Redis official website](https://redis.io/download)

### **2. Verify Redis Installation**
```bash
# Test Redis connection
redis-cli ping
# Should return "PONG"

# Check Redis version
redis-cli --version
```

### **3. Configure Redis (Optional)**
```bash
# Edit Redis configuration
sudo nano /etc/redis/redis.conf

# For development, you can leave the default configuration
# For production, consider setting a password
```

---

## 🏃 **Running the Application**

### **1. Start the Development Server**
```bash
# Start the server in development mode
npm run dev

# The server should start and show:
# 🚀 TITO HR Server running on http://localhost:3000
# 📊 Health check: http://localhost:3000/health
```

### **2. Verify Server is Running**
```bash
# Test the health endpoint
curl http://localhost:3000/health

# Test the root endpoint
curl http://localhost:3000/
```

### **3. Check Server Logs**
```bash
# The server should show logs like:
# Database connection successful
# Redis connection successful
# Server started successfully
```

---

## ✅ **Verification**

### **1. Health Check**
```bash
# Test health endpoint
curl http://localhost:3000/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-09-04T10:00:00Z",
  "uptime": 3600,
  "environment": "development",
  "services": {
    "database": "healthy",
    "redis": "healthy"
  },
  "version": "1.0.0"
}
```

### **2. API Information**
```bash
# Test root endpoint
curl http://localhost:3000/

# Expected response:
{
  "message": "TITO HR Management System API",
  "version": "1.0.0",
  "timestamp": "2025-09-04T10:00:00Z",
  "endpoints": {
    "auth": "/api/v1/auth",
    "hr": "/api/v1/hr",
    "attendance": "/api/v1/attendance",
    "health": "/health"
  }
}
```

### **3. Database Connection**
```bash
# Test database connection
psql -h localhost -U tito_user -d tito_hr -c "SELECT COUNT(*) FROM users;"

# Should return a number (e.g., 1)
```

### **4. Redis Connection**
```bash
# Test Redis connection
redis-cli ping

# Should return "PONG"
```

---

## 🛠️ **Development Tools**

### **1. VS Code Extensions**
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json"
  ]
}
```

### **2. Useful npm Scripts**
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm test             # Run all tests
npm run test:unit    # Run unit tests
npm run test:integration # Run integration tests
npm run test:e2e     # Run end-to-end tests
npm run test:coverage # Run tests with coverage

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run type-check   # Check TypeScript types
```

### **3. Database Management**
```bash
# Connect to database
psql -h localhost -U tito_user -d tito_hr

# Useful PostgreSQL commands
\l                  # List databases
\dt                 # List tables
\d table_name       # Describe table
\q                  # Quit
```

### **4. Redis Management**
```bash
# Connect to Redis
redis-cli

# Useful Redis commands
ping                # Test connection
keys *              # List all keys
flushall            # Clear all data (use with caution)
quit                # Quit
```

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. Port Already in Use**
```bash
# Error: EADDRINUSE: address already in use :::3000
# Solution: Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change the port in .env file
PORT=3001
```

#### **2. Database Connection Failed**
```bash
# Error: Database connection failed
# Solution: Check PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if not running
sudo systemctl start postgresql

# Check database exists
psql -h localhost -U tito_user -d tito_hr -c "\l"
```

#### **3. Redis Connection Failed**
```bash
# Error: Redis connection failed
# Solution: Check Redis is running
sudo systemctl status redis-server

# Start Redis if not running
sudo systemctl start redis-server

# Test Redis connection
redis-cli ping
```

#### **4. Permission Denied**
```bash
# Error: Permission denied
# Solution: Check file permissions
chmod +x scripts/*.sh

# Or run with sudo if necessary
sudo npm install
```

#### **5. TypeScript Compilation Errors**
```bash
# Error: TypeScript compilation failed
# Solution: Check TypeScript configuration
npm run type-check

# Fix type issues or update tsconfig.json
```

### **Debug Mode**
```bash
# Enable debug logging
export DEBUG=*
npm run dev

# Or set in .env file
LOG_LEVEL=debug
```

### **Reset Development Environment**
```bash
# Stop all services
sudo systemctl stop postgresql
sudo systemctl stop redis-server

# Clear node_modules
rm -rf node_modules
npm install

# Reset database
psql -h localhost -U tito_user -d tito_hr -f database/schemas/main-schema.sql
psql -h localhost -U tito_user -d tito_hr -f database/seeds/001_initial_data.sql

# Clear Redis
redis-cli flushall

# Restart services
sudo systemctl start postgresql
sudo systemctl start redis-server
npm run dev
```

---

## 📞 **Getting Help**

### **Documentation**
- Check the [API Reference](../api/api-reference.md)
- Review the [Database Schema](../database/database-schema.md)
- Read the [Contribution Guidelines](contribution-guidelines.md)

### **Common Commands**
```bash
# Check server status
curl http://localhost:3000/health

# View logs
tail -f logs/app.log

# Test database
psql -h localhost -U tito_user -d tito_hr -c "SELECT * FROM users;"

# Test Redis
redis-cli ping
```

### **Support**
- Create an issue in the repository
- Check existing issues for solutions
- Contact the development team

---

**Last Updated**: September 4, 2025  
**Version**: 1.0.0  
**Compatibility**: Node.js 18+, PostgreSQL 13+, Redis 6+
# 🚀 Installation Guide

## Overview

This guide provides step-by-step instructions for installing and setting up the TITO HR Management System in various environments.

## Prerequisites

### **System Requirements**
- **Node.js** 18.0.0 or higher
- **PostgreSQL** 14.0 or higher
- **npm** 8.0.0 or higher
- **Git** 2.0.0 or higher

### **Operating System Support**
- **Linux** (Ubuntu 20.04+, CentOS 8+)
- **macOS** (10.15+)
- **Windows** (10/11 with WSL2 recommended)

### **Hardware Requirements**
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 10GB free space
- **CPU**: 2+ cores recommended

## Installation Methods

### **Method 1: Manual Installation**

#### **Step 1: Clone Repository**
```bash
git clone https://github.com/your-org/tito-hr-system.git
cd tito-hr-system
```

#### **Step 2: Install Dependencies**
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

#### **Step 3: Database Setup**
```bash
# Create PostgreSQL database
createdb tito_hr_system

# Run database migrations
cd server
npm run db:migrate

# Seed initial data
npm run db:seed
```

#### **Step 4: Environment Configuration**
```bash
# Copy environment templates
cp .env.example .env
cp client/.env.example client/.env
cp server/.env.example server/.env

# Edit configuration files
nano .env
nano client/.env
nano server/.env
```

#### **Step 5: Start Application**
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm run start
```

### **Method 2: Docker Installation**

#### **Step 1: Docker Setup**
```bash
# Install Docker and Docker Compose
# Follow Docker installation guide for your OS

# Clone repository
git clone https://github.com/your-org/tito-hr-system.git
cd tito-hr-system
```

#### **Step 2: Docker Configuration**
```bash
# Copy Docker environment file
cp docker-compose.env.example docker-compose.env

# Edit environment variables
nano docker-compose.env
```

#### **Step 3: Start with Docker**
```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### **Method 3: Cloud Deployment**

#### **AWS Deployment**
```bash
# Install AWS CLI
# Configure AWS credentials

# Deploy using AWS CDK
npm run deploy:aws
```

#### **Azure Deployment**
```bash
# Install Azure CLI
# Login to Azure

# Deploy using Azure CLI
npm run deploy:azure
```

#### **Google Cloud Deployment**
```bash
# Install Google Cloud SDK
# Configure authentication

# Deploy using gcloud
npm run deploy:gcp
```

## Configuration

### **Environment Variables**

#### **Root Configuration (.env)**
```env
# Application
NODE_ENV=production
PORT=5000
CLIENT_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/tito_hr_system

# Security
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### **Client Configuration (client/.env)**
```env
# API
VITE_API_URL=http://localhost:5000
VITE_API_VERSION=v1

# Application
VITE_APP_NAME=TITO HR Management
VITE_APP_VERSION=1.0.0

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false
```

#### **Server Configuration (server/.env)**
```env
# Server
PORT=5000
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tito_hr_system
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# Security
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

### **Database Configuration**

#### **PostgreSQL Setup**
```sql
-- Create database
CREATE DATABASE tito_hr_system;

-- Create user
CREATE USER tito_user WITH PASSWORD 'secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE tito_hr_system TO tito_user;

-- Connect to database
\c tito_hr_system;

-- Run schema
\i database/schemas/main-schema.sql;
```

#### **Database Migrations**
```bash
# Run migrations
npm run db:migrate

# Rollback migrations
npm run db:rollback

# Check migration status
npm run db:status
```

## Verification

### **Health Checks**
```bash
# Check application health
curl http://localhost:5000/health

# Check database connection
curl http://localhost:5000/api/health/db

# Check frontend
curl http://localhost:3000
```

### **Test Endpoints**
```bash
# Test API endpoints
curl -X GET http://localhost:5000/api/employees
curl -X GET http://localhost:5000/api/departments
curl -X GET http://localhost:5000/api/attendance
```

### **Database Verification**
```sql
-- Check tables
\dt

-- Check data
SELECT COUNT(*) FROM employees;
SELECT COUNT(*) FROM departments;
SELECT COUNT(*) FROM attendance_records;
```

## Post-Installation

### **Initial Setup**
1. **Create Admin User**
   ```bash
   npm run create-admin
   ```

2. **Configure Company Settings**
   - Navigate to admin panel
   - Set company information
   - Configure policies
   - Set up departments

3. **Import Initial Data**
   ```bash
   npm run import-data
   ```

### **User Onboarding**
1. **Create User Accounts**
   - Add HR administrators
   - Create department heads
   - Set up employee accounts

2. **Configure Permissions**
   - Assign roles
   - Set permissions
   - Test access levels

3. **Training**
   - Provide user documentation
   - Conduct training sessions
   - Set up support channels

## Troubleshooting

### **Common Issues**

#### **Database Connection Issues**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U tito_user -d tito_hr_system

# Reset database
npm run db:reset
```

#### **Port Conflicts**
```bash
# Check port usage
netstat -tulpn | grep :5000
netstat -tulpn | grep :3000

# Kill processes
sudo kill -9 <PID>
```

#### **Permission Issues**
```bash
# Fix file permissions
sudo chown -R $USER:$USER /path/to/tito-hr-system
chmod -R 755 /path/to/tito-hr-system
```

### **Log Analysis**
```bash
# View application logs
tail -f server/logs/app.log

# View error logs
tail -f server/logs/error.log

# View access logs
tail -f server/logs/access.log
```

### **Performance Issues**
```bash
# Check system resources
htop
df -h
free -h

# Monitor database
pg_stat_activity
pg_stat_database
```

## Security Considerations

### **Production Security**
- **HTTPS Configuration** - Enable SSL/TLS
- **Firewall Setup** - Configure network security
- **Database Security** - Secure database access
- **Regular Updates** - Keep system updated

### **Backup Strategy**
- **Database Backups** - Regular database backups
- **File Backups** - Backup uploaded files
- **Configuration Backups** - Backup configuration files
- **Disaster Recovery** - Test recovery procedures

## Maintenance

### **Regular Maintenance**
- **System Updates** - Keep software updated
- **Security Patches** - Apply security updates
- **Performance Monitoring** - Monitor system performance
- **Log Rotation** - Manage log files

### **Monitoring**
- **Health Checks** - Regular health monitoring
- **Performance Metrics** - Track system performance
- **Error Monitoring** - Monitor error rates
- **User Activity** - Track user activities

---

*Last Updated: January 2025 | Version: 1.0.0*

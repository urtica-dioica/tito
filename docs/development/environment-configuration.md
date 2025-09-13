# ⚙️ TITO HR Management System - Environment Configuration

## 🎯 **Overview**

This document provides comprehensive information about environment configuration for the TITO HR Management System. It covers all environment variables, their purposes, and configuration examples.

## 📋 **Table of Contents**

- [Environment Variables](#environment-variables)
- [Configuration Examples](#configuration-examples)
- [Security Considerations](#security-considerations)
- [Environment-Specific Settings](#environment-specific-settings)
- [Validation](#validation)
- [Troubleshooting](#troubleshooting)

---

## 🔧 **Environment Variables**

### **Server Configuration**
```bash
# Server Configuration
NODE_ENV=development                    # Environment: development, staging, production
PORT=3000                              # Server port (default: 3000)
HOST=localhost                         # Server host (default: localhost)
```

### **Database Configuration**
```bash
# PostgreSQL Database
DATABASE_URL=postgresql://tito_user:password@localhost:5432/tito_hr
DB_HOST=localhost                      # Database host
DB_PORT=5432                          # Database port
DB_NAME=tito_hr                       # Database name
DB_USER=tito_user                     # Database username
DB_PASSWORD=password                  # Database password
DB_SSL=false                          # SSL connection (true for production)
```

### **Redis Configuration**
```bash
# Redis Cache
REDIS_URL=redis://localhost:6379      # Redis connection URL
REDIS_HOST=localhost                  # Redis host
REDIS_PORT=6379                       # Redis port
REDIS_PASSWORD=                       # Redis password (empty for local)
REDIS_DB=0                           # Redis database number
```

### **JWT Configuration**
```bash
# JWT Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-here
JWT_EXPIRES_IN=15m                    # Access token expiry
JWT_REFRESH_EXPIRES_IN=7d             # Refresh token expiry
```

### **Security Configuration**
```bash
# Security Settings
BCRYPT_ROUNDS=12                      # Password hashing rounds
CORS_ORIGIN=http://localhost:3000     # CORS allowed origins
RATE_LIMIT_WINDOW_MS=900000          # Rate limit window (15 minutes)
RATE_LIMIT_MAX_REQUESTS=100          # Max requests per window
```

### **Logging Configuration**
```bash
# Logging
LOG_LEVEL=debug                       # Log level: error, warn, info, debug
LOG_FILE=logs/app.log                 # Log file path
LOG_MAX_SIZE=10m                      # Max log file size
LOG_MAX_FILES=5                       # Max log files to keep
```

### **File Upload Configuration**
```bash
# File Upload
UPLOAD_DIR=uploads                    # Upload directory
MAX_FILE_SIZE=5242880                 # Max file size (5MB)
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif
```

### **Email Configuration (Optional)**
```bash
# Email Service
SMTP_HOST=smtp.gmail.com              # SMTP host
SMTP_PORT=587                         # SMTP port
SMTP_USER=your-email@gmail.com        # SMTP username
SMTP_PASS=your-app-password           # SMTP password
SMTP_FROM=noreply@tito-hr.com         # From email address
```

---

## 📝 **Configuration Examples**

### **Development Environment (.env.development)**
```bash
# Development Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database
DATABASE_URL=postgresql://tito_user:password@localhost:5432/tito_hr_dev
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tito_hr_dev
DB_USER=tito_user
DB_PASSWORD=password
DB_SSL=false

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=dev-jwt-secret-key-not-for-production
JWT_REFRESH_SECRET=dev-refresh-secret-key-not-for-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=10
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif
```

### **Production Environment (.env.production)**
```bash
# Production Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://tito_user:secure_password@db-host:5432/tito_hr
DB_HOST=db-host
DB_PORT=5432
DB_NAME=tito_hr
DB_USER=tito_user
DB_PASSWORD=secure_password
DB_SSL=true

# Redis
REDIS_URL=redis://:redis_password@redis-host:6379
REDIS_HOST=redis-host
REDIS_PORT=6379
REDIS_PASSWORD=redis_password
REDIS_DB=0

# JWT
JWT_SECRET=super-secure-jwt-secret-key-for-production-only
JWT_REFRESH_SECRET=super-secure-refresh-secret-key-for-production-only
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/tito-hr/app.log

# File Upload
UPLOAD_DIR=/var/uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=hr@your-domain.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@your-domain.com
```

### **Testing Environment (.env.test)**
```bash
# Testing Configuration
NODE_ENV=test
PORT=3001
HOST=localhost

# Database
DATABASE_URL=postgresql://tito_user:password@localhost:5432/tito_hr_test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tito_hr_test
DB_USER=tito_user
DB_PASSWORD=password
DB_SSL=false

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=1

# JWT
JWT_SECRET=test-jwt-secret-key
JWT_REFRESH_SECRET=test-refresh-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=24h

# Security
BCRYPT_ROUNDS=4
CORS_ORIGIN=http://localhost:3001
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000

# Logging
LOG_LEVEL=error
LOG_FILE=logs/test.log

# File Upload
UPLOAD_DIR=test-uploads
MAX_FILE_SIZE=1048576
ALLOWED_FILE_TYPES=image/jpeg,image/png
```

---

## 🔒 **Security Considerations**

### **Production Security**
- **Strong Passwords**: Use strong, unique passwords for all services
- **JWT Secrets**: Generate cryptographically secure JWT secrets
- **Database SSL**: Always use SSL connections in production
- **Environment Isolation**: Never use development secrets in production
- **Secret Management**: Consider using secret management services

### **Secret Generation**
```bash
# Generate secure JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate secure database password
openssl rand -base64 32

# Generate secure Redis password
openssl rand -base64 16
```

### **Environment File Security**
```bash
# Add to .gitignore
.env
.env.local
.env.production
.env.staging
.env.test

# Keep example files in version control
.env.example
.env.development.example
.env.production.example
```

---

## 🌍 **Environment-Specific Settings**

### **Development**
- **Debug Mode**: Enable detailed logging
- **Relaxed Security**: Lower bcrypt rounds, longer token expiry
- **Local Services**: Use local database and Redis
- **CORS**: Allow localhost origins

### **Staging**
- **Production-like**: Similar to production but with test data
- **Monitoring**: Enable monitoring and alerting
- **Backup**: Regular database backups
- **SSL**: Use SSL for all connections

### **Production**
- **High Security**: Strong passwords, SSL, rate limiting
- **Performance**: Optimized logging, connection pooling
- **Monitoring**: Full monitoring and alerting
- **Backup**: Automated backups and disaster recovery

---

## ✅ **Validation**

### **Required Variables**
All environments must have these variables:
- `NODE_ENV`
- `PORT`
- `DATABASE_URL` or database connection variables
- `REDIS_URL` or Redis connection variables
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

### **Validation Script**
```bash
#!/bin/bash
# validate-env.sh

required_vars=(
    "NODE_ENV"
    "PORT"
    "DATABASE_URL"
    "REDIS_URL"
    "JWT_SECRET"
    "JWT_REFRESH_SECRET"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: $var is not set"
        exit 1
    fi
done

echo "All required environment variables are set"
```

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Database Connection Failed**
```bash
# Check database variables
echo $DATABASE_URL
echo $DB_HOST
echo $DB_PORT
echo $DB_NAME
echo $DB_USER

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

#### **Redis Connection Failed**
```bash
# Check Redis variables
echo $REDIS_URL
echo $REDIS_HOST
echo $REDIS_PORT

# Test connection
redis-cli -h $REDIS_HOST -p $REDIS_PORT ping
```

#### **JWT Token Issues**
```bash
# Check JWT variables
echo $JWT_SECRET
echo $JWT_REFRESH_SECRET
echo $JWT_EXPIRES_IN
echo $JWT_REFRESH_EXPIRES_IN
```

#### **File Upload Issues**
```bash
# Check upload directory
ls -la $UPLOAD_DIR

# Check permissions
chmod 755 $UPLOAD_DIR
```

### **Environment Validation**
```bash
# Validate environment configuration
npm run validate:env

# Check environment variables
npm run check:env
```

---

## 📚 **Best Practices**

### **Configuration Management**
1. **Use .env files** for local development
2. **Use environment variables** in production
3. **Never commit secrets** to version control
4. **Use different databases** for different environments
5. **Validate configuration** on startup

### **Security Best Practices**
1. **Rotate secrets regularly**
2. **Use strong passwords**
3. **Enable SSL in production**
4. **Limit CORS origins**
5. **Use rate limiting**

### **Development Best Practices**
1. **Use .env.example** as a template
2. **Document all variables**
3. **Provide default values** where appropriate
4. **Validate on startup**
5. **Use environment-specific configs**

---

**Last Updated**: September 4, 2025  
**Version**: 1.0.0  
**Environment**: All Environments
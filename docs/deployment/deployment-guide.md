# 🚀 TITO HR Management System - Deployment Guide

## 🎯 **Overview**

This guide provides comprehensive instructions for deploying the TITO HR Management System in production environments. The system is designed to be scalable, secure, and maintainable.

## 📋 **Table of Contents**

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Application Deployment](#application-deployment)
- [Security Configuration](#security-configuration)
- [Monitoring and Logging](#monitoring-and-logging)
- [Backup and Recovery](#backup-and-recovery)
- [Scaling and Performance](#scaling-and-performance)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)
- [Support and Maintenance](#support-and-maintenance)

---

## 📋 **Prerequisites**

### **System Requirements**

- **Node.js**: Version 18.x or higher
- **PostgreSQL**: Version 13.x or higher
- **Redis**: Version 6.x or higher
- **Memory**: Minimum 2GB RAM (4GB recommended)
- **Storage**: Minimum 10GB available space
- **CPU**: 2 cores minimum (4 cores recommended)

### **Software Dependencies**

- **npm**: Version 8.x or higher
- **TypeScript**: Version 5.x
- **PM2**: For process management (recommended)

---

## 🔧 **Environment Setup**

### **1. Database Setup**

#### **PostgreSQL Installation**

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**CentOS/RHEL:**
```bash
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### **Database Configuration**

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE tito_hr;
CREATE USER tito_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE tito_hr TO tito_user;
\q
```

#### **Database Schema Setup**

```bash
# Run the schema file
psql -h localhost -U tito_user -d tito_hr -f database/schemas/main-schema.sql
```

### **2. Redis Setup**

#### **Redis Installation**

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**CentOS/RHEL:**
```bash
sudo yum install redis
sudo systemctl start redis
sudo systemctl enable redis
```

#### **Redis Configuration**

Edit `/etc/redis/redis.conf`:
```conf
# Security
requirepass your_redis_password
bind 127.0.0.1

# Memory management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
```

Restart Redis:
```bash
sudo systemctl restart redis-server
```

### **3. Node.js Setup**

#### **Node.js Installation**

**Using NodeSource repository:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Using nvm (recommended for development):**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

---

## 🚀 **Application Deployment**

### **1. Code Deployment**

```bash
# Clone the repository
git clone <repository-url>
cd tito-hr-system

# Install dependencies
npm install

# Build the application
npm run build

# Create production environment file
cp server/env.example server/.env
```

### **2. Environment Configuration**

Create `server/.env` with production values:

```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://tito_user:secure_password@localhost:5432/tito_hr
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tito_hr
DB_USER=tito_user
DB_PASSWORD=secure_password

# Redis Configuration
REDIS_URL=redis://:your_redis_password@localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### **3. Process Management with PM2**

#### **Install PM2**
```bash
npm install -g pm2
```

#### **Create PM2 Configuration**

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'tito-hr-server',
    script: 'dist/app.js',
    cwd: './server',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: 'logs/combined.log',
    out_file: 'logs/out.log',
    error_file: 'logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

#### **Start Application**
```bash
cd server
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### **4. Reverse Proxy Setup (Nginx)**

#### **Install Nginx**
```bash
sudo apt install nginx
```

#### **Configure Nginx**

Create `/etc/nginx/sites-available/tito-hr`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }

    # Static files (if any)
    location /static/ {
        alias /path/to/static/files/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### **Enable Site**
```bash
sudo ln -s /etc/nginx/sites-available/tito-hr /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### **5. SSL Certificate (Let's Encrypt)**

#### **Install Certbot**
```bash
sudo apt install certbot python3-certbot-nginx
```

#### **Obtain Certificate**
```bash
sudo certbot --nginx -d your-domain.com
```

#### **Auto-renewal**
```bash
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🔒 **Security Configuration**

### **1. Firewall Setup**

```bash
# UFW (Ubuntu)
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3000/tcp  # Block direct access to Node.js

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### **2. Database Security**

```sql
-- Create read-only user for reporting
CREATE USER tito_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE tito_hr TO tito_readonly;
GRANT USAGE ON SCHEMA public TO tito_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO tito_readonly;
```

### **3. Redis Security**

```conf
# /etc/redis/redis.conf
requirepass your_strong_redis_password
bind 127.0.0.1
port 0
unixsocket /var/run/redis/redis.sock
unixsocketperm 700
```

---

## 📊 **Monitoring and Logging**

### **1. Log Management**

#### **Log Rotation**
Create `/etc/logrotate.d/tito-hr`:
```
/path/to/tito-hr/server/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 node node
    postrotate
        pm2 reloadLogs
    endscript
}
```

### **2. Health Monitoring**

#### **Create Health Check Script**
```bash
#!/bin/bash
# /usr/local/bin/tito-health-check.sh

HEALTH_URL="http://localhost:3000/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ] || [ $RESPONSE -eq 503 ]; then
    echo "Health check passed: $RESPONSE"
    exit 0
else
    echo "Health check failed: $RESPONSE"
    pm2 restart tito-hr-server
    exit 1
fi
```

#### **Add to Crontab**
```bash
sudo crontab -e
# Add: */5 * * * * /usr/local/bin/tito-health-check.sh
```

### **3. Performance Monitoring**

#### **Install Monitoring Tools**
```bash
# PM2 monitoring
pm2 install pm2-server-monit

# System monitoring
sudo apt install htop iotop nethogs
```

---

## 💾 **Backup and Recovery**

### **1. Database Backup**

#### **Automated Backup Script**
```bash
#!/bin/bash
# /usr/local/bin/backup-database.sh

BACKUP_DIR="/backups/tito-hr"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/tito_hr_$DATE.sql"

mkdir -p $BACKUP_DIR

pg_dump -h localhost -U tito_user -d tito_hr > $BACKUP_FILE
gzip $BACKUP_FILE

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

#### **Schedule Backup**
```bash
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-database.sh
```

### **2. Application Backup**

```bash
#!/bin/bash
# /usr/local/bin/backup-application.sh

APP_DIR="/path/to/tito-hr"
BACKUP_DIR="/backups/application"
DATE=$(date +%Y%m%d_%H%M%S)

tar -czf "$BACKUP_DIR/tito-hr-app_$DATE.tar.gz" -C $APP_DIR .
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

---

## 📈 **Scaling and Performance**

### **1. Horizontal Scaling**

#### **Load Balancer Configuration**
```nginx
upstream tito_backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    location / {
        proxy_pass http://tito_backend;
    }
}
```

### **2. Database Optimization**

#### **Connection Pooling**
```javascript
// In your database config
const poolConfig = {
    max: 20,
    min: 5,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200
};
```

### **3. Redis Clustering**

For high availability, consider Redis Cluster or Redis Sentinel:

```bash
# Redis Sentinel configuration
# /etc/redis/sentinel.conf
port 26379
sentinel monitor mymaster 127.0.0.1 6379 2
sentinel down-after-milliseconds mymaster 30000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 180000
```

---

## 🔧 **Troubleshooting**

### **1. Common Issues**

#### **Application Won't Start**
```bash
# Check logs
pm2 logs tito-hr-server

# Check environment variables
pm2 env 0

# Restart application
pm2 restart tito-hr-server
```

#### **Database Connection Issues**
```bash
# Test database connection
psql -h localhost -U tito_user -d tito_hr -c "SELECT 1;"

# Check PostgreSQL status
sudo systemctl status postgresql
```

#### **Redis Connection Issues**
```bash
# Test Redis connection
redis-cli -a your_redis_password ping

# Check Redis status
sudo systemctl status redis-server
```

### **2. Performance Issues**

#### **High Memory Usage**
```bash
# Check memory usage
pm2 monit

# Restart if needed
pm2 restart tito-hr-server --max-memory-restart 1G
```

#### **Slow Database Queries**
```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();
```

---

## 🔧 **Maintenance**

### **1. Regular Maintenance Tasks**

#### **Weekly Tasks**
- Review application logs
- Check disk space usage
- Verify backup integrity
- Update security patches

#### **Monthly Tasks**
- Review performance metrics
- Update dependencies
- Security audit
- Database maintenance

### **2. Updates and Upgrades**

#### **Application Updates**
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Build application
npm run build

# Restart with PM2
pm2 restart tito-hr-server
```

#### **Database Migrations**
```bash
# Run migrations (if any)
npm run migrate

# Backup before major updates
/usr/local/bin/backup-database.sh
```

---

## 📞 **Support and Maintenance**

### **1. Monitoring Endpoints**

- **Health Check**: `GET /health`
- **API Information**: `GET /`
- **Redis Health**: `GET /api/v1/redis/health`

### **2. Log Locations**

- **Application Logs**: `server/logs/`
- **PM2 Logs**: `~/.pm2/logs/`
- **Nginx Logs**: `/var/log/nginx/`
- **System Logs**: `/var/log/syslog`

### **3. Emergency Procedures**

#### **Service Recovery**
```bash
# Restart all services
sudo systemctl restart postgresql
sudo systemctl restart redis-server
pm2 restart all
sudo systemctl restart nginx
```

#### **Database Recovery**
```bash
# Restore from backup
gunzip -c /backups/tito-hr/tito_hr_YYYYMMDD_HHMMSS.sql.gz | psql -h localhost -U tito_user -d tito_hr
```

---

**Last Updated**: September 4, 2025  
**Version**: 1.0.0  
**Compatibility**: Node.js 18+, PostgreSQL 13+, Redis 6+
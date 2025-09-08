# Frontend Production Deployment Guide

## 🚀 **Deployment Overview**

This guide provides comprehensive instructions for deploying the TITO HR Management System frontend to production environments.

## 📋 **Deployment Options**

### **1. Static Hosting (Recommended)**
- **Vercel** - Zero-config deployment with automatic builds
- **Netlify** - Git-based deployment with form handling
- **AWS S3 + CloudFront** - Scalable static hosting
- **GitHub Pages** - Free hosting for public repositories

### **2. Container Deployment**
- **Docker** - Containerized deployment
- **Kubernetes** - Orchestrated container deployment
- **Docker Compose** - Multi-container deployment

### **3. Traditional Web Server**
- **Nginx** - High-performance web server
- **Apache** - Traditional web server
- **IIS** - Windows web server

## 🏗️ **Build Configuration**

### **Production Build**
```bash
# Install dependencies
npm ci --only=production

# Build for production
npm run build

# Verify build
npm run preview
```

### **Environment Configuration**
```bash
# .env.production
VITE_API_URL=https://api.tito-hr.com
VITE_APP_NAME=TITO HR Management System
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
```

### **Build Optimization**
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
          ui: ['lucide-react'],
        },
      },
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
```

## 🌐 **Vercel Deployment**

### **Setup**
1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

### **Configuration**
```json
// vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "https://api.tito-hr.com"
  }
}
```

## 🐳 **Docker Deployment**

### **Dockerfile**
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### **Docker Compose**
```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=https://api.tito-hr.com
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
```

### **Nginx Configuration**
```nginx
# nginx.conf
server {
    listen 80;
    server_name tito-hr.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tito-hr.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

## ☁️ **AWS S3 + CloudFront**

### **S3 Setup**
```bash
# Create S3 bucket
aws s3 mb s3://tito-hr-frontend

# Upload build files
aws s3 sync dist/ s3://tito-hr-frontend --delete

# Set bucket policy
aws s3api put-bucket-policy --bucket tito-hr-frontend --policy file://bucket-policy.json
```

### **CloudFront Distribution**
```json
// cloudfront-config.json
{
  "CallerReference": "tito-hr-frontend-2025",
  "Comment": "TITO HR Frontend Distribution",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-tito-hr-frontend",
        "DomainName": "tito-hr-frontend.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-tito-hr-frontend",
    "ViewerProtocolPolicy": "redirect-to-https",
    "Compress": true,
    "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  }
}
```

## 🔒 **Security Configuration**

### **Content Security Policy**
```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.tito-hr.com;
  font-src 'self';
">
```

### **Security Headers**
```nginx
# nginx.conf
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.tito-hr.com;" always;
```

## 📊 **Performance Optimization**

### **Bundle Analysis**
```bash
# Install bundle analyzer
npm install -D rollup-plugin-visualizer

# Analyze bundle
npm run build
npx vite-bundle-analyzer dist
```

### **Lazy Loading**
```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';

const HRDashboard = lazy(() => import('./pages/hr/Dashboard'));
const EmployeeManagement = lazy(() => import('./pages/hr/EmployeeManagement'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/hr/dashboard" element={<HRDashboard />} />
        <Route path="/hr/employees" element={<EmployeeManagement />} />
      </Routes>
    </Suspense>
  );
}
```

### **Service Worker**
```typescript
// public/sw.js
const CACHE_NAME = 'tito-hr-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
```

## 📈 **Monitoring & Analytics**

### **Error Tracking**
```typescript
// src/utils/errorTracking.ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.VITE_ENVIRONMENT,
});

export const captureException = (error: Error) => {
  Sentry.captureException(error);
};
```

### **Performance Monitoring**
```typescript
// src/utils/performance.ts
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name} took ${end - start} milliseconds`);
};
```

## 🔄 **CI/CD Pipeline**

### **GitHub Actions**
```yaml
# .github/workflows/deploy.yml
name: Deploy Frontend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.API_URL }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./
```

## 🚀 **Deployment Checklist**

### **Pre-Deployment**
- [ ] Environment variables configured
- [ ] Build optimization enabled
- [ ] Security headers configured
- [ ] SSL certificate installed
- [ ] Domain DNS configured

### **Deployment**
- [ ] Build successful
- [ ] Static files uploaded
- [ ] CDN configured
- [ ] Cache policies set
- [ ] Error pages configured

### **Post-Deployment**
- [ ] Application accessible
- [ ] API connectivity verified
- [ ] Performance metrics monitored
- [ ] Error tracking active
- [ ] Backup procedures in place

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Build Failures**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### **Routing Issues**
```nginx
# nginx.conf - Handle client-side routing
location / {
    try_files $uri $uri/ /index.html;
}
```

#### **API Connection Issues**
```typescript
// Check environment variables
console.log('API URL:', import.meta.env.VITE_API_URL);

// Verify CORS configuration
// Check network requests in browser dev tools
```

---

**Last Updated**: January 2025  
**Deployment Version**: 1.0.0  
**Status**: Ready for Production

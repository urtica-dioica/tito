# TITO HR Management System

A comprehensive Human Resources Management System built with modern web technologies.

## 🏗️ Architecture

This project follows a monorepo structure with separate client and server applications:

```
tito/
├── client/          # React + TypeScript frontend
├── server/          # Node.js + Express backend
├── database/        # Database schemas and migrations
└── docs/           # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20.19+ or 22.12+
- PostgreSQL 14+
- Redis 6+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tito
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

4. **Database Setup**
   ```bash
   cd server
   npm run db:setup
   npm run db:seed
   ```

5. **Start the applications**
   ```bash
   # Start server (from server directory)
   npm run dev

   # Start client (from client directory)
   npm run dev
   ```

## 📁 Project Structure

### Client (`/client`)
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

### Server (`/server`)
- **Runtime**: Node.js + Express
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma
- **Authentication**: JWT tokens
- **Caching**: Redis
- **Validation**: Joi schemas
- **Testing**: Jest + Supertest

### Database (`/database`)
- **Schema**: PostgreSQL
- **Migrations**: Custom migration scripts
- **Seeding**: Development data seeding

## 🎯 Features

### HR Management
- Employee management (CRUD operations)
- Department management
- Payroll processing
- Request management
- System settings

### Department Head Features
- Department employee overview
- Employee performance statistics
- Request approval/rejection
- Payroll review

### Employee Features
- Personal dashboard
- Attendance tracking
- Request submission
- Leave management

### Authentication & Authorization
- Role-based access control (HR, Department Head, Employee)
- JWT token authentication
- Password setup via email invitation

## 🔧 Development

### Available Scripts

#### Server
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run db:setup     # Setup database
npm run db:seed      # Seed database with test data
```

#### Client
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Code formatting
- **Husky**: Git hooks for code quality

## 🧪 Testing

### Server Testing
```bash
cd server
npm run test         # Unit tests
npm run test:e2e     # End-to-end tests
npm run test:integration # Integration tests
```

### Client Testing
```bash
cd client
npm run test         # Component tests
npm run test:e2e     # End-to-end tests
```

## 📚 Documentation

- [System Architecture](server/docs/architecture/system-architecture.md)
- [API Reference](server/docs/api/api-reference.md)
- [Database Schema](server/docs/database/database-schema.md)
- [Development Setup](server/docs/development/development-setup.md)
- [Frontend Implementation](client/docs/guides/frontend-specification.md)

## 🚀 Deployment

### Production Build

1. **Build the applications**
   ```bash
   # Build server
   cd server
   npm run build

   # Build client
   cd ../client
   npm run build
   ```

2. **Environment Configuration**
   - Set production environment variables
   - Configure database connection
   - Set up Redis connection
   - Configure email service

3. **Deploy**
   - Deploy server to your hosting platform
   - Deploy client build to static hosting
   - Configure reverse proxy if needed

## 🔐 Security

- JWT token authentication
- Role-based authorization
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Rate limiting
- CORS configuration

## 📊 Monitoring

- Request logging
- Error tracking
- Performance monitoring
- Audit trails

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the development guides

## 🗺️ Roadmap

- [ ] Mobile application
- [ ] Advanced reporting
- [ ] Integration with external systems
- [ ] Multi-language support
- [ ] Advanced analytics dashboard

---

**TITO HR Management System** - Streamlining HR operations with modern technology.

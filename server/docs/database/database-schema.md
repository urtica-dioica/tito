# 🗄️ TITO HR Management System - Database Schema Reference

## 🎯 **Overview**

The TITO HR Management System uses PostgreSQL as its primary database. This document provides a comprehensive reference for the database schema, including tables, relationships, indexes, and constraints.

## 📋 **Table of Contents**

- [Database Information](#database-information)
- [Table Structure](#table-structure)
- [Relationships](#relationships)
- [Indexes](#indexes)
- [Data Types](#data-types)
- [Triggers and Functions](#triggers-and-functions)
- [Backup and Maintenance](#backup-and-maintenance)
- [Performance Considerations](#performance-considerations)

---

## 📊 **Database Information**

- **Database Engine**: PostgreSQL 13+
- **Character Set**: UTF-8
- **Collation**: en_US.UTF-8
- **Schema**: public (default)

---

## 🏗️ **Table Structure**

### **Core Tables**

#### **1. Users Table**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Stores user account information and authentication data.

**Key Fields**:
- `id`: Primary key, UUID with auto-generation
- `email`: Unique email address for login
- `password_hash`: Hashed password using bcrypt
- `role`: User role (hr, employee, department_head)
- `is_active`: Account status flag

**Indexes**:
- Primary key on `id`
- Unique index on `email`
- Index on `role` for role-based queries

#### **2. Departments Table**
```sql
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    department_head_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Stores organizational department information.

**Key Fields**:
- `id`: Primary key, UUID with auto-generation
- `name`: Department name (unique)
- `description`: Department description
- `department_head_user_id`: Foreign key to users table
- `is_active`: Department status flag

**Relationships**:
- One-to-many with users (department head)
- One-to-many with employees

#### **3. Employees Table**
```sql
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(20) UNIQUE NOT NULL CHECK (employee_id ~ '^EMP\d{6}$'),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    position VARCHAR(100) NOT NULL,
    employment_type employment_type_enum NOT NULL,
    hire_date DATE NOT NULL,
    base_salary DECIMAL(10,2) NOT NULL CHECK (base_salary >= 0),
    status employee_status_enum DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Stores employee-specific information linked to user accounts.

**Key Fields**:
- `id`: Primary key, UUID with auto-generation
- `user_id`: Foreign key to users table (one-to-one)
- `employee_id`: Unique employee identifier (format: EMP-YYYY-NNNNNNN)
- `department_id`: Foreign key to departments table
- `position`: Job position/title
- `employment_type`: Type of employment (regular, contractual, jo)
- `hire_date`: Date of employment
- `base_salary`: Base salary amount (must be >= 0)
- `status`: Employment status (active, inactive, terminated, on_leave)

**Relationships**:
- One-to-one with users
- Many-to-one with departments

### **Attendance Tables**

#### **4. Attendance Records Table**
```sql
CREATE TABLE attendance_records (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    clock_in_time TIMESTAMP,
    clock_out_time TIMESTAMP,
    total_hours DECIMAL(4,2),
    status VARCHAR(50) DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Stores daily attendance records for employees.

**Key Fields**:
- `id`: Primary key, auto-incrementing
- `employee_id`: Foreign key to employees table
- `clock_in_time`: Clock in timestamp
- `clock_out_time`: Clock out timestamp
- `total_hours`: Calculated total hours worked
- `status`: Attendance status (present, absent, late, etc.)

#### **5. Attendance Sessions Table**
```sql
CREATE TABLE attendance_sessions (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    session_date DATE NOT NULL,
    session_type VARCHAR(50) NOT NULL,
    session_time TIMESTAMP NOT NULL,
    qr_code_hash VARCHAR(255),
    selfie_image_path VARCHAR(500),
    location_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Stores individual attendance sessions (clock in/out events).

**Key Fields**:
- `id`: Primary key, auto-incrementing
- `employee_id`: Foreign key to employees table
- `session_date`: Date of the session
- `session_type`: Type of session (clock_in, clock_out)
- `session_time`: Timestamp of the session
- `qr_code_hash`: QR code hash used for verification
- `selfie_image_path`: Path to selfie image (if applicable)
- `location_data`: GPS location data in JSON format

### **Request Tables**

#### **6. Time Correction Requests Table**
```sql
CREATE TABLE time_correction_requests (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    request_date DATE NOT NULL,
    session_type VARCHAR(50) NOT NULL,
    original_time TIMESTAMP,
    requested_time TIMESTAMP NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Stores time correction requests from employees.

**Key Fields**:
- `id`: Primary key, auto-incrementing
- `employee_id`: Foreign key to employees table
- `request_date`: Date for which correction is requested
- `session_type`: Type of session to correct (clock_in, clock_out)
- `original_time`: Original recorded time
- `requested_time`: Requested corrected time
- `reason`: Reason for the correction request
- `status`: Request status (pending, approved, rejected)
- `approved_by`: Foreign key to users table (approver)
- `approved_at`: Timestamp of approval

#### **7. Overtime Requests Table**
```sql
CREATE TABLE overtime_requests (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    request_date DATE NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    requested_hours DECIMAL(4,2) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Stores overtime work requests from employees.

**Key Fields**:
- `id`: Primary key, auto-incrementing
- `employee_id`: Foreign key to employees table
- `request_date`: Date of overtime work
- `start_time`: Overtime start time
- `end_time`: Overtime end time
- `requested_hours`: Number of overtime hours requested
- `reason`: Reason for overtime request
- `status`: Request status (pending, approved, rejected)
- `approved_by`: Foreign key to users table (approver)
- `approved_at`: Timestamp of approval

#### **8. Leaves Table**
```sql
CREATE TABLE leaves (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    leave_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Stores leave requests from employees.

**Key Fields**:
- `id`: Primary key, auto-incrementing
- `employee_id`: Foreign key to employees table
- `leave_type`: Type of leave (vacation, sick, personal, etc.)
- `start_date`: Leave start date
- `end_date`: Leave end date
- `total_days`: Total number of leave days
- `reason`: Reason for leave request
- `status`: Request status (pending, approved, rejected)
- `approved_by`: Foreign key to users table (approver)
- `approved_at`: Timestamp of approval

#### **9. Leave Balances Table**
```sql
CREATE TABLE leave_balances (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    leave_type VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    total_days INTEGER NOT NULL DEFAULT 0,
    used_days INTEGER NOT NULL DEFAULT 0,
    remaining_days INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, leave_type, year)
);
```

**Purpose**: Stores leave balance information for employees.

**Key Fields**:
- `id`: Primary key, auto-incrementing
- `employee_id`: Foreign key to employees table
- `leave_type`: Type of leave
- `year`: Year for the balance
- `total_days`: Total allocated days
- `used_days`: Days already used
- `remaining_days`: Days remaining

### **Payroll Tables**

#### **10. Payroll Periods Table**
```sql
CREATE TABLE payroll_periods (
    id SERIAL PRIMARY KEY,
    period_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Stores payroll processing periods.

**Key Fields**:
- `id`: Primary key, auto-incrementing
- `period_name`: Name of the payroll period
- `start_date`: Period start date
- `end_date`: Period end date
- `status`: Period status (draft, processing, completed)
- `created_by`: Foreign key to users table (creator)

#### **11. Payroll Records Table**
```sql
CREATE TABLE payroll_records (
    id SERIAL PRIMARY KEY,
    payroll_period_id INTEGER NOT NULL REFERENCES payroll_periods(id),
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    gross_pay DECIMAL(10,2) NOT NULL DEFAULT 0,
    net_pay DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_deductions DECIMAL(10,2) NOT NULL DEFAULT 0,
    regular_hours DECIMAL(4,2) DEFAULT 0,
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft',
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Stores individual employee payroll records.

**Key Fields**:
- `id`: Primary key, auto-incrementing
- `payroll_period_id`: Foreign key to payroll_periods table
- `employee_id`: Foreign key to employees table
- `gross_pay`: Total gross pay amount
- `net_pay`: Net pay after deductions
- `total_deductions`: Total deduction amount
- `regular_hours`: Regular hours worked
- `overtime_hours`: Overtime hours worked
- `status`: Record status (draft, processed, paid)
- `paid_at`: Timestamp when payment was made

#### **12. Payroll Deductions Table**
```sql
CREATE TABLE payroll_deductions (
    id SERIAL PRIMARY KEY,
    payroll_record_id INTEGER NOT NULL REFERENCES payroll_records(id),
    deduction_type_id INTEGER NOT NULL REFERENCES deduction_types(id),
    amount DECIMAL(10,2) NOT NULL,
    percentage DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Stores individual deductions for payroll records.

**Key Fields**:
- `id`: Primary key, auto-incrementing
- `payroll_record_id`: Foreign key to payroll_records table
- `deduction_type_id`: Foreign key to deduction_types table
- `amount`: Deduction amount
- `percentage`: Deduction percentage (if applicable)

#### **13. Deduction Types Table**
```sql
CREATE TABLE deduction_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    percentage DECIMAL(5,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Stores types of payroll deductions.

**Key Fields**:
- `id`: Primary key, auto-incrementing
- `name`: Name of the deduction type
- `description`: Description of the deduction
- `percentage`: Default percentage (if applicable)
- `is_active`: Whether the deduction type is active

#### **14. Payroll Approvals Table**
```sql
CREATE TABLE payroll_approvals (
    id SERIAL PRIMARY KEY,
    payroll_record_id INTEGER NOT NULL REFERENCES payroll_records(id),
    approved_by INTEGER NOT NULL REFERENCES users(id),
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Stores payroll approval records.

**Key Fields**:
- `id`: Primary key, auto-incrementing
- `payroll_record_id`: Foreign key to payroll_records table
- `approved_by`: Foreign key to users table (approver)
- `approved_at`: Timestamp of approval
- `comments`: Approval comments

### **System Tables**

#### **15. System Settings Table**
```sql
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Stores system configuration settings.

**Key Fields**:
- `id`: Primary key, auto-incrementing
- `setting_key`: Unique setting identifier
- `setting_value`: Setting value
- `description`: Setting description

#### **16. ID Cards Table**
```sql
CREATE TABLE id_cards (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    card_number VARCHAR(50) UNIQUE NOT NULL,
    expiry_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Stores employee ID card information.

**Key Fields**:
- `id`: Primary key, auto-incrementing
- `employee_id`: Foreign key to employees table
- `card_number`: Unique card number
- `expiry_date`: Card expiration date
- `is_active`: Card status flag

---

## 🔗 **Relationships**

### **Primary Relationships**

1. **Users ↔ Employees**: One-to-one relationship
   - Each user can have one employee record
   - Each employee record belongs to one user

2. **Departments ↔ Employees**: One-to-many relationship
   - Each department can have multiple employees
   - Each employee belongs to one department

3. **Employees ↔ Attendance Records**: One-to-many relationship
   - Each employee can have multiple attendance records
   - Each attendance record belongs to one employee

4. **Employees ↔ Requests**: One-to-many relationships
   - Each employee can have multiple time correction requests
   - Each employee can have multiple overtime requests
   - Each employee can have multiple leave requests

5. **Payroll Periods ↔ Payroll Records**: One-to-many relationship
   - Each payroll period can have multiple payroll records
   - Each payroll record belongs to one payroll period

6. **Payroll Records ↔ Payroll Deductions**: One-to-many relationship
   - Each payroll record can have multiple deductions
   - Each deduction belongs to one payroll record

### **Foreign Key Constraints**

All foreign key relationships are enforced with appropriate constraints:

- **CASCADE DELETE**: When a user is deleted, their employee record is deleted
- **RESTRICT DELETE**: When a department is deleted, employees must be reassigned first
- **SET NULL**: When a department head is deleted, the department_head_user_id is set to NULL

---

## 📊 **Indexes**

### **Primary Indexes**
- All tables have primary key indexes on `id` columns (UUID)
- All foreign key columns have indexes for join performance

### **Unique Indexes**
- `users.email` - Unique email addresses
- `employees.user_id` - One employee per user
- `employees.employee_id` - Unique employee IDs (format: EMP######)
- `departments.name` - Unique department names
- `system_settings.setting_key` - Unique setting keys
- `id_cards.qr_code_hash` - Unique QR code hashes

### **Performance Indexes**
- `attendance_records.employee_id` - Employee attendance queries
- `attendance_records.created_at` - Date range queries
- `leaves.employee_id` - Employee leave queries
- `leaves.start_date` - Leave date queries
- `payroll_records.payroll_period_id` - Period-based queries
- `payroll_records.employee_id` - Employee payroll queries

---

## 📝 **Data Types**

### **Common Data Types**
- **UUID**: Universally unique identifiers with auto-generation
- **VARCHAR(n)**: Variable-length strings with length limits
- **TEXT**: Unlimited length text fields
- **BOOLEAN**: True/false values
- **DECIMAL(p,s)**: Fixed-point decimal numbers
- **DATE**: Date values (YYYY-MM-DD)
- **TIMESTAMP**: Date and time values
- **JSONB**: Binary JSON for structured data
- **ENUM**: Custom enumerated types for status values

### **Enum Types**
```sql
-- User roles
CREATE TYPE user_role AS ENUM ('hr', 'employee', 'department_head');

-- Employment types
CREATE TYPE employment_type AS ENUM ('regular', 'contractual', 'jo');

-- Attendance status
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'half_day');

-- Request status
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');

-- Payroll status
CREATE TYPE payroll_status AS ENUM ('draft', 'processing', 'completed', 'paid');
```

---

## ⚙️ **Triggers and Functions**

### **Automatic Timestamps**
```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### **Data Validation**
```sql
-- Function to validate email format
CREATE OR REPLACE FUNCTION validate_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Constraint to validate email format
ALTER TABLE users ADD CONSTRAINT valid_email 
    CHECK (validate_email(email));
```

---

## 💾 **Backup and Maintenance**

### **Backup Strategy**
```bash
# Full database backup
pg_dump -h localhost -U postgres -d tito_hr > backup_$(date +%Y%m%d).sql

# Schema-only backup
pg_dump -h localhost -U postgres -d tito_hr --schema-only > schema_backup.sql

# Data-only backup
pg_dump -h localhost -U postgres -d tito_hr --data-only > data_backup.sql
```

### **Maintenance Tasks**
```sql
-- Update table statistics
ANALYZE;

-- Reindex tables
REINDEX TABLE users;
REINDEX TABLE employees;

-- Vacuum tables
VACUUM ANALYZE;
```

---

## ⚡ **Performance Considerations**

### **Query Optimization**
- Use appropriate indexes for frequently queried columns
- Use EXPLAIN ANALYZE to analyze query performance
- Consider partitioning for large tables (attendance_records, payroll_records)
- Use connection pooling for better performance

### **Data Archiving**
- Archive old attendance records (older than 2 years)
- Archive completed payroll records (older than 7 years)
- Archive inactive user accounts
- Regular cleanup of temporary data

---

## 🛠️ **Database Management**

### **Setup Commands**
```bash
# Complete database setup (database + schema + seed)
npm run db:reset

# Individual commands:
npm run db:setup    # Create database and user only
npm run db:migrate  # Apply schema only
npm run db:seed     # Seed data only
```

### **Schema Source**
The database schema is defined in `database/schemas/main-schema.sql` and includes:
- **18 Tables**: Complete normalized schema
- **11 ENUM Types**: Custom enumerated types for status values
- **UUID Primary Keys**: All tables use UUID with auto-generation
- **Foreign Key Constraints**: Proper referential integrity
- **Indexes**: Optimized for query performance
- **System Settings**: Pre-configured system parameters

### **Schema Features**
- **UUID Primary Keys**: All tables use `gen_random_uuid()` for primary keys
- **ENUM Types**: Custom enumerated types for consistent status values
- **Check Constraints**: Data validation at database level
- **Cascade Deletes**: Proper cleanup of related records
- **Audit Trail**: Built-in audit logging system
- **System Settings**: Configurable system parameters
- **Business Logic Functions**: Automated calculations and workflows
- **Triggers**: Automatic data processing and validation
- **Department Management**: Specialized functions for department heads

### **Business Logic Functions**
The schema includes several important functions:

#### **Attendance Functions**
- `calculate_attendance_overall_status()`: Automatically calculates overall attendance status
- `convert_overtime_to_leave()`: Converts overtime hours to leave days

#### **Payroll Functions**
- `calculate_payroll()`: Automatically calculates payroll amounts
- `process_time_correction_approval()`: Handles time correction approvals
- `process_overtime_request_approval()`: Handles overtime request approvals

#### **Department Management Functions**
- `get_department_employees()`: Returns employees for a department head
- `get_department_head_department()`: Returns department info for a department head

#### **Utility Functions**
- `update_updated_at()`: Automatically updates timestamp fields
- `log_audit_event()`: Logs all database changes for audit trail

---

**Last Updated**: September 4, 2025  
**Database Version**: PostgreSQL 13+  
**Schema Version**: 1.0.0  
**Schema File**: `database/schemas/main-schema.sql`
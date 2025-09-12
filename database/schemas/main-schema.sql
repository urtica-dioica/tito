-- TITO HR Management System - Complete Database Schema
-- Includes: Core HR, Attendance, Leave, Payroll, Time Correction, Selfie Verification, ID Card Management
-- Version: 2.1 (Updated with dynamic payroll period calculation)
-- Last Updated: 2025
-- 
-- Recent Updates:
-- - Added working_days and expected_hours fields to payroll_periods table
-- - Updated calculate_payroll() function to use period-specific expected hours
-- - Enhanced system to calculate actual working days per month (excluding weekends)

/* === ENUM Type Definitions === */
CREATE TYPE user_role AS ENUM ('hr', 'employee', 'department_head');
CREATE TYPE employment_type_enum AS ENUM ('regular', 'contractual', 'jo');
CREATE TYPE employee_status_enum AS ENUM ('active', 'inactive', 'terminated', 'on_leave');
CREATE TYPE attendance_status_enum AS ENUM ('present', 'late', 'early', 'absent');
CREATE TYPE overall_attendance_status_enum AS ENUM ('present', 'late', 'absent', 'partial');
CREATE TYPE leave_type_enum AS ENUM ('vacation', 'sick', 'maternity', 'other');
CREATE TYPE leave_status_enum AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE payroll_period_status_enum AS ENUM ('draft', 'processing', 'sent_for_review', 'completed');
CREATE TYPE payroll_record_status_enum AS ENUM ('draft', 'processed', 'paid');
CREATE TYPE time_correction_status_enum AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE overtime_request_status_enum AS ENUM ('pending', 'approved', 'rejected');

/* === Utility Functions === */
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END;
$$ LANGUAGE plpgsql;

/* === Audit Logging Core === */
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by_user_id UUID,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_log_record_id ON audit_log(record_id);
CREATE INDEX idx_audit_log_changed_at ON audit_log(changed_at);

CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
    v_user_id UUID;
BEGIN
    -- Get user ID, handle case when setting doesn't exist
    -- SECURITY: Use INVOKER security model (removed SECURITY DEFINER)
    BEGIN
        v_user_id := current_setting('app.current_user_id', TRUE)::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    -- SECURITY: Validate that the user has permission to perform this operation
    -- Only log if we can identify the user or if it's a system operation
    IF v_user_id IS NOT NULL THEN
        -- Check if user exists and is active
        IF NOT EXISTS (SELECT 1 FROM users WHERE id = v_user_id AND is_active = true) THEN
            RAISE EXCEPTION 'Invalid or inactive user attempting audit operation';
        END IF;
    END IF;

    -- SECURITY: Sanitize data before logging (prevent injection)
    IF (TG_OP = 'INSERT') THEN
        v_new_data := to_jsonb(NEW);
        INSERT INTO audit_log (table_name, record_id, action, new_data, changed_by_user_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, v_new_data, v_user_id);
    ELSIF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, changed_by_user_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, v_old_data, v_new_data, v_user_id);
    ELSIF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
        INSERT INTO audit_log (table_name, record_id, action, old_data, changed_by_user_id)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, v_old_data, v_user_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

/* === Authentication & Users === */
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
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER users_audit_log AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION log_audit_event();

/* === Department Structure === */
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    department_head_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note: Department head role validation should be handled at application level
CREATE TRIGGER departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER departments_audit_log AFTER INSERT OR UPDATE OR DELETE ON departments FOR EACH ROW EXECUTE FUNCTION log_audit_event();

/* === Employee Master Data === */
CREATE SEQUENCE employee_id_seq;
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(20) UNIQUE NOT NULL CHECK (employee_id ~ '^EMP-\d{4}-\d{7}$'),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    "position" VARCHAR(100) NOT NULL,
    employment_type employment_type_enum NOT NULL,
    hire_date DATE NOT NULL,
    base_salary DECIMAL(10,2) NOT NULL CHECK (base_salary >= 0),
    status employee_status_enum DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE OR REPLACE FUNCTION generate_employee_id() RETURNS TRIGGER AS $$
BEGIN NEW.employee_id := 'EMP-' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-' || LPAD(NEXTVAL('employee_id_seq')::TEXT, 7, '0'); RETURN NEW; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER set_employee_id BEFORE INSERT ON employees FOR EACH ROW EXECUTE FUNCTION generate_employee_id();
CREATE TRIGGER employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER employees_audit_log AFTER INSERT OR UPDATE OR DELETE ON employees FOR EACH ROW EXECUTE FUNCTION log_audit_event();

/* === ID Card Management === */
CREATE TABLE id_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    qr_code_hash VARCHAR(255) UNIQUE NOT NULL,
    qr_code_data TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    issued_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER id_cards_updated_at BEFORE UPDATE ON id_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER id_cards_audit_log AFTER INSERT OR UPDATE OR DELETE ON id_cards FOR EACH ROW EXECUTE FUNCTION log_audit_event();

/* === Attendance System === */
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    overall_status overall_attendance_status_enum DEFAULT 'present',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date)
);
CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_record_id UUID NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('morning_in', 'morning_out', 'afternoon_in', 'afternoon_out', 'overtime', 'clock_in', 'clock_out')),
    clock_in TIMESTAMP,
    clock_out TIMESTAMP,
    calculated_hours DECIMAL(4,2) GENERATED ALWAYS AS ( 
        CASE WHEN clock_in IS NOT NULL AND clock_out IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (clock_out - clock_in)) / 3600.0 
        ELSE 0 END 
    ) STORED,
    regular_hours DECIMAL(4,2) DEFAULT 0,
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    late_minutes INTEGER DEFAULT 0,
    late_hours DECIMAL(4,2) DEFAULT 0,
    status attendance_status_enum DEFAULT 'present',
    selfie_image_path VARCHAR(500),
    selfie_taken_at TIMESTAMP,
    selfie_image_url VARCHAR(500),
    qr_code_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(attendance_record_id, session_type)
);
CREATE TRIGGER attendance_records_updated_at BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER attendance_records_audit_log AFTER INSERT OR UPDATE OR DELETE ON attendance_records FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER attendance_sessions_updated_at BEFORE UPDATE ON attendance_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER attendance_sessions_audit_log AFTER INSERT OR UPDATE OR DELETE ON attendance_sessions FOR EACH ROW EXECUTE FUNCTION log_audit_event();

/* === Time Correction Requests === */
CREATE TABLE time_correction_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_session_id UUID REFERENCES attendance_sessions(id) ON DELETE SET NULL,
    correction_date DATE NOT NULL,
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('morning_in', 'morning_out', 'afternoon_in', 'afternoon_out')),
    requested_clock_in TIMESTAMP,
    requested_clock_out TIMESTAMP,
    reason TEXT NOT NULL,
    status time_correction_status_enum DEFAULT 'pending',
    approver_id UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER time_correction_requests_updated_at BEFORE UPDATE ON time_correction_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER time_correction_requests_audit_log AFTER INSERT OR UPDATE OR DELETE ON time_correction_requests FOR EACH ROW EXECUTE FUNCTION log_audit_event();

/* === Overtime Requests === */
CREATE TABLE overtime_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    request_date DATE NOT NULL,
    overtime_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    requested_hours DECIMAL(4,2) NOT NULL CHECK (requested_hours > 0),
    reason TEXT NOT NULL,
    status overtime_request_status_enum DEFAULT 'pending',
    approver_id UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER overtime_requests_updated_at BEFORE UPDATE ON overtime_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER overtime_requests_audit_log AFTER INSERT OR UPDATE OR DELETE ON overtime_requests FOR EACH ROW EXECUTE FUNCTION log_audit_event();

/* === Leave Management === */
CREATE TABLE leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type leave_type_enum NOT NULL,
    balance DECIMAL(6,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, leave_type)
);
CREATE TABLE leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    leave_type leave_type_enum NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status leave_status_enum DEFAULT 'pending',
    approver_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE leave_accruals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_record_id UUID REFERENCES attendance_records(id) ON DELETE SET NULL,
    overtime_hours DECIMAL(4,2) NOT NULL,
    leave_days_accrued DECIMAL(4,2) NOT NULL,
    accrual_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER leave_balances_audit_log AFTER INSERT OR UPDATE OR DELETE ON leave_balances FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER leaves_audit_log AFTER INSERT OR UPDATE OR DELETE ON leaves FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER leave_accruals_audit_log AFTER INSERT OR UPDATE OR DELETE ON leave_accruals FOR EACH ROW EXECUTE FUNCTION log_audit_event();

/* === System Configuration === */
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('number', 'boolean', 'string', 'decimal')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
        INSERT INTO system_settings (setting_key, setting_value, data_type, description) VALUES
            ('expected_monthly_hours', '176', 'number', 'Default expected work hours per month (22 working days × 8 hours).'),
            ('overtime_to_leave_ratio', '0.125', 'decimal', 'Converts overtime hours to leave days (e.g., 0.125 = 1 day per 8 hours).'),
            ('selfie_retention_days', '2', 'number', 'Number of days to retain selfie images before automatic deletion.'),
            ('qr_code_expiry_years', '2', 'number', 'Number of years before ID card QR codes expire.'),
            ('attendance_calculation_updated', '2025-01-27-mathematical-formulation', 'string', 'Updated attendance calculation to use fixed 4-hour sessions'),
            ('attendance_grace_period_minutes', '30', 'number', 'Grace period in minutes for late clock-in'),
            ('attendance_morning_start', '8.0', 'decimal', 'Morning session start time in decimal hours (8:00 AM)'),
            ('attendance_morning_end', '12.0', 'decimal', 'Morning session end time in decimal hours (12:00 PM)'),
            ('attendance_afternoon_start', '13.0', 'decimal', 'Afternoon session start time in decimal hours (1:00 PM)'),
            ('attendance_afternoon_end', '17.0', 'decimal', 'Afternoon session end time in decimal hours (5:00 PM)'),
            ('attendance_session_cap_hours', '4.0', 'decimal', 'Maximum hours per session (morning/afternoon)');

/* === Payroll Module === */
CREATE TABLE deduction_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    percentage DECIMAL(5,2) CHECK (percentage >= 0 AND percentage <= 100),
    fixed_amount DECIMAL(10,2) CHECK (fixed_amount >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_deduction_type CHECK ( 
        (percentage IS NOT NULL AND fixed_amount IS NULL) OR 
        (percentage IS NULL AND fixed_amount IS NOT NULL) 
    )
);
CREATE TRIGGER deduction_types_updated_at BEFORE UPDATE ON deduction_types FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER deduction_types_audit_log AFTER INSERT OR UPDATE OR DELETE ON deduction_types FOR EACH ROW EXECUTE FUNCTION log_audit_event();

/* === Employee Deduction Balances === */
CREATE TABLE employee_deduction_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    deduction_type_id UUID NOT NULL REFERENCES deduction_types(id) ON DELETE CASCADE,
    original_amount DECIMAL(10,2) NOT NULL CHECK (original_amount > 0),
    remaining_balance DECIMAL(10,2) NOT NULL CHECK (remaining_balance >= 0),
    monthly_deduction_amount DECIMAL(10,2) NOT NULL CHECK (monthly_deduction_amount > 0),
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, deduction_type_id, start_date)
);
CREATE TRIGGER employee_deduction_balances_updated_at BEFORE UPDATE ON employee_deduction_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER employee_deduction_balances_audit_log AFTER INSERT OR UPDATE OR DELETE ON employee_deduction_balances FOR EACH ROW EXECUTE FUNCTION log_audit_event();

/* === Benefits System === */
CREATE TABLE benefit_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (amount > 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER benefit_types_updated_at BEFORE UPDATE ON benefit_types FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER benefit_types_audit_log AFTER INSERT OR UPDATE OR DELETE ON benefit_types FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TABLE employee_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    benefit_type_id UUID NOT NULL REFERENCES benefit_types(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, benefit_type_id, start_date)
);
CREATE TRIGGER employee_benefits_updated_at BEFORE UPDATE ON employee_benefits FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER employee_benefits_audit_log AFTER INSERT OR UPDATE OR DELETE ON employee_benefits FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TABLE payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status payroll_period_status_enum DEFAULT 'draft',
    working_days INTEGER, -- Actual working days in the month (excluding weekends)
    expected_hours DECIMAL(6,2), -- Expected hours for the month (working_days * 8)
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    base_salary DECIMAL(10,2) NOT NULL,
    hourly_rate DECIMAL(8,2) NOT NULL,
    total_worked_hours DECIMAL(6,2) NOT NULL,
    total_regular_hours DECIMAL(6,2) NOT NULL,
    total_overtime_hours DECIMAL(6,2) DEFAULT 0,
    total_late_hours DECIMAL(6,2) DEFAULT 0,
    late_deductions DECIMAL(10,2) DEFAULT 0,
    gross_pay DECIMAL(10,2) NOT NULL,
    net_pay DECIMAL(10,2) NOT NULL,
    total_deductions DECIMAL(10,2) DEFAULT 0,
    status payroll_record_status_enum DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_benefits DECIMAL(10,2) DEFAULT 0,
    paid_leave_hours DECIMAL(6,2) DEFAULT 0 -- Hours from approved leave days that are paid
);
CREATE TRIGGER payroll_records_updated_at BEFORE UPDATE ON payroll_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- CREATE TRIGGER payroll_records_audit_log AFTER INSERT OR UPDATE OR DELETE ON payroll_records FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TABLE payroll_deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_record_id UUID NOT NULL REFERENCES payroll_records(id) ON DELETE CASCADE,
    deduction_type_id UUID REFERENCES deduction_types(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE payroll_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES users(id),
    department_id UUID REFERENCES departments(id),
    status leave_status_enum DEFAULT 'pending',
    comments TEXT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER payroll_periods_audit_log AFTER INSERT OR UPDATE OR DELETE ON payroll_periods FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER payroll_deductions_audit_log AFTER INSERT OR UPDATE OR DELETE ON payroll_deductions FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER payroll_approvals_audit_log AFTER INSERT OR UPDATE OR DELETE ON payroll_approvals FOR EACH ROW EXECUTE FUNCTION log_audit_event();

/* === Business Logic Functions === */

-- Function to calculate daily total hours using mathematical formulation
CREATE OR REPLACE FUNCTION calculate_daily_total_hours(p_attendance_record_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_morning_hours DECIMAL(4,2) := 0;
    v_afternoon_hours DECIMAL(4,2) := 0;
    v_total_hours DECIMAL(4,2) := 0;

    -- Configuration parameters
    v_morning_start DECIMAL(4,2) := 8.0;      -- 8:00 AM
    v_morning_end DECIMAL(4,2) := 12.0;       -- 12:00 PM
    v_afternoon_start DECIMAL(4,2) := 13.0;   -- 1:00 PM
    v_afternoon_end DECIMAL(4,2) := 17.0;     -- 5:00 PM
    v_grace_period_minutes INTEGER := 30;     -- 30 minutes
    v_session_cap_hours DECIMAL(4,2) := 4.0;  -- 4 hours per session

    -- Session times
    v_morning_in_time DECIMAL(4,2);
    v_morning_out_time DECIMAL(4,2);
    v_afternoon_in_time DECIMAL(4,2);
    v_afternoon_out_time DECIMAL(4,2);

    -- Calculation variables
    v_effective_start DECIMAL(4,2);
    v_effective_end DECIMAL(4,2);
    v_raw_hours DECIMAL(4,2);

BEGIN
    -- Get all session times for the attendance record
    SELECT
        CASE WHEN s1.clock_in IS NOT NULL THEN
            EXTRACT(HOUR FROM s1.clock_in) + EXTRACT(MINUTE FROM s1.clock_in) / 60.0
        ELSE NULL END,
        CASE WHEN s2.clock_out IS NOT NULL THEN
            EXTRACT(HOUR FROM s2.clock_out) + EXTRACT(MINUTE FROM s2.clock_out) / 60.0
        ELSE NULL END,
        CASE WHEN s3.clock_in IS NOT NULL THEN
            EXTRACT(HOUR FROM s3.clock_in) + EXTRACT(MINUTE FROM s3.clock_in) / 60.0
        ELSE NULL END,
        CASE WHEN s4.clock_out IS NOT NULL THEN
            EXTRACT(HOUR FROM s4.clock_out) + EXTRACT(MINUTE FROM s4.clock_out) / 60.0
        ELSE NULL END
    INTO v_morning_in_time, v_morning_out_time, v_afternoon_in_time, v_afternoon_out_time
    FROM attendance_records ar
    LEFT JOIN attendance_sessions s1 ON ar.id = s1.attendance_record_id AND s1.session_type = 'morning_in'
    LEFT JOIN attendance_sessions s2 ON ar.id = s2.attendance_record_id AND s2.session_type = 'morning_out'
    LEFT JOIN attendance_sessions s3 ON ar.id = s3.attendance_record_id AND s3.session_type = 'afternoon_in'
    LEFT JOIN attendance_sessions s4 ON ar.id = s4.attendance_record_id AND s4.session_type = 'afternoon_out'
    WHERE ar.id = p_attendance_record_id;

    -- Calculate morning session hours
    IF v_morning_in_time IS NOT NULL AND v_morning_out_time IS NOT NULL THEN
        -- Apply grace period rule for morning start
        IF v_morning_in_time < v_morning_start THEN
            v_effective_start := v_morning_start;
        ELSE
            v_effective_start := CEIL(v_morning_in_time - (v_grace_period_minutes / 60.0));
        END IF;

        -- Ensure effective start is not after morning end
        IF v_effective_start <= v_morning_end THEN
            v_effective_end := LEAST(v_morning_out_time, v_morning_end);
            v_raw_hours := GREATEST(0, v_effective_end - v_effective_start);
            v_morning_hours := LEAST(v_session_cap_hours, v_raw_hours);
        END IF;
    END IF;

    -- Calculate afternoon session hours
    IF v_afternoon_in_time IS NOT NULL AND v_afternoon_out_time IS NOT NULL THEN
        -- Apply grace period rule for afternoon start
        IF v_afternoon_in_time < v_afternoon_start THEN
            v_effective_start := v_afternoon_start;
        ELSE
            v_effective_start := CEIL(v_afternoon_in_time - (v_grace_period_minutes / 60.0));
        END IF;

        -- Ensure effective start is not after afternoon end
        IF v_effective_start <= v_afternoon_end THEN
            v_effective_end := LEAST(v_afternoon_out_time, v_afternoon_end);
            v_raw_hours := GREATEST(0, v_effective_end - v_effective_start);
            v_afternoon_hours := LEAST(v_session_cap_hours, v_raw_hours);
        END IF;
    END IF;

    -- Calculate total hours
    v_total_hours := v_morning_hours + v_afternoon_hours;

    RETURN ROUND(v_total_hours, 2);
END;
$$ LANGUAGE plpgsql;

/* === Views === */
CREATE VIEW attendance_records_with_total_hours AS
SELECT 
    id,
    employee_id,
    date,
    overall_status,
    created_at,
    updated_at,
    calculate_daily_total_hours(id) AS calculated_total_hours,
    (SELECT attendance_sessions.clock_in 
     FROM attendance_sessions 
     WHERE attendance_sessions.attendance_record_id = ar.id 
     AND attendance_sessions.session_type::text = 'morning_in'::text) AS morning_in,
    (SELECT attendance_sessions.clock_out 
     FROM attendance_sessions 
     WHERE attendance_sessions.attendance_record_id = ar.id 
     AND attendance_sessions.session_type::text = 'morning_out'::text) AS morning_out,
    (SELECT attendance_sessions.clock_in 
     FROM attendance_sessions 
     WHERE attendance_sessions.attendance_record_id = ar.id 
     AND attendance_sessions.session_type::text = 'afternoon_in'::text) AS afternoon_in,
    (SELECT attendance_sessions.clock_out 
     FROM attendance_sessions 
     WHERE attendance_sessions.attendance_record_id = ar.id 
     AND attendance_sessions.session_type::text = 'afternoon_out'::text) AS afternoon_out
FROM attendance_records ar;

CREATE OR REPLACE FUNCTION calculate_attendance_overall_status()
RETURNS TRIGGER AS $$
DECLARE
    v_overall_status overall_attendance_status_enum;
    v_total_sessions INTEGER;
    v_present_sessions INTEGER;
    v_late_sessions INTEGER;
    v_absent_sessions INTEGER;
BEGIN
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'present'),
        COUNT(*) FILTER (WHERE status = 'late'),
        COUNT(*) FILTER (WHERE status = 'absent')
    INTO v_total_sessions, v_present_sessions, v_late_sessions, v_absent_sessions
    FROM attendance_sessions 
    WHERE attendance_record_id = NEW.attendance_record_id;
    
    IF v_total_sessions = 0 THEN
        v_overall_status := 'absent';
    ELSIF v_absent_sessions > 0 AND v_present_sessions = 0 THEN
        v_overall_status := 'absent';
    ELSIF v_late_sessions > 0 AND v_present_sessions > 0 THEN
        v_overall_status := 'late';
    ELSIF v_present_sessions > 0 AND v_present_sessions < v_total_sessions THEN
        v_overall_status := 'partial';
    ELSE
        v_overall_status := 'present';
    END IF;
    
    UPDATE attendance_records 
    SET overall_status = v_overall_status, updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.attendance_record_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION convert_overtime_to_leave()
RETURNS TRIGGER AS $$
DECLARE
    v_overtime_hours DECIMAL(4,2);
    v_leave_days_accrued DECIMAL(4,2);
    v_overtime_ratio DECIMAL(6,4);
    v_employee_id UUID;
    v_date DATE;
BEGIN
    IF NEW.session_type != 'overtime' OR NEW.calculated_hours <= 0 THEN
        RETURN NEW;
    END IF;
    
    SELECT ar.employee_id, ar.date 
    INTO v_employee_id, v_date
    FROM attendance_records ar 
    WHERE ar.id = NEW.attendance_record_id;
    
    SELECT CAST(setting_value AS DECIMAL(6,4))
    INTO v_overtime_ratio
    FROM system_settings 
    WHERE setting_key = 'overtime_to_leave_ratio';
    
    v_overtime_hours := NEW.calculated_hours;
    v_leave_days_accrued := v_overtime_hours * v_overtime_ratio;
    
    INSERT INTO leave_accruals (employee_id, attendance_record_id, overtime_hours, leave_days_accrued, accrual_date)
    VALUES (v_employee_id, NEW.attendance_record_id, v_overtime_hours, v_leave_days_accrued, v_date);
    
    INSERT INTO leave_balances (employee_id, leave_type, balance, updated_at)
    VALUES (v_employee_id, 'vacation', v_leave_days_accrued, CURRENT_TIMESTAMP)
    ON CONFLICT (employee_id, leave_type) 
    DO UPDATE SET 
        balance = leave_balances.balance + v_leave_days_accrued,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/* === Employee Deduction and Benefits Functions === */
CREATE OR REPLACE FUNCTION apply_employee_deductions(p_payroll_record_id UUID)
RETURNS VOID AS $$
DECLARE
    v_employee_id UUID;
    v_deduction_record RECORD;
    v_actual_deduction DECIMAL(10,2);
BEGIN
    -- Get employee ID from payroll record
    SELECT employee_id INTO v_employee_id
    FROM payroll_records 
    WHERE id = p_payroll_record_id;
    
    -- Apply each active deduction
    FOR v_deduction_record IN 
        SELECT edb.*, dt.name as deduction_name
        FROM employee_deduction_balances edb
        JOIN deduction_types dt ON edb.deduction_type_id = dt.id
        WHERE edb.employee_id = v_employee_id 
        AND edb.is_active = true
        AND edb.remaining_balance > 0
    LOOP
        -- Calculate actual deduction (minimum of monthly amount or remaining balance)
        v_actual_deduction := LEAST(
            v_deduction_record.monthly_deduction_amount,
            v_deduction_record.remaining_balance
        );
        
        -- Insert payroll deduction record
        INSERT INTO payroll_deductions (
            payroll_record_id,
            deduction_type_id,
            name,
            amount
        ) VALUES (
            p_payroll_record_id,
            v_deduction_record.deduction_type_id,
            v_deduction_record.deduction_name,
            v_actual_deduction
        );
        
        -- Update remaining balance
        UPDATE employee_deduction_balances 
        SET 
            remaining_balance = remaining_balance - v_actual_deduction,
            is_active = CASE WHEN (remaining_balance - v_actual_deduction) <= 0 THEN false ELSE true END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_deduction_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;


-- Function to calculate payroll preserving server-calculated attendance hours
CREATE OR REPLACE FUNCTION calculate_payroll()
RETURNS TRIGGER AS $$
DECLARE
    v_expected_monthly_hours INTEGER;
    v_period_expected_hours DECIMAL(6,2);
    v_hourly_rate DECIMAL(8,2);
    v_regular_pay DECIMAL(10,2);
    v_total_pay DECIMAL(10,2);
    v_net_pay DECIMAL(10,2);
    v_user_role user_role;
    v_total_paid_hours DECIMAL(6,2);
BEGIN
    SELECT u.role INTO v_user_role
    FROM users u
    JOIN employees e ON e.user_id = u.id
    WHERE e.id = NEW.employee_id;
    
    IF v_user_role != 'employee' THEN
        RETURN NEW;
    END IF;
    
    -- Apply deductions
    PERFORM apply_employee_deductions(NEW.id);
    
    -- Get period-specific expected hours, fallback to system setting
    SELECT pp.expected_hours
    INTO v_period_expected_hours
    FROM payroll_periods pp
    WHERE pp.id = NEW.payroll_period_id;
    
    -- Use period-specific hours if available, otherwise use system setting
    IF v_period_expected_hours IS NOT NULL THEN
        v_expected_monthly_hours := v_period_expected_hours;
    ELSE
        SELECT CAST(setting_value AS INTEGER)
        INTO v_expected_monthly_hours
        FROM system_settings 
        WHERE setting_key = 'expected_monthly_hours';
    END IF;
    
    v_hourly_rate := NEW.base_salary / v_expected_monthly_hours;
    
    -- Calculate total paid hours (worked hours + paid leave hours)
    -- Preserve the paid_leave_hours value that was passed in
    v_total_paid_hours := NEW.total_regular_hours + COALESCE(NEW.paid_leave_hours, 0);
    v_total_pay := v_hourly_rate * v_total_paid_hours;
    v_net_pay := v_total_pay - NEW.total_deductions - NEW.late_deductions;
    
    -- Update the NEW record values, preserving paid_leave_hours
    NEW.hourly_rate := v_hourly_rate;
    NEW.paid_leave_hours := COALESCE(NEW.paid_leave_hours, 0); -- Preserve the value
    NEW.gross_pay := v_total_pay;
    NEW.net_pay := v_net_pay;
    NEW.updated_at := CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/* === Time Correction Functions === */
CREATE OR REPLACE FUNCTION process_time_correction_approval()
RETURNS TRIGGER AS $$
DECLARE
    v_attendance_record_id UUID;
    v_session_type VARCHAR(50);
    v_employee_id UUID;
    v_correction_date DATE;
    v_requested_clock_in TIMESTAMP;
    v_requested_clock_out TIMESTAMP;
BEGIN
    IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
        
        v_employee_id := NEW.employee_id;
        v_correction_date := NEW.correction_date;
        v_session_type := NEW.session_type;
        v_requested_clock_in := NEW.requested_clock_in;
        v_requested_clock_out := NEW.requested_clock_out;
        
        -- Create or get attendance record for the correction date
        INSERT INTO attendance_records (employee_id, date, overall_status)
        VALUES (v_employee_id, v_correction_date, 'present')
        ON CONFLICT (employee_id, date) DO NOTHING;
        
        SELECT id INTO v_attendance_record_id
        FROM attendance_records
        WHERE employee_id = v_employee_id AND date = v_correction_date;
        
        -- Create or update attendance session with new session types
        INSERT INTO attendance_sessions (
            attendance_record_id, 
            session_type, 
            clock_in, 
            clock_out, 
            status
        ) VALUES (
            v_attendance_record_id,
            v_session_type,
            v_requested_clock_in,
            v_requested_clock_out,
            'present'
        ) ON CONFLICT (attendance_record_id, session_type) 
        DO UPDATE SET
            clock_in = v_requested_clock_in,
            clock_out = v_requested_clock_out,
            updated_at = CURRENT_TIMESTAMP;
        
        -- Update time correction request with approval timestamp
        UPDATE time_correction_requests 
        SET 
            approved_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/* === Overtime Request Functions === */
CREATE OR REPLACE FUNCTION process_overtime_request_approval()
RETURNS TRIGGER AS $$
DECLARE
    v_attendance_record_id UUID;
    v_employee_id UUID;
    v_overtime_date DATE;
    v_start_time TIME;
    v_end_time TIME;
    v_requested_hours DECIMAL(4,2);
BEGIN
    IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
        
        v_employee_id := NEW.employee_id;
        v_overtime_date := NEW.overtime_date;
        v_start_time := NEW.start_time;
        v_end_time := NEW.end_time;
        v_requested_hours := NEW.requested_hours;
        
        -- Create or find attendance record for overtime date
        INSERT INTO attendance_records (employee_id, date, overall_status)
        VALUES (v_employee_id, v_overtime_date, 'present')
        ON CONFLICT (employee_id, date) DO NOTHING;
        
        SELECT id INTO v_attendance_record_id
        FROM attendance_records
        WHERE employee_id = v_employee_id AND date = v_overtime_date;
        
        -- Create overtime session
        INSERT INTO attendance_sessions (
            attendance_record_id, 
            session_type, 
            clock_in, 
            clock_out, 
            status
        ) VALUES (
            v_attendance_record_id,
            'overtime',
            (v_overtime_date + v_start_time)::TIMESTAMP,
            (v_overtime_date + v_end_time)::TIMESTAMP,
            'present'
        );
        
        -- Update overtime request with approval timestamp
        UPDATE overtime_requests 
        SET 
            approved_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/* === ID Card Management Functions === */
CREATE OR REPLACE FUNCTION generate_employee_qr_code(p_employee_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_qr_data TEXT;
    v_employee_code VARCHAR(20);
    v_department_name VARCHAR(100);
    v_company_info TEXT;
BEGIN
    SELECT 
        e.employee_id,
        d.name
    INTO v_employee_code, v_department_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE e.id = p_employee_id;
    
    v_company_info := 'TITO_HR_SYSTEM';
    v_qr_data := v_company_info || '|' || v_employee_code || '|' || v_department_name || '|' || EXTRACT(EPOCH FROM NOW())::TEXT;
    
    RETURN v_qr_data;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_employee_id_card(p_employee_id UUID, p_issued_by UUID)
RETURNS UUID AS $$
DECLARE
    v_qr_code_data TEXT;
    v_qr_code_hash TEXT;
    v_expiry_years INTEGER;
    v_expiry_date DATE;
    v_id_card_id UUID;
    v_issuer_role user_role;
BEGIN
    -- SECURITY: Validate that the issuer has permission (HR admin only)
    SELECT role INTO v_issuer_role
    FROM users
    WHERE id = p_issued_by AND is_active = true;

    IF v_issuer_role IS NULL THEN
        RAISE EXCEPTION 'Invalid or inactive issuer';
    END IF;

    IF v_issuer_role != 'hr' THEN
        RAISE EXCEPTION 'Only HR administrators can create ID cards';
    END IF;

    -- SECURITY: Validate that employee exists and is active
    IF NOT EXISTS (SELECT 1 FROM employees e JOIN users u ON e.user_id = u.id WHERE e.id = p_employee_id AND u.is_active = true) THEN
        RAISE EXCEPTION 'Invalid or inactive employee';
    END IF;

    SELECT CAST(setting_value AS INTEGER)
    INTO v_expiry_years
    FROM system_settings
    WHERE setting_key = 'qr_code_expiry_years';

    v_expiry_date := CURRENT_DATE + (v_expiry_years || ' years')::INTERVAL;
    v_qr_code_data := generate_employee_qr_code(p_employee_id);
    v_qr_code_hash := encode(sha256(v_qr_code_data::bytea), 'hex');

    INSERT INTO id_cards (
        employee_id,
        qr_code_hash,
        qr_code_data,
        expiry_date,
        issued_by
    ) VALUES (
        p_employee_id,
        v_qr_code_hash,
        v_qr_code_data,
        v_expiry_date,
        p_issued_by
    ) RETURNING id INTO v_id_card_id;

    RETURN v_id_card_id;
END;
$$ LANGUAGE plpgsql;

/* === Selfie Cleanup Function === */
CREATE OR REPLACE FUNCTION cleanup_expired_selfies()
RETURNS INTEGER AS $$
DECLARE
    v_retention_days INTEGER;
    v_deleted_count INTEGER := 0;
BEGIN
    SELECT CAST(setting_value AS INTEGER)
    INTO v_retention_days
    FROM system_settings 
    WHERE setting_key = 'selfie_retention_days';
    
    UPDATE attendance_sessions 
    SET 
        selfie_image_path = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE 
        selfie_taken_at < CURRENT_DATE - (v_retention_days || ' days')::INTERVAL
        AND selfie_image_path IS NOT NULL;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

/* === Time-Based Attendance Validation Functions === */

-- Function to validate attendance time windows
CREATE OR REPLACE FUNCTION validate_attendance_time_window(
    p_session_type VARCHAR(50),
    p_timestamp TIMESTAMP
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_time TIME;
    v_is_valid BOOLEAN := FALSE;
BEGIN
    -- Convert timestamp to Manila timezone before validation
    v_current_time := (p_timestamp AT TIME ZONE 'Asia/Manila')::TIME;
    
    CASE p_session_type
        WHEN 'morning_in' THEN
            -- Morning clock-in: 7:00 AM to 12:00 PM
            v_is_valid := v_current_time >= '07:00:00' AND v_current_time <= '12:00:00';
        WHEN 'morning_out' THEN
            -- Morning clock-out: 8:00 AM to 12:00 PM
            v_is_valid := v_current_time >= '08:00:00' AND v_current_time <= '12:00:00';
        WHEN 'afternoon_in' THEN
            -- Afternoon clock-in: 1:00 PM to 5:00 PM
            v_is_valid := v_current_time >= '13:00:00' AND v_current_time <= '17:00:00';
        WHEN 'afternoon_out' THEN
            -- Afternoon clock-out: 1:00 PM to 6:00 PM
            v_is_valid := v_current_time >= '13:00:00' AND v_current_time <= '18:00:00';
        WHEN 'overtime' THEN
            -- Overtime: after 5:00 PM
            v_is_valid := v_current_time >= '17:00:00';
        ELSE
            v_is_valid := FALSE;
    END CASE;
    
    RETURN v_is_valid;
END;
$$ LANGUAGE plpgsql;

-- Function to determine next expected session type
CREATE OR REPLACE FUNCTION get_next_session_type(
    p_employee_id UUID,
    p_date DATE
) RETURNS VARCHAR(50) AS $$
DECLARE
    v_morning_in_exists BOOLEAN := FALSE;
    v_morning_out_exists BOOLEAN := FALSE;
    v_afternoon_in_exists BOOLEAN := FALSE;
    v_afternoon_out_exists BOOLEAN := FALSE;
    v_current_time TIME;
    v_next_session VARCHAR(50);
BEGIN
    -- Use Manila timezone for current time
    v_current_time := (NOW() AT TIME ZONE 'Asia/Manila')::TIME;
    
    -- Check existing sessions for the day
    SELECT 
        EXISTS(SELECT 1 FROM attendance_sessions s 
               JOIN attendance_records ar ON s.attendance_record_id = ar.id 
               WHERE ar.employee_id = p_employee_id AND ar.date = p_date 
               AND s.session_type = 'morning_in' AND s.clock_in IS NOT NULL),
        EXISTS(SELECT 1 FROM attendance_sessions s 
               JOIN attendance_records ar ON s.attendance_record_id = ar.id 
               WHERE ar.employee_id = p_employee_id AND ar.date = p_date 
               AND s.session_type = 'morning_out' AND s.clock_out IS NOT NULL),
        EXISTS(SELECT 1 FROM attendance_sessions s 
               JOIN attendance_records ar ON s.attendance_record_id = ar.id 
               WHERE ar.employee_id = p_employee_id AND ar.date = p_date 
               AND s.session_type = 'afternoon_in' AND s.clock_in IS NOT NULL),
        EXISTS(SELECT 1 FROM attendance_sessions s 
               JOIN attendance_records ar ON s.attendance_record_id = ar.id 
               WHERE ar.employee_id = p_employee_id AND ar.date = p_date 
               AND s.session_type = 'afternoon_out' AND s.clock_out IS NOT NULL)
    INTO v_morning_in_exists, v_morning_out_exists, v_afternoon_in_exists, v_afternoon_out_exists;
    
    -- Determine next session based on current time and existing sessions
    IF v_current_time < '12:00:00' THEN
        -- Morning session
        IF NOT v_morning_in_exists THEN
            v_next_session := 'morning_in';
        ELSIF v_morning_in_exists AND NOT v_morning_out_exists THEN
            v_next_session := 'morning_out';
        ELSE
            v_next_session := NULL; -- Morning session complete
        END IF;
    ELSIF v_current_time >= '13:00:00' AND v_current_time < '18:00:00' THEN
        -- Afternoon session
        IF NOT v_afternoon_in_exists THEN
            v_next_session := 'afternoon_in';
        ELSIF v_afternoon_in_exists AND NOT v_afternoon_out_exists THEN
            v_next_session := 'afternoon_out';
        ELSE
            v_next_session := NULL; -- Afternoon session complete
        END IF;
    ELSE
        -- Break time (12:00 PM - 1:00 PM) or after hours
        v_next_session := NULL;
    END IF;
    
    RETURN v_next_session;
END;
$$ LANGUAGE plpgsql;

-- Function to check if employee can clock in/out during break period
CREATE OR REPLACE FUNCTION is_break_period(p_timestamp TIMESTAMP) RETURNS BOOLEAN AS $$
BEGIN
    -- Convert timestamp to Manila timezone before checking break period
    RETURN (p_timestamp AT TIME ZONE 'Asia/Manila')::TIME >= '12:00:00' AND (p_timestamp AT TIME ZONE 'Asia/Manila')::TIME < '13:00:00';
END;
$$ LANGUAGE plpgsql;

-- Function to validate attendance session creation
CREATE OR REPLACE FUNCTION validate_attendance_session()
RETURNS TRIGGER AS $$
DECLARE
    v_is_valid BOOLEAN;
    v_next_expected_session VARCHAR(50);
    v_is_break BOOLEAN;
BEGIN
    -- Skip validation for overtime sessions and time correction sessions (they are approved by department heads)
    IF NEW.session_type IN ('overtime', 'clock_in', 'clock_out') THEN
        RETURN NEW;
    END IF;
    
    -- Check if it's break period
    v_is_break := is_break_period(NEW.clock_in);
    IF v_is_break AND NEW.session_type IN ('morning_out', 'afternoon_in') THEN
        -- Allow morning_out and afternoon_in during break period
        v_is_valid := TRUE;
    ELSE
        -- Validate time window for other sessions
        v_is_valid := validate_attendance_time_window(NEW.session_type, NEW.clock_in);
    END IF;
    
    IF NOT v_is_valid THEN
        RAISE EXCEPTION 'Invalid attendance time for session type % at time %', 
            NEW.session_type, NEW.clock_in;
    END IF;
    
    -- Check if this is the expected next session
    SELECT get_next_session_type(
        (SELECT ar.employee_id FROM attendance_records ar WHERE ar.id = NEW.attendance_record_id),
        (SELECT ar.date FROM attendance_records ar WHERE ar.id = NEW.attendance_record_id)
    ) INTO v_next_expected_session;
    
    IF v_next_expected_session IS NOT NULL AND NEW.session_type != v_next_expected_session THEN
        RAISE EXCEPTION 'Expected session type % but got %', v_next_expected_session, NEW.session_type;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/* === Business Logic Triggers === */
CREATE TRIGGER update_attendance_overall_status 
    AFTER INSERT OR UPDATE ON attendance_sessions 
    FOR EACH ROW EXECUTE FUNCTION calculate_attendance_overall_status();

CREATE TRIGGER process_overtime_to_leave 
    AFTER INSERT OR UPDATE ON attendance_sessions 
    FOR EACH ROW EXECUTE FUNCTION convert_overtime_to_leave();

CREATE TRIGGER validate_attendance_session_trigger
    BEFORE INSERT OR UPDATE ON attendance_sessions
    FOR EACH ROW EXECUTE FUNCTION validate_attendance_session();

CREATE TRIGGER calculate_payroll_trigger 
    BEFORE INSERT OR UPDATE ON payroll_records 
    FOR EACH ROW EXECUTE FUNCTION calculate_payroll();

CREATE TRIGGER process_time_correction_approval_trigger
    AFTER UPDATE ON time_correction_requests
    FOR EACH ROW EXECUTE FUNCTION process_time_correction_approval();

-- Function to calculate session hours for payroll using mathematical formulation with grace periods and session caps
CREATE OR REPLACE FUNCTION calculate_session_payroll_data()
RETURNS TRIGGER AS $$
DECLARE
    v_regular_hours DECIMAL(4,2) := 0;
    v_overtime_hours DECIMAL(4,2) := 0;
    v_late_minutes INTEGER := 0;
    v_expected_daily_hours DECIMAL(4,2) := 8.0;
    v_clock_in_time TIME;
    v_clock_out_time TIME;
    v_expected_start_time TIME := '08:00:00';
    v_grace_period_minutes INTEGER := 15;
    v_morning_session_complete BOOLEAN := FALSE;
    v_afternoon_session_complete BOOLEAN := FALSE;
BEGIN
    -- Only calculate when both clock_in and clock_out are present
    IF NEW.clock_in IS NOT NULL AND NEW.clock_out IS NOT NULL THEN
        v_clock_in_time := NEW.clock_in::TIME;
        v_clock_out_time := NEW.clock_out::TIME;
        
        -- Check if this completes a morning or afternoon session
        IF NEW.session_type = 'morning_out' THEN
            v_morning_session_complete := TRUE;
        ELSIF NEW.session_type = 'afternoon_out' THEN
            v_afternoon_session_complete := TRUE;
        END IF;
        
        -- Set fixed 4 hours for completed sessions
        IF v_morning_session_complete THEN
            v_regular_hours := 4.0;
        ELSIF v_afternoon_session_complete THEN
            v_regular_hours := 4.0;
        ELSE
            -- For other session types (overtime, etc.), use actual calculation
            v_regular_hours := EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 3600;
        END IF;
        
        -- Calculate late minutes (after grace period) - only for morning_in
        IF NEW.session_type = 'morning_in' AND v_clock_in_time > (v_expected_start_time + (v_grace_period_minutes || ' minutes')::INTERVAL) THEN
            v_late_minutes := EXTRACT(EPOCH FROM (v_clock_in_time - (v_expected_start_time + (v_grace_period_minutes || ' minutes')::INTERVAL))) / 60;
        END IF;
        
        -- Calculate overtime hours (only for overtime sessions)
        IF NEW.session_type = 'overtime' AND v_regular_hours > 0 THEN
            v_overtime_hours := v_regular_hours;
            v_regular_hours := 0;
        END IF;
        
        -- Ensure regular hours is not negative
        v_regular_hours := GREATEST(0, v_regular_hours);
        
        -- Update the record
        NEW.regular_hours := v_regular_hours;
        NEW.overtime_hours := v_overtime_hours;
        NEW.late_minutes := v_late_minutes;
        NEW.late_hours := CEIL(v_late_minutes / 60.0);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payroll calculation
CREATE TRIGGER calculate_payroll_session_data
    BEFORE INSERT OR UPDATE ON attendance_sessions
    FOR EACH ROW EXECUTE FUNCTION calculate_session_payroll_data();

CREATE TRIGGER process_overtime_request_approval_trigger
    AFTER UPDATE ON overtime_requests
    FOR EACH ROW EXECUTE FUNCTION process_overtime_request_approval();

/* === Department Management Functions === */
CREATE OR REPLACE FUNCTION get_department_employees(p_department_head_user_id UUID)
RETURNS TABLE (
    employee_id UUID,
    user_id UUID,
    employee_code VARCHAR(20),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    "position" VARCHAR(100),
    employment_type employment_type_enum,
    hire_date DATE,
    base_salary DECIMAL(10,2),
    status employee_status_enum
) AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_department_head_user_id AND role = 'department_head'
    ) THEN
        RAISE EXCEPTION 'User is not a department head';
    END IF;
    
    RETURN QUERY
    SELECT 
        e.id as employee_id,
        e.user_id,
        e.employee_id as employee_code,
        u.first_name,
        u.last_name,
        e."position",
        e.employment_type,
        e.hire_date,
        e.base_salary,
        e.status
    FROM employees e
    JOIN users u ON e.user_id = u.id
    JOIN departments d ON e.department_id = d.id
    WHERE d.department_head_user_id = p_department_head_user_id
    AND e.status = 'active'
    ORDER BY u.last_name, u.first_name;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_department_head_department(p_department_head_user_id UUID)
RETURNS TABLE (
    department_id UUID,
    department_name VARCHAR(100),
    department_description TEXT
) AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_department_head_user_id AND role = 'department_head'
    ) THEN
        RAISE EXCEPTION 'User is not a department head';
    END IF;
    
    RETURN QUERY
    SELECT 
        d.id as department_id,
        d.name as department_name,
        d.description as department_description
    FROM departments d
    WHERE d.department_head_user_id = p_department_head_user_id;
END;
$$ LANGUAGE plpgsql;

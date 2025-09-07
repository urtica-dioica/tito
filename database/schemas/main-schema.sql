-- TITO HR Management System - Complete Database Schema
-- Includes: Core HR, Attendance, Leave, Payroll, Time Correction, Selfie Verification, ID Card Management
-- Version: 2.0 (Complete with all features)
-- Last Updated: 2025

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
BEGIN
    IF (TG_OP = 'INSERT') THEN
        v_new_data := to_jsonb(NEW);
        INSERT INTO audit_log (table_name, record_id, action, new_data, changed_by_user_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, v_new_data, current_setting('app.current_user_id', TRUE)::UUID);
    ELSIF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, changed_by_user_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, v_old_data, v_new_data, current_setting('app.current_user_id', TRUE)::UUID);
    ELSIF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
        INSERT INTO audit_log (table_name, record_id, action, old_data, changed_by_user_id)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, v_old_data, current_setting('app.current_user_id', TRUE)::UUID);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    session_type VARCHAR(50) NOT NULL,
    clock_in TIMESTAMP,
    clock_out TIMESTAMP,
    calculated_hours DECIMAL(4,2) GENERATED ALWAYS AS ( 
        CASE WHEN clock_in IS NOT NULL AND clock_out IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (clock_out - clock_in)) / 3600.0 
        ELSE 0 END 
    ) STORED,
    late_hours DECIMAL(4,2) DEFAULT 0,
    status attendance_status_enum DEFAULT 'present',
    selfie_image_path VARCHAR(500),
    selfie_taken_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER attendance_records_updated_at BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER attendance_records_audit_log AFTER INSERT OR UPDATE OR DELETE ON attendance_records FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER attendance_sessions_audit_log AFTER INSERT OR UPDATE OR DELETE ON attendance_sessions FOR EACH ROW EXECUTE FUNCTION log_audit_event();

/* === Time Correction Requests === */
CREATE TABLE time_correction_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_session_id UUID REFERENCES attendance_sessions(id) ON DELETE SET NULL,
    correction_date DATE NOT NULL,
    session_type VARCHAR(50) NOT NULL,
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
            ('qr_code_expiry_years', '2', 'number', 'Number of years before ID card QR codes expire.');

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

CREATE TABLE payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status payroll_period_status_enum DEFAULT 'draft',
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER payroll_records_updated_at BEFORE UPDATE ON payroll_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER payroll_records_audit_log AFTER INSERT OR UPDATE OR DELETE ON payroll_records FOR EACH ROW EXECUTE FUNCTION log_audit_event();

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

CREATE OR REPLACE FUNCTION calculate_payroll()
RETURNS TRIGGER AS $$
DECLARE
    v_expected_monthly_hours INTEGER;
    v_hourly_rate DECIMAL(8,2);
    v_regular_pay DECIMAL(10,2);
    v_total_pay DECIMAL(10,2);
    v_net_pay DECIMAL(10,2);
    v_user_role user_role;
BEGIN
    SELECT u.role INTO v_user_role
    FROM users u
    JOIN employees e ON e.user_id = u.id
    WHERE e.id = NEW.employee_id;
    
    IF v_user_role != 'employee' THEN
        RETURN NEW;
    END IF;
    
    SELECT CAST(setting_value AS INTEGER)
    INTO v_expected_monthly_hours
    FROM system_settings 
    WHERE setting_key = 'expected_monthly_hours';
    
    v_hourly_rate := NEW.base_salary / v_expected_monthly_hours;
    v_regular_pay := v_hourly_rate * NEW.total_regular_hours;
    v_total_pay := v_regular_pay;
    v_net_pay := v_total_pay - NEW.total_deductions - NEW.late_deductions;
    
    UPDATE payroll_records 
    SET 
        hourly_rate = v_hourly_rate,
        gross_pay = v_total_pay,
        net_pay = v_net_pay,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
    
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
BEGIN
    IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
        
        v_employee_id := NEW.employee_id;
        v_correction_date := NEW.correction_date;
        v_session_type := NEW.session_type;
        
        INSERT INTO attendance_records (employee_id, date, overall_status)
        VALUES (v_employee_id, v_correction_date, 'present')
        ON CONFLICT (employee_id, date) DO NOTHING;
        
        SELECT id INTO v_attendance_record_id
        FROM attendance_records
        WHERE employee_id = v_employee_id AND date = v_correction_date;
        
        INSERT INTO attendance_sessions (
            attendance_record_id, 
            session_type, 
            clock_in, 
            clock_out, 
            status
        ) VALUES (
            v_attendance_record_id,
            v_session_type,
            NEW.requested_clock_in,
            NEW.requested_clock_out,
            'present'
        ) ON CONFLICT (attendance_record_id, session_type) 
        DO UPDATE SET
            clock_in = NEW.requested_clock_in,
            clock_out = NEW.requested_clock_out,
            updated_at = CURRENT_TIMESTAMP;
        
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_employee_id_card(p_employee_id UUID, p_issued_by UUID)
RETURNS UUID AS $$
DECLARE
    v_qr_code_data TEXT;
    v_qr_code_hash TEXT;
    v_expiry_years INTEGER;
    v_expiry_date DATE;
    v_id_card_id UUID;
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

/* === Business Logic Triggers === */
CREATE TRIGGER update_attendance_overall_status 
    AFTER INSERT OR UPDATE ON attendance_sessions 
    FOR EACH ROW EXECUTE FUNCTION calculate_attendance_overall_status();

CREATE TRIGGER process_overtime_to_leave 
    AFTER INSERT OR UPDATE ON attendance_sessions 
    FOR EACH ROW EXECUTE FUNCTION convert_overtime_to_leave();

CREATE TRIGGER calculate_payroll_trigger 
    AFTER INSERT OR UPDATE ON payroll_records 
    FOR EACH ROW EXECUTE FUNCTION calculate_payroll();

CREATE TRIGGER process_time_correction_approval_trigger
    AFTER UPDATE ON time_correction_requests
    FOR EACH ROW EXECUTE FUNCTION process_time_correction_approval();

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

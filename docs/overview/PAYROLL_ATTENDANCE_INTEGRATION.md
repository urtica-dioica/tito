# Payroll Attendance Integration

## Overview

The payroll process uses the **mathematical formulation** for all attendance hours calculations, providing consistent and accurate payroll calculations based on the same precise logic used throughout the attendance system.

## Integration Status

### ✅ **Unified Calculation Method**

The `PayrollService` uses **only** the mathematical formulation:

1. **Single Method**: `calculateAttendanceHours()`
   - Uses the `AttendanceHoursCalculator` utility
   - Implements grace periods, session caps, and proper calculations
   - Provides detailed logging for debugging
   - **No legacy methods or fallbacks**

2. **Configuration**: System settings in database
   - All parameters stored in `system_settings` table
   - No environment variable switching
   - Consistent across all components

## Mathematical Formulation in Payroll

### **Grace Period Rules**
- 30-minute grace period for late clock-ins
- Effective start time calculated using ceiling function
- Applied to both morning and afternoon sessions

### **Session Caps**
- Morning session: Maximum 4 hours
- Afternoon session: Maximum 4 hours
- Total daily maximum: 8 hours

### **Calculation Logic**
```typescript
// Example: Employee clocks in at 8:31 AM, clocks out at 6:00 PM
// Morning: 3 hours (9:00 AM to 12:00 PM, after grace period)
// Afternoon: 4 hours (1:00 PM to 5:00 PM, capped at 4 hours)
// Total: 7 hours
```

## Configuration

### **System Settings** (Database)

The database stores these parameters in the `system_settings` table:
- `attendance_morning_start`: 8.0 (8:00 AM)
- `attendance_morning_end`: 12.0 (12:00 PM)
- `attendance_afternoon_start`: 13.0 (1:00 PM)
- `attendance_afternoon_end`: 17.0 (5:00 PM)
- `attendance_grace_period_minutes`: 30
- `attendance_session_cap_hours`: 4.0

## Payroll Calculation Flow

### **1. Employee Payroll Calculation**
```typescript
async calculateEmployeePayroll(employeeId: string, payrollPeriodId: string)
```

**Process:**
1. Get payroll period dates
2. Calculate expected working days (actual working days per month)
3. **Use mathematical formulation for attendance hours**
4. Get approved leave hours
5. Calculate gross pay, deductions, and net pay

### **2. Attendance Hours Calculation**
```typescript
// Single method - mathematical formulation only
calculateAttendanceHours(employeeId, startDate, endDate)
```

**Features:**
- Uses `defaultHoursCalculator.calculateFromSessions()`
- Processes each attendance record individually
- Applies grace periods and session caps
- Logs detailed calculation breakdown

### **3. Detailed Logging**
The system logs:
- Individual day calculations with morning/afternoon breakdown
- Effective start times after grace period application
- Total hours calculated per day
- Monthly totals for payroll

## Benefits

### **1. Consistency**
- Same calculation logic across attendance and payroll
- Eliminates discrepancies between systems
- Unified mathematical formulation

### **2. Accuracy**
- Proper grace period handling
- Session caps prevent over-calculation
- Precise time calculations
- Monthly working days calculated dynamically

### **3. Transparency**
- Detailed logging of calculations
- Easy debugging and verification
- Clear audit trail

### **4. Reliability**
- Single calculation method
- No configuration switching
- Consistent results every time

## Monthly Working Days Handling

### **Dynamic Calculation**
The system calculates actual working days per month:

```typescript
// Examples from database:
December 2025: 23 working days = 184 hours (23 × 8)
November 2025: 20 working days = 160 hours (20 × 8)  
October 2025:  23 working days = 184 hours (23 × 8)
September 2025: 22 working days = 176 hours (22 × 8)
August 2025:   21 working days = 168 hours (21 × 8)
```

### **Payroll Impact**
- **Hourly Rate**: `baseSalary / actualExpectedHours`
- **Gross Pay**: `(totalPaidHours / actualExpectedHours) × baseSalary`
- **Fair Compensation**: Proportional to actual month structure

## Testing

### **Manual Testing**
```bash
# Test payroll calculation
npm run dev
# Process payroll for a period
# Check detailed logs for calculation breakdown
```

### **Database Validation**
```sql
-- Check calculated hours
SELECT 
    employee_id,
    date,
    calculate_daily_total_hours(id) as calculated_hours
FROM attendance_records 
WHERE date >= '2025-01-01';

-- Verify payroll records
SELECT 
    employee_id,
    total_worked_hours,
    total_regular_hours,
    hourly_rate,
    gross_pay
FROM payroll_records 
WHERE payroll_period_id = 'period-id';
```

## Monitoring

### **Log Analysis**
Look for these log entries:
```
Payroll hours calculation: {
  employeeId: "...",
  date: "2025-01-27",
  morningHours: 3,
  afternoonHours: 4,
  totalHours: 7,
  effectiveMorningStart: 9.0,
  effectiveAfternoonStart: 13.0
}

Gross pay calculation debug: {
  employeeId: "...",
  totalWorkedHours: 150,
  paidLeaveHours: 8,
  totalPaidHours: 158,
  expectedHours: 176,
  baseSalary: 20000,
  grossPay: 17954.55
}
```

### **Key Metrics**
- Total hours calculated per employee
- Monthly working days accuracy
- Payroll calculation consistency
- Performance impact

## Troubleshooting

### **Common Issues**

1. **Calculation Discrepancies**
   - Check system settings in database
   - Verify session times configuration
   - Review grace period application

2. **Performance Issues**
   - Monitor calculation time
   - Check database query performance
   - Consider caching for large datasets

3. **Configuration Problems**
   - Verify system settings in database
   - Ensure consistent parameters
   - Check payroll period working days

### **Debug Commands**
```bash
# View system settings
psql -d your_database -c "SELECT * FROM system_settings WHERE setting_key LIKE 'attendance_%';"

# Check payroll periods
psql -d your_database -c "SELECT period_name, working_days, expected_hours FROM payroll_periods ORDER BY start_date DESC;"

# Test calculation for specific employee
psql -d your_database -c "SELECT calculate_daily_total_hours('attendance-record-id');"
```

## Conclusion

The payroll system uses the **mathematical formulation exclusively**, ensuring consistent and accurate calculations. The implementation includes:

- ✅ **Single calculation method** (mathematical formulation only)
- ✅ **Dynamic monthly working days** calculation
- ✅ **Detailed logging and monitoring**
- ✅ **Database backup calculations**
- ✅ **Comprehensive testing framework**
- ✅ **No legacy code or fallbacks**

This provides a robust, reliable payroll calculation system that accurately reflects employee attendance using the precise mathematical formulation with proper monthly working days handling. 🎯
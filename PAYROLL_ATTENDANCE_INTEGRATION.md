# Payroll Attendance Integration

## Overview

The payroll process now uses the new mathematical formulation for attendance hours calculation, providing consistent and accurate payroll calculations based on the same logic used throughout the attendance system.

## Integration Status

### ✅ **Updated Payroll Service**

The `PayrollService` has been updated to use the new mathematical formulation:

1. **New Method**: `calculateAttendanceHoursWithNewFormula()`
   - Uses the `AttendanceHoursCalculator` utility
   - Implements grace periods, session caps, and proper calculations
   - Provides detailed logging for debugging

2. **Legacy Method**: `calculateAttendanceHoursLegacy()`
   - Maintains the old fixed 4-hour approach
   - Available as fallback option
   - Preserves existing behavior if needed

3. **Configuration**: Environment variable control
   - `USE_NEW_ATTENDANCE_CALCULATION=true` (default)
   - `USE_NEW_ATTENDANCE_CALCULATION=false` (legacy mode)

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

### **Environment Variables**

```bash
# Enable/disable new calculation method
USE_NEW_ATTENDANCE_CALCULATION=true  # Default: true

# Mathematical formulation parameters
ATTENDANCE_MORNING_START=8.0
ATTENDANCE_MORNING_END=12.0
ATTENDANCE_AFTERNOON_START=13.0
ATTENDANCE_AFTERNOON_END=17.0
ATTENDANCE_GRACE_PERIOD_MINUTES=30
ATTENDANCE_SESSION_CAP_HOURS=4.0
```

### **System Settings**

The database also stores these parameters in the `system_settings` table:
- `attendance_morning_start`
- `attendance_morning_end`
- `attendance_afternoon_start`
- `attendance_afternoon_end`
- `attendance_grace_period_minutes`
- `attendance_session_cap_hours`

## Payroll Calculation Flow

### **1. Employee Payroll Calculation**
```typescript
async calculateEmployeePayroll(employeeId: string, payrollPeriodId: string)
```

**Process:**
1. Get payroll period dates
2. Calculate expected working days
3. **NEW**: Use mathematical formulation for attendance hours
4. Get approved leave hours
5. Calculate gross pay, deductions, and net pay

### **2. Attendance Hours Calculation**
```typescript
// New method (default)
calculateAttendanceHoursWithNewFormula(employeeId, startDate, endDate)

// Legacy method (fallback)
calculateAttendanceHoursLegacy(employeeId, startDate, endDate)
```

### **3. Detailed Logging**
The system now logs:
- Which calculation method is being used
- Individual day calculations with morning/afternoon breakdown
- Effective start times after grace period application
- Total hours calculated

## Benefits

### **1. Consistency**
- Same calculation logic across attendance and payroll
- Eliminates discrepancies between systems
- Unified mathematical formulation

### **2. Accuracy**
- Proper grace period handling
- Session caps prevent over-calculation
- Precise time calculations

### **3. Transparency**
- Detailed logging of calculations
- Easy debugging and verification
- Clear audit trail

### **4. Flexibility**
- Environment variable control
- Legacy method available as fallback
- Easy configuration updates

## Migration Strategy

### **Phase 1: Implementation** ✅
- New calculation method implemented
- Legacy method preserved
- Environment variable control added

### **Phase 2: Testing**
- Compare old vs new calculations
- Verify payroll accuracy
- Test edge cases

### **Phase 3: Rollout**
- Enable new calculation by default
- Monitor for issues
- Keep legacy method as backup

### **Phase 4: Cleanup**
- Remove legacy method after validation
- Update documentation
- Optimize performance

## Testing

### **Manual Testing**
```bash
# Test with new calculation
USE_NEW_ATTENDANCE_CALCULATION=true npm run dev

# Test with legacy calculation
USE_NEW_ATTENDANCE_CALCULATION=false npm run dev
```

### **Comparison Testing**
```sql
-- Compare calculations for the same period
SELECT 
    employee_id,
    date,
    -- New calculation
    calculate_daily_total_hours(id) as new_calculation,
    -- Legacy calculation (sum of regular_hours)
    (SELECT SUM(regular_hours) FROM attendance_sessions 
     WHERE attendance_record_id = id) as legacy_calculation
FROM attendance_records 
WHERE date >= '2025-01-01';
```

## Monitoring

### **Log Analysis**
Look for these log entries:
```
Payroll calculation method: {
  employeeId: "...",
  useNewCalculation: true,
  method: "mathematical-formulation"
}

Payroll hours calculation: {
  employeeId: "...",
  date: "2025-01-27",
  morningHours: 3,
  afternoonHours: 4,
  totalHours: 7
}
```

### **Key Metrics**
- Total hours calculated per employee
- Calculation method used
- Any discrepancies between methods
- Performance impact

## Troubleshooting

### **Common Issues**

1. **Calculation Discrepancies**
   - Check environment variables
   - Verify session times in database
   - Review grace period application

2. **Performance Issues**
   - Monitor calculation time
   - Check database query performance
   - Consider caching for large datasets

3. **Configuration Problems**
   - Verify environment variables
   - Check system settings in database
   - Ensure consistent parameters

### **Debug Commands**
```bash
# Check current configuration
echo $USE_NEW_ATTENDANCE_CALCULATION

# View system settings
psql -d your_database -c "SELECT * FROM system_settings WHERE setting_key LIKE 'attendance_%';"

# Test calculation for specific employee
psql -d your_database -c "SELECT calculate_daily_total_hours('attendance-record-id');"
```

## Conclusion

The payroll system now uses the same mathematical formulation as the attendance system, ensuring consistent and accurate calculations. The implementation includes:

- ✅ New mathematical formulation integration
- ✅ Legacy method preservation
- ✅ Environment variable control
- ✅ Detailed logging and monitoring
- ✅ Database backup calculations
- ✅ Comprehensive testing framework

This provides a robust, reliable payroll calculation system that accurately reflects employee attendance using the precise mathematical formulation. 🎯

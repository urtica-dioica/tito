# Database Attendance Calculation Backup System

## Overview

The database now includes triggers and functions that implement the same mathematical formulation as the server-side `AttendanceHoursCalculator`. This provides a **backup calculation system** that ensures consistent hours calculation even if the server-side logic fails or produces incorrect results.

## Database Components

### 1. **Updated Trigger Function**
- **Function**: `calculate_session_payroll_data()`
- **Trigger**: `calculate_payroll_session_data`
- **Purpose**: Automatically calculates `regular_hours`, `overtime_hours`, `late_minutes`, and `late_hours` when attendance sessions are inserted/updated
- **Implementation**: Uses the same mathematical formulation as server-side code

### 2. **Total Hours Calculation Function**
- **Function**: `calculate_daily_total_hours(attendance_record_id)`
- **Purpose**: Calculates total daily hours for any attendance record
- **Returns**: Total hours using mathematical formulation
- **Usage**: Can be called directly from SQL queries

### 3. **Attendance Records View**
- **View**: `attendance_records_with_total_hours`
- **Purpose**: Shows all attendance records with calculated total hours
- **Includes**: All session times and calculated total hours
- **Usage**: For reporting and debugging

### 4. **System Settings**
New configuration parameters stored in `system_settings` table:
- `attendance_morning_start`: 8.0 (8:00 AM)
- `attendance_morning_end`: 12.0 (12:00 PM)
- `attendance_afternoon_start`: 13.0 (1:00 PM)
- `attendance_afternoon_end`: 17.0 (5:00 PM)
- `attendance_grace_period_minutes`: 30
- `attendance_session_cap_hours`: 4.0

## Mathematical Formulation Implementation

The database triggers implement the exact same logic as the server-side code:

### Grace Period Rule
```sql
-- Apply grace period rule for morning start
IF v_morning_in_time < v_morning_start THEN
    v_effective_start := v_morning_start;
ELSE
    v_effective_start := CEIL(v_morning_in_time - (v_grace_period_minutes / 60.0));
END IF;
```

### Session Caps
```sql
-- Apply session cap
v_regular_hours := LEAST(v_session_cap_hours, v_raw_hours);
```

### Total Hours Calculation
```sql
-- Calculate total hours
v_total_hours := v_morning_hours + v_afternoon_hours;
```

## Usage Examples

### 1. **Get Total Hours for an Attendance Record**
```sql
SELECT calculate_daily_total_hours('attendance-record-uuid-here');
```

### 2. **View All Attendance Records with Calculated Hours**
```sql
SELECT 
    employee_id,
    date,
    calculated_total_hours,
    morning_in,
    morning_out,
    afternoon_in,
    afternoon_out
FROM attendance_records_with_total_hours
WHERE date >= '2025-01-01';
```

### 3. **Compare Server vs Database Calculations**
```sql
-- This query can help identify discrepancies
SELECT 
    ar.id,
    ar.date,
    calculate_daily_total_hours(ar.id) as db_calculated_hours,
    -- Add server-calculated hours here for comparison
FROM attendance_records ar
WHERE ar.date >= CURRENT_DATE - INTERVAL '7 days';
```

## Backup Scenarios

### 1. **Server-Side Calculation Failure**
If the server-side `AttendanceHoursCalculator` fails:
- Database triggers continue to calculate hours automatically
- `regular_hours` and `overtime_hours` fields are populated
- Total hours can be calculated using `calculate_daily_total_hours()`

### 2. **Incorrect Server Calculations**
If server-side calculations are wrong:
- Database provides independent calculation
- Can compare results using the view
- Database calculation can be used as the authoritative source

### 3. **Data Integrity Verification**
- Database triggers ensure data consistency
- Automatic calculation prevents manual errors
- Audit trail maintained through triggers

## Migration Instructions

### 1. **Apply Database Updates**
```bash
# Run the migration script
psql -d your_database -f database/schemas/migrate-attendance-calculation.sql
```

### 2. **Test the Implementation**
```bash
# Run the test script
psql -d your_database -f database/schemas/test-attendance-calculation.sql
```

### 3. **Verify Configuration**
```sql
-- Check system settings
SELECT * FROM system_settings WHERE setting_key LIKE 'attendance_%';
```

## Benefits

1. **Redundancy**: Two independent calculation systems
2. **Consistency**: Same mathematical formulation in both systems
3. **Reliability**: Database triggers ensure data integrity
4. **Debugging**: Easy comparison between server and database calculations
5. **Audit**: Complete audit trail of all calculations
6. **Performance**: Database-level calculations are fast and efficient

## Monitoring and Maintenance

### 1. **Regular Verification**
- Compare server vs database calculations periodically
- Monitor for discrepancies
- Investigate any differences

### 2. **Configuration Updates**
- Update system settings when business rules change
- Ensure both server and database use same parameters
- Test changes in development environment first

### 3. **Performance Monitoring**
- Monitor trigger performance
- Optimize if needed for large datasets
- Consider indexing for frequently queried fields

## Troubleshooting

### 1. **Calculation Discrepancies**
If server and database calculations differ:
1. Check system settings configuration
2. Verify grace period and session cap values
3. Review session time data for accuracy
4. Check for timezone issues

### 2. **Performance Issues**
If triggers are slow:
1. Check for missing indexes
2. Optimize the calculation function
3. Consider batch processing for large datasets

### 3. **Data Inconsistencies**
If data seems incorrect:
1. Run the test script to verify logic
2. Check for corrupted session data
3. Verify timezone handling
4. Review grace period application

## Conclusion

The database backup system ensures that attendance hours are calculated correctly even if the server-side logic fails. This provides a robust, reliable system for critical payroll calculations while maintaining the flexibility and precision of the mathematical formulation.

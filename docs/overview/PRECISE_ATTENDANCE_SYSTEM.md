# Precise Attendance System

## Overview

The system now uses **only** the mathematical formulation for all attendance calculations. No legacy methods, no fallbacks, no configuration switches - just precise, consistent calculations across the entire system.

## System Architecture

### ✅ **Single Calculation Method**

**Mathematical Formulation Only**:
- Grace period rules (30 minutes)
- Session caps (4 hours per session)
- Proper morning/afternoon calculations
- Break time handling (12:01-12:59)

### 🎯 **Precision Guaranteed**

1. **Attendance Service**: Uses `AttendanceHoursCalculator`
2. **Payroll Service**: Uses `AttendanceHoursCalculator`
3. **Database Triggers**: Same mathematical formulation
4. **Time Correction**: Uses `AttendanceHoursCalculator`

## Mathematical Formulation

### **Core Rules**
```
Morning Session: 8:00 AM - 12:00 PM (4 hours max)
Afternoon Session: 1:00 PM - 5:00 PM (4 hours max)
Grace Period: 30 minutes
Break Time: 12:01 PM - 12:59 PM (1 hour)
```

### **Calculation Formula**
```
Effective Start = CEIL(ClockIn - GracePeriod)
Morning Hours = MIN(4, MAX(0, MIN(ClockOut, 12:00) - EffectiveStart))
Afternoon Hours = MIN(4, MAX(0, MIN(ClockOut, 17:00) - 13:00))
Total Hours = Morning Hours + Afternoon Hours
```

## Example Calculation

**Input**: Employee clocks in at 8:31 AM, clocks out at 6:00 PM

**Calculation**:
1. **Morning Session**:
   - Clock-in: 8:31 AM (8.5167 hours)
   - Grace period: 30 minutes (0.5 hours)
   - Effective start: CEIL(8.5167 - 0.5) = 9.0 (9:00 AM)
   - Morning hours: MIN(4, MAX(0, 12.0 - 9.0)) = 3 hours

2. **Afternoon Session**:
   - Afternoon start: 1:00 PM (13.0 hours)
   - Afternoon end: 5:00 PM (17.0 hours)
   - Afternoon hours: MIN(4, MAX(0, 17.0 - 13.0)) = 4 hours

3. **Total Hours**: 3 + 4 = 7 hours

## Implementation

### **Server-Side**
```typescript
// AttendanceHoursCalculator
const result = defaultHoursCalculator.calculateFromSessions(sessions);
// Returns: { morningHours: 3, afternoonHours: 4, totalHours: 7 }
```

### **Database Triggers**
```sql
-- calculate_session_payroll_data() function
-- Implements same mathematical formulation
-- Automatic calculation on session insert/update
```

### **Payroll Integration**
```typescript
// PayrollService.calculateAttendanceHours()
const attendanceData = await this.calculateAttendanceHours(employeeId, startDate, endDate);
// Uses mathematical formulation for all payroll calculations
```

## Configuration

### **Environment Variables** (Optional)
```bash
# Session Times
ATTENDANCE_MORNING_START=8.0
ATTENDANCE_MORNING_END=12.0
ATTENDANCE_AFTERNOON_START=13.0
ATTENDANCE_AFTERNOON_END=17.0

# Grace Period
ATTENDANCE_GRACE_PERIOD_MINUTES=30

# Session Caps
ATTENDANCE_SESSION_CAP_HOURS=4.0
ATTENDANCE_MAX_DAILY_HOURS=8.0

# Timezone
ATTENDANCE_TIMEZONE=Asia/Manila
```

### **System Settings** (Database)
```sql
-- Stored in system_settings table
attendance_morning_start: 8.0
attendance_morning_end: 12.0
attendance_afternoon_start: 13.0
attendance_afternoon_end: 17.0
attendance_grace_period_minutes: 30
attendance_session_cap_hours: 4.0
```

## Benefits

### 🎯 **Precision**
- Single calculation method across entire system
- No discrepancies between components
- Consistent results every time

### 🚀 **Performance**
- No configuration checks or method switching
- Optimized mathematical formulation
- Efficient database triggers

### 🛡️ **Reliability**
- Triple redundancy (server, database, triggers)
- Automatic calculation on data changes
- Complete audit trail

### 📊 **Transparency**
- Detailed logging of all calculations
- Easy debugging and verification
- Clear mathematical foundation

## Testing

### **Unit Tests**
```bash
npm test -- attendanceHoursCalculator.test.ts
```

### **Database Tests**
```bash
psql -d your_database -f database/schemas/test-attendance-calculation.sql
```

### **Manual Validation**
```typescript
// Test the specification example
const sessions = {
  morningIn: new Date('2025-01-01T08:31:00'),
  afternoonOut: new Date('2025-01-01T18:00:00')
};
const result = calculator.calculateTotalHours(sessions);
// Expected: 7 hours (3 morning + 4 afternoon)
```

## Monitoring

### **Log Entries**
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
```

### **Database View**
```sql
-- Check calculated hours
SELECT * FROM attendance_records_with_total_hours 
WHERE date >= CURRENT_DATE - INTERVAL '7 days';
```

## Migration

### **Database Updates**
```bash
# Apply mathematical formulation to database triggers
psql -d your_database -f database/schemas/migrate-attendance-calculation.sql
```

### **Server Updates**
```bash
# Build with new calculation method
npm run build
npm start
```

## Conclusion

The system is now **precise and consistent**:

- ✅ **Single Method**: Mathematical formulation only
- ✅ **No Legacy Code**: Clean, maintainable codebase
- ✅ **Triple Redundancy**: Server, database, and triggers
- ✅ **Complete Integration**: Attendance, payroll, and time correction
- ✅ **Precise Calculations**: Grace periods, session caps, proper logic

The system guarantees accurate, consistent attendance calculations across all components using the exact mathematical formulation you specified. 🎯

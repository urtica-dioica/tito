# Attendance Hours Calculation System

## Overview

This document describes the new mathematical formulation for calculating total hours worked by an employee in a single workday. The system implements precise rules for morning and afternoon sessions, grace periods, and break time constraints.

## Mathematical Formulation

### Variables

- `t_clock-in`: Actual clock-in time (24-hour format, e.g., 7:30 = 7.5 hours)
- `t_clock-out`: Actual clock-out time (24-hour format, e.g., 18:00 = 18.0 hours)
- `t_morning-start`: Official morning session start time (default: 8:00 AM = 8.0 hours)
- `t_morning-end`: Official morning session end time (default: 12:00 PM = 12.0 hours)
- `t_afternoon-start`: Official afternoon session start time (default: 1:00 PM = 13.0 hours)
- `t_afternoon-end`: Maximum afternoon session end time (default: 5:00 PM = 17.0 hours)
- `g`: Grace period in minutes (default: 30 minutes = 0.5 hours)
- `H_morning`: Total hours counted for morning session (capped at 4 hours)
- `H_afternoon`: Total hours counted for afternoon session (capped at 4 hours)
- `H_total`: Total hours worked in the workday (`H_total = H_morning + H_afternoon`)

### Rules and Constraints

1. **Session Caps**: Each session (morning/afternoon) is capped at 4 hours
2. **Early Clock-In Rule**: If employee clocks in before official session start, session starts at official start time
3. **Grace Period Rule**: If employee clocks in late within grace period, effective start time is rounded up to next hour
4. **Late Clock-Out Rule**: Hours are capped at session maximum end time
5. **Break Time**: Mandatory break from 12:01 to 12:59 (1 hour)

### Calculation Formula

#### Morning Session Hours
```
H_morning = min(4, max(0, min(t_clock-out, t_morning-end) - t_effective-in-morning))
```

#### Afternoon Session Hours
```
H_afternoon = min(4, max(0, min(t_clock-out, t_afternoon-end) - t_effective-in-afternoon))
```

#### Total Hours
```
H_total = H_morning + H_afternoon
```

## Implementation

### Backend Components

1. **AttendanceHoursCalculator** (`/server/src/utils/attendanceHoursCalculator.ts`)
   - Core calculation logic
   - Configurable parameters
   - Handles all edge cases

2. **AttendanceService** (`/server/src/services/attendance/attendanceService.ts`)
   - Updated to use new calculation method
   - Provides detailed calculation results

3. **PayrollService** (`/server/src/services/payroll/payrollService.ts`)
   - Updated to use new calculation for payroll processing
   - Maintains backward compatibility

4. **Configuration** (`/server/src/config/attendanceConfig.ts`)
   - Centralized configuration management
   - Environment variable support
   - Validation and formatting utilities

### API Endpoints

- `GET /api/attendance/:attendanceRecordId/hours-calculation`
  - Returns detailed hours calculation breakdown
  - Includes effective start/end times
  - Shows configuration used

### Frontend Integration

The frontend automatically displays the new calculated hours through existing components:

- **DailyAttendanceTable**: Shows total hours in the "Total Hours" column
- **EmployeeDashboard**: Displays "Total Hours Today" in the attendance card
- **EmployeeAttendance**: Shows hours in attendance history

## Example Calculation

**Input:**
- Clock-in: 8:31 AM (8.5167 hours)
- Clock-out: 6:00 PM (18.0 hours)
- Grace period: 30 minutes

**Calculation:**
1. **Morning Session:**
   - Effective start: ceiling(8.5167 - 0.5) = 9.0 (9:00 AM)
   - Effective end: 12.0 (12:00 PM)
   - Hours: min(4, max(0, 12.0 - 9.0)) = 3 hours

2. **Afternoon Session:**
   - Effective start: 13.0 (1:00 PM)
   - Effective end: 17.0 (5:00 PM)
   - Hours: min(4, max(0, 17.0 - 13.0)) = 4 hours

3. **Total Hours:** 3 + 4 = 7 hours

## Configuration

### Environment Variables

```bash
# Session Times (decimal hours)
ATTENDANCE_MORNING_START=8.0
ATTENDANCE_MORNING_END=12.0
ATTENDANCE_AFTERNOON_START=13.0
ATTENDANCE_AFTERNOON_END=17.0

# Grace Period
ATTENDANCE_GRACE_PERIOD_MINUTES=30

# Session Caps
ATTENDANCE_SESSION_CAP_HOURS=4
ATTENDANCE_MAX_DAILY_HOURS=8

# Break Period
ATTENDANCE_BREAK_START=12.0167
ATTENDANCE_BREAK_END=12.9833

# Timezone
ATTENDANCE_TIMEZONE=Asia/Manila

# Validation Rules
ATTENDANCE_ALLOW_EARLY_CLOCK_IN=true
ATTENDANCE_ALLOW_LATE_CLOCK_OUT=true
ATTENDANCE_REQUIRE_BOTH_SESSIONS=false
```

## Testing

### Unit Tests
- Comprehensive test suite in `/server/tests/unit/attendanceHoursCalculator.test.ts`
- Tests all edge cases and mathematical scenarios
- Validates configuration and error handling

### Test Script
- Manual testing script: `/server/scripts/test-hours-calculation.js`
- Validates the specification example
- Provides additional test cases

### Running Tests
```bash
# Run unit tests
npm test -- attendanceHoursCalculator.test.ts

# Run manual test script
node scripts/test-hours-calculation.js
```

## Migration Notes

### Backward Compatibility
- Existing attendance records continue to work
- New calculations apply to all future attendance processing
- Payroll calculations use new formula automatically

### Database Impact
- No database schema changes required
- Existing `calculated_hours` field continues to work
- New detailed calculation available via API

## Benefits

1. **Precision**: Mathematical formulation ensures consistent calculations
2. **Flexibility**: Configurable parameters for different business rules
3. **Transparency**: Detailed breakdown of calculation steps
4. **Compliance**: Handles all specified business rules and edge cases
5. **Maintainability**: Centralized logic with comprehensive testing

## Support

For questions or issues with the hours calculation system:

1. Check the unit tests for expected behavior
2. Review the configuration settings
3. Use the detailed calculation API endpoint for debugging
4. Consult this documentation for mathematical formulation details

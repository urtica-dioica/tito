/**
 * Attendance Configuration
 * 
 * Centralized configuration for attendance calculation parameters
 * including grace periods, session times, and business rules.
 */

export interface AttendanceConfig {
  // Session Times (in decimal hours, 24-hour format)
  morningStart: number;      // Default: 8.0 (8:00 AM)
  morningEnd: number;        // Default: 12.0 (12:00 PM)
  afternoonStart: number;    // Default: 13.0 (1:00 PM)
  afternoonEnd: number;      // Default: 17.0 (5:00 PM)
  
  // Grace Period
  gracePeriodMinutes: number; // Default: 30 minutes
  
  // Session Caps
  sessionCapHours: number;   // Default: 4 hours per session
  maxDailyHours: number;     // Default: 8 hours per day
  
  // Break Period
  breakStart: number;        // Default: 12.0167 (12:01)
  breakEnd: number;          // Default: 12.9833 (12:59)
  
  // Timezone
  timezone: string;          // Default: 'Asia/Manila'
  
  // Validation Rules
  allowEarlyClockIn: boolean;    // Default: true
  allowLateClockOut: boolean;    // Default: true
  requireBothSessions: boolean;  // Default: false
}

export const defaultAttendanceConfig: AttendanceConfig = {
  morningStart: 8.0,         // 8:00 AM
  morningEnd: 12.0,          // 12:00 PM
  afternoonStart: 13.0,      // 1:00 PM
  afternoonEnd: 17.0,        // 5:00 PM
  gracePeriodMinutes: 30,    // 30 minutes
  sessionCapHours: 4,        // 4 hours per session
  maxDailyHours: 8,          // 8 hours per day
  breakStart: 12 + 1/60,     // 12:01
  breakEnd: 12 + 59/60,      // 12:59
  timezone: 'Asia/Manila',
  allowEarlyClockIn: true,
  allowLateClockOut: true,
  requireBothSessions: false
};

/**
 * Get attendance configuration from environment variables or use defaults
 */
export function getAttendanceConfig(): AttendanceConfig {
  return {
    morningStart: parseFloat(process.env.ATTENDANCE_MORNING_START || '8.0'),
    morningEnd: parseFloat(process.env.ATTENDANCE_MORNING_END || '12.0'),
    afternoonStart: parseFloat(process.env.ATTENDANCE_AFTERNOON_START || '13.0'),
    afternoonEnd: parseFloat(process.env.ATTENDANCE_AFTERNOON_END || '17.0'),
    gracePeriodMinutes: parseInt(process.env.ATTENDANCE_GRACE_PERIOD_MINUTES || '30'),
    sessionCapHours: parseFloat(process.env.ATTENDANCE_SESSION_CAP_HOURS || '4'),
    maxDailyHours: parseFloat(process.env.ATTENDANCE_MAX_DAILY_HOURS || '8'),
    breakStart: parseFloat(process.env.ATTENDANCE_BREAK_START || '12.0167'),
    breakEnd: parseFloat(process.env.ATTENDANCE_BREAK_END || '12.9833'),
    timezone: process.env.ATTENDANCE_TIMEZONE || 'Asia/Manila',
    allowEarlyClockIn: true, // Always allow early clock-in
    allowLateClockOut: true, // Always allow late clock-out
    requireBothSessions: false // Don't require both sessions
  };
}

/**
 * Validate attendance configuration
 */
export function validateAttendanceConfig(config: AttendanceConfig): string[] {
  const errors: string[] = [];

  // Validate session times
  if (config.morningStart < 0 || config.morningStart >= 24) {
    errors.push('Morning start time must be between 0 and 24 hours');
  }
  
  if (config.morningEnd < 0 || config.morningEnd >= 24) {
    errors.push('Morning end time must be between 0 and 24 hours');
  }
  
  if (config.afternoonStart < 0 || config.afternoonStart >= 24) {
    errors.push('Afternoon start time must be between 0 and 24 hours');
  }
  
  if (config.afternoonEnd < 0 || config.afternoonEnd >= 24) {
    errors.push('Afternoon end time must be between 0 and 24 hours');
  }

  // Validate session order
  if (config.morningStart >= config.morningEnd) {
    errors.push('Morning start time must be before morning end time');
  }
  
  if (config.afternoonStart >= config.afternoonEnd) {
    errors.push('Afternoon start time must be before afternoon end time');
  }
  
  if (config.morningEnd >= config.afternoonStart) {
    errors.push('Morning end time must be before afternoon start time');
  }

  // Validate grace period
  if (config.gracePeriodMinutes < 0 || config.gracePeriodMinutes > 60) {
    errors.push('Grace period must be between 0 and 60 minutes');
  }

  // Validate session caps
  if (config.sessionCapHours <= 0 || config.sessionCapHours > 12) {
    errors.push('Session cap hours must be between 0 and 12 hours');
  }
  
  if (config.maxDailyHours <= 0 || config.maxDailyHours > 24) {
    errors.push('Max daily hours must be between 0 and 24 hours');
  }

  // Validate break period
  if (config.breakStart < 0 || config.breakStart >= 24) {
    errors.push('Break start time must be between 0 and 24 hours');
  }
  
  if (config.breakEnd < 0 || config.breakEnd >= 24) {
    errors.push('Break end time must be between 0 and 24 hours');
  }
  
  if (config.breakStart >= config.breakEnd) {
    errors.push('Break start time must be before break end time');
  }

  return errors;
}

/**
 * Convert decimal hours to time string (HH:MM format)
 */
export function decimalHoursToTimeString(decimalHours: number): string {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Convert time string (HH:MM format) to decimal hours
 */
export function timeStringToDecimalHours(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours + minutes / 60;
}

/**
 * Format configuration for display
 */
export function formatAttendanceConfig(config: AttendanceConfig): {
  morningSession: string;
  afternoonSession: string;
  gracePeriod: string;
  sessionCap: string;
  maxDaily: string;
  breakPeriod: string;
  timezone: string;
} {
  return {
    morningSession: `${decimalHoursToTimeString(config.morningStart)} - ${decimalHoursToTimeString(config.morningEnd)}`,
    afternoonSession: `${decimalHoursToTimeString(config.afternoonStart)} - ${decimalHoursToTimeString(config.afternoonEnd)}`,
    gracePeriod: `${config.gracePeriodMinutes} minutes`,
    sessionCap: `${config.sessionCapHours} hours`,
    maxDaily: `${config.maxDailyHours} hours`,
    breakPeriod: `${decimalHoursToTimeString(config.breakStart)} - ${decimalHoursToTimeString(config.breakEnd)}`,
    timezone: config.timezone
  };
}

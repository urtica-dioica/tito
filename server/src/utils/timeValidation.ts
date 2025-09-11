/**
 * Time-based attendance validation utilities
 * Implements business rules for morning/afternoon sessions and break periods
 */

export type SessionType = 'morning_in' | 'morning_out' | 'afternoon_in' | 'afternoon_out' | 'overtime';

export interface TimeWindow {
  start: string; // HH:MM format
  end: string;   // HH:MM format
}

export interface AttendanceTimeConfig {
  morningIn: TimeWindow;
  morningOut: TimeWindow;
  afternoonIn: TimeWindow;
  afternoonOut: TimeWindow;
  breakPeriod: TimeWindow;
  overtimeStart: string;
}

// Default time configuration
export const DEFAULT_TIME_CONFIG: AttendanceTimeConfig = {
  morningIn: { start: '07:00', end: '12:00' },
  morningOut: { start: '08:00', end: '12:00' },
  afternoonIn: { start: '13:00', end: '17:00' },
  afternoonOut: { start: '13:00', end: '18:00' },
  breakPeriod: { start: '12:00', end: '13:00' },
  overtimeStart: '17:00'
};

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Check if a time falls within a time window
 */
export function isTimeInWindow(time: Date, window: TimeWindow): boolean {
  const currentMinutes = time.getHours() * 60 + time.getMinutes();
  const startMinutes = timeToMinutes(window.start);
  const endMinutes = timeToMinutes(window.end);
  
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Check if current time is during break period
 */
export function isBreakPeriod(time: Date = new Date()): boolean {
  return isTimeInWindow(time, DEFAULT_TIME_CONFIG.breakPeriod);
}

/**
 * Validate if a session type is allowed at the given time
 */
export function validateSessionTime(sessionType: SessionType, timestamp: Date): {
  isValid: boolean;
  reason?: string;
} {
  const time = timestamp;
  
  switch (sessionType) {
    case 'morning_in':
      if (!isTimeInWindow(time, DEFAULT_TIME_CONFIG.morningIn)) {
        return {
          isValid: false,
          reason: `Morning clock-in is only allowed between ${DEFAULT_TIME_CONFIG.morningIn.start} and ${DEFAULT_TIME_CONFIG.morningIn.end}`
        };
      }
      break;
      
    case 'morning_out':
      if (!isTimeInWindow(time, DEFAULT_TIME_CONFIG.morningOut) && !isBreakPeriod(time)) {
        return {
          isValid: false,
          reason: `Morning clock-out is only allowed between ${DEFAULT_TIME_CONFIG.morningOut.start} and ${DEFAULT_TIME_CONFIG.morningOut.end}, or during break period`
        };
      }
      break;
      
    case 'afternoon_in':
      if (!isTimeInWindow(time, DEFAULT_TIME_CONFIG.afternoonIn) && !isBreakPeriod(time)) {
        return {
          isValid: false,
          reason: `Afternoon clock-in is only allowed between ${DEFAULT_TIME_CONFIG.afternoonIn.start} and ${DEFAULT_TIME_CONFIG.afternoonIn.end}, or during break period`
        };
      }
      break;
      
    case 'afternoon_out':
      if (!isTimeInWindow(time, DEFAULT_TIME_CONFIG.afternoonOut)) {
        return {
          isValid: false,
          reason: `Afternoon clock-out is only allowed between ${DEFAULT_TIME_CONFIG.afternoonOut.start} and ${DEFAULT_TIME_CONFIG.afternoonOut.end}`
        };
      }
      break;
      
    case 'overtime':
      const overtimeMinutes = timeToMinutes(DEFAULT_TIME_CONFIG.overtimeStart);
      const currentMinutes = time.getHours() * 60 + time.getMinutes();
      if (currentMinutes < overtimeMinutes) {
        return {
          isValid: false,
          reason: `Overtime is only allowed after ${DEFAULT_TIME_CONFIG.overtimeStart}`
        };
      }
      break;
      
    default:
      return {
        isValid: false,
        reason: 'Invalid session type'
      };
  }
  
  return { isValid: true };
}

/**
 * Determine the next expected session type for an employee
 */
export function getNextSessionType(
  existingSessions: { sessionType: SessionType; timestamp: Date }[],
  currentTime: Date = new Date()
): SessionType | null {
  const hasMorningIn = existingSessions.some(s => s.sessionType === 'morning_in');
  const hasMorningOut = existingSessions.some(s => s.sessionType === 'morning_out');
  const hasAfternoonIn = existingSessions.some(s => s.sessionType === 'afternoon_in');
  const hasAfternoonOut = existingSessions.some(s => s.sessionType === 'afternoon_out');
  
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const morningEndMinutes = timeToMinutes(DEFAULT_TIME_CONFIG.morningIn.end);
  const afternoonStartMinutes = timeToMinutes(DEFAULT_TIME_CONFIG.afternoonIn.start);
  const afternoonEndMinutes = timeToMinutes(DEFAULT_TIME_CONFIG.afternoonOut.end);
  
  // Morning session (before 12:00 PM)
  if (currentMinutes < morningEndMinutes) {
    if (!hasMorningIn) {
      return 'morning_in';
    } else if (hasMorningIn && !hasMorningOut) {
      return 'morning_out';
    }
  }
  
  // Break period (12:00 PM - 1:00 PM) - allow morning_out and afternoon_in
  if (isBreakPeriod(currentTime)) {
    if (hasMorningIn && !hasMorningOut) {
      return 'morning_out';
    } else if (hasMorningOut && !hasAfternoonIn) {
      return 'afternoon_in';
    }
  }
  
  // Afternoon session (1:00 PM - 6:00 PM)
  if (currentMinutes >= afternoonStartMinutes && currentMinutes <= afternoonEndMinutes) {
    if (!hasAfternoonIn) {
      return 'afternoon_in';
    } else if (hasAfternoonIn && !hasAfternoonOut) {
      return 'afternoon_out';
    }
  }
  
  // After hours - overtime
  if (currentMinutes > afternoonEndMinutes) {
    return 'overtime';
  }
  
  return null; // No valid session at this time
}

/**
 * Get session display information
 */
export function getSessionDisplayInfo(sessionType: SessionType): {
  label: string;
  description: string;
  timeWindow: string;
} {
  switch (sessionType) {
    case 'morning_in':
      return {
        label: 'Morning Clock In',
        description: 'Start your morning work session',
        timeWindow: `${DEFAULT_TIME_CONFIG.morningIn.start} - ${DEFAULT_TIME_CONFIG.morningIn.end}`
      };
    case 'morning_out':
      return {
        label: 'Morning Clock Out',
        description: 'End your morning work session',
        timeWindow: `${DEFAULT_TIME_CONFIG.morningOut.start} - ${DEFAULT_TIME_CONFIG.morningOut.end} (or during break)`
      };
    case 'afternoon_in':
      return {
        label: 'Afternoon Clock In',
        description: 'Start your afternoon work session',
        timeWindow: `${DEFAULT_TIME_CONFIG.afternoonIn.start} - ${DEFAULT_TIME_CONFIG.afternoonIn.end} (or during break)`
      };
    case 'afternoon_out':
      return {
        label: 'Afternoon Clock Out',
        description: 'End your afternoon work session',
        timeWindow: `${DEFAULT_TIME_CONFIG.afternoonOut.start} - ${DEFAULT_TIME_CONFIG.afternoonOut.end}`
      };
    case 'overtime':
      return {
        label: 'Overtime',
        description: 'Record overtime work',
        timeWindow: `After ${DEFAULT_TIME_CONFIG.overtimeStart}`
      };
    default:
      return {
        label: 'Unknown',
        description: 'Unknown session type',
        timeWindow: 'N/A'
      };
  }
}

/**
 * Check if employee can perform attendance action at current time
 */
export function canPerformAttendanceAction(
  sessionType: SessionType,
  existingSessions: { sessionType: SessionType; timestamp: Date }[],
  currentTime: Date = new Date()
): {
  canPerform: boolean;
  reason?: string;
  nextExpectedSession?: SessionType;
} {
  // Check if this is the expected next session
  const nextExpected = getNextSessionType(existingSessions, currentTime);
  
  if (nextExpected && sessionType !== nextExpected) {
  return {
    canPerform: false,
    reason: `Expected ${getSessionDisplayInfo(nextExpected).label} at this time`,
    nextExpectedSession: nextExpected || undefined
  };
  }
  
  // Validate time window
  const timeValidation = validateSessionTime(sessionType, currentTime);
  if (!timeValidation.isValid) {
    return {
      canPerform: false,
      reason: timeValidation.reason,
      nextExpectedSession: nextExpected || undefined
    };
  }
  
  return {
    canPerform: true,
    nextExpectedSession: nextExpected || undefined
  };
}

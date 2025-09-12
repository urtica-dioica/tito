/**
 * Attendance Hours Calculator
 * 
 * Implements the mathematical formulation for calculating total hours worked by an employee
 * in a single workday, considering morning and afternoon sessions, grace period rules,
 * and break time constraints.
 * 
 * Mathematical Formulation:
 * - Each session (morning/afternoon) is capped at 4 hours
 * - Grace period rule: 30 minutes after hour mark rounds up to next hour
 * - Break time: 12:01-12:59 (1 hour mandatory break)
 * - Early clock-in: Session starts at official start time
 * - Late clock-out: Hours capped at session maximum
 */

export interface AttendanceSessionTimes {
  morningIn?: Date;
  morningOut?: Date;
  afternoonIn?: Date;
  afternoonOut?: Date;
}

export interface AttendanceConfig {
  morningStart: number;      // Default: 8.0 (8:00 AM)
  morningEnd: number;        // Default: 12.0 (12:00 PM)
  afternoonStart: number;    // Default: 13.0 (1:00 PM)
  afternoonEnd: number;      // Default: 17.0 (5:00 PM)
  gracePeriodMinutes: number; // Default: 30 minutes
  sessionCapHours: number;   // Default: 4 hours
}

export interface CalculatedHours {
  morningHours: number;
  afternoonHours: number;
  totalHours: number;
  effectiveMorningStart: number | null;
  effectiveAfternoonStart: number | null;
  effectiveMorningEnd: number | null;
  effectiveAfternoonEnd: number | null;
}

export class AttendanceHoursCalculator {
  private config: AttendanceConfig;

  constructor(config?: Partial<AttendanceConfig>) {
    // Use configuration from environment or defaults
    const baseConfig = {
      morningStart: 8.0,      // 8:00 AM
      morningEnd: 12.0,       // 12:00 PM
      afternoonStart: 13.0,   // 1:00 PM
      afternoonEnd: 17.0,     // 5:00 PM
      gracePeriodMinutes: 30, // 30 minutes
      sessionCapHours: 4,     // 4 hours per session
    };
    
    this.config = { ...baseConfig, ...config };
  }

  /**
   * Convert Date to decimal hours (24-hour format)
   * @param date - Date object
   * @returns Decimal hours (e.g., 8.5 for 8:30 AM)
   */
  private dateToDecimalHours(date: Date): number {
    return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  }

  /**
   * Apply grace period rule to determine effective start time
   * @param clockInTime - Actual clock-in time in decimal hours
   * @returns Effective start time in decimal hours
   */
  private applyGracePeriodRule(clockInTime: number): number {
    const gracePeriodHours = this.config.gracePeriodMinutes / 60;
    return Math.ceil(clockInTime - gracePeriodHours);
  }

  /**
   * Check if time falls within break period (12:01-12:59)
   * @param time - Time in decimal hours
   * @returns True if within break period
   */
  // private isBreakPeriod(time: number): boolean {
  //   const breakStart = 12 + 1/60;  // 12:01
  //   const breakEnd = 12 + 59/60;   // 12:59
  //   return time >= breakStart && time <= breakEnd;
  // }

  /**
   * Calculate morning session hours
   * @param sessions - Attendance session times
   * @returns Morning hours and effective times
   */
  private calculateMorningHours(sessions: AttendanceSessionTimes): {
    hours: number;
    effectiveStart: number | null;
    effectiveEnd: number | null;
  } {
    const { morningIn, morningOut } = sessions;

    // No morning session if no clock-in
    if (!morningIn) {
      return { hours: 0, effectiveStart: null, effectiveEnd: null };
    }

    const clockInTime = this.dateToDecimalHours(morningIn);
    
    // Determine effective morning start time
    let effectiveStart: number;
    
    if (clockInTime < this.config.morningStart) {
      // Early clock-in: session starts at official start time
      effectiveStart = this.config.morningStart;
    } else {
      // Apply grace period rule
      effectiveStart = this.applyGracePeriodRule(clockInTime);
    }

    // Ensure effective start is not after morning end
    if (effectiveStart > this.config.morningEnd) {
      return { hours: 0, effectiveStart: null, effectiveEnd: null };
    }

    // Determine effective morning end time
    let effectiveEnd: number;
    
    if (!morningOut) {
      // No clock-out: use morning end time
      effectiveEnd = this.config.morningEnd;
    } else {
      const clockOutTime = this.dateToDecimalHours(morningOut);
      
      if (clockOutTime <= this.config.morningEnd) {
        // Clock-out before or at morning end
        effectiveEnd = clockOutTime;
      } else if (clockOutTime < this.config.afternoonStart) {
        // Clock-out between morning end and afternoon start
        effectiveEnd = this.config.morningEnd;
      } else {
        // Clock-out after afternoon start: use morning end
        effectiveEnd = this.config.morningEnd;
      }
    }

    // Calculate morning hours with cap
    const rawHours = Math.max(0, effectiveEnd - effectiveStart);
    const cappedHours = Math.min(this.config.sessionCapHours, rawHours);

    return {
      hours: Math.round(cappedHours * 100) / 100, // Round to 2 decimal places
      effectiveStart,
      effectiveEnd
    };
  }

  /**
   * Calculate afternoon session hours
   * @param sessions - Attendance session times
   * @returns Afternoon hours and effective times
   */
  private calculateAfternoonHours(sessions: AttendanceSessionTimes): {
    hours: number;
    effectiveStart: number | null;
    effectiveEnd: number | null;
  } {
    const { afternoonIn, afternoonOut } = sessions;

    // No afternoon session if no clock-in
    if (!afternoonIn) {
      return { hours: 0, effectiveStart: null, effectiveEnd: null };
    }

    const clockInTime = this.dateToDecimalHours(afternoonIn);
    
    // Determine effective afternoon start time
    let effectiveStart: number;
    
    if (clockInTime < this.config.afternoonStart) {
      // Clock-in before afternoon start: use official start time
      effectiveStart = this.config.afternoonStart;
    } else {
      // Apply grace period rule
      effectiveStart = this.applyGracePeriodRule(clockInTime);
    }

    // Ensure effective start is not after afternoon end
    if (effectiveStart > this.config.afternoonEnd) {
      return { hours: 0, effectiveStart: null, effectiveEnd: null };
    }

    // Determine effective afternoon end time
    let effectiveEnd: number;
    
    if (!afternoonOut) {
      // No clock-out: use afternoon end time
      effectiveEnd = this.config.afternoonEnd;
    } else {
      const clockOutTime = this.dateToDecimalHours(afternoonOut);
      
      // Use the earlier of clock-out time or afternoon end
      effectiveEnd = Math.min(clockOutTime, this.config.afternoonEnd);
    }

    // Calculate afternoon hours with cap
    const rawHours = Math.max(0, effectiveEnd - effectiveStart);
    const cappedHours = Math.min(this.config.sessionCapHours, rawHours);

    return {
      hours: Math.round(cappedHours * 100) / 100, // Round to 2 decimal places
      effectiveStart,
      effectiveEnd
    };
  }

  /**
   * Calculate total hours for a workday
   * @param sessions - Attendance session times
   * @returns Complete calculation results
   */
  public calculateTotalHours(sessions: AttendanceSessionTimes): CalculatedHours {
    const morningResult = this.calculateMorningHours(sessions);
    const afternoonResult = this.calculateAfternoonHours(sessions);

    const totalHours = morningResult.hours + afternoonResult.hours;

    return {
      morningHours: morningResult.hours,
      afternoonHours: afternoonResult.hours,
      totalHours: Math.round(totalHours * 100) / 100, // Round to 2 decimal places
      effectiveMorningStart: morningResult.effectiveStart,
      effectiveAfternoonStart: afternoonResult.effectiveStart,
      effectiveMorningEnd: morningResult.effectiveEnd,
      effectiveAfternoonEnd: afternoonResult.effectiveEnd
    };
  }

  /**
   * Calculate hours from attendance sessions (database format)
   * @param sessions - Array of attendance sessions from database
   * @returns Complete calculation results
   */
  public calculateFromSessions(sessions: Array<{
    sessionType: string;
    clockIn?: Date;
    clockOut?: Date;
  }>): CalculatedHours {
    const sessionTimes: AttendanceSessionTimes = {};

    // Extract session times
    for (const session of sessions) {
      switch (session.sessionType) {
        case 'morning_in':
          sessionTimes.morningIn = session.clockIn;
          break;
        case 'morning_out':
          sessionTimes.morningOut = session.clockOut;
          break;
        case 'afternoon_in':
          sessionTimes.afternoonIn = session.clockIn;
          break;
        case 'afternoon_out':
          sessionTimes.afternoonOut = session.clockOut;
          break;
      }
    }

    return this.calculateTotalHours(sessionTimes);
  }

  /**
   * Get current configuration
   * @returns Current configuration object
   */
  public getConfig(): AttendanceConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param newConfig - Partial configuration to update
   */
  public updateConfig(newConfig: Partial<AttendanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Default instance with standard configuration
export const defaultHoursCalculator = new AttendanceHoursCalculator();

// Example usage and validation
export function validateHoursCalculation(): void {
  const calculator = new AttendanceHoursCalculator();
  
  // Test case from the specification
  const testSessions: AttendanceSessionTimes = {
    morningIn: new Date('2025-01-01T08:31:00'), // 8:31 AM
    afternoonOut: new Date('2025-01-01T18:00:00') // 6:00 PM
  };

  const result = calculator.calculateTotalHours(testSessions);
  
  console.log('Test calculation result:', result);
  console.log('Expected: 7 hours (3 morning + 4 afternoon)');
  console.log('Actual matches expected:', result.totalHours === 7);
}

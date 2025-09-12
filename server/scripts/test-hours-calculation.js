/**
 * Test script for the new attendance hours calculation
 * 
 * This script validates the mathematical formulation implementation
 * by running the example from the specification.
 */

const { AttendanceHoursCalculator } = require('../dist/utils/attendanceHoursCalculator');

console.log('Testing Attendance Hours Calculation');
console.log('=====================================\n');

// Create calculator instance
const calculator = new AttendanceHoursCalculator();

// Test case from the specification
console.log('Test Case: Employee with 8:31 AM clock-in and 6:00 PM clock-out');
console.log('Expected Result: 7 hours (3 morning + 4 afternoon)\n');

const testSessions = {
  morningIn: new Date('2025-01-01T08:31:00'), // 8:31 AM
  afternoonOut: new Date('2025-01-01T18:00:00') // 6:00 PM
};

const result = calculator.calculateTotalHours(testSessions);

console.log('Calculation Results:');
console.log(`- Morning Hours: ${result.morningHours}`);
console.log(`- Afternoon Hours: ${result.afternoonHours}`);
console.log(`- Total Hours: ${result.totalHours}`);
console.log(`- Effective Morning Start: ${result.effectiveMorningStart} (${result.effectiveMorningStart ? result.effectiveMorningStart + ':00' : 'N/A'})`);
console.log(`- Effective Afternoon Start: ${result.effectiveAfternoonStart} (${result.effectiveAfternoonStart ? result.effectiveAfternoonStart + ':00' : 'N/A'})`);
console.log(`- Effective Morning End: ${result.effectiveMorningEnd} (${result.effectiveMorningEnd ? result.effectiveMorningEnd + ':00' : 'N/A'})`);
console.log(`- Effective Afternoon End: ${result.effectiveAfternoonEnd} (${result.effectiveAfternoonEnd ? result.effectiveAfternoonEnd + ':00' : 'N/A'})`);

console.log('\nValidation:');
console.log(`✓ Expected: 7 hours, Actual: ${result.totalHours} hours`);
console.log(`✓ Test ${result.totalHours === 7 ? 'PASSED' : 'FAILED'}`);

// Additional test cases
console.log('\n\nAdditional Test Cases:');
console.log('=====================\n');

// Test 1: Complete workday
console.log('Test 1: Complete workday (8:00 AM - 5:00 PM)');
const completeWorkday = {
  morningIn: new Date('2025-01-01T08:00:00'),
  morningOut: new Date('2025-01-01T12:00:00'),
  afternoonIn: new Date('2025-01-01T13:00:00'),
  afternoonOut: new Date('2025-01-01T17:00:00')
};

const result1 = calculator.calculateTotalHours(completeWorkday);
console.log(`Result: ${result1.totalHours} hours (${result1.morningHours} morning + ${result1.afternoonHours} afternoon)`);

// Test 2: Late morning clock-in
console.log('\nTest 2: Late morning clock-in (9:30 AM - 5:00 PM)');
const lateMorning = {
  morningIn: new Date('2025-01-01T09:30:00'),
  afternoonOut: new Date('2025-01-01T17:00:00')
};

const result2 = calculator.calculateTotalHours(lateMorning);
console.log(`Result: ${result2.totalHours} hours (${result2.morningHours} morning + ${result2.afternoonHours} afternoon)`);

// Test 3: Early clock-in
console.log('\nTest 3: Early clock-in (7:30 AM - 5:00 PM)');
const earlyClockIn = {
  morningIn: new Date('2025-01-01T07:30:00'),
  afternoonOut: new Date('2025-01-01T17:00:00')
};

const result3 = calculator.calculateTotalHours(earlyClockIn);
console.log(`Result: ${result3.totalHours} hours (${result3.morningHours} morning + ${result3.afternoonHours} afternoon)`);

// Test 4: Partial day (morning only)
console.log('\nTest 4: Partial day - morning only (8:00 AM - 12:00 PM)');
const morningOnly = {
  morningIn: new Date('2025-01-01T08:00:00'),
  morningOut: new Date('2025-01-01T12:00:00')
};

const result4 = calculator.calculateTotalHours(morningOnly);
console.log(`Result: ${result4.totalHours} hours (${result4.morningHours} morning + ${result4.afternoonHours} afternoon)`);

console.log('\n\nConfiguration:');
console.log('==============');
const config = calculator.getConfig();
console.log(`Morning Session: ${config.morningStart}:00 - ${config.morningEnd}:00`);
console.log(`Afternoon Session: ${config.afternoonStart}:00 - ${config.afternoonEnd}:00`);
console.log(`Grace Period: ${config.gracePeriodMinutes} minutes`);
console.log(`Session Cap: ${config.sessionCapHours} hours`);

console.log('\nTest completed successfully!');

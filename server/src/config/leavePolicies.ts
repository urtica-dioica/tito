/**
 * Leave Payment Policies Configuration
 * 
 * This file defines which leave types are paid and their payment policies.
 * This can be extended to support more complex policies in the future.
 */

export interface LeavePaymentPolicy {
  leaveType: string;
  isPaid: boolean;
  paymentPercentage?: number; // For partial payment (e.g., 50% for some sick leave)
  maxPaidDaysPerYear?: number; // Maximum paid days per year for this leave type
  description: string;
}

export const LEAVE_PAYMENT_POLICIES: LeavePaymentPolicy[] = [
  {
    leaveType: 'vacation',
    isPaid: true,
    paymentPercentage: 100,
    description: 'Vacation leave is fully paid'
  },
  {
    leaveType: 'sick',
    isPaid: true,
    paymentPercentage: 100,
    maxPaidDaysPerYear: 10, // Example: 10 paid sick days per year
    description: 'Sick leave is fully paid up to 10 days per year'
  },
  {
    leaveType: 'maternity',
    isPaid: true,
    paymentPercentage: 100,
    description: 'Maternity leave is fully paid'
  },
  {
    leaveType: 'paternity',
    isPaid: true,
    paymentPercentage: 100,
    description: 'Paternity leave is fully paid'
  },
  {
    leaveType: 'bereavement',
    isPaid: true,
    paymentPercentage: 100,
    maxPaidDaysPerYear: 3, // Example: 3 paid bereavement days per year
    description: 'Bereavement leave is fully paid up to 3 days per year'
  },
  {
    leaveType: 'personal',
    isPaid: false,
    paymentPercentage: 0,
    description: 'Personal leave is unpaid'
  },
  {
    leaveType: 'other',
    isPaid: false,
    paymentPercentage: 0,
    description: 'Other leave types are unpaid by default'
  }
];

/**
 * Get payment policy for a specific leave type
 */
export function getLeavePaymentPolicy(leaveType: string): LeavePaymentPolicy | undefined {
  return LEAVE_PAYMENT_POLICIES.find(policy => policy.leaveType === leaveType);
}

/**
 * Check if a leave type is paid
 */
export function isLeaveTypePaid(leaveType: string): boolean {
  const policy = getLeavePaymentPolicy(leaveType);
  return policy?.isPaid || false;
}

/**
 * Get payment percentage for a leave type
 */
export function getLeavePaymentPercentage(leaveType: string): number {
  const policy = getLeavePaymentPolicy(leaveType);
  return policy?.paymentPercentage || 0;
}

/**
 * Get maximum paid days per year for a leave type
 */
export function getMaxPaidDaysPerYear(leaveType: string): number | undefined {
  const policy = getLeavePaymentPolicy(leaveType);
  return policy?.maxPaidDaysPerYear;
}

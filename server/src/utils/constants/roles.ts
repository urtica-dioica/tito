// User roles for the TITO HR Management System
export const USER_ROLES = {
  HR: 'hr',
  EMPLOYEE: 'employee',
  DEPARTMENT_HEAD: 'department_head',
} as const;

// Type for user roles
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY = {
  [USER_ROLES.EMPLOYEE]: 1,
  [USER_ROLES.DEPARTMENT_HEAD]: 2,
  [USER_ROLES.HR]: 3,
} as const;

// Role descriptions
export const ROLE_DESCRIPTIONS = {
  [USER_ROLES.HR]: 'HR Administrator - Full system access and user management',
  [USER_ROLES.DEPARTMENT_HEAD]: 'Department Head - Department-specific access',
  [USER_ROLES.EMPLOYEE]: 'Employee - Personal access only',
} as const;

// Role permissions mapping
export const ROLE_PERMISSIONS = {
  [USER_ROLES.HR]: {
    // User Management
    canCreateUsers: true,
    canUpdateUsers: true,
    canDeleteUsers: true,
    canViewAllUsers: true,
    
    // Employee Management
    canCreateEmployees: true,
    canUpdateEmployees: true,
    canDeleteEmployees: true,
    canViewAllEmployees: true,
    
    // Department Management
    canCreateDepartments: true,
    canUpdateDepartments: true,
    canDeleteDepartments: true,
    canViewAllDepartments: true,
    canAssignDepartmentHeads: true,
    
    // Payroll Management
    canCreatePayrollPeriods: true,
    canUpdatePayrollPeriods: true,
    canDeletePayrollPeriods: true,
    canViewAllPayrolls: true,
    canApprovePayrolls: true,
    
    // System Settings
    canUpdateSystemSettings: true,
    canViewSystemSettings: true,
    canGenerateReports: true,
    
    // ID Card Management
    canGenerateIDCards: true,
    canViewAllIDCards: true,
    canUpdateIDCards: true,
    
    // Request Management (View Only)
    canViewAllRequests: true,
    cannotApproveRequests: true, // HR cannot approve time corrections or overtime
    
    // Audit & Compliance
    canViewAuditLogs: true,
    canExportData: true,
  },
  
  [USER_ROLES.DEPARTMENT_HEAD]: {
    // User Management
    canCreateUsers: false,
    canUpdateUsers: false,
    canDeleteUsers: false,
    canViewAllUsers: false,
    
    // Employee Management
    canCreateEmployees: false,
    canUpdateEmployees: false,
    canDeleteEmployees: false,
    canViewAllEmployees: false,
    canViewDepartmentEmployees: true,
    
    // Department Management
    canCreateDepartments: false,
    canUpdateDepartments: false,
    canDeleteDepartments: false,
    canViewAllDepartments: false,
    canViewOwnDepartment: true,
    canAssignDepartmentHeads: false,
    
    // Payroll Management
    canCreatePayrollPeriods: false,
    canUpdatePayrollPeriods: false,
    canDeletePayrollPeriods: false,
    canViewAllPayrolls: false,
    canViewDepartmentPayrolls: true,
    canApproveDepartmentPayrolls: true,
    
    // System Settings
    canUpdateSystemSettings: false,
    canViewSystemSettings: false,
    canGenerateReports: false,
    
    // ID Card Management
    canGenerateIDCards: false,
    canViewAllIDCards: false,
    canViewDepartmentIDCards: true,
    canUpdateIDCards: false,
    
    // Request Management (Approval Authority)
    canViewAllRequests: false,
    canViewDepartmentRequests: true,
    canApproveTimeCorrections: true,
    canApproveOvertimeRequests: true,
    canApproveLeaveRequests: true,
    
    // Audit & Compliance
    canViewAuditLogs: false,
    canViewDepartmentAuditLogs: true,
    canExportData: false,
  },
  
  [USER_ROLES.EMPLOYEE]: {
    // User Management
    canCreateUsers: false,
    canUpdateUsers: false,
    canDeleteUsers: false,
    canViewAllUsers: false,
    canUpdateOwnProfile: true,
    
    // Employee Management
    canCreateEmployees: false,
    canUpdateEmployees: false,
    canDeleteEmployees: false,
    canViewAllEmployees: false,
    canViewOwnProfile: true,
    
    // Department Management
    canCreateDepartments: false,
    canUpdateDepartments: false,
    canDeleteDepartments: false,
    canViewAllDepartments: false,
    canViewOwnDepartment: true,
    canAssignDepartmentHeads: false,
    
    // Payroll Management
    canCreatePayrollPeriods: false,
    canUpdatePayrollPeriods: false,
    canDeletePayrollPeriods: false,
    canViewAllPayrolls: false,
    canViewOwnPayrolls: true,
    canApprovePayrolls: false,
    
    // System Settings
    canUpdateSystemSettings: false,
    canViewSystemSettings: false,
    canGenerateReports: false,
    
    // ID Card Management
    canGenerateIDCards: false,
    canViewAllIDCards: false,
    canViewOwnIDCard: true,
    canUpdateIDCards: false,
    
    // Request Management (Submission Only)
    canViewAllRequests: false,
    canViewOwnRequests: true,
    canSubmitTimeCorrections: true,
    canSubmitOvertimeRequests: true,
    canSubmitLeaveRequests: true,
    canApproveRequests: false,
    
    // Attendance Management
    canClockIn: true,
    canClockOut: true,
    canViewOwnAttendance: true,
    canSubmitSelfie: true,
    
    // Audit & Compliance
    canViewAuditLogs: false,
    canViewOwnAuditLogs: true,
    canExportData: false,
  },
} as const;

// Check if a role has a specific permission
export const hasPermission = (role: UserRole, permission: keyof typeof ROLE_PERMISSIONS[UserRole]): boolean => {
  return ROLE_PERMISSIONS[role][permission] || false;
};

// Check if a role can access another role's data
export const canAccessRole = (userRole: UserRole, targetRole: UserRole): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[targetRole];
};

// Get all permissions for a role
export const getRolePermissions = (role: UserRole): typeof ROLE_PERMISSIONS[UserRole] => {
  return ROLE_PERMISSIONS[role];
};

// Validate if a role is valid
export const isValidRole = (role: string): role is UserRole => {
  return Object.values(USER_ROLES).includes(role as UserRole);
};

// Get role display name
export const getRoleDisplayName = (role: UserRole): string => {
  const displayNames = {
    [USER_ROLES.HR]: 'HR Admin',
    [USER_ROLES.DEPARTMENT_HEAD]: 'Department Head',
    [USER_ROLES.EMPLOYEE]: 'Employee',
  };
  return displayNames[role];
}; 
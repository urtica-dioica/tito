import { Router } from 'express';
import authRoutes from './auth/authRoutes';
import redisRoutes from './redis/redisRoutes';
import hrEmployeeRoutes from './hr/employeeRoutes';
import departmentRoutes from './hr/departmentRoutes';
import systemRoutes from './hr/systemRoutes';
import idCardRoutes from './hr/idCardRoutes';
import dashboardRoutes from './hr/dashboardRoutes';
import attendanceRoutes from './attendance/attendanceRoutes';
import timeCorrectionRoutes from './attendance/timeCorrectionRoutes';
import overtimeRoutes from './attendance/overtimeRoutes';
import leaveRoutes from './leave/leaveRoutes';
import payrollRoutes from './payroll/payrollRoutes';
import departmentHeadRoutes from './department-head/departmentHeadRoutes';
import auditRoutes from './audit/auditRoutes';
import kioskRoutes from './kiosk/kioskRoutes';
import employeeRoutes from './employee/employeeRoutes';
import leaveBalanceRoutes from './hr/leaveBalanceRoutes';
import hrRequestRoutes from './hr/requestRoutes';
import schedulerRoutes from './scheduler/schedulerRoutes';

const router = Router();

// API version prefix
const API_VERSION = '/api/v1';

// Mount routes
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/redis`, redisRoutes);
router.use(`${API_VERSION}/hr/employees`, hrEmployeeRoutes);
router.use(`${API_VERSION}/hr/departments`, departmentRoutes);
router.use(`${API_VERSION}/hr/system`, systemRoutes);
router.use(`${API_VERSION}/hr/id-cards`, idCardRoutes);
router.use(`${API_VERSION}/hr/dashboard`, dashboardRoutes);
router.use(`${API_VERSION}/attendance`, attendanceRoutes);
router.use(`${API_VERSION}/time-corrections`, timeCorrectionRoutes);
router.use(`${API_VERSION}/overtime`, overtimeRoutes);
router.use(`${API_VERSION}/leaves`, leaveRoutes);
router.use(`${API_VERSION}/payroll`, payrollRoutes);
router.use(`${API_VERSION}/department-head`, departmentHeadRoutes);
router.use(`${API_VERSION}/audit`, auditRoutes);
router.use(`${API_VERSION}/kiosk`, kioskRoutes);
router.use(`${API_VERSION}/employee`, employeeRoutes);
router.use(`${API_VERSION}/hr/leave-balances`, leaveBalanceRoutes);
router.use(`${API_VERSION}/hr/requests`, hrRequestRoutes);
router.use(`${API_VERSION}/scheduler`, schedulerRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env['NODE_ENV'] || 'development'
  });
});

// Root endpoint
router.get('/', (_req, res) => {
  res.json({
    message: 'TITO HR Management System API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: `${API_VERSION}/auth`,
      redis: `${API_VERSION}/redis`,
      hr: {
        employees: `${API_VERSION}/hr/employees`,
        departments: `${API_VERSION}/hr/departments`,
        system: `${API_VERSION}/hr/system`,
        idCards: `${API_VERSION}/hr/id-cards`,
        dashboard: `${API_VERSION}/hr/dashboard`
      },
      attendance: `${API_VERSION}/attendance`,
      timeCorrections: `${API_VERSION}/time-corrections`,
      overtime: `${API_VERSION}/overtime`,
      leaves: `${API_VERSION}/leaves`,
      payroll: `${API_VERSION}/payroll`,
      departmentHead: `${API_VERSION}/department-head`,
      kiosk: `${API_VERSION}/kiosk`,
      employee: `${API_VERSION}/employee`,
      hrLeaveBalances: `${API_VERSION}/hr/leave-balances`,
      health: '/health'
    }
  });
});

export default router; 
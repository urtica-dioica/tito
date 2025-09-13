import { EmployeeService } from '../../../src/services/employee/employeeService';
import { getPool } from '../../../src/config/database';

// Mock the dependencies
jest.mock('../../../src/config/database');

const mockGetPool = getPool as jest.MockedFunction<typeof getPool>;

describe('EmployeeService', () => {
  let employeeService: EmployeeService;
  let mockPool: any;

  beforeEach(() => {
    employeeService = new EmployeeService();
    jest.clearAllMocks();

    // Mock database pool
    mockPool = {
      query: jest.fn(),
      connect: jest.fn().mockResolvedValue({
        query: jest.fn(),
        release: jest.fn()
      })
    };
    mockGetPool.mockReturnValue(mockPool);
  });

  describe('getEmployeeIdByUserId', () => {
    it('should return employee ID for valid user ID', async () => {
      // Arrange
      mockPool.query.mockResolvedValue({
        rows: [{ id: 'emp-123' }]
      });

      // Act
      const result = await employeeService.getEmployeeIdByUserId('user-123');

      // Assert
      expect(result).toBe('emp-123');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT\s+id\s+FROM\s+employees\s+WHERE\s+user_id\s+=\s+\$1/),
        ['user-123']
      );
    });

    it('should return null if employee not found', async () => {
      // Arrange
      mockPool.query.mockResolvedValue({ rows: [] });

      // Act
      const result = await employeeService.getEmployeeIdByUserId('user-123');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getDashboard', () => {
    const mockEmployeeInfo = {
      id: 'emp-123',
      name: 'John Doe',
      employee_id: 'EMP001',
      department: 'Engineering',
        position: 'Software Developer',
      hire_date: '2023-01-01',
      profile_picture: 'profile.jpg'
    };

    const mockTodayAttendance = {
      today_status: 'present',
      clock_in_time: '08:30:00',
      clock_out_time: '17:30:00',
      total_hours: 8.5,
      morning_clock_in: '08:30:00',
      morning_clock_out: '12:00:00',
      afternoon_clock_in: '13:00:00',
      afternoon_clock_out: '17:30:00',
      break_start: '12:00:00',
      break_end: '13:00:00'
    };

    const mockMonthlyStats = {
      monthly_present: 20,
      monthly_absent: 2,
      monthly_late: 3
    };

    const mockLeaveBalance = {
      vacation: 10,
      sick: 8,
      maternity: 0,
      other: 2
    };

    const mockRecentActivity = [
      {
        id: 'act-123',
        type: 'clock_in',
        description: 'Clocked in at 08:30',
        timestamp: '2024-01-15T08:30:00Z',
        status: 'success'
      }
    ];

    it('should return employee dashboard successfully', async () => {
      // Arrange - Mock all database queries with appropriate responses
      mockPool.query.mockImplementation((query: string, _params: any[]) => {
        if (query.includes('CONCAT(u.first_name') && query.includes('employees e')) {
          // getEmployeeInfo query
          return Promise.resolve({ rows: [mockEmployeeInfo] });
        }
        if (query.includes('attendance_records ar') && query.includes('ar.employee_id = $1 AND ar.date = $2')) {
          // getTodayAttendanceStatus - attendance record query
          return Promise.resolve({ rows: [mockTodayAttendance] });
        }
        if (query.includes('attendance_sessions s') && query.includes('ar.employee_id = $1 AND ar.date = $2')) {
          // getTodayAttendanceStatus - sessions query
          return Promise.resolve({ rows: [] });
        }
        if (query.includes('COUNT(*) FILTER') && query.includes('overall_status')) {
          // getMonthlyAttendanceStats query
          return Promise.resolve({ rows: [mockMonthlyStats] });
        }
        if (query.includes('leave_balances') && query.includes('employee_id = $1')) {
          // getLeaveBalance query
          return Promise.resolve({ rows: [mockLeaveBalance] });
        }
        if (query.includes('attendance_sessions s') && query.includes('ORDER BY s.created_at DESC')) {
          // getRecentActivity query
          return Promise.resolve({ rows: mockRecentActivity });
        }
        if (query.includes('time_correction_requests') && query.includes('status = \'pending\'')) {
          // getPendingRequestsCount query - complex subquery
          return Promise.resolve({ rows: [{ total: '3' }] });
        }
        // Default empty result for any other queries
        return Promise.resolve({ rows: [] });
      });

      // Act
      const result = await employeeService.getDashboard('emp-123');

      // Assert
      expect(result).toEqual({
        employee: {
          id: 'emp-123',
          name: 'John Doe',
          employeeId: 'EMP001',
          department: 'Engineering',
          position: 'Software Developer',
          hireDate: '2023-01-01',
          profilePicture: 'profile.jpg'
        },
        attendance: {
          todayStatus: 'present',
          clockInTime: '08:30:00',
          clockOutTime: '17:30:00',
          totalHours: 8.5,
          morningClockIn: '08:30:00',
          morningClockOut: '12:00:00',
          afternoonClockIn: '13:00:00',
          afternoonClockOut: '17:30:00',
          breakStart: '12:00:00',
          breakEnd: '13:00:00',
          monthlyPresent: 20,
          monthlyAbsent: 2,
          monthlyLate: 3
        },
        leaveBalance: {
          vacation: 10,
          sick: 8,
          maternity: 0,
          other: 2
        },
        recentActivity: [
          {
            id: 'act-123',
            type: 'clock_in',
            description: 'Clocked in at 08:30',
            timestamp: '2024-01-15T08:30:00Z',
            status: 'success'
          }
        ],
        pendingRequests: 3,
        upcomingEvents: []
      });
    });

    it('should handle missing employee info gracefully', async () => {
      // Arrange
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // getEmployeeInfo - no employee found
        .mockResolvedValueOnce({ rows: [] }) // getTodayAttendanceStatus
        .mockResolvedValueOnce({ rows: [] }) // getMonthlyAttendanceStats
        .mockResolvedValueOnce({ rows: [] }) // getLeaveBalance
        .mockResolvedValueOnce({ rows: [] }) // getRecentActivity
        .mockResolvedValueOnce({ rows: [{ total: '0' }] }) // getPendingRequestsCount
        .mockResolvedValueOnce({ rows: [] }); // getUpcomingEvents

      // Mock the combined query for getPendingRequestsCount
      mockPool.query.mockResolvedValueOnce({ rows: [{ total: '0' }] }); // getPendingRequestsCount combined query

      // Act & Assert - should throw error for missing employee
      await expect(employeeService.getDashboard('emp-123'))
        .rejects.toThrow('Employee not found');
    });
  });

  describe('getEmployeeProfile', () => {
    const mockProfile = {
      id: 'emp-123',
      employeeId: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@company.com',
      phone: '+1234567890',
      address: '123 Main St',
      department: 'Engineering',
      position: 'Software Developer',
      employmentType: 'regular',
      hireDate: '2023-01-01',
      baseSalary: 50000,
      status: 'active'
    };

    it('should return employee profile successfully', async () => {
      // Arrange
      mockPool.query.mockResolvedValue({ rows: [mockProfile] });

      // Act
      const result = await employeeService.getEmployeeProfile('emp-123');

      // Assert
      expect(result).toEqual({
        id: 'emp-123',
        employeeId: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        phone: '+1234567890',
        address: '123 Main St',
        department: 'Engineering',
        position: 'Software Developer',
        employmentType: 'regular',
        hireDate: '2023-01-01',
        baseSalary: 50000,
        status: 'active'
      });
    });

    it('should throw error if employee not found', async () => {
      // Arrange
      mockPool.query.mockResolvedValue({ rows: [] });

      // Act & Assert
      await expect(employeeService.getEmployeeProfile('emp-123'))
        .rejects.toThrow('Employee not found');
    });
  });

  describe('updateEmployeeProfile', () => {
    const updateData = {
      phone: '+1234567890',
      address: '123 Main St'
    };

    it('should update employee profile successfully', async () => {
      // Arrange
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [{ id: 'emp-123' }] }) // check employee exists
          .mockResolvedValueOnce({ rows: [] }) // update user table
          .mockResolvedValueOnce(undefined) // COMMIT
          .mockResolvedValueOnce({ rows: [{ id: 'emp-123', first_name: 'John', last_name: 'Doe', email: 'john.doe@company.com', phone: '+1234567890', address: '123 Main St' }] }), // get updated profile
        release: jest.fn()
      };

      mockPool.connect.mockResolvedValue(mockClient);
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'emp-123', first_name: 'John', last_name: 'Doe', email: 'john.doe@company.com', phone: '+1234567890', address: '123 Main St' }] }); // getEmployeeProfile call

      // Act
      const result = await employeeService.updateEmployeeProfile('emp-123', updateData);

      // Assert
      expect(result).toBeDefined();
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw error if employee not found', async () => {
      // Arrange
      mockPool.query.mockResolvedValue({ rows: [] });

      // Act & Assert
      await expect(employeeService.updateEmployeeProfile('emp-123', updateData))
        .rejects.toThrow('Employee not found');
    });
  });

  describe('getAttendanceHistory', () => {
    const mockAttendanceHistory = [
      {
        id: 'att-123',
        date: '2024-01-15',
        clockIn: '08:30:00',
        clockOut: '17:30:00',
        totalHours: 8.5,
        status: 'present',
        overtimeHours: 0,
        notes: ''
      }
    ];

    it('should return attendance history successfully', async () => {
      // Arrange
      mockPool.query.mockResolvedValue({ rows: mockAttendanceHistory });

      // Act
      const result = await employeeService.getAttendanceHistory('emp-123', '2024-01');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'att-123',
        date: '2024-01-15',
        clockIn: '08:30:00',
        clockOut: '17:30:00',
        totalHours: 8.5,
        status: 'present',
        overtimeHours: 0,
        notes: ''
      });
    });

    it('should use current month if month not provided', async () => {
      // Arrange
      // const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      mockPool.query.mockResolvedValue({ rows: [] });

      // Act
      await employeeService.getAttendanceHistory('emp-123');

      // Assert
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE ar.employee_id = $1'),
        ['emp-123']
      );
    });
  });

  describe('getAttendanceSummary', () => {
    const mockSummary = {
      total_days: 22,
      present_days: 20,
      absent_days: 1,
      late_days: 1,
      total_hours: 160,
      average_hours: 8.0,
      overtime_hours: 0
    };

    it('should return attendance summary successfully', async () => {
      // Arrange
      mockPool.query.mockResolvedValue({ rows: [mockSummary] });

      // Act
      const result = await employeeService.getAttendanceSummary('emp-123', '2024-01');

      // Assert
      expect(result).toEqual({
        totalDays: 22,
        presentDays: 20,
        absentDays: 1,
        lateDays: 1,
        totalHours: 160,
        averageHours: 8.0,
        overtimeHours: 0
      });
    });
  });

  describe('getEmployeeRequests', () => {
    const mockRequests = [
      {
        id: 'req-123',
        type: 'time_correction',
        status: 'pending',
        submittedAt: '2024-01-15T10:00:00Z',
        approverName: null,
        approvedAt: null,
        rejectionReason: '',
        details: {
          date: '2024-01-15',
          reason: 'Forgot to clock out'
        }
      }
    ];

    it('should return employee requests successfully', async () => {
      // Arrange
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // leave requests
        .mockResolvedValueOnce({ rows: mockRequests }) // time correction requests
        .mockResolvedValueOnce({ rows: [] }); // overtime requests

      // Act
      const result = await employeeService.getEmployeeRequests('emp-123', {
        type: 'time_correction',
        status: 'pending',
        limit: 10,
        offset: 0
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'req-123',
        type: 'time_correction',
        status: 'pending',
        submittedAt: '2024-01-15T10:00:00Z',
        approverName: null,
        approvedAt: null,
        rejectionReason: '',
        details: {
          date: '2024-01-15',
          reason: 'Forgot to clock out'
        }
      });
    });
  });

  describe('getRequestStats', () => {
    const mockStats = {
      total: 10,
      pending: 3,
      approved: 6,
      rejected: 1
    };

    it('should return request stats successfully', async () => {
      // Arrange
      mockPool.query.mockResolvedValue({ rows: [mockStats] });

      // Act
      const result = await employeeService.getRequestStats('emp-123');

      // Assert
      expect(result).toEqual({
        total: 10,
        pending: 3,
        approved: 6,
        rejected: 1
      });
    });
  });

  describe('getLatestPaystub', () => {
    const mockPaystub = {
      id: 'paystub-123',
      payroll_period_id: 'period-123',
      period_name: 'January 2024',
      employee_id: 'emp-123',
      employee_name: 'John Doe',
      position: 'Software Developer',
      department_name: 'Engineering',
      base_salary: 5000,
      total_regular_hours: 160,
      total_overtime_hours: 0,
      total_late_hours: 0,
      paid_leave_hours: 0,
      gross_pay: 5000,
      total_deductions: 1000,
      total_benefits: 500,
      net_pay: 4500,
      late_deductions: 0,
      status: 'processed',
      created_at: '2024-01-31T10:00:00Z'
    };

    it('should return latest paystub successfully', async () => {
      // Arrange
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockPaystub] }) // main payroll record
        .mockResolvedValueOnce({ rows: [] }) // deductions
        .mockResolvedValueOnce({ rows: [] }); // benefits

      // Act
      const result = await employeeService.getLatestPaystub('emp-123');

      // Assert
      expect(result).toEqual({
        id: 'paystub-123',
        periodName: 'January 2024',
        periodStartDate: undefined,
        periodEndDate: undefined,
        employeeId: 'emp-123',
        employeeName: 'John Doe',
        position: 'Software Developer',
        department: 'Engineering',
        baseSalary: 5000,
        totalRegularHours: 160,
        totalOvertimeHours: 0,
        paidLeaveHours: 0,
        grossPay: 5000,
        totalDeductions: 1000,
        totalBenefits: 500,
        netPay: 4500,
        lateDeductions: 0,
        deductions: [],
        benefits: [],
        createdAt: '2024-01-31T10:00:00Z'
      });
    });
  });


  describe('getEmployeePaystubs', () => {
    const mockPaystubs = [
      {
        id: 'paystub-123',
        payroll_period_id: 'period-123',
        period_name: 'January 2024',
        period_start_date: '2024-01-01',
        period_end_date: '2024-01-31',
        employee_id: 'emp-123',
        employee_name: 'John Doe',
        position: 'Software Developer',
        department_id: 'dept-123',
        department_name: 'Engineering',
        base_salary: 5000,
        total_regular_hours: 160,
        total_overtime_hours: 0,
        total_late_hours: 0,
        paid_leave_hours: 0,
        gross_pay: 5000,
        total_deductions: 1000,
        total_benefits: 500,
        net_pay: 4500,
        late_deductions: 0,
        status: 'processed',
        created_at: '2024-01-31T10:00:00Z',
        updated_at: '2024-01-31T10:00:00Z'
      }
    ];

    it('should return employee paystubs successfully', async () => {
      // Arrange
      mockPool.query
        .mockResolvedValueOnce({ rows: mockPaystubs }) // get paystubs
        .mockResolvedValueOnce({ rows: [] }) // deductions for first paystub
        .mockResolvedValueOnce({ rows: [] }); // benefits for first paystub

      // Act
      const result = await employeeService.getEmployeePaystubs('emp-123', {
        page: 1,
        limit: 10,
        year: 2024
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'paystub-123',
        periodName: 'January 2024',
        periodStartDate: '2024-01-01',
        periodEndDate: '2024-01-31',
        employeeId: 'emp-123',
        employeeName: 'John Doe',
        position: 'Software Developer',
        department: 'Engineering',
        baseSalary: 5000,
        totalRegularHours: 160,
        totalOvertimeHours: 0,
        paidLeaveHours: 0,
        grossPay: 5000,
        totalDeductions: 1000,
        totalBenefits: 500,
        netPay: 4500,
        lateDeductions: 0,
        deductions: [],
        benefits: [],
        createdAt: '2024-01-31T10:00:00Z'
      });
    });
  });
});
// Main App Component with Routing for TITO HR Management System
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { AppLayout } from './components/layout';

// Pages
import Login from './pages/Login';
import SetupPassword from './pages/SetupPassword';

// HR Pages
import HRDashboard from './pages/hr/Dashboard';
import HREmployeeManagement from './pages/hr/EmployeeManagement';
import HRDepartmentManagement from './pages/hr/DepartmentManagement';
import HRPayrollManagement from './pages/hr/PayrollManagement';
import HRSettings from './pages/hr/Settings';
import HRRequests from './pages/hr/Requests';

// Department Head Pages
import DepartmentHeadDashboard from './pages/dept/Dashboard';
import DepartmentHeadEmployees from './pages/dept/Employees';
import DepartmentHeadPayrolls from './pages/dept/Payrolls';
import DepartmentHeadRequests from './pages/dept/Requests';

// Employee Pages
import EmployeeDashboard from './pages/employee/Dashboard';
import EmployeeAttendance from './pages/employee/Attendance';
import EmployeeRequests from './pages/employee/Requests';

// Kiosk Pages
import KioskAttendance from './pages/kiosk/Attendance';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
    },
  },
});


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/setup-password" element={<SetupPassword />} />
            <Route path="/kiosk" element={<KioskAttendance />} />
            
            {/* HR Routes */}
            <Route path="/hr/*" element={
              <ProtectedRoute allowedRoles={['hr']}>
                <AppLayout role="hr">
                  <Routes>
                    <Route path="dashboard" element={<HRDashboard />} />
                    <Route path="employees" element={<HREmployeeManagement />} />
                    <Route path="departments" element={<HRDepartmentManagement />} />
                    <Route path="payroll" element={<HRPayrollManagement />} />
                    <Route path="requests" element={<HRRequests />} />
                    <Route path="settings" element={<HRSettings />} />
                    <Route path="*" element={<Navigate to="/hr/dashboard" replace />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            } />
            
            {/* Department Head Routes */}
            <Route path="/dept/*" element={
              <ProtectedRoute allowedRoles={['department_head']}>
                <AppLayout role="department_head">
                  <Routes>
                    <Route path="dashboard" element={<DepartmentHeadDashboard />} />
                    <Route path="employees" element={<DepartmentHeadEmployees />} />
                    <Route path="payrolls" element={<DepartmentHeadPayrolls />} />
                    <Route path="requests" element={<DepartmentHeadRequests />} />
                    <Route path="*" element={<Navigate to="/dept/dashboard" replace />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            } />
            
            {/* Employee Routes */}
            <Route path="/employee/*" element={
              <ProtectedRoute allowedRoles={['employee']}>
                <AppLayout role="employee">
                  <Routes>
                    <Route path="dashboard" element={<EmployeeDashboard />} />
                    <Route path="attendance" element={<EmployeeAttendance />} />
                    <Route path="requests" element={<EmployeeRequests />} />
                    <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            } />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
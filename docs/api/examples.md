# 💡 API Examples and Code Samples

This document provides comprehensive examples and code samples for using the TITO HR Management System API.

## 🚀 Quick Start Examples

### Basic Authentication Flow

#### JavaScript/Node.js
```javascript
const axios = require('axios');

// Configure API client
const api = axios.create({
  baseURL: 'https://api.tito-hr.com/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Login function
async function login(username, password) {
  try {
    const response = await api.post('/auth/login', {
      username,
      password
    });
    
    const { token, user } = response.data.data;
    
    // Set authorization header for future requests
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    console.log('Login successful:', user);
    return { token, user };
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
login('hr@company.com', 'securepassword')
  .then(({ token, user }) => {
    console.log('Authenticated as:', user.role);
  })
  .catch(error => {
    console.error('Authentication failed:', error);
  });
```

#### Python
```python
import requests
import json

class TitoHRAPI:
    def __init__(self, base_url='https://api.tito-hr.com/v1'):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json'
        })
        self.token = None
    
    def login(self, username, password):
        """Authenticate user and store token"""
        try:
            response = self.session.post(
                f'{self.base_url}/auth/login',
                json={'username': username, 'password': password}
            )
            response.raise_for_status()
            
            data = response.json()
            self.token = data['data']['token']
            self.session.headers.update({
                'Authorization': f'Bearer {self.token}'
            })
            
            print(f"Login successful: {data['data']['user']['role']}")
            return data['data']
        except requests.exceptions.RequestException as e:
            print(f"Login failed: {e}")
            raise
    
    def get_employees(self, page=1, limit=20):
        """Get list of employees"""
        try:
            response = self.session.get(
                f'{self.base_url}/hr/employees',
                params={'page': page, 'limit': limit}
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Failed to get employees: {e}")
            raise

# Usage
api = TitoHRAPI()
api.login('hr@company.com', 'securepassword')
employees = api.get_employees()
print(f"Found {len(employees['data']['employees'])} employees")
```

#### PHP
```php
<?php

class TitoHRAPI {
    private $baseUrl;
    private $token;
    private $httpClient;
    
    public function __construct($baseUrl = 'https://api.tito-hr.com/v1') {
        $this->baseUrl = $baseUrl;
        $this->httpClient = new GuzzleHttp\Client([
            'base_uri' => $baseUrl,
            'timeout' => 10,
            'headers' => [
                'Content-Type' => 'application/json'
            ]
        ]);
    }
    
    public function login($username, $password) {
        try {
            $response = $this->httpClient->post('/auth/login', [
                'json' => [
                    'username' => $username,
                    'password' => $password
                ]
            ]);
            
            $data = json_decode($response->getBody(), true);
            $this->token = $data['data']['token'];
            
            // Update headers with token
            $this->httpClient = new GuzzleHttp\Client([
                'base_uri' => $this->baseUrl,
                'timeout' => 10,
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Authorization' => 'Bearer ' . $this->token
                ]
            ]);
            
            echo "Login successful: " . $data['data']['user']['role'] . "\n";
            return $data['data'];
        } catch (Exception $e) {
            echo "Login failed: " . $e->getMessage() . "\n";
            throw $e;
        }
    }
    
    public function getEmployees($page = 1, $limit = 20) {
        try {
            $response = $this->httpClient->get('/hr/employees', [
                'query' => [
                    'page' => $page,
                    'limit' => $limit
                ]
            ]);
            
            return json_decode($response->getBody(), true);
        } catch (Exception $e) {
            echo "Failed to get employees: " . $e->getMessage() . "\n";
            throw $e;
        }
    }
}

// Usage
$api = new TitoHRAPI();
$api->login('hr@company.com', 'securepassword');
$employees = $api->getEmployees();
echo "Found " . count($employees['data']['employees']) . " employees\n";
?>
```

## 👥 Employee Management Examples

### Complete Employee Lifecycle

#### 1. Create Department
```javascript
async function createDepartment(name, description, headId) {
  try {
    const response = await api.post('/hr/departments', {
      name,
      description,
      head_id: headId
    });
    
    console.log('Department created:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Failed to create department:', error.response?.data);
    throw error;
  }
}

// Usage
const department = await createDepartment(
  'Engineering',
  'Software development team',
  'user-uuid-here'
);
```

#### 2. Create Employee
```javascript
async function createEmployee(employeeData) {
  try {
    const response = await api.post('/hr/employees', employeeData);
    
    console.log('Employee created:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Failed to create employee:', error.response?.data);
    throw error;
  }
}

// Usage
const employee = await createEmployee({
  name: 'John Doe',
  email: 'john.doe@company.com',
  position: 'Senior Developer',
  department_id: department.id,
  hire_date: '2024-01-15',
  base_salary: 75000,
  employment_type: 'regular',
  phone: '+1-555-0123',
  address: '123 Main St, City, State'
});
```

#### 3. Update Employee
```javascript
async function updateEmployee(employeeId, updates) {
  try {
    const response = await api.put(`/hr/employees/${employeeId}`, updates);
    
    console.log('Employee updated:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Failed to update employee:', error.response?.data);
    throw error;
  }
}

// Usage
const updatedEmployee = await updateEmployee(employee.id, {
  base_salary: 80000,
  position: 'Lead Developer'
});
```

#### 4. Get Employee Details
```javascript
async function getEmployee(employeeId) {
  try {
    const response = await api.get(`/hr/employees/${employeeId}`);
    
    console.log('Employee details:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Failed to get employee:', error.response?.data);
    throw error;
  }
}

// Usage
const employeeDetails = await getEmployee(employee.id);
```

#### 5. List Employees with Filtering
```javascript
async function listEmployees(filters = {}) {
  try {
    const response = await api.get('/hr/employees', {
      params: filters
    });
    
    console.log('Employees:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Failed to list employees:', error.response?.data);
    throw error;
  }
}

// Usage examples
const allEmployees = await listEmployees();
const activeEmployees = await listEmployees({ status: 'active' });
const engineeringEmployees = await listEmployees({ 
  department_id: department.id,
  status: 'active'
});
const searchResults = await listEmployees({ 
  search: 'john',
  page: 1,
  limit: 10
});
```

## 💰 Payroll Management Examples

### Complete Payroll Processing Flow

#### 1. Generate Payroll
```javascript
async function generatePayroll(period, employeeIds = []) {
  try {
    const response = await api.post('/hr/payroll/generate', {
      period,
      employee_ids: employeeIds
    });
    
    console.log('Payroll generated:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Failed to generate payroll:', error.response?.data);
    throw error;
  }
}

// Usage
const payroll = await generatePayroll('2024-01');
// Or for specific employees
const specificPayroll = await generatePayroll('2024-01', [employee.id]);
```

#### 2. Get Payroll Records
```javascript
async function getPayrollRecords(filters = {}) {
  try {
    const response = await api.get('/hr/payroll', {
      params: filters
    });
    
    console.log('Payroll records:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Failed to get payroll records:', error.response?.data);
    throw error;
  }
}

// Usage examples
const allPayrolls = await getPayrollRecords();
const januaryPayrolls = await getPayrollRecords({ period: '2024-01' });
const employeePayrolls = await getPayrollRecords({ 
  employee_id: employee.id 
});
const processedPayrolls = await getPayrollRecords({ 
  status: 'processed' 
});
```

#### 3. Employee Paystub Access
```javascript
async function getEmployeePaystubs(filters = {}) {
  try {
    const response = await api.get('/employee/paystubs', {
      params: filters
    });
    
    console.log('Paystubs:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Failed to get paystubs:', error.response?.data);
    throw error;
  }
}

// Usage (employee perspective)
const paystubs = await getEmployeePaystubs();
const januaryPaystub = await getEmployeePaystubs({ period: '2024-01' });
```

## 📋 Leave Management Examples

### Complete Leave Request Flow

#### 1. Submit Leave Request (Employee)
```javascript
async function submitLeaveRequest(leaveData) {
  try {
    const response = await api.post('/employee/leaves', leaveData);
    
    console.log('Leave request submitted:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Failed to submit leave request:', error.response?.data);
    throw error;
  }
}

// Usage
const leaveRequest = await submitLeaveRequest({
  type: 'vacation',
  start_date: '2024-02-01',
  end_date: '2024-02-05',
  reason: 'Family vacation'
});
```

#### 2. Get Leave Requests (Employee)
```javascript
async function getEmployeeLeaves() {
  try {
    const response = await api.get('/employee/leaves');
    
    console.log('Leave requests:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Failed to get leave requests:', error.response?.data);
    throw error;
  }
}

// Usage
const leaves = await getEmployeeLeaves();
```

#### 3. Get Pending Leave Requests (Department Head)
```javascript
async function getPendingLeaveRequests() {
  try {
    const response = await api.get('/department-head/leaves/pending');
    
    console.log('Pending leave requests:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Failed to get pending leave requests:', error.response?.data);
    throw error;
  }
}

// Usage
const pendingLeaves = await getPendingLeaveRequests();
```

#### 4. Approve Leave Request (Department Head)
```javascript
async function approveLeaveRequest(leaveId, comments = '') {
  try {
    const response = await api.put(`/department-head/leaves/${leaveId}/approve`, {
      comments
    });
    
    console.log('Leave request approved:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Failed to approve leave request:', error.response?.data);
    throw error;
  }
}

// Usage
const approvedLeave = await approveLeaveRequest(
  leaveRequest.id,
  'Approved for family vacation'
);
```

#### 5. Reject Leave Request (Department Head)
```javascript
async function rejectLeaveRequest(leaveId, reason) {
  try {
    const response = await api.put(`/department-head/leaves/${leaveId}/reject`, {
      reason
    });
    
    console.log('Leave request rejected:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Failed to reject leave request:', error.response?.data);
    throw error;
  }
}

// Usage
const rejectedLeave = await rejectLeaveRequest(
  leaveRequest.id,
  'Insufficient leave balance'
);
```

## ⏰ Attendance Management Examples

### Complete Attendance Flow

#### 1. Kiosk QR Code Scan
```javascript
async function scanQRCode(qrCode) {
  try {
    const response = await api.post('/kiosk/scan', {
      qr_code: qrCode
    });
    
    console.log('QR code scanned:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Failed to scan QR code:', error.response?.data);
    throw error;
  }
}

// Usage
const scanResult = await scanQRCode('employee-qr-code-123');
```

#### 2. Clock In
```javascript
async function clockIn(employeeId, selfieImage) {
  try {
    const response = await api.post('/kiosk/clock-in', {
      employee_id: employeeId,
      selfie_image: selfieImage
    });
    
    console.log('Clock in successful:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Failed to clock in:', error.response?.data);
    throw error;
  }
}

// Usage
const clockInResult = await clockIn(
  employee.id,
  'base64-encoded-image-data'
);
```

#### 3. Clock Out
```javascript
async function clockOut(employeeId, selfieImage) {
  try {
    const response = await api.post('/kiosk/clock-out', {
      employee_id: employeeId,
      selfie_image: selfieImage
    });
    
    console.log('Clock out successful:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Failed to clock out:', error.response?.data);
    throw error;
  }
}

// Usage
const clockOutResult = await clockOut(
  employee.id,
  'base64-encoded-image-data'
);
```

#### 4. Get Attendance History (Employee)
```javascript
async function getAttendanceHistory(filters = {}) {
  try {
    const response = await api.get('/employee/attendance', {
      params: filters
    });
    
    console.log('Attendance history:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Failed to get attendance history:', error.response?.data);
    throw error;
  }
}

// Usage examples
const allAttendance = await getAttendanceHistory();
const januaryAttendance = await getAttendanceHistory({
  start_date: '2024-01-01',
  end_date: '2024-01-31'
});
const recentAttendance = await getAttendanceHistory({
  page: 1,
  limit: 10
});
```

## 📊 Dashboard Examples

### HR Dashboard
```javascript
async function getHRDashboard() {
  try {
    const response = await api.get('/hr/dashboard');
    
    console.log('HR Dashboard:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Failed to get HR dashboard:', error.response?.data);
    throw error;
  }
}

// Usage
const dashboard = await getHRDashboard();
console.log(`Total employees: ${dashboard.totalEmployees}`);
console.log(`Total departments: ${dashboard.totalDepartments}`);
console.log(`Pending requests: ${dashboard.pendingRequests}`);
```

### Employee Profile
```javascript
async function getEmployeeProfile() {
  try {
    const response = await api.get('/employee/profile');
    
    console.log('Employee profile:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Failed to get employee profile:', error.response?.data);
    throw error;
  }
}

// Usage
const profile = await getEmployeeProfile();
console.log(`Name: ${profile.name}`);
console.log(`Position: ${profile.position}`);
console.log(`Department: ${profile.department.name}`);
```

## 🔄 Error Handling Examples

### Comprehensive Error Handling
```javascript
async function handleAPIRequest(requestFunction) {
  try {
    const result = await requestFunction();
    return { success: true, data: result };
  } catch (error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          console.error('Bad Request:', data.message);
          if (data.errors) {
            console.error('Validation errors:', data.errors);
          }
          break;
        case 401:
          console.error('Unauthorized:', data.message);
          // Handle token refresh or re-login
          break;
        case 403:
          console.error('Forbidden:', data.message);
          // Handle insufficient permissions
          break;
        case 404:
          console.error('Not Found:', data.message);
          break;
        case 409:
          console.error('Conflict:', data.message);
          break;
        case 422:
          console.error('Validation Error:', data.message);
          if (data.errors) {
            console.error('Field errors:', data.errors);
          }
          break;
        case 429:
          console.error('Rate Limit Exceeded:', data.message);
          // Handle rate limiting
          break;
        case 500:
          console.error('Internal Server Error:', data.message);
          break;
        default:
          console.error('Unexpected error:', data.message);
      }
      
      return { 
        success: false, 
        error: data.message, 
        code: data.code,
        status 
      };
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.message);
      return { 
        success: false, 
        error: 'Network error', 
        code: 'NETWORK_ERROR' 
      };
    } else {
      // Other error
      console.error('Error:', error.message);
      return { 
        success: false, 
        error: error.message, 
        code: 'UNKNOWN_ERROR' 
      };
    }
  }
}

// Usage
const result = await handleAPIRequest(() => 
  api.get('/hr/employees')
);

if (result.success) {
  console.log('Success:', result.data);
} else {
  console.error('Failed:', result.error);
}
```

### Token Refresh Handling
```javascript
async function refreshToken() {
  try {
    const response = await api.post('/auth/refresh', {
      refreshToken: localStorage.getItem('refreshToken')
    });
    
    const { token } = response.data.data;
    localStorage.setItem('accessToken', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return token;
  } catch (error) {
    console.error('Token refresh failed:', error.response?.data);
    // Redirect to login
    window.location.href = '/login';
    throw error;
  }
}

// Interceptor for automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await refreshToken();
        // Retry original request
        return api.request(error.config);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
```

## 🔧 Utility Functions

### Pagination Helper
```javascript
async function getAllPages(endpoint, params = {}) {
  const allData = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    try {
      const response = await api.get(endpoint, {
        params: { ...params, page, limit: 100 }
      });
      
      const { data, pagination } = response.data.data;
      allData.push(...data);
      
      hasMore = page < pagination.pages;
      page++;
    } catch (error) {
      console.error('Failed to fetch page:', page, error);
      throw error;
    }
  }
  
  return allData;
}

// Usage
const allEmployees = await getAllPages('/hr/employees');
const allDepartments = await getAllPages('/hr/departments');
```

### Date Helper
```javascript
function formatDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Usage
const today = formatDate(new Date());
const currentMonth = getCurrentMonth();
```

### Validation Helper
```javascript
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

function validateRequired(value, fieldName) {
  if (!value || value.trim() === '') {
    throw new Error(`${fieldName} is required`);
  }
}

// Usage
try {
  validateRequired(employeeData.name, 'Name');
  validateEmail(employeeData.email);
  validatePhone(employeeData.phone);
} catch (error) {
  console.error('Validation error:', error.message);
}
```

---

**Last Updated**: January 27, 2025  
**API Version**: v1  
**Status**: ✅ **PRODUCTION READY**


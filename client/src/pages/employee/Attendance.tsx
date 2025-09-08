import React, { useState } from 'react';
import { Clock, Calendar, TrendingUp, Filter, Download, Eye } from 'lucide-react';
import Card from '../../components/shared/Card';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import PageLayout from '../../components/layout/PageLayout';

// Mock data types - TODO: Replace with actual types from API
interface AttendanceRecord {
  id: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  totalHours: number | null;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'holiday';
  overtimeHours?: number;
  notes?: string;
}

interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalHours: number;
  averageHours: number;
  overtimeHours: number;
}

const EmployeeAttendance: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterStatus, setFilterStatus] = useState('');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');

  // Mock data - TODO: Replace with actual API calls
  const attendanceRecords: AttendanceRecord[] = [
    {
      id: '1',
      date: '2025-01-15',
      clockIn: '2025-01-15T08:30:00Z',
      clockOut: null,
      totalHours: null,
      status: 'present',
      overtimeHours: 0,
    },
    {
      id: '2',
      date: '2025-01-14',
      clockIn: '2025-01-14T08:45:00Z',
      clockOut: '2025-01-14T17:30:00Z',
      totalHours: 8.75,
      status: 'late',
      overtimeHours: 0.75,
    },
    {
      id: '3',
      date: '2025-01-13',
      clockIn: '2025-01-13T08:00:00Z',
      clockOut: '2025-01-13T17:00:00Z',
      totalHours: 9,
      status: 'present',
      overtimeHours: 1,
    },
    {
      id: '4',
      date: '2025-01-12',
      clockIn: '2025-01-12T08:15:00Z',
      clockOut: '2025-01-12T17:15:00Z',
      totalHours: 9,
      status: 'present',
      overtimeHours: 1,
    },
    {
      id: '5',
      date: '2025-01-11',
      clockIn: null,
      clockOut: null,
      totalHours: 0,
      status: 'absent',
    },
    {
      id: '6',
      date: '2025-01-10',
      clockIn: '2025-01-10T08:00:00Z',
      clockOut: '2025-01-10T12:00:00Z',
      totalHours: 4,
      status: 'half_day',
    },
    {
      id: '7',
      date: '2025-01-09',
      clockIn: '2025-01-09T08:00:00Z',
      clockOut: '2025-01-09T17:00:00Z',
      totalHours: 9,
      status: 'present',
      overtimeHours: 1,
    },
    {
      id: '8',
      date: '2025-01-08',
      clockIn: '2025-01-08T08:30:00Z',
      clockOut: '2025-01-08T17:30:00Z',
      totalHours: 9,
      status: 'present',
      overtimeHours: 1,
    },
  ];

  const attendanceSummary: AttendanceSummary = {
    totalDays: 22,
    presentDays: 18,
    absentDays: 1,
    lateDays: 2,
    totalHours: 144.5,
    averageHours: 8.2,
    overtimeHours: 4.75,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'error';
      case 'late': return 'warning';
      case 'half_day': return 'warning';
      case 'holiday': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'late': return 'Late';
      case 'half_day': return 'Half Day';
      case 'holiday': return 'Holiday';
      default: return status;
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesStatus = !filterStatus || record.status === filterStatus;
    const recordMonth = record.date.slice(0, 7);
    const matchesMonth = recordMonth === selectedMonth;
    return matchesStatus && matchesMonth;
  });

  return (
    <PageLayout
      title="My Attendance"
      subtitle="Track your daily attendance and working hours"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Present Days</p>
              <p className="text-2xl font-bold text-text-primary">{attendanceSummary.presentDays}</p>
              <p className="text-xs text-text-secondary">
                of {attendanceSummary.totalDays} days
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Absent Days</p>
              <p className="text-2xl font-bold text-text-primary">{attendanceSummary.absentDays}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Total Hours</p>
              <p className="text-2xl font-bold text-text-primary">{attendanceSummary.totalHours}</p>
              <p className="text-xs text-text-secondary">
                Avg: {attendanceSummary.averageHours}h/day
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Overtime Hours</p>
              <p className="text-2xl font-bold text-text-primary">{attendanceSummary.overtimeHours}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-text-secondary" />
                <span className="text-sm font-medium text-text-secondary">Filters:</span>
              </div>
              
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
                <div className="min-w-0 md:w-48">
                  <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(value: string) => setSelectedMonth(value)}
                    label="Month"
                  />
                </div>
                
                <div className="min-w-0 md:w-48">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-button-primary focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="half_day">Half Day</option>
                    <option value="holiday">Holiday</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-button-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === 'calendar'
                      ? 'bg-white text-button-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Calendar
                </button>
              </div>
              
              <Button variant="secondary" icon={<Download className="h-4 w-4" />}>
                Export
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Attendance Records */}
      {viewMode === 'list' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Clock In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Clock Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Overtime
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-text-primary">
                        {formatDate(record.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusColor(record.status)}>
                        {getStatusLabel(record.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {formatTime(record.clockIn)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {formatTime(record.clockOut)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {record.totalHours ? `${record.totalHours}h` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {record.overtimeHours ? `${record.overtimeHours}h` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button variant="secondary" size="sm" icon={<Eye className="h-4 w-4" />}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="p-6">
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">Calendar View</h3>
              <p className="text-sm text-text-secondary">
                Calendar view will be implemented in a future update.
              </p>
            </div>
          </div>
        </Card>
      )}

      {filteredRecords.length === 0 && (
        <Card className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Calendar className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">No attendance records found</h3>
          <p className="text-sm text-text-secondary">
            {filterStatus || selectedMonth !== new Date().toISOString().slice(0, 7)
              ? 'Try adjusting your filter criteria.'
              : 'No attendance records available for the selected period.'
            }
          </p>
        </Card>
      )}
    </PageLayout>
  );
};

export default EmployeeAttendance;

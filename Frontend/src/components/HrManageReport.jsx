import React, { useState, useEffect } from 'react';

const HrManageReport = () => {
  const [activeTab, setActiveTab] = useState('attendance');
  const [filters, setFilters] = useState({
    department: 'all',
    dateRange: 'current_month',
    employee: 'all',
    status: 'all'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [leavesData, setLeavesData] = useState([]);
  const [halfDaysData, setHalfDaysData] = useState([]);
  const [workingHoursData, setWorkingHoursData] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'

  // Sample departments
  const departments = ['all', 'HR', 'IT', 'Sales', 'Marketing', 'Operations', 'Production', 'Finance'];

  // Sample employees
  const employees = [
    { id: 'EMP001', name: 'John Smith', department: 'HR' },
    { id: 'EMP002', name: 'Sarah Johnson', department: 'IT' },
    { id: 'EMP003', name: 'Michael Brown', department: 'Sales' },
    { id: 'EMP004', name: 'Emily Davis', department: 'Marketing' },
    { id: 'EMP005', name: 'Robert Wilson', department: 'Operations' },
    { id: 'EMP006', name: 'Lisa Anderson', department: 'Production' },
    { id: 'EMP007', name: 'David Lee', department: 'HR' },
    { id: 'EMP008', name: 'Jennifer Taylor', department: 'IT' },
    { id: 'EMP009', name: 'William Clark', department: 'Finance' },
    { id: 'EMP010', name: 'Amanda White', department: 'Sales' }
  ];

  // Sample attendance data
  const sampleAttendanceData = [
    {
      id: 1,
      employeeId: 'EMP001',
      employeeName: 'John Smith',
      department: 'HR',
      date: '2024-01-15',
      checkIn: '09:05 AM',
      checkOut: '06:15 PM',
      lateMinutes: 5,
      earlyLeaveMinutes: 0,
      workingHours: '8.5',
      status: 'present',
      remarks: 'Slight delay due to traffic'
    },
    {
      id: 2,
      employeeId: 'EMP002',
      employeeName: 'Sarah Johnson',
      department: 'IT',
      date: '2024-01-15',
      checkIn: '08:55 AM',
      checkOut: '05:45 PM',
      lateMinutes: 0,
      earlyLeaveMinutes: 15,
      workingHours: '8.0',
      status: 'present',
      remarks: 'Left early for doctor appointment'
    },
    {
      id: 3,
      employeeId: 'EMP003',
      employeeName: 'Michael Brown',
      department: 'Sales',
      date: '2024-01-15',
      checkIn: '09:30 AM',
      checkOut: '06:30 PM',
      lateMinutes: 30,
      earlyLeaveMinutes: 0,
      workingHours: '8.0',
      status: 'late',
      remarks: 'Client meeting preparation'
    },
    {
      id: 4,
      employeeId: 'EMP004',
      employeeName: 'Emily Davis',
      department: 'Marketing',
      date: '2024-01-15',
      checkIn: '09:00 AM',
      checkOut: '06:00 PM',
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      workingHours: '9.0',
      status: 'present',
      remarks: 'Regular working day'
    },
    {
      id: 5,
      employeeId: 'EMP005',
      employeeName: 'Robert Wilson',
      department: 'Operations',
      date: '2024-01-15',
      checkIn: '',
      checkOut: '',
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      workingHours: '0',
      status: 'absent',
      remarks: 'Sick leave'
    },
    {
      id: 6,
      employeeId: 'EMP006',
      employeeName: 'Lisa Anderson',
      department: 'Production',
      date: '2024-01-15',
      checkIn: '10:00 AM',
      checkOut: '04:00 PM',
      lateMinutes: 60,
      earlyLeaveMinutes: 120,
      workingHours: '5.0',
      status: 'half_day',
      remarks: 'Half day - personal work'
    },
    {
      id: 7,
      employeeId: 'EMP007',
      employeeName: 'David Lee',
      department: 'HR',
      date: '2024-01-14',
      checkIn: '08:50 AM',
      checkOut: '06:10 PM',
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      workingHours: '9.0',
      status: 'present',
      remarks: ''
    },
    {
      id: 8,
      employeeId: 'EMP008',
      employeeName: 'Jennifer Taylor',
      department: 'IT',
      date: '2024-01-14',
      checkIn: '09:10 AM',
      checkOut: '05:50 PM',
      lateMinutes: 10,
      earlyLeaveMinutes: 10,
      workingHours: '8.0',
      status: 'present',
      remarks: 'Working from home'
    },
    {
      id: 9,
      employeeId: 'EMP009',
      employeeName: 'William Clark',
      department: 'Finance',
      date: '2024-01-14',
      checkIn: '08:45 AM',
      checkOut: '06:30 PM',
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      workingHours: '9.5',
      status: 'present',
      remarks: 'Month end closing'
    },
    {
      id: 10,
      employeeId: 'EMP010',
      employeeName: 'Amanda White',
      department: 'Sales',
      date: '2024-01-14',
      checkIn: '',
      checkOut: '',
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      workingHours: '0',
      status: 'leave',
      remarks: 'Annual leave'
    }
  ];

  // Sample leaves data
  const sampleLeavesData = [
    {
      id: 1,
      employeeId: 'EMP005',
      employeeName: 'Robert Wilson',
      department: 'Operations',
      leaveType: 'Sick Leave',
      fromDate: '2024-01-15',
      toDate: '2024-01-16',
      totalDays: 2,
      status: 'approved',
      appliedOn: '2024-01-14',
      reason: 'Fever and cold'
    },
    {
      id: 2,
      employeeId: 'EMP010',
      employeeName: 'Amanda White',
      department: 'Sales',
      leaveType: 'Annual Leave',
      fromDate: '2024-01-14',
      toDate: '2024-01-14',
      totalDays: 1,
      status: 'approved',
      appliedOn: '2024-01-10',
      reason: 'Personal work'
    },
    {
      id: 3,
      employeeId: 'EMP003',
      employeeName: 'Michael Brown',
      department: 'Sales',
      leaveType: 'Casual Leave',
      fromDate: '2024-01-18',
      toDate: '2024-01-18',
      totalDays: 1,
      status: 'pending',
      appliedOn: '2024-01-15',
      reason: 'Family function'
    },
    {
      id: 4,
      employeeId: 'EMP008',
      employeeName: 'Jennifer Taylor',
      department: 'IT',
      leaveType: 'Maternity Leave',
      fromDate: '2024-02-01',
      toDate: '2024-05-01',
      totalDays: 90,
      status: 'approved',
      appliedOn: '2024-01-10',
      reason: 'Maternity leave'
    },
    {
      id: 5,
      employeeId: 'EMP002',
      employeeName: 'Sarah Johnson',
      department: 'IT',
      leaveType: 'Medical Leave',
      fromDate: '2024-01-12',
      toDate: '2024-01-12',
      totalDays: 1,
      status: 'approved',
      appliedOn: '2024-01-11',
      reason: 'Dental appointment'
    }
  ];

  // Sample half days data
  const sampleHalfDaysData = [
    {
      id: 1,
      employeeId: 'EMP006',
      employeeName: 'Lisa Anderson',
      department: 'Production',
      date: '2024-01-15',
      type: 'first_half',
      checkIn: '10:00 AM',
      checkOut: '01:00 PM',
      workingHours: '3.0',
      reason: 'Personal work',
      status: 'approved'
    },
    {
      id: 2,
      employeeId: 'EMP001',
      employeeName: 'John Smith',
      department: 'HR',
      date: '2024-01-10',
      type: 'second_half',
      checkIn: '02:00 PM',
      checkOut: '06:00 PM',
      workingHours: '4.0',
      reason: 'Morning medical appointment',
      status: 'approved'
    },
    {
      id: 3,
      employeeId: 'EMP004',
      employeeName: 'Emily Davis',
      department: 'Marketing',
      date: '2024-01-08',
      type: 'first_half',
      checkIn: '09:00 AM',
      checkOut: '01:00 PM',
      workingHours: '4.0',
      reason: 'Afternoon training session',
      status: 'approved'
    },
    {
      id: 4,
      employeeId: 'EMP009',
      employeeName: 'William Clark',
      department: 'Finance',
      date: '2024-01-05',
      type: 'second_half',
      checkIn: '12:00 PM',
      checkOut: '06:00 PM',
      workingHours: '6.0',
      reason: 'Morning court hearing',
      status: 'approved'
    }
  ];

  // Sample working hours summary
  const sampleWorkingHoursData = [
    {
      id: 1,
      employeeId: 'EMP001',
      employeeName: 'John Smith',
      department: 'HR',
      month: 'January 2024',
      totalWorkingDays: 20,
      presentDays: 18,
      leaveDays: 2,
      halfDays: 1,
      totalHours: 144,
      avgDailyHours: 8.0,
      overtimeHours: 12
    },
    {
      id: 2,
      employeeId: 'EMP002',
      employeeName: 'Sarah Johnson',
      department: 'IT',
      month: 'January 2024',
      totalWorkingDays: 20,
      presentDays: 19,
      leaveDays: 1,
      halfDays: 0,
      totalHours: 152,
      avgDailyHours: 8.0,
      overtimeHours: 8
    },
    {
      id: 3,
      employeeId: 'EMP003',
      employeeName: 'Michael Brown',
      department: 'Sales',
      month: 'January 2024',
      totalWorkingDays: 20,
      presentDays: 17,
      leaveDays: 2,
      halfDays: 1,
      totalHours: 140,
      avgDailyHours: 7.8,
      overtimeHours: 5
    },
    {
      id: 4,
      employeeId: 'EMP004',
      employeeName: 'Emily Davis',
      department: 'Marketing',
      month: 'January 2024',
      totalWorkingDays: 20,
      presentDays: 20,
      leaveDays: 0,
      halfDays: 1,
      totalHours: 160,
      avgDailyHours: 8.0,
      overtimeHours: 16
    },
    {
      id: 5,
      employeeId: 'EMP005',
      employeeName: 'Robert Wilson',
      department: 'Operations',
      month: 'January 2024',
      totalWorkingDays: 20,
      presentDays: 16,
      leaveDays: 4,
      halfDays: 0,
      totalHours: 128,
      avgDailyHours: 8.0,
      overtimeHours: 0
    }
  ];

  // Sample summary statistics
  const sampleSummaryStats = {
    totalEmployees: 10,
    presentToday: 7,
    absentToday: 1,
    lateToday: 2,
    onLeaveToday: 2,
    totalLeavesThisMonth: 15,
    avgAttendanceRate: '92%',
    avgWorkingHours: '8.2 hours/day'
  };

  useEffect(() => {
    // Simulate API call
    setIsLoading(true);
    setTimeout(() => {
      setAttendanceData(sampleAttendanceData);
      setLeavesData(sampleLeavesData);
      setHalfDaysData(sampleHalfDaysData);
      setWorkingHoursData(sampleWorkingHoursData);
      setSummaryStats(sampleSummaryStats);
      setIsLoading(false);
    }, 500);
  }, [filters]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = (data) => {
    const sortedData = [...data];
    if (sortConfig.key) {
      sortedData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortedData;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
      case 'approved': return 'bg-green-100 text-green-800';
      case 'absent':
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-orange-100 text-orange-800';
      case 'half_day': return 'bg-yellow-100 text-yellow-800';
      case 'leave': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'late': return 'Late';
      case 'half_day': return 'Half Day';
      case 'leave': return 'On Leave';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'pending': return 'Pending';
      default: return status;
    }
  };

  const getLeaveTypeColor = (type) => {
    switch (type) {
      case 'Sick Leave': return 'bg-red-50 text-red-700 border-red-200';
      case 'Annual Leave': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Casual Leave': return 'bg-green-50 text-green-700 border-green-200';
      case 'Maternity Leave': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Medical Leave': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getHalfDayTypeLabel = (type) => {
    switch (type) {
      case 'first_half': return 'First Half';
      case 'second_half': return 'Second Half';
      default: return type;
    }
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    return time;
  };

  const handleExport = (format) => {
    let dataToExport = [];
    let fileName = '';

    switch (activeTab) {
      case 'attendance':
        dataToExport = attendanceData;
        fileName = 'attendance_report';
        break;
      case 'leaves':
        dataToExport = leavesData;
        fileName = 'leaves_report';
        break;
      case 'half-days':
        dataToExport = halfDaysData;
        fileName = 'half_days_report';
        break;
      case 'working-hours':
        dataToExport = workingHoursData;
        fileName = 'working_hours_report';
        break;
    }

    if (format === 'csv') {
      // Generate CSV
      const headers = Object.keys(dataToExport[0] || {}).join(',');
      const rows = dataToExport.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' ? `"${value}"` : value
        ).join(',')
      ).join('\n');
      
      const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`Exporting ${fileName} in ${format.toUpperCase()} format...`);
      // In real implementation, generate PDF/Excel
    }
  };

  const AttendanceTable = () => (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Employee
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Department
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('date')}
            >
              <div className="flex items-center">
                Date
                {sortConfig.key === 'date' && (
                  <svg className={`w-4 h-4 ml-1 ${sortConfig.direction === 'desc' ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                )}
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Check-in
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Check-out
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Working Hours
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Late/Early Leave
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Remarks
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {isLoading ? (
            <tr>
              <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                Loading attendance data...
              </td>
            </tr>
          ) : getSortedData(attendanceData).length === 0 ? (
            <tr>
              <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                No attendance records found
              </td>
            </tr>
          ) : (
            getSortedData(attendanceData).map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium mr-3">
                      {record.employeeName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{record.employeeName}</div>
                      <div className="text-xs text-gray-500">{record.employeeId}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {record.department}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={!record.checkIn ? 'text-gray-400 italic' : ''}>
                    {formatTime(record.checkIn)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={!record.checkOut ? 'text-gray-400 italic' : ''}>
                    {formatTime(record.checkOut)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={`font-medium ${parseFloat(record.workingHours) < 8 ? 'text-orange-600' : 'text-green-600'}`}>
                    {record.workingHours} hrs
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                    {getStatusLabel(record.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="space-y-1">
                    {record.lateMinutes > 0 && (
                      <span className="text-orange-600">Late: {record.lateMinutes} min</span>
                    )}
                    {record.earlyLeaveMinutes > 0 && (
                      <div className="text-red-600">Early Leave: {record.earlyLeaveMinutes} min</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                  {record.remarks || '—'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const LeavesTable = () => (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Employee
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Department
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Leave Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Duration
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Days
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Applied On
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Reason
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {isLoading ? (
            <tr>
              <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                Loading leaves data...
              </td>
            </tr>
          ) : leavesData.length === 0 ? (
            <tr>
              <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                No leave records found
              </td>
            </tr>
          ) : (
            leavesData.map((leave) => (
              <tr key={leave.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium mr-3">
                      {leave.employeeName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{leave.employeeName}</div>
                      <div className="text-xs text-gray-500">{leave.employeeId}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {leave.department}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded border ${getLeaveTypeColor(leave.leaveType)}`}>
                    {leave.leaveType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {leave.fromDate} to {leave.toDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(leave.status)}`}>
                    {getStatusLabel(leave.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {leave.appliedOn}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                  {leave.reason}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const HalfDaysTable = () => (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Employee
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Department
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Half Day Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Timings
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Working Hours
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Reason
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {isLoading ? (
            <tr>
              <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                Loading half days data...
              </td>
            </tr>
          ) : halfDaysData.length === 0 ? (
            <tr>
              <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                No half day records found
              </td>
            </tr>
          ) : (
            halfDaysData.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium mr-3">
                      {record.employeeName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{record.employeeName}</div>
                      <div className="text-xs text-gray-500">{record.employeeId}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {record.department}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    {getHalfDayTypeLabel(record.type)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center space-x-2">
                    <span className={!record.checkIn ? 'text-gray-400 italic' : ''}>
                      {formatTime(record.checkIn)}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className={!record.checkOut ? 'text-gray-400 italic' : ''}>
                      {formatTime(record.checkOut)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {record.workingHours} hrs
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                    {getStatusLabel(record.status)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                  {record.reason}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const WorkingHoursTable = () => (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Employee
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Department
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Month
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Working Days
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Present
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Leave
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Half Days
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Hours
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Avg Daily Hours
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Overtime
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {isLoading ? (
            <tr>
              <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                Loading working hours data...
              </td>
            </tr>
          ) : workingHoursData.length === 0 ? (
            <tr>
              <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                No working hours records found
              </td>
            </tr>
          ) : (
            workingHoursData.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium mr-3">
                      {record.employeeName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{record.employeeName}</div>
                      <div className="text-xs text-gray-500">{record.employeeId}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {record.department}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.month}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                  {record.totalWorkingDays}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                  <span className="font-medium text-green-600">{record.presentDays}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                  <span className="font-medium text-blue-600">{record.leaveDays}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                  <span className="font-medium text-yellow-600">{record.halfDays}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                  <span className="font-medium text-gray-800">{record.totalHours} hrs</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                  <span className={`font-medium ${parseFloat(record.avgDailyHours) < 8 ? 'text-orange-600' : 'text-green-600'}`}>
                    {record.avgDailyHours} hrs
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                  <span className="font-medium text-purple-600">{record.overtimeHours} hrs</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderTable = () => {
    switch (activeTab) {
      case 'attendance':
        return <AttendanceTable />;
      case 'leaves':
        return <LeavesTable />;
      case 'half-days':
        return <HalfDaysTable />;
      case 'working-hours':
        return <WorkingHoursTable />;
      default:
        return <AttendanceTable />;
    }
  };

  return (
    <div className="bg-white shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        {/* <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">HR Reports Management</h2>
            <p className="text-gray-600">Track employee attendance, leaves, half-days, and working hours</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <div className="flex rounded-lg border border-gray-300">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 text-sm font-medium ${viewMode === 'table' ? 'bg-blue-50 text-blue-700 border-r border-gray-300' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Table View
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`px-4 py-2 text-sm font-medium ${viewMode === 'card' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Card View
              </button>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleExport('pdf')}
                className="px-4 py-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="px-4 py-2 text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Excel
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="px-4 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>
        </div> */}

        {/* Tabs */}
        <div className="flex flex-wrap border-b border-gray-200">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'attendance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
          >
            Daily Attendance
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'leaves' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
          >
            Leaves
          </button>
          <button
            onClick={() => setActiveTab('half-days')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'half-days' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
          >
            Half Days
          </button>
          <button
            onClick={() => setActiveTab('working-hours')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'working-hours' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
          >
            Working Hours Summary
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      {summaryStats && (
        <div className="mb-6">
          {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium mb-1">Total Employees</div>
              <div className="text-2xl font-bold text-gray-800">{summaryStats.totalEmployees}</div>
              <div className="text-xs text-blue-500 mt-1">Currently active</div>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium mb-1">Present Today</div>
              <div className="text-2xl font-bold text-gray-800">{summaryStats.presentToday}</div>
              <div className="text-xs text-green-500 mt-1">+{summaryStats.lateToday} late</div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <div className="text-sm text-red-600 font-medium mb-1">Absent Today</div>
              <div className="text-2xl font-bold text-gray-800">{summaryStats.absentToday}</div>
              <div className="text-xs text-red-500 mt-1">{summaryStats.onLeaveToday} on leave</div>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
              <div className="text-sm text-purple-600 font-medium mb-1">Avg Working Hours</div>
              <div className="text-2xl font-bold text-gray-800">{summaryStats.avgWorkingHours}</div>
              <div className="text-xs text-purple-500 mt-1">Attendance: {summaryStats.avgAttendanceRate}</div>
            </div>
          </div> */}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({...filters, department: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept === 'all' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="current_week">This Week</option>
              <option value="current_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee
            </label>
            <select
              value={filters.employee}
              onChange={(e) => setFilters({...filters, employee: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="half_day">Half Day</option>
              <option value="leave">On Leave</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setFilters({
              department: 'all',
              dateRange: 'current_month',
              employee: 'all',
              status: 'all'
            })}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear Filters
          </button>
          <div className="text-sm text-gray-600">
            Showing {viewMode === 'table' ? 
              activeTab === 'attendance' ? attendanceData.length :
              activeTab === 'leaves' ? leavesData.length :
              activeTab === 'half-days' ? halfDaysData.length :
              workingHoursData.length
              : 'data'} records
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'table' ? (
        renderTable()
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card view implementation would go here */}
          <div className="col-span-3 text-center py-8 text-gray-500">
            Card view is currently in development. Please use table view for now.
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">1</span> to{' '}
          <span className="font-medium">10</span> of{' '}
          <span className="font-medium">
            {activeTab === 'attendance' ? attendanceData.length :
             activeTab === 'leaves' ? leavesData.length :
             activeTab === 'half-days' ? halfDaysData.length :
             workingHoursData.length}
          </span> records
        </div>
        <div className="flex space-x-2">
          <button className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            Previous
          </button>
          <button className="px-3 py-2 text-sm text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700">
            1
          </button>
          <button className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default HrManageReport;
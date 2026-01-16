import { useState, useEffect, useRef } from 'react';
import { 
  Clock, Calendar, Users, CheckCircle, XCircle, Plus, 
  Search, Filter, Download, Eye, LogIn, LogOut,
  Coffee, Activity, TrendingUp, UserCheck, XCircle as XCircleIcon,
  CheckCircle as CheckCircleIcon, MapPin, Smartphone, Monitor,
  AlertTriangle, X, ChevronDown, ChevronUp
} from 'lucide-react';
import Chart from 'chart.js/auto';

// Data normalization function
const normalizeAttendanceData = (data) => {
  return data.map(record => ({
    id: record.id || Date.now(),
    employeeId: record.employeeId || 0,
    employee: {
      id: record.employee?.id || 0,
      name: record.employee?.name || 'Unknown Employee',
      department: record.employee?.department || 'Unknown',
      position: record.employee?.position || 'Unknown',
      avatar: record.employee?.avatar || '',
      email: record.employee?.email || '',
      phone: record.employee?.phone || '',
      team: record.employee?.team || 'Unknown'
    },
    date: record.date || new Date().toISOString().split('T')[0],
    checkIn: record.checkIn || null,
    checkOut: record.checkOut || null,
    status: record.status || 'Unknown',
    hours: record.hours || 0,
    location: {
      type: record.location?.type || 'Unknown',
      coordinates: record.location?.coordinates || {},
      address: record.location?.address || 'N/A',
      accuracy: record.location?.accuracy || 'Unknown'
    },
    device: {
      type: record.device?.type || 'Unknown',
      model: record.device?.model || 'N/A',
      os: record.device?.os || 'N/A',
      ip: record.device?.ip || 'N/A',
      browser: record.device?.browser || 'N/A'
    },
    verification: {
      method: record.verification?.method || 'Manual',
      confidence: record.verification?.confidence || 100,
      timestamp: record.verification?.timestamp || 'N/A'
    },
    breaks: record.breaks || [],
    overtime: record.overtime || 0,
    productivity: record.productivity || 0,
    focusSessions: record.focusSessions || [],
    notes: record.notes || '',
    alerts: record.alerts || [],
    sessionQuality: record.sessionQuality || 'Unknown',
    leaveType: record.leaveType || null
  }));
};

// Filter Configuration
const filterConfig = {
  departments: ['All', 'Sales', 'Production', 'HR', 'Operations'],
  statuses: ['All', 'Present', 'Active', 'Late', 'Absent', 'Remote'],
  timeRanges: [
    'All Time',
    'Today',
    'Yesterday',
    'This Week',
    'Last Week',
    'This Month',
    'Last Month'
  ]
};

// Enhanced Status Badge Component
function EnhancedStatusBadge({ status }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'Present':
        return { color: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-600', icon: CheckCircle };
      case 'Active':
        return { color: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-600', icon: Activity };
      case 'Late':
        return { color: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-orange-600', icon: Clock };
      case 'Absent':
        return { color: 'bg-gradient-to-r from-rose-500 to-rose-600 text-white border-rose-600', icon: XCircle };
      case 'Remote':
        return { color: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-600', icon: Smartphone };
      default:
        return { color: 'bg-gradient-to-r from-slate-500 to-slate-600 text-white border-slate-600', icon: Clock };
    }
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-md ${config.color}`}>
      <IconComponent className="h-4 w-4" />
      {status}
    </span>
  );
}

// Enhanced Attendance Row Component
function EnhancedAttendanceRow({ record, onViewDetails }) {
  const totalBreakTime = (record.breaks || []).reduce((sum, breakItem) => sum + (breakItem.duration || 0), 0);

  return (
    <tr className="hover:bg-gradient-to-r from-blue-25 to-blue-25 transition-all duration-300 group">
      <td className="py-5 px-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-md">
              {record.employee.name.split(' ').map(n => n[0]).join('')}
            </div>
            {record.status === 'Active' && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-md"></div>
            )}
          </div>
          <div>
            <div className="font-bold text-gray-900">{record.employee.name}</div>
            <div className="text-sm text-gray-600">{record.employee.department} • {record.employee.team}</div>
          </div>
        </div>
      </td>
      
      <td className="py-5 px-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <LogIn className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-sm font-semibold">{record.checkIn || '--:--'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <LogOut className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-sm">{record.checkOut || '--:--'}</span>
          </div>
        </div>
      </td>
      
      <td className="py-5 px-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Coffee className="h-4 w-4 text-blue-600" />
          </div>
          <span className="text-sm font-semibold">{(record.breaks || []).length}</span>
        </div>
        {totalBreakTime > 0 && (
          <div className="text-xs text-gray-500 mt-2">
            {Math.floor(totalBreakTime / 60)}h {totalBreakTime % 60}m
          </div>
        )}
      </td>
      
      <td className="py-5 px-6">
        <div className="space-y-2">
          <EnhancedStatusBadge status={record.status} />
          {record.sessionQuality && (
            <div className={`text-xs font-semibold ${
              record.sessionQuality === 'Excellent' ? 'text-emerald-600' :
              record.sessionQuality === 'Good' ? 'text-blue-600' :
              'text-blue-600'
            }`}>
              {record.sessionQuality}
            </div>
          )}
        </div>
      </td>
      
      <td className="py-5 px-6">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onViewDetails(record)}
            className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
            title="View Details"
          >
            <Eye className="h-5 w-5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// Enhanced Attendance Table Component
function EnhancedAttendanceTable({ data, onViewDetails }) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-blue-50">
          <th className="text-left py-5 px-6 text-sm font-bold text-gray-800">Employee</th>
          <th className="text-left py-5 px-6 text-sm font-bold text-gray-800">Check In/Out</th>
          <th className="text-left py-5 px-6 text-sm font-bold text-gray-800">Breaks</th>
          <th className="text-left py-5 px-6 text-sm font-bold text-gray-800">Status</th>
          <th className="text-left py-5 px-6 text-sm font-bold text-gray-800">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-blue-100">
        {data.map((record) => (
          <EnhancedAttendanceRow 
            key={record.id}
            record={record}
            onViewDetails={onViewDetails}
          />
        ))}
      </tbody>
    </table>
  );
}

// Employee Detail Modal Component
function EmployeeDetailModal({ employee, onClose }) {
  const safeEmployee = {
    ...employee,
    employee: employee.employee || {},
    location: employee.location || { type: 'Unknown', coordinates: {}, address: 'N/A', accuracy: 'Unknown' },
    device: employee.device || { type: 'Unknown', model: 'N/A', os: 'N/A', ip: 'N/A', browser: 'N/A' },
    verification: employee.verification || { method: 'Manual', confidence: 100, timestamp: 'N/A' },
    breaks: employee.breaks || [],
    notes: employee.notes || '',
    alerts: employee.alerts || []
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-blue-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-50 rounded-t-3xl">
          <div>
            <div className="flex items-baseline gap-3">
              <h2 className="text-2xl font-bold text-gray-900">{safeEmployee.employee.name}</h2>
              <span className="text-lg font-medium text-blue-600">{safeEmployee.employee.department}</span>
            </div>
            <p className="text-gray-600 mt-2 text-sm">{safeEmployee.employee.position}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Attendance Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-semibold">{safeEmployee.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check In:</span>
                  <span className="font-semibold">{safeEmployee.checkIn || '--:--'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check Out:</span>
                  <span className="font-semibold">{safeEmployee.checkOut || '--:--'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hours Worked:</span>
                  <span className="font-semibold">{safeEmployee.hours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Overtime:</span>
                  <span className="font-semibold">{safeEmployee.overtime}h</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Location & Device
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-semibold">{safeEmployee.location.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Device:</span>
                  <span className="font-semibold">{safeEmployee.device.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Verification:</span>
                  <span className="font-semibold">{safeEmployee.verification.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Productivity:</span>
                  <span className="font-semibold">{safeEmployee.productivity}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Breaks */}
          {safeEmployee.breaks.length > 0 && (
            <div className="bg-blue-50 rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Coffee className="h-5 w-5 text-blue-600" />
                Breaks ({safeEmployee.breaks.length})
              </h3>
              <div className="space-y-3">
                {safeEmployee.breaks.map((breakItem, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <div>
                      <span className="font-semibold">{breakItem.type}</span>
                      <div className="text-sm text-gray-600">
                        {breakItem.start} - {breakItem.end || 'Active'}
                      </div>
                    </div>
                    <span className="text-sm font-semibold">
                      {breakItem.duration > 0 ? `${breakItem.duration}m` : 'Active'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alerts */}
          {safeEmployee.alerts.length > 0 && (
            <div className="bg-rose-50 rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                Alerts ({safeEmployee.alerts.length})
              </h3>
              <div className="space-y-2">
                {safeEmployee.alerts.map((alert, index) => (
                  <div key={index} className="text-rose-700 bg-rose-100 px-3 py-2 rounded-lg text-sm">
                    {alert}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-blue-100">
          <button 
            onClick={onClose} 
            className="px-6 py-3 text-gray-700 bg-white border border-blue-200 rounded-xl hover:bg-blue-50 transition-all duration-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Attendance Pie Chart Component
const AttendancePieChart = ({ data }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const stats = {
    present: data.filter(a => a.status === 'Present').length,
    active: data.filter(a => a.status === 'Active').length,
    late: data.filter(a => a.status === 'Late').length,
    absent: data.filter(a => a.status === 'Absent').length,
    remote: data.filter(a => a.location?.type === 'Remote' && (a.status === 'Present' || a.status === 'Active')).length
  };

  const total = data.length;

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      
      const chartData = {
        labels: ['Present', 'Active', 'Late', 'Absent', 'Remote'],
        datasets: [
          {
            data: [
              stats.present,
              stats.active,
              stats.late,
              stats.absent,
              stats.remote
            ],
            backgroundColor: [
              '#10B981',
              '#3B82F6',
              '#F59E0B',
              '#EF4444',
              '#8B5CF6'
            ],
            borderColor: '#ffffff',
            borderWidth: 3,
            hoverOffset: 15
          }
        ]
      };

      const config = {
        type: 'doughnut',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          cutout: '65%',
          animation: {
            animateScale: true,
            animateRotate: true
          }
        }
      };

      chartInstance.current = new Chart(ctx, config);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, stats, total]);

  return (
    <div className="bg-gradient-to-br from-white to-blue-25 rounded-3xl shadow-xl p-6 border border-blue-100">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-xl font-bold text-gray-900 flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-xl">
            <Users className="h-6 w-6 text-white" />
          </div>
          Attendance Overview
        </h4>
      </div>

      <div className="flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-inner mb-6">
        <div className="relative w-64 h-64">
          <canvas ref={chartRef} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-900">Team</div>
              <div className="text-lg font-bold text-gray-900">Attendance</div>
              <div className="text-xs text-gray-600 mt-1">{total} Employees</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Employee Attendance Component
export function EmployeeAttendance() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: 'All',
    status: 'All',
    timeRange: 'All Time'
  });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);

  // Sample attendance data
  const sampleData = [
    {
      id: 1,
      employeeId: 1,
      employee: {
        id: 1,
        name: 'John Smith',
        department: 'Sales',
        position: 'Manager',
        team: 'Enterprise Sales'
      },
      date: '2024-01-15',
      checkIn: '09:00',
      checkOut: '17:30',
      status: 'Present',
      hours: 8.5,
      location: { type: 'Office', address: '123 Main St, New York, NY' },
      device: { type: 'Desktop', model: 'Dell Precision 5560' },
      verification: { method: 'Manual', confidence: 100 },
      breaks: [
        { type: 'Lunch', start: '12:00', end: '12:45', duration: 45, status: 'completed' }
      ],
      overtime: 0.5,
      productivity: 92,
      alerts: [],
      sessionQuality: 'Excellent'
    },
    {
      id: 2,
      employeeId: 2,
      employee: {
        id: 2,
        name: 'Sarah Johnson',
        department: 'Marketing',
        position: 'Director',
        team: 'Digital Marketing'
      },
      date: '2024-01-15',
      checkIn: '09:15',
      checkOut: '17:45',
      status: 'Late',
      hours: 8.5,
      location: { type: 'Remote', address: '456 Park Ave, New York, NY' },
      device: { type: 'Laptop', model: 'MacBook Pro 16"' },
      verification: { method: 'Mobile App', confidence: 100 },
      breaks: [
        { type: 'Lunch', start: '12:30', end: '13:15', duration: 45, status: 'completed' }
      ],
      overtime: 0.75,
      productivity: 85,
      alerts: ['Late check-in'],
      sessionQuality: 'Good'
    },
    {
      id: 3,
      employeeId: 3,
      employee: {
        id: 3,
        name: 'Mike Chen',
        department: 'Production',
        position: 'Senior Developer',
        team: 'Backend Team'
      },
      date: '2024-01-15',
      checkIn: '08:45',
      checkOut: null,
      status: 'Active',
      hours: 0,
      location: { type: 'Office', address: '123 Main St, New York, NY' },
      device: { type: 'Desktop', model: 'Custom Workstation' },
      verification: { method: 'Web Portal', confidence: 100 },
      breaks: [
        { type: 'Break', start: '16:00', end: null, duration: 0, status: 'active' }
      ],
      overtime: 0,
      productivity: 78,
      alerts: [],
      sessionQuality: 'Good'
    },
    {
      id: 4,
      employeeId: 4,
      employee: {
        id: 4,
        name: 'Emily Davis',
        department: 'HR',
        position: 'HR Specialist',
        team: 'Recruitment'
      },
      date: '2024-01-15',
      checkIn: null,
      checkOut: null,
      status: 'Absent',
      hours: 0,
      location: { type: 'Unknown', address: 'N/A' },
      device: { type: 'Unknown', model: 'N/A' },
      verification: { method: 'None', confidence: 0 },
      breaks: [],
      overtime: 0,
      productivity: 0,
      alerts: ['No check-in recorded'],
      sessionQuality: 'Unknown',
      leaveType: 'Sick'
    }
  ];

  const [attendanceData, setAttendanceData] = useState(normalizeAttendanceData(sampleData));

  // Filter data
  const filteredData = attendanceData.filter(record => {
    const matchesSearch = searchTerm === '' || 
      record.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = filters.department === 'All' || 
      record.employee.department === filters.department;

    const matchesStatus = filters.status === 'All' || 
      record.status === filters.status;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  // Statistics
  const stats = {
    totalEmployees: attendanceData.length,
    present: attendanceData.filter(a => a.status === 'Present' || a.status === 'Active').length,
    absent: attendanceData.filter(a => a.status === 'Absent').length,
    late: attendanceData.filter(a => a.status === 'Late').length,
    active: attendanceData.filter(a => a.status === 'Active').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">
              Employee Attendance
            </h1>
            <p className="text-gray-600 mt-3 text-lg">Track and manage employee attendance in real-time</p>
          </div>
          <button className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg font-medium">
            <Download className="h-5 w-5" />
            Export Report
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Pie Chart */}
          <AttendancePieChart data={filteredData} />

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-white to-blue-25 rounded-2xl p-6 border border-blue-100 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.present}</p>
                  <p className="text-sm font-semibold text-gray-600">Present</p>
                </div>
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-3 rounded-xl shadow-md">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-blue-25 rounded-2xl p-6 border border-blue-100 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.absent}</p>
                  <p className="text-sm font-semibold text-gray-600">Absent</p>
                </div>
                <div className="bg-gradient-to-r from-rose-500 to-rose-600 p-3 rounded-xl shadow-md">
                  <XCircleIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-blue-25 rounded-2xl p-6 border border-blue-100 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
                  <p className="text-sm font-semibold text-gray-600">Active</p>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl shadow-md">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-blue-25 rounded-2xl p-6 border border-blue-100 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.late}</p>
                  <p className="text-sm font-semibold text-gray-600">Late</p>
                </div>
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-3 rounded-xl shadow-md">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gradient-to-br from-white to-blue-25 rounded-3xl px-6 py-4 border border-blue-100 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
            <div className="flex flex-col sm:flex-row gap-6 flex-1">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400" />
                <input
                  type="text"
                  placeholder="Search employees, departments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                />
              </div>
              
              <div className="flex items-center gap-3 text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-xl">
                <Filter className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{filteredData.length} of {attendanceData.length} records</span>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Department</label>
              <select
                value={filters.department}
                onChange={(e) => setFilters({...filters, department: e.target.value})}
                className="w-full px-3 py-2 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-sm"
              >
                {filterConfig.departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-sm"
              >
                {filterConfig.statuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Time Range</label>
              <select
                value={filters.timeRange}
                onChange={(e) => setFilters({...filters, timeRange: e.target.value})}
                className="w-full px-3 py-2 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-sm"
              >
                {filterConfig.timeRanges.map((range) => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-gradient-to-br from-white to-blue-25 rounded-3xl border border-blue-100 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <EnhancedAttendanceTable 
              data={filteredData}
              onViewDetails={setSelectedEmployee}
            />
          </div>
        </div>

        {/* Employee Detail Modal */}
        {selectedEmployee && (
          <EmployeeDetailModal
            employee={selectedEmployee}
            onClose={() => setSelectedEmployee(null)}
          />
        )}
      </div>
    </div>
  );
}

export default EmployeeAttendance;
import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import {
  Calendar,
  Download,
  Filter,
  MoreVertical,
  Plus,
  Search,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  CalendarDays,
  UserCheck,
  UserX,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  FileText,
} from "lucide-react";

// Mock Data
const departments = [
  { name: "Production", totalEmployees: 45, onLeave: 8, leaveUtilization: 0.65, upcomingLeaves: 12 },
  { name: "Marketing", totalEmployees: 28, onLeave: 4, leaveUtilization: 0.45, upcomingLeaves: 7 },
  { name: "Sales", totalEmployees: 35, onLeave: 6, leaveUtilization: 0.72, upcomingLeaves: 9 },
  { name: "HR", totalEmployees: 15, onLeave: 2, leaveUtilization: 0.38, upcomingLeaves: 3 },
  { name: "Finance", totalEmployees: 22, onLeave: 3, leaveUtilization: 0.51, upcomingLeaves: 5 },
  { name: "Operations", totalEmployees: 38, onLeave: 7, leaveUtilization: 0.68, upcomingLeaves: 10 },
];

const leaveTypes = [
  { id: "annual", name: "Annual", color: "#2563eb", icon: "🏖️", maxDays: 20, requiresApproval: true },
  { id: "sick", name: "Sick", color: "#10b981", icon: "🏥", maxDays: 10, requiresApproval: false },
  { id: "casual", name: "Casual", color: "#f59e0b", icon: "☕", maxDays: 8, requiresApproval: true },
  { id: "Unpaid", name: "Unpaid", color: "#8b5cf6", icon: "👶", maxDays: 180, requiresApproval: true },
  { id: "Unpaid", name: "Unpaid", color: "#3b82f6", icon: "👨‍👦", maxDays: 15, requiresApproval: true },
  { id: "unpaid", name: "Unpaid", color: "#6b7280", icon: "💼", maxDays: 30, requiresApproval: true },
];

// Simple date formatting function
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const options = { month: 'short', day: '2-digit', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

const getStartOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 2).toISOString().split('T')[0];
};

const getEndOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0];
};

// Advanced leave analytics data
const generateLeaveData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map(month => ({
    month,
    applied: Math.floor(Math.random() * 20) + 10,
    approved: Math.floor(Math.random() * 18) + 8,
    rejected: Math.floor(Math.random() * 5) + 1,
    onLeave: Math.floor(Math.random() * 15) + 5,
  }));
};

// Detailed employees on leave
const employeesOnLeave = [
  {
    id: 1,
    name: "John Doe",
    avatar: "JD",
    department: "Production",
    position: "Senior Developer",
    email: "john@company.com",
    phone: "+1 (555) 123-4567",
    leaveBalance: { annual: 8, sick: 7, casual: 4, },
    onLeave: true,
    leaveUntil: "2026-05-10",
  },
  {
    id: 2,
    name: "Sarah Smith",
    avatar: "SS",
    department: "Marketing",
    position: "Marketing Manager",
    email: "sarah@company.com",
    phone: "+1 (555) 987-6543",
    leaveBalance: { annual: 12, sick: 8, casual: 6, },
    onLeave: true,
    leaveUntil: "2026-05-05",
  },
  {
    id: 3,
    name: "Michael Brown",
    avatar: "MB",
    department: "Sales",
    position: "Sales Executive",
    email: "michael@company.com",
    phone: "+1 (555) 456-7890",
    leaveBalance: { annual: 6, sick: 9, casual: 3, },
    onLeave: true,
    leaveUntil: "2026-05-15",
  },
  {
    id: 4,
    name: "Emma Wilson",
    avatar: "EW",
    department: "HR",
    position: "HR Manager",
    email: "emma@company.com",
    phone: "+1 (555) 234-5678",
    leaveBalance: { annual: 15, sick: 10, casual: 5, },
    onLeave: true,
    leaveUntil: "2026-06-01",
  },
  {
    id: 5,
    name: "Robert Chen",
    avatar: "RC",
    department: "Production",
    position: "DevOps Engineer",
    email: "robert@company.com",
    phone: "+1 (555) 876-5432",
    leaveBalance: { annual: 10, sick: 6, casual: 4, },
    onLeave: false,
  },
];

// Applied leaves with detailed information
const appliedLeaves = [
  {
    id: 1,
    employee: {
      id: 1,
      name: "John Doe",
      avatar: "JD",
      department: "Production",
      position: "Senior Developer",
      email: "john@company.com",
    },
    type: "Annual",
    startDate: "2026-05-01",
    endDate: "2026-05-05",
    duration: 5,
    status: "approved",
    reason: "Family vacation",
    submittedAt: "2026-04-20",
    approvedBy: "Jane Manager",
    approvedAt: "2026-04-21",
    attachments: ["flight_tickets.pdf", "hotel_booking.pdf"],
  },
  {
    id: 2,
    employee: {
      id: 2,
      name: "Sarah Smith",
      avatar: "SS",
      department: "Marketing",
      position: "Marketing Manager",
      email: "sarah@company.com",
    },
    type: "Sick",
    startDate: "2026-05-02",
    endDate: "2026-05-02",
    duration: 1,
    status: "pending",
    reason: "Doctor appointment",
    submittedAt: "2026-05-01",
  },
  {
    id: 3,
    employee: {
      id: 3,
      name: "Michael Brown",
      avatar: "MB",
      department: "Sales",
      position: "Sales Executive",
      email: "michael@company.com",
    },
    type: "Casual",
    startDate: "2026-05-03",
    endDate: "2026-05-04",
    duration: 2,
    status: "approved",
    reason: "Personal work",
    submittedAt: "2026-04-28",
    approvedBy: "Mark Director",
    approvedAt: "2026-04-29",
  },
  {
    id: 4,
    employee: {
      id: 4,
      name: "Emma Wilson",
      avatar: "EW",
      department: "HR",
      position: "HR Manager",
      email: "emma@company.com",
    },
    type: "Unpaid",
    startDate: "2026-05-10",
    endDate: "2026-11-10",
    duration: 180,
    status: "approved",
    reason: "Unpaid leave",
    submittedAt: "2026-04-15",
    approvedBy: "CEO Office",
    approvedAt: "2026-04-16",
  },
  {
    id: 5,
    employee: {
      id: 5,
      name: "Robert Chen",
      avatar: "RC",
      department: "Production",
      position: "DevOps Engineer",
      email: "robert@company.com",
    },
    type: "Annual",
    startDate: "2026-05-15",
    endDate: "2026-05-20",
    duration: 6,
    status: "pending",
    reason: "Wedding ceremony",
    submittedAt: "2026-05-01",
  },
];

// View Leaves - All leaves (historical and current)
const allLeaves = [
  {
    id: 101,
    employee: {
      id: 1,
      name: "John Doe",
      avatar: "JD",
      department: "Production",
      position: "Senior Developer",
      email: "john@company.com",
    },
    type: "Annual",
    startDate: "2026-03-10",
    endDate: "2026-03-15",
    duration: 6,
    status: "approved",
    reason: "Personal vacation",
    submittedAt: "2026-02-28",
    approvedBy: "Jane Manager",
  },
  {
    id: 102,
    employee: {
      id: 2,
      name: "Sarah Smith",
      avatar: "SS",
      department: "Marketing",
      position: "Marketing Manager",
      email: "sarah@company.com",
    },
    type: "Sick",
    startDate: "2026-03-20",
    endDate: "2026-03-21",
    duration: 2,
    status: "approved",
    reason: "Medical appointment",
    submittedAt: "2026-03-19",
    approvedBy: "Mark Director",
  },
  {
    id: 103,
    employee: {
      id: 3,
      name: "Michael Brown",
      avatar: "MB",
      department: "Sales",
      position: "Sales Executive",
      email: "michael@company.com",
    },
    type: "Casual",
    startDate: "2026-04-01",
    endDate: "2026-04-02",
    duration: 2,
    status: "rejected",
    reason: "Personal work",
    submittedAt: "2026-03-30",
    approvedBy: "HR Manager",
  },
  {
    id: 104,
    employee: {
      id: 6,
      name: "Lisa Taylor",
      avatar: "LT",
      department: "Finance",
      position: "Accountant",
      email: "lisa@company.com",
    },
    type: "Unpaid",
    startDate: "2026-01-15",
    endDate: "2026-07-15",
    duration: 180,
    status: "approved",
    reason: "Unpaid leave",
    submittedAt: "2026-12-20",
    approvedBy: "CEO Office",
  },
  {
    id: 105,
    employee: {
      id: 7,
      name: "David Kim",
      avatar: "DK",
      department: "Operations",
      position: "Operations Manager",
      email: "david@company.com",
    },
    type: "Unpaid",
    startDate: "2026-04-10",
    endDate: "2026-04-25",
    duration: 15,
    status: "approved",
    reason: "Unpaid leave",
    submittedAt: "2026-03-28",
    approvedBy: "HR Manager",
  },
  {
    id: 106,
    employee: {
      id: 8,
      name: "Maria Garcia",
      avatar: "MG",
      department: "HR",
      position: "HR Specialist",
      email: "maria@company.com",
    },
    type: "Unpaid",
    startDate: "2026-02-01",
    endDate: "2026-02-15",
    duration: 15,
    status: "approved",
    reason: "Personal reasons",
    submittedAt: "2026-01-25",
    approvedBy: "HR Director",
  },
];

export default function AdvancedLeaveManagementSystem() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedLeaveType, setSelectedLeaveType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({
    start: getStartOfMonth(),
    end: getEndOfMonth(),
  });
  const [showFilters, setShowFilters] = useState(false);
  const [leaveData, setLeaveData] = useState(generateLeaveData());
  const [viewLeaveModal, setViewLeaveModal] = useState(null);
  const [selectedView, setSelectedView] = useState('all'); // 'all', 'upcoming', 'past'

  // Advanced statistics calculations
  const stats = useMemo(() => {
    const totalEmployees = departments.reduce((sum, dept) => sum + dept.totalEmployees, 0);
    const totalOnLeave = departments.reduce((sum, dept) => sum + dept.onLeave, 0);
    const totalApplied = appliedLeaves.length;
    const pendingApprovals = appliedLeaves.filter(leave => leave.status === 'pending').length;
    const approvalRate = totalApplied > 0 
      ? ((appliedLeaves.filter(leave => leave.status === 'approved').length / totalApplied) * 100).toFixed(1)
      : '0';

    return {
      totalEmployees,
      totalOnLeave,
      totalApplied,
      pendingApprovals,
      approvalRate,
      leaveUtilization: ((totalOnLeave / totalEmployees) * 100).toFixed(1),
    };
  }, []);

  // Filter applied leaves
  const filteredLeaves = useMemo(() => {
    return appliedLeaves.filter(leave => {
      const matchesDepartment = selectedDepartment === 'all' || leave.employee.department === selectedDepartment;
      const matchesStatus = selectedStatus === 'all' || leave.status === selectedStatus;
      const matchesSearch = searchQuery === '' || 
        leave.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leave.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leave.reason.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesDepartment && matchesStatus && matchesSearch;
    });
  }, [selectedDepartment, selectedStatus, searchQuery]);

  // Filter all leaves (for View Leaves tab)
  const filteredAllLeaves = useMemo(() => {
    return allLeaves.filter(leave => {
      const matchesDepartment = selectedDepartment === 'all' || leave.employee.department === selectedDepartment;
      const matchesStatus = selectedStatus === 'all' || leave.status === selectedStatus;
      const matchesType = selectedLeaveType === 'all' || leave.type.toLowerCase() === selectedLeaveType;
      const matchesSearch = searchQuery === '' || 
        leave.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leave.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leave.reason.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by view type
      const today = new Date();
      const leaveEnd = new Date(leave.endDate);
      
      let matchesView = true;
      if (selectedView === 'upcoming') {
        matchesView = leaveEnd > today;
      } else if (selectedView === 'past') {
        matchesView = leaveEnd <= today;
      }
      
      return matchesDepartment && matchesStatus && matchesType && matchesSearch && matchesView;
    });
  }, [selectedDepartment, selectedStatus, selectedLeaveType, searchQuery, selectedView]);

  // Calculate department-wise leave distribution
  const departmentLeaveData = useMemo(() => {
    return departments.map(dept => ({
      name: dept.name,
      onLeave: dept.onLeave,
      upcoming: dept.upcomingLeaves,
      utilization: Math.round(dept.leaveUtilization * 100),
    }));
  }, []);

  // Handle leave actions
  const handleLeaveAction = (leaveId, action) => {
    // In a real app, this would make an API call
    console.log(`${action} leave ${leaveId}`);
  };

  // Refresh data
  const refreshData = () => {
    setLeaveData(generateLeaveData());
  };

  // Handle view leave details
  const handleViewLeave = (leave) => {
    setViewLeaveModal(leave);
  };

  // Close view modal
  const closeViewModal = () => {
    setViewLeaveModal(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6 space-y-6">
      {/* Header with Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="p-2">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-1 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 font-medium text-sm rounded-t-lg transition-colors ${
                activeTab === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="inline mr-2" size={16} />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('applied')}
              className={`px-4 py-3 font-medium text-sm rounded-t-lg transition-colors ${
                activeTab === 'applied'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CalendarDays className="inline mr-2" size={16} />
              Applied Leaves ({appliedLeaves.length})
            </button>
            <button
              onClick={() => setActiveTab('viewLeaves')}
              className={`px-4 py-3 font-medium text-sm rounded-t-lg transition-colors ${
                activeTab === 'viewLeaves'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="inline mr-2" size={16} />
              View Leaves ({allLeaves.length})
            </button>
            <button
              onClick={() => setActiveTab('onLeave')}
              className={`px-4 py-3 font-medium text-sm rounded-t-lg transition-colors ${
                activeTab === 'onLeave'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UserX className="inline mr-2" size={16} />
              On Leave ({stats.totalOnLeave})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-3 font-medium text-sm rounded-t-lg transition-colors ${
                activeTab === 'analytics'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <PieChartIcon className="inline mr-2" size={16} />
              Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder={
                  activeTab === 'viewLeaves' 
                    ? "Search all leaves..." 
                    : "Search employees, leave types, or reasons..."
                }
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm min-w-[140px]"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept.name} value={dept.name}>{dept.name}</option>
              ))}
            </select>
            <select
              className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm min-w-[140px]"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            
            {/* Leave Type Filter - Show for View Leaves tab */}
            {activeTab === 'viewLeaves' && (
              <select
                className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm min-w-[140px]"
                value={selectedLeaveType}
                onChange={(e) => setSelectedLeaveType(e.target.value)}
              >
                <option value="all">All Types</option>
                {leaveTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            )}

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
            >
              <Filter size={16} />
              More Filters
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
              <Download size={16} />
              Export Report
            </button>
            <button 
              onClick={refreshData}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
              title="Refresh data"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* View Type Filter for View Leaves tab */}
        {activeTab === 'viewLeaves' && (
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-700 font-medium">View:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setSelectedView('all')}
                  className={`px-3 py-1.5 text-sm rounded-lg ${selectedView === 'all' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  All Leaves
                </button>
                <button
                  onClick={() => setSelectedView('upcoming')}
                  className={`px-3 py-1.5 text-sm rounded-lg ${selectedView === 'upcoming' ? 'bg-green-100 text-green-700' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setSelectedView('past')}
                  className={`px-3 py-1.5 text-sm rounded-lg ${selectedView === 'past' ? 'bg-amber-100 text-amber-700' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Past Leaves
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date Range</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  />
                  <span className="self-center">to</span>
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Leave Type</label>
                <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                  <option value="all">All Types</option>
                  {leaveTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Duration</label>
                <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                  <option value="all">Any Duration</option>
                  <option value="1">1 Day</option>
                  <option value="2-3">2-3 Days</option>
                  <option value="4-7">4-7 Days</option>
                  <option value="7+">More than 7 Days</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content based on Active Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Total Employees</p>
                  <h3 className="text-3xl font-bold text-blue-900 mt-2">{stats.totalEmployees}</h3>
                </div>
                <Users className="text-blue-600" size={32} />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Currently on Leave</p>
                  <h3 className="text-3xl font-bold text-green-900 mt-2">{stats.totalOnLeave}</h3>
                  <p className="text-xs text-green-700 mt-1">{stats.leaveUtilization}% of workforce</p>
                </div>
                <UserX className="text-green-600" size={32} />
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-800">Pending Approvals</p>
                  <h3 className="text-3xl font-bold text-amber-900 mt-2">{stats.pendingApprovals}</h3>
                  <p className="text-xs text-amber-700 mt-1">Requires attention</p>
                </div>
                <AlertCircle className="text-amber-600" size={32} />
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">Approval Rate</p>
                  <h3 className="text-3xl font-bold text-purple-900 mt-2">{stats.approvalRate}%</h3>
                  <p className="text-xs text-purple-700 mt-1">This month</p>
                </div>
                <CheckCircle className="text-purple-600" size={32} />
              </div>
            </div>
          </div>

          {/* Department-wise Leave Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Department Leave Status</h3>
              <div className="space-y-4">
                {departments.map((dept) => (
                  <div key={dept.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{dept.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-600">{dept.onLeave} on leave</span>
                        <span className="text-sm text-blue-600 font-medium">
                          {Math.round(dept.leaveUtilization * 100)}% utilization
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                        style={{ width: `${dept.leaveUtilization * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{dept.totalEmployees} employees</span>
                      <span>{dept.upcomingLeaves} upcoming leaves</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Leave Trend Analysis</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={leaveData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="applied" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} />
                    <Area type="monotone" dataKey="approved" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                    <Area type="monotone" dataKey="onLeave" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'applied' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Applied Leaves ({filteredLeaves.length})</h3>
              <div className="flex items-center gap-3">
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  <Plus size={16} className="inline mr-1" />
                  New Leave
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Employee</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Leave Type</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Dates</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Duration</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map((leave) => (
                  <tr key={leave.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                          {leave.employee.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{leave.employee.name}</p>
                          <p className="text-xs text-slate-500">{leave.employee.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {leave.type}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-sm text-slate-900">{formatDate(leave.startDate)}</p>
                        <p className="text-sm text-slate-900">to {formatDate(leave.endDate)}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-medium text-slate-900">{leave.duration} days</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                        leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                        leave.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {leave.status === 'approved' ? <CheckCircle size={12} /> :
                         leave.status === 'pending' ? <Clock size={12} /> :
                         <XCircle size={12} />}
                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {leave.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleLeaveAction(leave.id, 'approve')}
                              className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleLeaveAction(leave.id, 'reject')}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => handleViewLeave(leave)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium"
                        >
                          <Eye size={12} className="inline mr-1" />
                          View
                        </button>
                        {/* <button className="p-1.5 hover:bg-slate-100 rounded">
                          <MoreVertical size={16} className="text-slate-500" />
                        </button> */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'viewLeaves' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                All Leaves ({filteredAllLeaves.length})
                <span className="text-sm font-normal text-slate-500 ml-2">
                  {selectedView === 'all' ? 'All leaves' : selectedView === 'upcoming' ? 'Upcoming leaves' : 'Past leaves'}
                </span>
              </h3>
              <div className="flex items-center gap-3">
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  <Download size={16} className="inline mr-1" />
                  Export History
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Employee</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Leave Type</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Dates</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Duration</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Submitted On</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAllLeaves.map((leave) => (
                  <tr key={leave.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                          {leave.employee.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{leave.employee.name}</p>
                          <p className="text-xs text-slate-500">{leave.employee.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {leave.type}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-sm text-slate-900">{formatDate(leave.startDate)}</p>
                        <p className="text-sm text-slate-900">to {formatDate(leave.endDate)}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-medium text-slate-900">{leave.duration} days</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                        leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                        leave.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {leave.status === 'approved' ? <CheckCircle size={12} /> :
                         leave.status === 'pending' ? <Clock size={12} /> :
                         <XCircle size={12} />}
                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-slate-700">{formatDate(leave.submittedAt)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleViewLeave(leave)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium"
                        >
                          <Eye size={12} className="inline mr-1" />
                          View Details
                        </button>
                        {/* <button className="p-1.5 hover:bg-slate-100 rounded">
                          <MoreVertical size={16} className="text-slate-500" />
                        </button> */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'onLeave' && (
        <div className="space-y-6">
          {/* Employees Currently on Leave */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Employees Currently on Leave ({employeesOnLeave.filter(e => e.onLeave).length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employeesOnLeave.filter(e => e.onLeave).map((employee) => (
                <div key={employee.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg">
                        {employee.avatar}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{employee.name}</h4>
                        <p className="text-sm text-slate-600">{employee.position}</p>
                        <p className="text-xs text-slate-500">{employee.department}</p>
                      </div>
                    </div>
                    <div className="px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">
                      On Leave
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar size={14} />
                      <span>Returns: {formatDate(employee.leaveUntil)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail size={14} />
                      <span>{employee.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone size={14} />
                      <span>{employee.phone}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex justify-between text-sm">
                      <div className="text-center">
                        <div className="text-slate-600">Annual</div>
                        <div className="font-semibold text-blue-600">{employee.leaveBalance.annual}d left</div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-600">Sick</div>
                        <div className="font-semibold text-green-600">{employee.leaveBalance.sick}d left</div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-600">Casual</div>
                        <div className="font-semibold text-amber-600">{employee.leaveBalance.casual}d left</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department-wise On Leave Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Department-wise Employees on Leave</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentLeaveData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="onLeave" name="Currently on Leave" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="upcoming" name="Upcoming Leaves" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leave Type Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Leave Type Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leaveTypes}
                      dataKey="maxDays"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {leaveTypes.map((type, index) => (
                        <Cell key={type.id} fill={type.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Leave Analytics */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Monthly Leave Analytics</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={leaveData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="applied" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-900">{stats.approvalRate}%</div>
                <div className="text-sm font-medium text-blue-800 mt-2">Average Approval Rate</div>
                <div className="text-xs text-blue-700 mt-1">Higher than industry average</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-900">4.2</div>
                <div className="text-sm font-medium text-green-800 mt-2">Average Leave Duration</div>
                <div className="text-xs text-green-700 mt-1">Days per leave request</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-900">18.5%</div>
                <div className="text-sm font-medium text-purple-800 mt-2">Leave Utilization</div>
                <div className="text-xs text-purple-700 mt-1">Of total available leave days</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Leave Details Modal */}
      {viewLeaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Leave Details</h3>
                  <p className="text-sm text-slate-600">Complete information about the leave request</p>
                </div>
                <button
                  onClick={closeViewModal}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <XCircle size={20} className="text-slate-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Employee Information */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-900 mb-4">Employee Information</h4>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
                      {viewLeaveModal.employee.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-lg text-slate-900">{viewLeaveModal.employee.name}</p>
                      <p className="text-slate-600">{viewLeaveModal.employee.position}</p>
                      <p className="text-sm text-slate-500">{viewLeaveModal.employee.department}</p>
                      <p className="text-sm text-slate-500">{viewLeaveModal.employee.email}</p>
                    </div>
                  </div>
                </div>

                {/* Leave Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Leave Type</label>
                      <div className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium">
                        {viewLeaveModal.type}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                      <div className="px-3 py-2 bg-slate-100 text-slate-900 rounded-lg font-medium">
                        {viewLeaveModal.duration} days
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                      <div className={`px-3 py-2 rounded-lg font-medium ${
                        viewLeaveModal.status === 'approved' ? 'bg-green-100 text-green-800' :
                        viewLeaveModal.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {viewLeaveModal.status.charAt(0).toUpperCase() + viewLeaveModal.status.slice(1)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                      <div className="px-3 py-2 bg-slate-100 text-slate-900 rounded-lg">
                        {formatDate(viewLeaveModal.startDate)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                      <div className="px-3 py-2 bg-slate-100 text-slate-900 rounded-lg">
                        {formatDate(viewLeaveModal.endDate)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Submitted On</label>
                      <div className="px-3 py-2 bg-slate-100 text-slate-900 rounded-lg">
                        {formatDate(viewLeaveModal.submittedAt)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Reason for Leave</label>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-slate-900">{viewLeaveModal.reason}</p>
                  </div>
                </div>

                {/* Attachments (if any) */}
                {viewLeaveModal.attachments && viewLeaveModal.attachments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Attachments</label>
                    <div className="space-y-2">
                      {viewLeaveModal.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <span className="text-sm text-blue-700">{attachment}</span>
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approval Information (if approved) */}
                {viewLeaveModal.approvedBy && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <h4 className="font-semibold text-green-900 mb-2">Approval Information</h4>
                    <p className="text-green-800">Approved by: <span className="font-semibold">{viewLeaveModal.approvedBy}</span></p>
                    {viewLeaveModal.approvedAt && (
                      <p className="text-green-800 text-sm mt-1">Approved on: {formatDate(viewLeaveModal.approvedAt)}</p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-slate-200">
                  <button
                    onClick={closeViewModal}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50"
                  >
                    Close
                  </button>
                  {viewLeaveModal.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          handleLeaveAction(viewLeaveModal.id, 'approve');
                          closeViewModal();
                        }}
                        className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          handleLeaveAction(viewLeaveModal.id, 'reject');
                          closeViewModal();
                        }}
                        className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState, useMemo } from "react";
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
} from "recharts";
import {
  Calendar,
  Download,
  Filter,
  Search,
  Plus,
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
  FileText,
  MessageSquare,
  Check,
  X,
  User,
  ChevronDown,
  ChevronRight,
  BarChart3,
  PieChart as PieChartIcon,
  CalendarDays,
  UserX,
} from "lucide-react";
import HrSidebar from '../../components/HrSidebar';

// Mock Data
const departments = [
  { name: "Production", totalEmployees: 45, onLeave: 8 },
  { name: "Marketing", totalEmployees: 28, onLeave: 4 },
  { name: "Sales", totalEmployees: 35, onLeave: 6 },
  { name: "HR", totalEmployees: 15, onLeave: 2 },
  { name: "Finance", totalEmployees: 22, onLeave: 3 },
  { name: "Operations", totalEmployees: 38, onLeave: 7 },
];

const leaveTypes = [
  { id: "annual", name: "Annual", color: "#2563eb" },
  { id: "sick", name: "Sick", color: "#10b981" },
  { id: "casual", name: "Casual", color: "#f59e0b" },
  { id: "parental", name: "Parental", color: "#8b5cf6" },
];

// Simple date formatting
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
};

// Employees on leave
const employeesOnLeave = [
  {
    id: 1,
    name: "John Doe",
    avatar: "JD",
    department: "Production",
    position: "Senior Developer",
    email: "john@company.com",
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
    onLeave: true,
    leaveUntil: "2026-05-05",
  },
];

// Applied leaves
const appliedLeaves = [
  {
    id: 1,
    employee: { name: "John Doe", department: "Production", email: "john@company.com" },
    type: "Annual",
    startDate: "2026-05-01",
    endDate: "2026-05-05",
    duration: 5,
    status: "approved",
    reason: "Family vacation",
    submittedAt: "2026-04-20",
  },
  {
    id: 2,
    employee: { name: "Sarah Smith", department: "Marketing", email: "sarah@company.com" },
    type: "Sick",
    startDate: "2026-05-02",
    endDate: "2026-05-02",
    duration: 1,
    status: "pending",
    reason: "Doctor appointment",
    submittedAt: "2026-05-01",
  },
];

// Applications data
const applications = [
  {
    id: 1,
    type: 'Leave Application',
    employeeName: 'John Smith',
    employeeEmail: 'john.smith@company.com',
    department: 'Sales',
    subject: 'Annual Leave Request',
    description: 'Requesting 5 days annual leave for family vacation',
    submittedDate: '2026-12-08',
    startDate: '2026-12-15',
    endDate: '2026-12-20',
    status: 'Pending',
    priority: 'Medium',
  },
  {
    id: 2,
    type: 'Transfer Request',
    employeeName: 'Sarah Johnson',
    employeeEmail: 'sarah.j@company.com',
    department: 'Marketing',
    subject: 'Department Transfer Request',
    description: 'Requesting transfer to Digital Marketing team',
    submittedDate: '2026-12-05',
    status: 'Approved',
    priority: 'High',
  },
  {
    id: 3,
    type: 'Reimbursement',
    employeeName: 'Mike Chen',
    employeeEmail: 'mike.chen@company.com',
    department: 'Production',
    subject: 'Travel Expense Reimbursement',
    description: 'Client meeting travel expenses',
    submittedDate: '2026-12-10',
    amount: '$450',
    status: 'Pending',
    priority: 'Medium',
  },
];

// Memos data
const memos = [
  {
    id: 1,
    type: 'Policy Update',
    title: 'Updated Remote Work Policy',
    content: 'Effective January 1st, 2026, employees can work remotely up to 3 days per week',
    issuedBy: 'HR Department',
    issuedDate: '2026-12-10',
    department: 'All',
    priority: 'High',
  },
  {
    id: 2,
    type: 'Announcement',
    title: 'Holiday Schedule 2026',
    content: 'Company holiday schedule for the year 2026 is now available',
    issuedBy: 'HR Manager',
    issuedDate: '2026-12-08',
    department: 'All',
    priority: 'Medium',
  },
];

const ApplicationsMemos = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('applications');
  const [activeTab, setActiveTab] = useState('applications');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewLeaveModal, setViewLeaveModal] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Stats calculations
  const stats = useMemo(() => ({
    totalEmployees: departments.reduce((sum, dept) => sum + dept.totalEmployees, 0),
    totalOnLeave: departments.reduce((sum, dept) => sum + dept.onLeave, 0),
    pendingApplications: applications.filter(app => app.status === 'Pending').length,
    totalMemos: memos.length,
  }), []);

  // Filter functions
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const matchesSearch = searchQuery === '' || 
        app.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = selectedDepartment === 'all' || app.department === selectedDepartment;
      const matchesStatus = selectedStatus === 'all' || app.status === selectedStatus;
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [searchQuery, selectedDepartment, selectedStatus]);

  const filteredLeaves = useMemo(() => {
    return appliedLeaves.filter(leave => {
      const matchesSearch = searchQuery === '' || 
        leave.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leave.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = selectedDepartment === 'all' || leave.employee.department === selectedDepartment;
      const matchesStatus = selectedStatus === 'all' || leave.status === selectedStatus;
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [searchQuery, selectedDepartment, selectedStatus]);

  const filteredMemos = useMemo(() => {
    return memos.filter(memo => {
      const matchesSearch = searchQuery === '' || 
        memo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memo.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [searchQuery]);

  // Get status colors
  const getStatusColor = (status) => {
    switch(status) {
      case 'Approved':
      case 'approved': return 'bg-green-100 text-green-700';
      case 'Rejected':
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'Pending':
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return 'bg-red-50 text-red-700 border-red-200';
      case 'Medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Low': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const renderApplications = () => (
    <div className="space-y-6">
      {/* Applications List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApplications.map((app) => (
          <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{app.subject}</h3>
                  <p className="text-sm text-gray-600">{app.type}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                {app.status}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{app.employeeName}</span>
                <span className="text-gray-400">•</span>
                <span>{app.department}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Submitted: {app.submittedDate}</span>
              </div>
              
              <p className="text-sm text-gray-700 line-clamp-2">{app.description}</p>
              
              {app.startDate && app.endDate && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                  <Calendar className="w-4 h-4" />
                  <span>{app.startDate} to {app.endDate}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(app.priority)}`}>
                  {app.priority} Priority
                </span>
                <button 
                  onClick={() => {
                    setSelectedApplication(app);
                    setShowDetailsModal(true);
                  }}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLeaves = () => (
    <div className="space-y-6">
      {/* Leaves List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLeaves.map((leave) => (
          <div key={leave.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{leave.employee.name}</h3>
                  <p className="text-sm text-gray-600">{leave.employee.department}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                {leave.status}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Leave Type:</span>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm">{leave.type}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</span>
                <span className="text-gray-400">•</span>
                <span className="font-medium">{leave.duration} days</span>
              </div>
              
              <p className="text-sm text-gray-700 line-clamp-2">{leave.reason}</p>
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-sm text-gray-600">Submitted: {formatDate(leave.submittedAt)}</span>
                <button 
                  onClick={() => {
                    setViewLeaveModal(leave);
                    setShowDetailsModal(true);
                  }}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMemos = () => (
    <div className="space-y-6">
      {/* Memos List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMemos.map((memo) => (
          <div key={memo.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{memo.title}</h3>
                  <p className="text-sm text-gray-600">{memo.type}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(memo.priority)}`}>
                {memo.priority}
              </span>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-700 line-clamp-3">{memo.content}</p>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>By {memo.issuedBy}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Issued: {memo.issuedDate}</span>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-sm text-gray-600">{memo.department}</span>
                <button 
                  onClick={() => {
                    setSelectedMemo(memo);
                    setShowDetailsModal(true);
                  }}
                  className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800"
                >
                  <Eye className="w-4 h-4" />
                  Read More
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // const renderDashboard = () => (
  //   <div className="space-y-6">
  //     {/* Stats Cards */}
  //     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  //       <div className="bg-white rounded-xl border border-gray-200 p-6">
  //         <div className="flex items-center justify-between">
  //           <div>
  //             <p className="text-sm font-medium text-gray-600">Total Applications</p>
  //             <p className="text-2xl font-bold text-gray-900 mt-2">{applications.length}</p>
  //           </div>
  //           <div className="p-3 bg-blue-100 rounded-lg">
  //             <FileText className="w-6 h-6 text-blue-600" />
  //           </div>
  //         </div>
  //       </div>
        
  //       <div className="bg-white rounded-xl border border-gray-200 p-6">
  //         <div className="flex items-center justify-between">
  //           <div>
  //             <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
  //             <p className="text-2xl font-bold text-gray-900 mt-2">{stats.pendingApplications}</p>
  //           </div>
  //           <div className="p-3 bg-yellow-100 rounded-lg">
  //             <AlertCircle className="w-6 h-6 text-yellow-600" />
  //           </div>
  //         </div>
  //       </div>
        
  //       <div className="bg-white rounded-xl border border-gray-200 p-6">
  //         <div className="flex items-center justify-between">
  //           <div>
  //             <p className="text-sm font-medium text-gray-600">Employees on Leave</p>
  //             <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalOnLeave}</p>
  //           </div>
  //           <div className="p-3 bg-red-100 rounded-lg">
  //             <UserX className="w-6 h-6 text-red-600" />
  //           </div>
  //         </div>
  //       </div>
        
  //       <div className="bg-white rounded-xl border border-gray-200 p-6">
  //         <div className="flex items-center justify-between">
  //           <div>
  //             <p className="text-sm font-medium text-gray-600">Active Memos</p>
  //             <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalMemos}</p>
  //           </div>
  //           <div className="p-3 bg-purple-100 rounded-lg">
  //             <MessageSquare className="w-6 h-6 text-purple-600" />
  //           </div>
  //         </div>
  //       </div>
  //     </div>

  //     {/* Department Leave Overview */}
  //     <div className="bg-white rounded-xl border border-gray-200 p-6">
  //       <h3 className="font-semibold text-gray-900 mb-4">Department Leave Overview</h3>
  //       <div className="space-y-4">
  //         {departments.map((dept) => (
  //           <div key={dept.name} className="space-y-2">
  //             <div className="flex items-center justify-between">
  //               <span className="font-medium text-gray-900">{dept.name}</span>
  //               <span className="text-sm text-gray-600">{dept.onLeave} on leave</span>
  //             </div>
  //             <div className="w-full bg-gray-200 rounded-full h-2">
  //               <div
  //                 className="h-2 rounded-full bg-blue-500"
  //                 style={{ width: `${(dept.onLeave / dept.totalEmployees) * 100}%` }}
  //               />
  //             </div>
  //             <div className="text-xs text-gray-500">
  //               {dept.totalEmployees} total employees
  //             </div>
  //           </div>
  //         ))}
  //       </div>
  //     </div>
  //   </div>
  // );

  return (
    <div className="flex h-screen bg-gray-50">
      <HrSidebar 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Application & Memos</h1>
              <p className="text-sm text-gray-600">Manage all employee applications and communications</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                {activeTab === 'applications' && 'New Application'}
                {activeTab === 'leaves' && 'New Leave'}
                {activeTab === 'memos' && 'Create Memo'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-6">
            {/* <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Dashboard
            </button> */}
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'applications'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Applications ({applications.length})
            </button>
            <button
              onClick={() => setActiveTab('leaves')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'leaves'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Leaves ({appliedLeaves.length})
            </button>
            <button
              onClick={() => setActiveTab('memos')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'memos'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Memos ({memos.length})
            </button>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder={
                      activeTab === 'applications' ? "Search applications..." :
                      activeTab === 'leaves' ? "Search leaves..." :
                      activeTab === 'memos' ? "Search memos..." :
                      "Search..."
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.name} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  <Filter size={16} />
                  More Filters
                </button>
              </div>
            </div>
          </div>

          {/* Render active tab content */}
          {/* {activeTab === 'dashboard' && renderDashboard()} */}
          {activeTab === 'applications' && renderApplications()}
          {activeTab === 'leaves' && renderLeaves()}
          {activeTab === 'memos' && renderMemos()}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && (selectedApplication || viewLeaveModal || selectedMemo) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedApplication && 'Application Details'}
                  {viewLeaveModal && 'Leave Details'}
                  {selectedMemo && 'Memo Details'}
                </h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedApplication(null);
                    setViewLeaveModal(null);
                    setSelectedMemo(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {selectedApplication && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{selectedApplication.subject}</h4>
                      <p className="text-sm text-gray-600">{selectedApplication.type}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Employee</p>
                      <p className="font-medium">{selectedApplication.employeeName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Department</p>
                      <p className="font-medium">{selectedApplication.department}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Status</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedApplication.status)}`}>
                        {selectedApplication.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Priority</p>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(selectedApplication.priority)}`}>
                        {selectedApplication.priority}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Description</p>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-900">{selectedApplication.description}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-gray-200">
                    {selectedApplication.status === 'Pending' && (
                      <>
                        <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                          Approve
                        </button>
                        <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {viewLeaveModal && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{viewLeaveModal.employee.name}</h4>
                      <p className="text-sm text-gray-600">{viewLeaveModal.employee.department}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Leave Type</p>
                      <p className="font-medium">{viewLeaveModal.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Duration</p>
                      <p className="font-medium">{viewLeaveModal.duration} days</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Status</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(viewLeaveModal.status)}`}>
                        {viewLeaveModal.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Dates</p>
                      <p className="font-medium">{formatDate(viewLeaveModal.startDate)} - {formatDate(viewLeaveModal.endDate)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Reason</p>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-900">{viewLeaveModal.reason}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-gray-200">
                    {viewLeaveModal.status === 'pending' && (
                      <>
                        <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                          Approve
                        </button>
                        <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {selectedMemo && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{selectedMemo.title}</h4>
                      <p className="text-sm text-gray-600">{selectedMemo.type}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Issued By</p>
                      <p className="font-medium">{selectedMemo.issuedBy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Date</p>
                      <p className="font-medium">{selectedMemo.issuedDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Department</p>
                      <p className="font-medium">{selectedMemo.department}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Priority</p>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(selectedMemo.priority)}`}>
                        {selectedMemo.priority}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Content</p>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-900">{selectedMemo.content}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-gray-200">
                    <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                      Send to All
                    </button>
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsMemos;
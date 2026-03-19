import React, { useState, useMemo, useEffect } from "react";
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
  Loader,
} from "lucide-react";
import HrSidebar from '../../components/HrSidebar';
import PagePreloader from '../../components/PagePreloader';
import { endpoints, getAuthHeaders } from '../../config/api';

// Simple date formatting
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
};

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

  // Real data from API
  const [applications, setApplications] = useState([]);
  const [appliedLeaves, setAppliedLeaves] = useState([]);
  const [memos, setMemos] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch applications for all employees
  const fetchApplications = async () => {
    try {
      const response = await fetch(endpoints.applications.base, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch applications');
      const result = await response.json();
      
      const formattedApps = result.data.map(app => ({
        id: app.id,
        type: app.application_type,
        employeeName: app.employee_name || 'Unknown',
        employeeEmail: app.employee_email || '',
        department: app.department,
        subject: app.subject,
        description: app.description,
        submittedDate: app.submission_date ? formatDate(app.submission_date) : 'N/A',
        status: app.status ? app.status.charAt(0).toUpperCase() + app.status.slice(1) : 'pending',
        priority: app.priority ? app.priority.charAt(0).toUpperCase() + app.priority.slice(1) : 'Medium',
        application_number: app.application_number,
        documents: app.documents || [],
      }));
      
      setApplications(formattedApps);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications');
    }
  };

  // Fetch leaves
  const fetchLeaves = async () => {
    try {
      const response = await fetch(endpoints.leaves.requests, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch leaves');
      const result = await response.json();
      
      const formattedLeaves = result.data.map(leave => ({
        id: leave.id,
        employee: { 
          name: leave.employee_name || 'Unknown', 
          department: leave.department || '', 
          email: leave.employee_email || '' 
        },
        type: leave.leave_type || leave.type,
        startDate: leave.start_date || leave.startDate,
        endDate: leave.end_date || leave.endDate,
        duration: leave.duration || 1,
        status: leave.status ? leave.status.toLowerCase() : 'pending',
        reason: leave.reason || leave.description || '',
        submittedAt: leave.created_at || leave.submittedAt,
      }));
      
      setAppliedLeaves(formattedLeaves);
    } catch (err) {
      console.error('Error fetching leaves:', err);
      // Don't set error for leaves since it's optional
    }
  };

  // Extract unique departments from applications and leaves
  const extractDepartments = (apps, leaves) => {
    const deptSet = new Set();
    apps.forEach(app => deptSet.add(app.department));
    leaves.forEach(leave => deptSet.add(leave.employee.department));
    
    return Array.from(deptSet).map(dept => ({
      name: dept,
      totalEmployees: 0, // Could be calculated if needed
      onLeave: leaves.filter(l => l.employee.department === dept).length,
    })).filter(d => d.name); // Remove empty/undefined departments
  };

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          fetchApplications(),
          fetchLeaves(),
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Update departments when applications or leaves change
  useEffect(() => {
    const depts = extractDepartments(applications, appliedLeaves);
    setDepartments(depts);
  }, [applications, appliedLeaves]);

  // Stats calculations
  const stats = useMemo(() => ({
    totalEmployees: departments.reduce((sum, dept) => sum + dept.totalEmployees, 0),
    totalOnLeave: departments.reduce((sum, dept) => sum + dept.onLeave, 0),
    pendingApplications: applications.filter(app => app.status === 'Pending').length,
    totalMemos: memos.length,
  }), [departments, applications, memos]);

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
  }, [applications, searchQuery, selectedDepartment, selectedStatus]);

  const filteredLeaves = useMemo(() => {
    return appliedLeaves.filter(leave => {
      const matchesSearch = searchQuery === '' || 
        leave.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leave.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = selectedDepartment === 'all' || leave.employee.department === selectedDepartment;
      const matchesStatus = selectedStatus === 'all' || leave.status === selectedStatus;
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [appliedLeaves, searchQuery, selectedDepartment, selectedStatus]);

  const filteredMemos = useMemo(() => {
    return memos.filter(memo => {
      const matchesSearch = searchQuery === '' || 
        memo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memo.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [memos, searchQuery]);
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
          {/* Loading State */}
          {loading && (
            <PagePreloader loading={true} message="Loading applications & memos..." />
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {!loading && (
            <>
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
            </>
          )}
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
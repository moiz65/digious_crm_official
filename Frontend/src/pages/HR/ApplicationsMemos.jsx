import React, { useState } from 'react';
import HrSidebar from '../../components/HrSidebar';
import { 
  FileText, Search, Plus, Eye, Check, X, Clock, 
  Download, Filter, User, Mail, Calendar, MessageSquare,
  AlertCircle, CheckCircle, XCircle, Edit, Trash2, Users
} from 'lucide-react';

const ApplicationsMemos = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('applications');
  const [activeTab, setActiveTab] = useState('applications');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddApplicationModal, setShowAddApplicationModal] = useState(false);

  const [applications, setApplications] = useState([
    {
      id: 1,
      type: 'Leave Application',
      employeeName: 'John Smith',
      employeeEmail: 'john.smith@company.com',
      department: 'Sales',
      subject: 'Annual Leave Request',
      description: 'Requesting 5 days annual leave for family vacation',
      submittedDate: '2024-12-08',
      startDate: '2024-12-15',
      endDate: '2024-12-20',
      status: 'Pending',
      priority: 'Medium',
      attachments: ['leave-form.pdf']
    },
    {
      id: 2,
      type: 'Transfer Request',
      employeeName: 'Sarah Johnson',
      employeeEmail: 'sarah.j@company.com',
      department: 'Marketing',
      subject: 'Department Transfer Request',
      description: 'Requesting transfer to Digital Marketing team',
      submittedDate: '2024-12-05',
      status: 'Approved',
      priority: 'High',
      approvedBy: 'HR Manager',
      approvedDate: '2024-12-07',
      notes: 'Transfer approved effective January 1st'
    },
    {
      id: 3,
      type: 'Reimbursement',
      employeeName: 'Mike Chen',
      employeeEmail: 'mike.chen@company.com',
      department: 'Production',
      subject: 'Travel Expense Reimbursement',
      description: 'Client meeting travel expenses',
      submittedDate: '2024-12-10',
      amount: '$450',
      status: 'Pending',
      priority: 'Medium',
      attachments: ['receipts.pdf', 'expense-report.xlsx']
    },
    {
      id: 4,
      type: 'Promotion Request',
      employeeName: 'Emily Davis',
      employeeEmail: 'emily.d@company.com',
      department: 'Sales',
      subject: 'Senior Sales Executive Promotion',
      description: 'Request for promotion based on performance achievements',
      submittedDate: '2024-12-01',
      status: 'Rejected',
      priority: 'High',
      rejectedBy: 'HR Director',
      rejectedDate: '2024-12-06',
      notes: 'Further evaluation needed after Q1 2025'
    }
  ]);

  const [memos, setMemos] = useState([
    {
      id: 1,
      type: 'Policy Update',
      title: 'Updated Remote Work Policy',
      content: 'Effective January 1st, 2025, employees can work remotely up to 3 days per week',
      issuedBy: 'HR Department',
      issuedDate: '2024-12-10',
      department: 'All',
      priority: 'High',
      recipients: 248,
      status: 'Active',
      expiryDate: '2025-12-31'
    },
    {
      id: 2,
      type: 'Announcement',
      title: 'Holiday Schedule 2025',
      content: 'Company holiday schedule for the year 2025 is now available',
      issuedBy: 'HR Manager',
      issuedDate: '2024-12-08',
      department: 'All',
      priority: 'Medium',
      recipients: 248,
      status: 'Active',
      attachments: ['holiday-calendar-2025.pdf']
    },
    {
      id: 3,
      type: 'Warning',
      title: 'Attendance Policy Reminder',
      content: 'Reminder about strict adherence to attendance policies',
      issuedBy: 'HR Department',
      issuedDate: '2024-12-05',
      department: 'Sales',
      priority: 'High',
      recipients: 68,
      status: 'Active'
    },
    {
      id: 4,
      type: 'General',
      title: 'Office Maintenance Schedule',
      content: 'HVAC maintenance will be conducted on December 15th',
      issuedBy: 'Facilities',
      issuedDate: '2024-12-03',
      department: 'All',
      priority: 'Low',
      recipients: 248,
      status: 'Active'
    }
  ]);

  const [memoFormData, setMemoFormData] = useState({
    type: '',
    title: '',
    content: '',
    department: '',
    priority: 'Medium'
  });

  const [applicationFormData, setApplicationFormData] = useState({
    type: 'Leave Application',
    subject: '',
    description: '',
    priority: 'Medium'
  });

  const applicationTypes = ['All', 'Leave Application', 'Transfer Request', 'Reimbursement', 'Promotion Request', 'Complaint', 'Other'];
  const memoTypes = ['Policy Update', 'Announcement', 'Warning', 'General'];
  const statuses = ['All', 'Pending', 'Approved', 'Rejected'];
  const priorities = ['Low', 'Medium', 'High'];
  const departments = ['All', 'Sales', 'Marketing', 'Production', 'HR', 'Operations'];

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || app.status === filterStatus;
    const matchesType = filterType === 'All' || app.type === filterType;
    const matchesDateRange = (!startDate || app.submittedDate >= startDate) && (!endDate || app.submittedDate <= endDate);
    return matchesSearch && matchesStatus && matchesType && matchesDateRange;
  });

  const filteredMemos = memos.filter(memo => {
    const matchesSearch = memo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         memo.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || memo.type === filterType;
    const matchesDateRange = (!startDate || memo.issuedDate >= startDate) && (!endDate || memo.issuedDate <= endDate);
    return matchesSearch && matchesType && matchesDateRange;
  });

  const handleApproveApplication = (id) => {
    setApplications(applications.map(app => 
      app.id === id 
        ? {...app, status: 'Approved', approvedBy: 'HR Manager', approvedDate: new Date().toISOString().split('T')[0]}
        : app
    ));
  };

  const handleRejectApplication = (id) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      setApplications(applications.map(app => 
        app.id === id 
          ? {...app, status: 'Rejected', rejectedBy: 'HR Manager', rejectedDate: new Date().toISOString().split('T')[0], notes: reason}
          : app
      ));
    }
  };

  const handleAddMemo = () => {
    const newMemo = {
      id: memos.length + 1,
      ...memoFormData,
      issuedBy: 'HR Manager',
      issuedDate: new Date().toISOString().split('T')[0],
      recipients: memoFormData.department === 'All' ? 248 : 68,
      status: 'Active'
    };
    setMemos([newMemo, ...memos]);
    setShowAddModal(false);
    resetMemoForm();
  };

  const handleDeleteMemo = (id) => {
    if (window.confirm('Are you sure you want to delete this memo?')) {
      setMemos(memos.filter(memo => memo.id !== id));
    }
  };

  const resetMemoForm = () => {
    setMemoFormData({
      type: '',
      title: '',
      content: '',
      department: '',
      priority: 'Medium'
    });
  };

  const handleAddApplication = () => {
    const newApplication = {
      id: applications.length + 1,
      ...applicationFormData,
      employeeName: 'Current User',
      employeeEmail: 'user@company.com',
      department: 'Sales',
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };
    setApplications([newApplication, ...applications]);
    setShowAddApplicationModal(false);
    resetApplicationForm();
  };

  const resetApplicationForm = () => {
    setApplicationFormData({
      type: 'Leave Application',
      subject: '',
      description: '',
      priority: 'Medium'
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Approved': return 'bg-green-100 text-green-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Active': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Approved': return <CheckCircle className="w-4 h-4" />;
      case 'Rejected': return <XCircle className="w-4 h-4" />;
      case 'Pending': return <Clock className="w-4 h-4" />;
      case 'Active': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const appStats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'Pending').length,
    approved: applications.filter(a => a.status === 'Approved').length,
    rejected: applications.filter(a => a.status === 'Rejected').length
  };

  const memoStats = {
    total: memos.length,
    active: memos.filter(m => m.status === 'Active').length,
    highPriority: memos.filter(m => m.priority === 'High').length,
    thisWeek: 3
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <HrSidebar 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Applications & Memos</h1>
              <p className="text-slate-600 mt-1">Manage employee applications and company memos</p>
            </div>
            {activeTab === 'memos' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Create Memo
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl shadow-lg p-2 border border-gray-200 mb-8 inline-flex gap-2">
            <button
              onClick={() => {
                setActiveTab('applications');
                setSearchTerm('');
                setFilterStatus('All');
                setFilterType('All');
              }}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold transition-all ${
                activeTab === 'applications'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Applications</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                activeTab === 'applications' 
                  ? 'bg-white/30 text-white' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {appStats.pending}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('memos');
                setSearchTerm('');
                setFilterType('All');
              }}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold transition-all ${
                activeTab === 'memos'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg scale-105'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Memos</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                activeTab === 'memos' 
                  ? 'bg-white/30 text-white' 
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {memoStats.active}
              </span>
            </button>
          </div>

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-white to-blue-25 rounded-2xl p-6 border border-blue-100 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Total Applications</p>
                      <p className="text-3xl font-bold text-slate-800 mt-2">{appStats.total}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white to-yellow-25 rounded-2xl p-6 border border-yellow-100 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Pending Review</p>
                      <p className="text-3xl font-bold text-slate-800 mt-2">{appStats.pending}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white to-green-25 rounded-2xl p-6 border border-green-100 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Approved</p>
                      <p className="text-3xl font-bold text-slate-800 mt-2">{appStats.approved}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white to-red-25 rounded-2xl p-6 border border-red-100 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Rejected</p>
                      <p className="text-3xl font-bold text-slate-800 mt-2">{appStats.rejected}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600">
                      <X className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Application Button */}
              {activeTab === 'applications' && (
                <div className="mb-6 flex justify-end">
                  <button 
                    onClick={() => setShowAddApplicationModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                  >
                    <Plus className="w-5 h-5" />
                    Add Application
                  </button>
                </div>
              )}

              {/* Search and Filter */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
                <div className="flex items-center gap-3 mb-5">
                  <Filter className="w-5 h-5 text-slate-600" />
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Filters</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-3 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by name, subject, department..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-all"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm text-slate-700 transition-all cursor-pointer"
                    >
                      {applicationTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="lg:col-span-2">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm text-slate-700 transition-all cursor-pointer"
                    >
                      {statuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div className="lg:col-span-2 relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="Start Date"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm text-slate-700 transition-all"
                    />
                  </div>
                  <div className="lg:col-span-2 relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="End Date"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm text-slate-700 transition-all"
                    />
                  </div>
                  <div className="lg:col-span-1 flex items-start">
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-md transition-all text-sm font-semibold whitespace-nowrap">
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3">
                    {(startDate || endDate) && (
                      <button 
                        onClick={() => {
                          setStartDate('');
                          setEndDate('');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all text-sm font-medium"
                      >
                        <X className="w-4 h-4" />
                        Clear Dates
                      </button>
                    )}
                    {(searchTerm || filterType !== 'All' || filterStatus !== 'All' || startDate || endDate) && (
                      <span className="text-xs text-slate-500">
                        {filteredApplications.length} result{filteredApplications.length !== 1 ? 's' : ''} found
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Applications List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredApplications.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-lg p-12 border border-blue-100 text-center col-span-full">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Applications Found</h3>
                    <p className="text-slate-600">No applications match your current filters.</p>
                  </div>
                ) : (
                  filteredApplications.map((app) => (
                    <div key={app.id} className="bg-white rounded-2xl shadow-lg border border-blue-100 hover:shadow-xl hover:border-blue-300 transition-all overflow-hidden flex flex-col">
                      {/* Header Bar */}
                      <div className={`px-6 py-3 ${
                        app.status === 'Pending' ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200' :
                        app.status === 'Approved' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200' :
                        'bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-white/80 backdrop-blur-sm text-purple-700 rounded-full text-xs font-bold shadow-sm border border-purple-200">
                              {app.type}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm border-2 ${getPriorityColor(app.priority)}`}>
                              {app.priority} Priority
                            </span>
                          </div>
                          <span className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${getStatusColor(app.status)}`}>
                            {getStatusIcon(app.status)}
                            {app.status}
                          </span>
                        </div>
                      </div>

                      {/* Main Content */}
                      <div className="p-6">
                        <div className="flex items-start justify-between gap-6">
                          <div className="flex-1">
                            {/* Employee Info */}
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                {app.employeeName.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-800 text-xl mb-1">{app.subject}</h3>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                  <div className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    <span className="font-medium">{app.employeeName}</span>
                                  </div>
                                  <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                                  <span>{app.department}</span>
                                  <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{app.submittedDate}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Description */}
                            <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                              <p className="text-slate-700 leading-relaxed">{app.description}</p>
                            </div>

                            {/* Additional Info for certain types */}
                            {app.startDate && app.endDate && (
                              <div className="flex items-center gap-4 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-semibold text-slate-700">
                                    {app.startDate} to {app.endDate}
                                  </span>
                                </div>
                              </div>
                            )}

                            {app.amount && (
                              <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 rounded-lg border border-green-200 w-fit">
                                <span className="text-sm font-semibold text-slate-600">Amount:</span>
                                <span className="text-lg font-bold text-green-700">{app.amount}</span>
                              </div>
                            )}

                            {/* Attachments */}
                            {app.attachments && app.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                <span className="text-xs font-semibold text-slate-600 flex items-center">
                                  Attachments:
                                </span>
                                {app.attachments.map((file, idx) => (
                                  <button
                                    key={idx}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium border border-blue-200 transition-all"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    {file}
                                    <Download className="w-3 h-3" />
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Approval/Rejection Notes */}
                            {app.status === 'Approved' && app.notes && (
                              <div className="mt-4 p-4 bg-green-50 rounded-xl border-2 border-green-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                  <span className="text-sm font-bold text-green-800">Approval Note</span>
                                </div>
                                <p className="text-sm text-green-700">{app.notes}</p>
                                <p className="text-xs text-green-600 mt-2">By {app.approvedBy} on {app.approvedDate}</p>
                              </div>
                            )}

                            {app.status === 'Rejected' && app.notes && (
                              <div className="mt-4 p-4 bg-red-50 rounded-xl border-2 border-red-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <XCircle className="w-5 h-5 text-red-600" />
                                  <span className="text-sm font-bold text-red-800">Rejection Reason</span>
                                </div>
                                <p className="text-sm text-red-700">{app.notes}</p>
                                <p className="text-xs text-red-600 mt-2">By {app.rejectedBy} on {app.rejectedDate}</p>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => {
                                setSelectedItem(app);
                                setShowDetailsModal(true);
                              }}
                              className="p-3 text-blue-600 hover:bg-blue-100 rounded-xl transition-all shadow-sm hover:shadow-md border border-blue-200"
                              title="View Details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            {app.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveApplication(app.id)}
                                  className="p-3 text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl transition-all shadow-lg hover:shadow-xl"
                                  title="Approve"
                                >
                                  <Check className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleRejectApplication(app.id)}
                                  className="p-3 text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl transition-all shadow-lg hover:shadow-xl"
                                  title="Reject"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Memos Tab */}
          {activeTab === 'memos' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-white to-purple-25 rounded-2xl p-6 border border-purple-100 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Total Memos</p>
                      <p className="text-3xl font-bold text-slate-800 mt-2">{memoStats.total}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white to-green-25 rounded-2xl p-6 border border-green-100 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Active Memos</p>
                      <p className="text-3xl font-bold text-slate-800 mt-2">{memoStats.active}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white to-red-25 rounded-2xl p-6 border border-red-100 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">High Priority</p>
                      <p className="text-3xl font-bold text-slate-800 mt-2">{memoStats.highPriority}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white to-blue-25 rounded-2xl p-6 border border-blue-100 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">This Week</p>
                      <p className="text-3xl font-bold text-slate-800 mt-2">{memoStats.thisWeek}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
                <div className="flex items-center gap-3 mb-5">
                  <Filter className="w-5 h-5 text-slate-600" />
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Filters</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-5 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by title, content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm transition-all"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm text-slate-700 transition-all cursor-pointer"
                    >
                      <option value="All">All Types</option>
                      {memoTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="lg:col-span-2 relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="Start Date"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm text-slate-700 transition-all"
                    />
                  </div>
                  <div className="lg:col-span-2 relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="End Date"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm text-slate-700 transition-all"
                    />
                  </div>
                  <div className="lg:col-span-1 flex items-start">
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-md transition-all text-sm font-semibold whitespace-nowrap">
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3">
                    {(startDate || endDate) && (
                      <button 
                        onClick={() => {
                          setStartDate('');
                          setEndDate('');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all text-sm font-medium"
                      >
                        <X className="w-4 h-4" />
                        Clear Dates
                      </button>
                    )}
                    {(searchTerm || filterType !== 'All' || startDate || endDate) && (
                      <span className="text-xs text-slate-500">
                        {filteredMemos.length} result{filteredMemos.length !== 1 ? 's' : ''} found
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Memos Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMemos.length === 0 ? (
                  <div className="col-span-full bg-white rounded-2xl shadow-lg p-12 border border-purple-100 text-center">
                    <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Memos Found</h3>
                    <p className="text-slate-600">No memos match your current filters.</p>
                  </div>
                ) : (
                  filteredMemos.map((memo) => (
                    <div key={memo.id} className="bg-white rounded-2xl shadow-lg border border-purple-100 hover:shadow-xl hover:border-purple-300 transition-all overflow-hidden group">
                      {/* Header with Type Badge */}
                      <div className={`px-6 py-4 border-b ${
                        memo.priority === 'High' ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200' :
                        memo.priority === 'Medium' ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' :
                        'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-white shadow-sm border border-purple-200 group-hover:shadow-md transition-all">
                              <MessageSquare className="w-5 h-5 text-purple-600" />
                            </div>
                            <span className="px-4 py-1.5 bg-white/90 backdrop-blur-sm text-purple-700 rounded-full text-xs font-bold shadow-sm border border-purple-200">
                              {memo.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedItem(memo);
                                setShowDetailsModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-white rounded-lg transition-all"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-green-600 hover:bg-white rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMemo(memo.id)}
                              className="p-2 text-red-600 hover:bg-white rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Main Content */}
                      <div className="p-6">
                        <h3 className="font-bold text-slate-800 text-xl mb-3 line-clamp-2 leading-tight">{memo.title}</h3>
                        <p className="text-slate-600 text-sm mb-4 line-clamp-3 leading-relaxed">{memo.content}</p>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="w-3.5 h-3.5 text-purple-600" />
                              <p className="text-xs text-slate-500 font-medium">Issued By</p>
                            </div>
                            <p className="text-sm font-bold text-slate-800">{memo.issuedBy}</p>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="w-3.5 h-3.5 text-purple-600" />
                              <p className="text-xs text-slate-500 font-medium">Date</p>
                            </div>
                            <p className="text-sm font-bold text-slate-800">{memo.issuedDate}</p>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                            <div className="flex items-center gap-2 mb-1">
                              <Users className="w-3.5 h-3.5 text-purple-600" />
                              <p className="text-xs text-slate-500 font-medium">Department</p>
                            </div>
                            <p className="text-sm font-bold text-slate-800">{memo.department}</p>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                            <div className="flex items-center gap-2 mb-1">
                              <Mail className="w-3.5 h-3.5 text-purple-600" />
                              <p className="text-xs text-slate-500 font-medium">Recipients</p>
                            </div>
                            <p className="text-sm font-bold text-slate-800">{memo.recipients} employees</p>
                          </div>
                        </div>

                        {/* Attachments */}
                        {memo.attachments && memo.attachments.length > 0 && (
                          <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                            <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" />
                              Attachments
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {memo.attachments.map((file, idx) => (
                                <button
                                  key={idx}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200 transition-all"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  {file}
                                  <Download className="w-3 h-3" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Footer with Status and Priority */}
                        <div className="flex items-center justify-between pt-4 border-t border-purple-100">
                          <span className={`px-4 py-2 rounded-xl text-xs font-bold border-2 shadow-sm ${getPriorityColor(memo.priority)}`}>
                            <span className="flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {memo.priority} Priority
                            </span>
                          </span>
                          <span className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-sm ${getStatusColor(memo.status)}`}>
                            {getStatusIcon(memo.status)}
                            {memo.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className={`flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r ${
              activeTab === 'applications' ? 'from-blue-500 to-blue-600' : 'from-purple-500 to-purple-600'
            } text-white rounded-t-3xl`}>
              <h2 className="text-2xl font-bold">
                {activeTab === 'applications' ? 'Application Details' : 'Memo Details'}
              </h2>
              <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8">
              {activeTab === 'applications' ? (
                <>
                  <div className="flex items-center gap-6 mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      {selectedItem.employeeName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800">{selectedItem.employeeName}</h3>
                      <p className="text-slate-600">{selectedItem.employeeEmail}</p>
                      <p className="text-slate-600">{selectedItem.department}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <p className="text-xs text-slate-600 font-medium mb-1">Application Type</p>
                        <p className="text-slate-800 font-semibold">{selectedItem.type}</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <p className="text-xs text-slate-600 font-medium mb-1">Status</p>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedItem.status)}`}>
                          {getStatusIcon(selectedItem.status)}
                          {selectedItem.status}
                        </span>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <p className="text-xs text-slate-600 font-medium mb-1">Priority</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getPriorityColor(selectedItem.priority)}`}>
                          {selectedItem.priority}
                        </span>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <p className="text-xs text-slate-600 font-medium mb-1">Submitted Date</p>
                        <p className="text-slate-800 font-semibold">{selectedItem.submittedDate}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-xl">
                      <p className="text-xs text-slate-600 font-medium mb-1">Subject</p>
                      <p className="text-slate-800 font-semibold">{selectedItem.subject}</p>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-xl">
                      <p className="text-xs text-slate-600 font-medium mb-1">Description</p>
                      <p className="text-slate-800">{selectedItem.description}</p>
                    </div>

                    {selectedItem.status === 'Approved' && (
                      <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <p className="text-green-800 font-bold">Approved</p>
                        </div>
                        <p className="text-sm text-green-700">Approved by {selectedItem.approvedBy} on {selectedItem.approvedDate}</p>
                        {selectedItem.notes && <p className="text-sm text-green-700 mt-2">{selectedItem.notes}</p>}
                      </div>
                    )}

                    {selectedItem.status === 'Rejected' && (
                      <div className="p-4 bg-red-50 rounded-xl border-2 border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="w-5 h-5 text-red-600" />
                          <p className="text-red-800 font-bold">Rejected</p>
                        </div>
                        <p className="text-sm text-red-700">Rejected by {selectedItem.rejectedBy} on {selectedItem.rejectedDate}</p>
                        {selectedItem.notes && <p className="text-sm text-red-700 mt-2"><span className="font-semibold">Reason:</span> {selectedItem.notes}</p>}
                      </div>
                    )}

                    {selectedItem.status === 'Pending' && (
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => {
                            handleApproveApplication(selectedItem.id);
                            setShowDetailsModal(false);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all"
                        >
                          <Check className="w-5 h-5" />
                          Approve Application
                        </button>
                        <button
                          onClick={() => {
                            handleRejectApplication(selectedItem.id);
                            setShowDetailsModal(false);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all"
                        >
                          <X className="w-5 h-5" />
                          Reject Application
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-6 mb-6">
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg">
                      <MessageSquare className="w-12 h-12 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800">{selectedItem.title}</h3>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                        {selectedItem.type}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50 rounded-xl">
                      <p className="text-xs text-slate-600 font-medium mb-2">Content</p>
                      <p className="text-slate-800 leading-relaxed">{selectedItem.content}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-purple-50 rounded-xl">
                        <p className="text-xs text-slate-600 font-medium mb-1">Issued By</p>
                        <p className="text-slate-800 font-semibold">{selectedItem.issuedBy}</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-xl">
                        <p className="text-xs text-slate-600 font-medium mb-1">Issued Date</p>
                        <p className="text-slate-800 font-semibold">{selectedItem.issuedDate}</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-xl">
                        <p className="text-xs text-slate-600 font-medium mb-1">Department</p>
                        <p className="text-slate-800 font-semibold">{selectedItem.department}</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-xl">
                        <p className="text-xs text-slate-600 font-medium mb-1">Recipients</p>
                        <p className="text-slate-800 font-semibold">{selectedItem.recipients} employees</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-xl">
                        <p className="text-xs text-slate-600 font-medium mb-1">Priority</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getPriorityColor(selectedItem.priority)}`}>
                          {selectedItem.priority}
                        </span>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-xl">
                        <p className="text-xs text-slate-600 font-medium mb-1">Status</p>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedItem.status)}`}>
                          {getStatusIcon(selectedItem.status)}
                          {selectedItem.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Memo Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-3xl">
              <h2 className="text-2xl font-bold">Create New Memo</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Memo Type</label>
                  <select
                    value={memoFormData.type}
                    onChange={(e) => setMemoFormData({...memoFormData, type: e.target.value})}
                    className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select Type</option>
                    {memoTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={memoFormData.title}
                    onChange={(e) => setMemoFormData({...memoFormData, title: e.target.value})}
                    className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter memo title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Content</label>
                  <textarea
                    value={memoFormData.content}
                    onChange={(e) => setMemoFormData({...memoFormData, content: e.target.value})}
                    className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows="6"
                    placeholder="Enter memo content"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
                    <select
                      value={memoFormData.department}
                      onChange={(e) => setMemoFormData({...memoFormData, department: e.target.value})}
                      className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select Department</option>
                      {departments.filter(d => d !== 'All').map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                      <option value="All">All Departments</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                    <select
                      value={memoFormData.priority}
                      onChange={(e) => setMemoFormData({...memoFormData, priority: e.target.value})}
                      className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {priorities.map(priority => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMemo}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Create Memo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Application Modal */}
      {showAddApplicationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-3xl">
              <h2 className="text-2xl font-bold">Submit New Application</h2>
              <button onClick={() => setShowAddApplicationModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Application Type</label>
                  <select
                    value={applicationFormData.type}
                    onChange={(e) => setApplicationFormData({...applicationFormData, type: e.target.value})}
                    className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {applicationTypes.filter(t => t !== 'All').map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                  <input
                    type="text"
                    value={applicationFormData.subject}
                    onChange={(e) => setApplicationFormData({...applicationFormData, subject: e.target.value})}
                    className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter application subject"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                  <textarea
                    value={applicationFormData.description}
                    onChange={(e) => setApplicationFormData({...applicationFormData, description: e.target.value})}
                    className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="6"
                    placeholder="Enter detailed description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                  <select
                    value={applicationFormData.priority}
                    onChange={(e) => setApplicationFormData({...applicationFormData, priority: e.target.value})}
                    className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {priorities.map(priority => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddApplicationModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddApplication}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Submit Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsMemos;

import React, { useState, useEffect } from 'react';
import {
  FileCheck, ClipboardList, Plus, Search, Filter,
  ArrowUpDown, UserCheck, CalendarDays, Mail as MailIcon,
  Clock, AlertCircle, Flag, Paperclip, X,
  Check, Download, Printer, Share2, FileText,
  Eye, CheckCircle, Users, Home, Settings,
  BarChart, Users as UsersIcon, Shield, Building,
  Globe, CreditCard, Phone, MapPin, Briefcase,
  File, Bookmark, Star, TrendingUp, DollarSign,
  Package, ShoppingCart, CreditCard as CreditCardIcon,
  PieChart, Grid, List, EyeOff, BookmarkPlus,
  UploadCloud, CloudOff, Wifi, Battery, Power,
  Database, Server, Cpu, HardDrive, Network,
  BellRing, Volume2, VolumeX, Moon, Sun, RotateCcw,
  Award, Trophy, Medal, Crown, CheckSquare,
  Square, ListChecks, ListTodo, Checklist, CalendarClock,
  Hourglass, Timer, CloudRain, CloudSnow, CloudLightning,
  CloudSun, CloudMoon, Sunrise, Sunset, ThermometerSun,
  Wind, Droplets, Umbrella, Flame, Snowflake
} from 'lucide-react';

const ApplicationsMemosDashboard = () => {
  const [activeTab, setActiveTab] = useState('applications');
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  const [showNewMemoModal, setShowNewMemoModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [applications, setApplications] = useState([]);
  const [memos, setMemos] = useState([]);
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    totalMemos: 0,
    unreadMemos: 0,
    importantMemos: 0
  });

  // Sample data
  useEffect(() => {
    const mockApplications = [
      {
        id: 1,
        applicationNumber: 'APP-2024-001',
        applicantName: 'John Smith',
        applicantEmail: 'john.smith@company.com',
        applicationType: 'Leave Application',
        submissionDate: '2024-01-15',
        status: 'pending',
        priority: 'medium',
        department: 'Production',
        requiredDocuments: 3,
        submittedDocuments: 2,
        notes: 'Requesting 5 days of annual leave',
        assignedTo: 'Sarah Johnson',
        lastUpdated: '2024-01-16',
        timeline: [
          { date: '2024-01-15', action: 'Submitted', status: 'completed' },
          { date: '2024-01-16', action: 'Under Review', status: 'current' }
        ]
      },
      {
        id: 2,
        applicationNumber: 'APP-2024-002',
        applicantName: 'Maria Garcia',
        applicantEmail: 'maria.garcia@company.com',
        applicationType: 'Travel Request',
        submissionDate: '2024-01-14',
        status: 'approved',
        priority: 'high',
        department: 'Sales',
        requiredDocuments: 4,
        submittedDocuments: 4,
        notes: 'Business trip to client meeting in Chicago',
        assignedTo: 'Michael Chen',
        lastUpdated: '2024-01-15',
        timeline: [
          { date: '2024-01-14', action: 'Submitted', status: 'completed' },
          { date: '2024-01-14', action: 'Reviewed', status: 'completed' },
          { date: '2024-01-15', action: 'Approved', status: 'completed' }
        ]
      },
      {
        id: 3,
        applicationNumber: 'APP-2024-003',
        applicantName: 'Robert Johnson',
        applicantEmail: 'robert.johnson@company.com',
        applicationType: 'Equipment Request',
        submissionDate: '2024-01-13',
        status: 'rejected',
        priority: 'low',
        department: 'IT',
        requiredDocuments: 2,
        submittedDocuments: 1,
        notes: 'Request for new laptop',
        assignedTo: 'IT Department',
        lastUpdated: '2024-01-14',
        timeline: [
          { date: '2024-01-13', action: 'Submitted', status: 'completed' },
          { date: '2024-01-14', action: 'Rejected - Missing documents', status: 'completed' }
        ]
      },
      {
        id: 4,
        applicationNumber: 'APP-2024-004',
        applicantName: 'Emily Davis',
        applicantEmail: 'emily.davis@company.com',
        applicationType: 'Training Request',
        submissionDate: '2024-01-12',
        status: 'in_progress',
        priority: 'medium',
        department: 'HR',
        requiredDocuments: 3,
        submittedDocuments: 3,
        notes: 'Request for leadership training program',
        assignedTo: 'Training Department',
        lastUpdated: '2024-01-13',
        timeline: [
          { date: '2024-01-12', action: 'Submitted', status: 'completed' },
          { date: '2024-01-13', action: 'Under Evaluation', status: 'current' }
        ]
      }
    ];

    const mockMemos = [
      {
        id: 1,
        memoNumber: 'MEMO-2024-001',
        title: 'Quarterly Meeting Agenda',
        author: 'CEO Office',
        date: '2024-01-15',
        priority: 'high',
        category: 'Announcement',
        status: 'unread',
        recipients: ['All Employees', 'Management'],
        summary: 'Agenda for Q1 company-wide meeting',
        attachments: 2,
        actionsRequired: true,
        deadline: '2024-01-20'
      },
      {
        id: 2,
        memoNumber: 'MEMO-2024-002',
        title: 'New Policy Implementation',
        author: 'HR Department',
        date: '2024-01-14',
        priority: 'medium',
        category: 'Policy',
        status: 'read',
        recipients: ['All Departments'],
        summary: 'Updated remote work policy guidelines',
        attachments: 3,
        actionsRequired: false,
        deadline: '2024-01-25'
      },
      {
        id: 3,
        memoNumber: 'MEMO-2024-003',
        title: 'Security Alert',
        author: 'IT Security',
        date: '2024-01-13',
        priority: 'urgent',
        category: 'Security',
        status: 'unread',
        recipients: ['All Staff'],
        summary: 'Important security updates required',
        attachments: 1,
        actionsRequired: true,
        deadline: '2024-01-14'
      }
    ];

    setApplications(mockApplications);
    setMemos(mockMemos);
    
    setStats({
      totalApplications: mockApplications.length,
      pendingApplications: mockApplications.filter(app => app.status === 'pending').length,
      approvedApplications: mockApplications.filter(app => app.status === 'approved').length,
      rejectedApplications: mockApplications.filter(app => app.status === 'rejected').length,
      totalMemos: mockMemos.length,
      unreadMemos: mockMemos.filter(memo => memo.status === 'unread').length,
      importantMemos: mockMemos.filter(memo => memo.priority === 'high' || memo.priority === 'urgent').length
    });
  }, []);

  const handleStatusChange = (appId, newStatus) => {
    setApplications(prev => prev.map(app => 
      app.id === appId ? { ...app, status: newStatus } : app
    ));
  };

  const handleMarkAsRead = (memoId) => {
    setMemos(prev => prev.map(memo => 
      memo.id === memoId ? { ...memo, status: 'read' } : memo
    ));
  };

  const handleAddApplication = (applicationData) => {
    const newApp = {
      id: applications.length + 1,
      applicationNumber: `APP-2024-${String(applications.length + 1).padStart(3, '0')}`,
      ...applicationData,
      submissionDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      timeline: [
        { date: new Date().toISOString().split('T')[0], action: 'Submitted', status: 'completed' },
        { date: new Date().toISOString().split('T')[0], action: 'Under Review', status: 'current' }
      ]
    };
    setApplications(prev => [...prev, newApp]);
    setShowNewAppModal(false);
  };

  const handleAddMemo = (memoData) => {
    const newMemo = {
      id: memos.length + 1,
      memoNumber: `MEMO-2024-${String(memos.length + 1).padStart(3, '0')}`,
      ...memoData,
      date: new Date().toISOString().split('T')[0],
      status: 'unread'
    };
    setMemos(prev => [...prev, newMemo]);
    setShowNewMemoModal(false);
  };

  return (
    <div className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Total Applications" 
          value={stats.totalApplications} 
          icon={<FileCheck className="h-6 w-6" />}
          trend="+12%"
          color="blue"
        />
        <StatCard 
          title="Pending Review" 
          value={stats.pendingApplications} 
          icon={<Clock className="h-6 w-6" />}
          trend="+5%"
          color="yellow"
        />
        <StatCard 
          title="Approved" 
          value={stats.approvedApplications} 
          icon={<CheckCircle className="h-6 w-6" />}
          trend="+8%"
          color="green"
        />
        <StatCard 
          title="Unread Memos" 
          value={stats.unreadMemos} 
          icon={<MailIcon className="h-6 w-6" />}
          trend="-3%"
          color="purple"
        />
      </div>

      {/* Main Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between px-6">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('applications')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap ${activeTab === 'applications' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <FileCheck className="h-4 w-4" />
                Applications ({applications.length})
              </button>
              <button
                onClick={() => setActiveTab('memos')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap ${activeTab === 'memos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <ClipboardList className="h-4 w-4" />
                Memos ({memos.length})
              </button>
            </nav>
            <div className="flex items-center gap-3">
              {/* {activeTab === 'applications' && (
                // <button 
                //   onClick={() => setShowNewAppModal(true)}
                //   className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-200 flex items-center gap-2"
                // >
                //   <Plus className="h-4 w-4" />
                //   New Application
                // </button>
              )} */}
              {activeTab === 'memos' && (
                <button 
                  onClick={() => setShowNewMemoModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-200 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Memo
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'applications' && (
            <ApplicationsTab 
              applications={applications}
              onSelect={setSelectedApplication}
              onStatusChange={handleStatusChange}
            />
          )}
          {activeTab === 'memos' && (
            <MemosTab 
              memos={memos}
              onSelect={setSelectedMemo}
              onMarkAsRead={handleMarkAsRead}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {showNewAppModal && (
        <NewApplicationModal
          onClose={() => setShowNewAppModal(false)}
          onSave={handleAddApplication}
        />
      )}

      {showNewMemoModal && (
        <NewMemoModal
          onClose={() => setShowNewMemoModal(false)}
          onSave={handleAddMemo}
        />
      )}

      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {selectedMemo && (
        <MemoDetailModal
          memo={selectedMemo}
          onClose={() => setSelectedMemo(null)}
          onMarkAsRead={handleMarkAsRead}
        />
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, trend, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <h4 className="text-2xl font-bold">{value}</h4>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs ${
          trend.startsWith('+') 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {trend}
        </div>
      </div>
    </div>
  );
};

// Applications Tab Component
const ApplicationsTab = ({ applications, onSelect, onStatusChange }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [search, setSearch] = useState('');

  const filteredApplications = applications.filter(app => {
    if (filter !== 'all' && app.status !== filter) return false;
    if (search && !app.applicantName.toLowerCase().includes(search.toLowerCase()) && 
        !app.applicationType.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.submissionDate) - new Date(a.submissionDate);
      case 'name':
        return a.applicantName.localeCompare(b.applicantName);
      case 'priority':
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      default:
        return 0;
    }
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Pending</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Rejected</span>;
      case 'in_progress':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">In Progress</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Unknown</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Urgent</span>;
      case 'high':
        return <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">High</span>;
      case 'medium':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Medium</span>;
      case 'low':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Low</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Normal</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search applications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="in_progress">In Progress</option>
          </select>

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="priority">Sort by Priority</option>
          </select>
        </div>
      </div>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedApplications.map(app => (
          <div 
            key={app.id} 
            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition duration-200 cursor-pointer"
            onClick={() => onSelect(app)}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{app.applicantName}</h4>
                <p className="text-sm text-gray-600">{app.applicationType}</p>
              </div>
              <div className="flex items-center gap-2">
                {getPriorityBadge(app.priority)}
                {getStatusBadge(app.status)}
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Application #</span>
                <span className="font-medium">{app.applicationNumber}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Submitted</span>
                <span className="font-medium">{app.submissionDate}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Department</span>
                <span className="font-medium">{app.department}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Documents</span>
                <span className={`font-medium ${app.submittedDocuments < app.requiredDocuments ? 'text-red-600' : 'text-green-600'}`}>
                  {app.submittedDocuments}/{app.requiredDocuments}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <UserCheck className="h-4 w-4" />
                <span>{app.assignedTo}</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(app);
                }}
                className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {sortedApplications.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
          <p className="text-gray-600">Try adjusting your filters or search terms</p>
        </div>
      )}
    </div>
  );
};

// Memos Tab Component
const MemosTab = ({ memos, onSelect, onMarkAsRead }) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredMemos = memos.filter(memo => {
    if (filter !== 'all' && memo.status !== filter) return false;
    if (search && !memo.title.toLowerCase().includes(search.toLowerCase()) && 
        !memo.author.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <Flag className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryBadge = (category) => {
    const colors = {
      Announcement: 'bg-purple-100 text-purple-800',
      Policy: 'bg-blue-100 text-blue-800',
      Security: 'bg-red-100 text-red-800',
      Project: 'bg-green-100 text-green-800',
      Training: 'bg-yellow-100 text-yellow-800',
      Finance: 'bg-indigo-100 text-indigo-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[category] || 'bg-gray-100 text-gray-800'}`}>
        {category}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search memos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Memos</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
      </div>

      {/* Memos List */}
      <div className="space-y-3">
        {filteredMemos.map(memo => (
          <div 
            key={memo.id} 
            className={`bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition duration-200 cursor-pointer ${memo.status === 'unread' ? 'bg-blue-50' : ''}`}
            onClick={() => {
              onSelect(memo);
              if (memo.status === 'unread') {
                onMarkAsRead(memo.id);
              }
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getPriorityIcon(memo.priority)}
                  <h4 className="font-semibold text-gray-900">{memo.title}</h4>
                  {memo.status === 'unread' && (
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">New</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{memo.summary}</p>
                
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    {memo.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {memo.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <MailIcon className="h-3 w-3" />
                    {memo.recipients.length} recipients
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                {getCategoryBadge(memo.category)}
                {memo.actionsRequired && (
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Action Required</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-4 text-sm">
                {memo.attachments > 0 && (
                  <span className="flex items-center gap-1 text-gray-600">
                    <Paperclip className="h-3 w-3" />
                    {memo.attachments} attachments
                  </span>
                )}
                {memo.deadline && (
                  <span className="flex items-center gap-1 text-gray-600">
                    <Clock className="h-3 w-3" />
                    Deadline: {memo.deadline}
                  </span>
                )}
              </div>
              <div className="text-sm font-medium text-gray-900">
                {memo.memoNumber}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMemos.length === 0 && (
        <div className="text-center py-12">
          <ClipboardList className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No memos found</h3>
          <p className="text-gray-600">Try adjusting your filters or search terms</p>
        </div>
      )}
    </div>
  );
};

// New Application Modal
const NewApplicationModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    applicantName: '',
    applicantEmail: '',
    applicationType: '',
    department: '',
    priority: 'medium',
    notes: '',
    requiredDocuments: 1
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">New Application</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Applicant Name *</label>
              <input 
                type="text"
                value={formData.applicantName}
                onChange={(e) => setFormData(prev => ({ ...prev, applicantName: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Applicant Email *</label>
              <input 
                type="email"
                value={formData.applicantEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, applicantEmail: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Application Type *</label>
              <select 
                value={formData.applicationType}
                onChange={(e) => setFormData(prev => ({ ...prev, applicationType: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              >
                <option value="">Select Type</option>
                <option value="Leave Application">Leave Application</option>
                <option value="Travel Request">Travel Request</option>
                <option value="Equipment Request">Equipment Request</option>
                <option value="Training Request">Training Request</option>
                <option value="Expense Reimbursement">Expense Reimbursement</option>
                <option value="Promotion Request">Promotion Request</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <select 
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              >
                <option value="">Select Department</option>
                <option value="Production">Production</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="IT">IT</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
              <select 
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Required Documents</label>
              <input 
                type="number"
                min="1"
                max="10"
                value={formData.requiredDocuments}
                onChange={(e) => setFormData(prev => ({ ...prev, requiredDocuments: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              placeholder="Additional notes or instructions..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-xl hover:bg-blue-700"
            >
              Create Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// New Memo Modal
const NewMemoModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: 'Announcement',
    priority: 'medium',
    summary: '',
    recipients: [],
    actionsRequired: false,
    deadline: ''
  });

  const [newRecipient, setNewRecipient] = useState('');

  const handleAddRecipient = () => {
    if (newRecipient.trim() && !formData.recipients.includes(newRecipient.trim())) {
      setFormData(prev => ({
        ...prev,
        recipients: [...prev.recipients, newRecipient.trim()]
      }));
      setNewRecipient('');
    }
  };

  const handleRemoveRecipient = (recipient) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== recipient)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">New Memo</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input 
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              placeholder="Memo title..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Author *</label>
              <input 
                type="text"
                value={formData.author}
                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                placeholder="Department or person"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              >
                <option value="Announcement">Announcement</option>
                <option value="Policy">Policy</option>
                <option value="Security">Security</option>
                <option value="Project">Project</option>
                <option value="Training">Training</option>
                <option value="Finance">Finance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
              <select 
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline (Optional)</label>
              <input 
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRecipient())}
                  placeholder="Add recipient (e.g., All Employees)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-xl"
                />
                <button
                  type="button"
                  onClick={handleAddRecipient}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              {formData.recipients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.recipients.map((recipient, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {recipient}
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipient(recipient)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Summary *</label>
            <textarea 
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              rows="3"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              placeholder="Brief summary of the memo..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              checked={formData.actionsRequired}
              onChange={(e) => setFormData(prev => ({ ...prev, actionsRequired: e.target.checked }))}
              className="w-4 h-4 text-blue-600"
              id="actionsRequired"
            />
            <label htmlFor="actionsRequired" className="text-sm text-gray-700">
              Actions Required
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-xl hover:bg-blue-700"
            >
              Create Memo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Application Detail Modal
const ApplicationDetailModal = ({ application, onClose, onStatusChange }) => {
  const [status, setStatus] = useState(application.status);

  const handleStatusUpdate = (newStatus) => {
    setStatus(newStatus);
    onStatusChange(application.id, newStatus);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{application.applicationType}</h3>
            <p className="text-sm text-gray-600">{application.applicationNumber}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Applicant Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Applicant Name</p>
                    <p className="font-medium">{application.applicantName}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="font-medium">{application.applicantEmail}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Department</p>
                    <p className="font-medium">{application.department}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Submission Date</p>
                    <p className="font-medium">{application.submissionDate}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Application Details</h4>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-2">Notes</p>
                  <p className="text-gray-900">{application.notes}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Timeline</h4>
                <div className="space-y-3">
                  {application.timeline.map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.status === 'completed' ? 'bg-green-100 text-green-600' :
                        step.status === 'current' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {step.status === 'completed' ? <Check className="h-4 w-4" /> : 
                         step.status === 'current' ? <Clock className="h-4 w-4" /> : 
                         <div className="w-2 h-2 bg-gray-400 rounded-full"></div>}
                      </div>
                      <div>
                        <p className="font-medium">{step.action}</p>
                        <p className="text-sm text-gray-600">{step.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Status & Actions</h4>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 mb-2">Current Status</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        status === 'approved' ? 'bg-green-100 text-green-800' :
                        status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {status === 'pending' ? 'Pending' :
                         status === 'approved' ? 'Approved' :
                         status === 'rejected' ? 'Rejected' :
                         'In Progress'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => handleStatusUpdate('approved')}
                      className="w-full px-4 py-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition duration-200"
                    >
                      Approve Application
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('rejected')}
                      className="w-full px-4 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition duration-200"
                    >
                      Reject Application
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('in_progress')}
                      className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition duration-200"
                    >
                      Mark as In Progress
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Documents</h4>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Documents Status</p>
                    <span className={`text-sm font-medium ${
                      application.submittedDocuments >= application.requiredDocuments 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {application.submittedDocuments}/{application.requiredDocuments}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        application.submittedDocuments >= application.requiredDocuments 
                          ? 'bg-green-500' 
                          : 'bg-yellow-500'
                      }`}
                      style={{ width: `${(application.submittedDocuments / application.requiredDocuments) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Quick Actions</h4>
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100">
                    <Download className="h-4 w-4" />
                    Download Documents
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100">
                    <MailIcon className="h-4 w-4" />
                    Email Applicant
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100">
                    <Printer className="h-4 w-4" />
                    Print Application
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memo Detail Modal
const MemoDetailModal = ({ memo, onClose, onMarkAsRead }) => {
  useEffect(() => {
    if (memo.status === 'unread') {
      onMarkAsRead(memo.id);
    }
  }, [memo.id, memo.status, onMarkAsRead]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{memo.title}</h3>
            <p className="text-sm text-gray-600">{memo.memoNumber}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="prose max-w-none">
                <h4 className="font-semibold text-gray-900 mb-4">Memo Content</h4>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <p className="text-gray-900 whitespace-pre-line">{memo.summary}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Additional Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Category</p>
                    <p className="font-medium">{memo.category}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Priority</p>
                    <p className="font-medium capitalize">{memo.priority}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Date Issued</p>
                    <p className="font-medium">{memo.date}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Author</p>
                    <p className="font-medium">{memo.author}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Recipients</h4>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="space-y-2">
                    {memo.recipients.map((recipient, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <UserCheck className="h-3 w-3 text-gray-400" />
                        <span>{recipient}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Status</h4>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Read Status</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        memo.status === 'unread' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {memo.status === 'unread' ? 'Unread' : 'Read'}
                      </span>
                    </div>
                    
                    {memo.actionsRequired && (
                      <div className="mt-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600">Action Required</span>
                      </div>
                    )}
                    
                    {memo.deadline && (
                      <div className="mt-2 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Deadline: {memo.deadline}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Quick Actions</h4>
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100">
                    <Download className="h-4 w-4" />
                    Download Memo
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100">
                    <Check className="h-4 w-4" />
                    Mark as Completed
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100">
                    <Share2 className="h-4 w-4" />
                    Share Memo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationsMemosDashboard;
import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Calendar, MapPin, Briefcase,
  FileCheck, ClipboardList, Plus, Search, Filter,
  Clock, AlertCircle, CheckCircle, X, Download,
  Printer, Share2, Paperclip, Upload, Eye,
  Check, UserPlus, Award, TrendingUp, DollarSign,
  Package, ShoppingCart, CreditCard, PieChart, Grid,
  Bell, Settings, LogOut, Home, BarChart, Users,
  Shield, Building, Globe, Bookmark, Star,
  CloudUpload, FileText, Send, Edit, Trash2,
  FilePlus, FolderPlus, FolderOpen, Folder,
  MessageSquare, Mail as MailIcon, BellRing, 
  CalendarDays, Target, Timer, Zap, Rocket,
  Trophy, Medal, Crown, Heart, ThumbsUp,
  TrendingDown, RefreshCw, ExternalLink, Link,
  Copy, QrCode, Smartphone, Tablet, Monitor,
  Headphones, Camera, Video, Mic, Music,
  Wifi, Battery, Power, Database, Server,
  Cpu, HardDrive, Network, Lock, Key,
  EyeOff, Eye as EyeIcon, Fingerprint,
  ShieldCheck, ShieldAlert, ShieldOff
} from 'lucide-react';

const ApplicationsMemosEmployee = () => {
  const [employee, setEmployee] = useState({
    id: 1,
    name: 'John Smith',
    email: 'john.smith@company.com',
    phone: '+1 (555) 123-4567',
    department: 'Production',
    position: 'Senior Developer',
    employeeId: 'EMP-00124',
    joinDate: '2022-03-15',
    location: 'New York Office',
    status: 'active',
    avatar: 'JS',
    manager: 'Sarah Johnson',
    projects: ['Project Phoenix', 'Customer Portal'],
    skills: ['React', 'Node.js', 'TypeScript', 'AWS']
  });

  const [activeTab, setActiveTab] = useState('applications');
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  const [showNewMemoModal, setShowNewMemoModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [applications, setApplications] = useState([]);
  const [memos, setMemos] = useState([]);
  const [stats, setStats] = useState({
    myApplications: 0,
    pendingApps: 0,
    approvedApps: 0,
    myMemos: 0,
    unreadMemos: 0,
    drafts: 2
  });

  // Sample data - employee's own applications and memos
  useEffect(() => {
    const mockApplications = [
      {
        id: 1,
        applicationNumber: 'APP-2024-001',
        type: 'Annual Leave Request',
        submissionDate: '2024-01-15',
        status: 'pending',
        priority: 'medium',
        startDate: '2024-02-01',
        endDate: '2024-02-05',
        totalDays: 5,
        notes: 'Family vacation',
        assignedTo: 'HR Department',
        lastUpdated: '2024-01-16',
        documents: [
          { name: 'Leave Form.pdf', size: '2.4 MB', uploaded: '2024-01-15' },
          { name: 'Travel Itinerary.docx', size: '1.2 MB', uploaded: '2024-01-15' }
        ]
      },
      {
        id: 2,
        applicationNumber: 'APP-2024-003',
        type: 'Equipment Request',
        submissionDate: '2024-01-10',
        status: 'approved',
        priority: 'high',
        requestedItem: 'Dell XPS 15 Laptop',
        reason: 'Current laptop performance issues',
        approvedBy: 'IT Manager',
        approvedDate: '2024-01-12',
        notes: 'For development work',
        estimatedDelivery: '2024-01-25',
        documents: [
          { name: 'Request Form.pdf', size: '1.8 MB', uploaded: '2024-01-10' }
        ]
      },
      {
        id: 3,
        applicationNumber: 'APP-2024-002',
        type: 'Training Request',
        submissionDate: '2024-01-08',
        status: 'rejected',
        priority: 'low',
        trainingProgram: 'Advanced React Course',
        provider: 'Udemy',
        cost: 199.99,
        rejectionReason: 'Budget constraints',
        notes: 'To improve frontend skills',
        documents: [
          { name: 'Course Details.pdf', size: '3.1 MB', uploaded: '2024-01-08' },
          { name: 'Justification.docx', size: '0.8 MB', uploaded: '2024-01-08' }
        ]
      },
      {
        id: 4,
        applicationNumber: 'APP-2024-004',
        type: 'Remote Work Request',
        submissionDate: '2024-01-05',
        status: 'in_review',
        priority: 'medium',
        requestType: 'Hybrid (3 days remote)',
        startDate: '2024-02-01',
        duration: '3 months',
        reason: 'Better work-life balance',
        assignedTo: 'HR Department',
        lastUpdated: '2024-01-06',
        documents: [
          { name: 'Remote Work Agreement.pdf', size: '2.1 MB', uploaded: '2024-01-05' }
        ]
      }
    ];

    const mockMemos = [
      {
        id: 1,
        memoNumber: 'MEMO-2024-001',
        title: 'Remote Work Policy Update',
        from: 'HR Department',
        date: '2024-01-15',
        priority: 'high',
        category: 'Policy',
        status: 'unread',
        summary: 'Updated guidelines for remote work arrangements effective February 1st.',
        attachments: 2,
        actionsRequired: true,
        deadline: '2024-01-25'
      },
      {
        id: 2,
        memoNumber: 'MEMO-2024-002',
        title: 'Q1 Team Meeting Invitation',
        from: 'Production Manager',
        date: '2024-01-14',
        priority: 'medium',
        category: 'Meeting',
        status: 'read',
        summary: 'Invitation to Q1 Production team meeting. Please review agenda.',
        attachments: 1,
        actionsRequired: false,
        deadline: '2024-01-20'
      },
      {
        id: 3,
        memoNumber: 'MEMO-2024-003',
        title: 'New Security Guidelines',
        from: 'IT Security Team',
        date: '2024-01-12',
        priority: 'urgent',
        category: 'Security',
        status: 'read',
        summary: 'Important security updates required for all development environments.',
        attachments: 3,
        actionsRequired: true,
        deadline: '2024-01-14'
      }
    ];

    setApplications(mockApplications);
    setMemos(mockMemos);
    
    setStats({
      myApplications: mockApplications.length,
      pendingApps: mockApplications.filter(app => app.status === 'pending' || app.status === 'in_review').length,
      approvedApps: mockApplications.filter(app => app.status === 'approved').length,
      myMemos: mockMemos.length,
      unreadMemos: mockMemos.filter(memo => memo.status === 'unread').length,
      drafts: 2
    });
  }, []);

  const handleAddApplication = (applicationData) => {
    const newApp = {
      id: applications.length + 1,
      applicationNumber: `APP-2024-${String(applications.length + 1).padStart(3, '0')}`,
      submissionDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      status: 'pending',
      ...applicationData
    };
    setApplications(prev => [...prev, newApp]);
    setShowNewAppModal(false);
  };

  const handleAddMemo = (memoData) => {
    const newMemo = {
      id: memos.length + 1,
      memoNumber: `MEMO-2024-${String(memos.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      status: 'sent',
      from: `${employee.name} (${employee.department})`,
      ...memoData
    };
    setMemos(prev => [...prev, newMemo]);
    setShowNewMemoModal(false);
  };

  const handleMarkAsRead = (memoId) => {
    setMemos(prev => prev.map(memo => 
      memo.id === memoId ? { ...memo, status: 'read' } : memo
    ));
  };

  return (
    
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 ">

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-sky-100 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse"></div>
      </div>
      <div className="relative z-10 p-6">
        
        {/* Header */}
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                {employee.avatar}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
              <p className="text-gray-600">{employee.position} • {employee.department}</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1 text-gray-500">
                  <Briefcase className="h-3 w-3" />
                  {employee.employeeId}
                </span>
                <span className="flex items-center gap-1 text-gray-500">
                  <Calendar className="h-3 w-3" />
                  Joined {employee.joinDate}
                </span>
                <span className="flex items-center gap-1 text-gray-500">
                  <MapPin className="h-3 w-3" />
                  {employee.location}
                </span>
              </div>
            </div>
          </div>
          
          {/* <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition duration-200 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-200 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Request
            </button>
          </div> */}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">My Applications</p>
                <p className="text-xl font-bold">{stats.myApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-xl font-bold">{stats.pendingApps}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-xl font-bold">{stats.approvedApps}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ClipboardList className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">My Memos</p>
                <p className="text-xl font-bold">{stats.myMemos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Unread</p>
                <p className="text-xl font-bold">{stats.unreadMemos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileText className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Drafts</p>
                <p className="text-xl font-bold">{stats.drafts}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button 
              onClick={() => setShowNewAppModal(true)}
              className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition duration-200 group"
            >
              <div className="p-2 bg-blue-100 rounded-lg mb-2 group-hover:scale-110 transition duration-200">
                <FilePlus className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">New Application</span>
              <span className="text-xs text-gray-500">Submit a request</span>
            </button>

            <button 
              onClick={() => setShowNewMemoModal(true)}
              className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition duration-200 group"
            >
              <div className="p-2 bg-purple-100 rounded-lg mb-2 group-hover:scale-110 transition duration-200">
                <Send className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Send Memo</span>
              <span className="text-xs text-gray-500">Internal communication</span>
            </button>

            <button 
              onClick={() => setActiveTab('applications')}
              className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-xl transition duration-200 group"
            >
              <div className="p-2 bg-green-100 rounded-lg mb-2 group-hover:scale-110 transition duration-200">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Track Status</span>
              <span className="text-xs text-gray-500">Check applications</span>
            </button>

            <button 
              onClick={() => setActiveTab('memos')}
              className="flex flex-col items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition duration-200 group"
            >
              <div className="p-2 bg-orange-100 rounded-lg mb-2 group-hover:scale-110 transition duration-200">
                <MailIcon className="h-5 w-5 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Inbox</span>
              <span className="text-xs text-gray-500">View memos</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200">
            <div className="flex items-center justify-between px-6">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('applications')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap ${activeTab === 'applications' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <FileCheck className="h-4 w-4" />
                  My Applications ({applications.length})
                </button>
                <button
                  onClick={() => setActiveTab('memos')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap ${activeTab === 'memos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <ClipboardList className="h-4 w-4" />
                  My Memos ({memos.length})
                </button>
                <button
                  onClick={() => setActiveTab('drafts')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap ${activeTab === 'drafts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <FileText className="h-4 w-4" />
                  Drafts ({stats.drafts})
                </button>
              </nav>
              <div className="flex items-center gap-3">
                {activeTab === 'applications' && (
                  <button 
                    onClick={() => setShowNewAppModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-200 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    New Application
                  </button>
                )}
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
              <MyApplicationsTab 
                applications={applications}
                onSelect={setSelectedApplication}
              />
            )}
            {activeTab === 'memos' && (
              <MyMemosTab 
                memos={memos}
                onSelect={setSelectedMemo}
                onMarkAsRead={handleMarkAsRead}
              />
            )}
            {activeTab === 'drafts' && (
              <DraftsTab drafts={[]} />
            )}
          </div>
        </div>

        {/* Modals */}
        {showNewAppModal && (
          <NewApplicationModal
            onClose={() => setShowNewAppModal(false)}
            onSave={handleAddApplication}
            employee={employee}
          />
        )}

        {showNewMemoModal && (
          <NewMemoModal
            onClose={() => setShowNewMemoModal(false)}
            onSave={handleAddMemo}
            employee={employee}
          />
        )}

        {selectedApplication && (
          <ApplicationDetailModal
            application={selectedApplication}
            onClose={() => setSelectedApplication(null)}
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
    </div>
  );
};

// My Applications Tab Component
const MyApplicationsTab = ({ applications, onSelect }) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredApplications = applications.filter(app => {
    if (filter !== 'all' && app.status !== filter) return false;
    if (search && !app.type.toLowerCase().includes(search.toLowerCase()) && 
        !app.applicationNumber.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Pending</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Rejected</span>;
      case 'in_review':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">In Review</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Unknown</span>;
    }
  };

  const getApplicationIcon = (type) => {
    const icons = {
      'Annual Leave Request': <Calendar className="h-4 w-4" />,
      'Equipment Request': <Package className="h-4 w-4" />,
      'Training Request': <Target className="h-4 w-4" />,
      'Remote Work Request': <Home className="h-4 w-4" />,
      'Travel Request': <Globe className="h-4 w-4" />
    };
    return icons[type] || <FileCheck className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search my applications..."
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
            <option value="all">All Applications</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="in_review">In Review</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredApplications.map(app => (
          <div 
            key={app.id} 
            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition duration-200 cursor-pointer"
            onClick={() => onSelect(app)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  {getApplicationIcon(app.type)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{app.type}</h4>
                  <p className="text-sm text-gray-600">{app.applicationNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(app.status)}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Submitted</p>
                <p className="font-medium text-sm">{app.submissionDate}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                <p className="font-medium text-sm">{app.lastUpdated}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Documents</p>
                <p className="font-medium text-sm">{app.documents?.length || 0} files</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {app.notes && (
                  <>
                    <MessageSquare className="h-4 w-4" />
                    <span className="truncate max-w-xs">{app.notes}</span>
                  </>
                )}
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

      {filteredApplications.length === 0 && (
        <div className="text-center py-12">
          <FileCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
          <p className="text-gray-600">You haven't submitted any applications yet.</p>
        </div>
      )}
    </div>
  );
};

// My Memos Tab Component
const MyMemosTab = ({ memos, onSelect, onMarkAsRead }) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredMemos = memos.filter(memo => {
    if (filter !== 'all' && memo.status !== filter) return false;
    if (search && !memo.title.toLowerCase().includes(search.toLowerCase()) && 
        !memo.from.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search my memos..."
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
            <option value="sent">Sent</option>
          </select>
        </div>
      </div>

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
                  {memo.status === 'sent' && (
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">Sent</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{memo.summary}</p>
                
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {memo.from}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {memo.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileCheck className="h-3 w-3" />
                    {memo.category}
                  </span>
                </div>
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
                {memo.actionsRequired && (
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    Action Required
                  </span>
                )}
                {memo.deadline && (
                  <span className="flex items-center gap-1 text-gray-600">
                    <Clock className="h-3 w-3" />
                    Due: {memo.deadline}
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
          <p className="text-gray-600">You don't have any memos yet.</p>
        </div>
      )}
    </div>
  );
};

// Drafts Tab Component
const DraftsTab = ({ drafts }) => {
  return (
    <div className="text-center py-12">
      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No drafts found</h3>
      <p className="text-gray-600">You don't have any saved drafts.</p>
    </div>
  );
};

// New Application Modal for Employee
const NewApplicationModal = ({ onClose, onSave, employee }) => {
  const [formData, setFormData] = useState({
    type: 'Annual Leave Request',
    startDate: '',
    endDate: '',
    notes: '',
    priority: 'medium',
    documents: []
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileUpload = (files) => {
    const newFiles = Array.from(files).map(file => ({
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.type.split('/')[1],
      file: file
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const applicationData = {
      type: formData.type,
      startDate: formData.startDate,
      endDate: formData.endDate,
      notes: formData.notes,
      priority: formData.priority,
      documents: uploadedFiles.map(file => ({
        name: file.name,
        size: file.size,
        uploaded: new Date().toISOString().split('T')[0]
      }))
    };

    if (formData.type === 'Equipment Request') {
      applicationData.requestedItem = formData.requestedItem || '';
      applicationData.reason = formData.reason || '';
    }

    if (formData.type === 'Training Request') {
      applicationData.trainingProgram = formData.trainingProgram || '';
      applicationData.provider = formData.provider || '';
      applicationData.cost = formData.cost || 0;
    }

    onSave(applicationData);
  };

  const applicationTypes = [
    { value: 'Annual Leave Request', label: 'Annual Leave', icon: Calendar },
    { value: 'Remote Work Request', label: 'Remote Work', icon: Home },
    { value: 'Equipment Request', label: 'Equipment', icon: Package },
    { value: 'Training Request', label: 'Training', icon: Target },
    { value: 'Travel Request', label: 'Travel', icon: Globe },
    { value: 'Expense Reimbursement', label: 'Expense', icon: DollarSign }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Submit New Application</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Applicant Info */}
          <div className="bg-blue-50 p-4 rounded-xl">
            <p className="text-sm text-blue-600 font-medium mb-2">Applicant Information</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="font-medium">{employee.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Department</p>
                <p className="font-medium">{employee.department}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Employee ID</p>
                <p className="font-medium">{employee.employeeId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-medium">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Application Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Application Type *</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {applicationTypes.map(type => (
                <button
                  type="button"
                  key={type.value}
                  onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                  className={`p-3 rounded-xl border-2 transition duration-200 ${
                    formData.type === type.value 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`p-2 rounded-lg ${
                      formData.type === type.value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <type.icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-medium text-gray-900">{type.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Fields Based on Application Type */}
          {formData.type === 'Annual Leave Request' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input 
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                <input 
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>
            </div>
          )}

          {formData.type === 'Equipment Request' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Needed *</label>
                <input 
                  type="text"
                  value={formData.requestedItem || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, requestedItem: e.target.value }))}
                  required
                  placeholder="e.g., Laptop, Monitor, Software"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Request *</label>
                <textarea 
                  value={formData.reason || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  required
                  rows="2"
                  placeholder="Explain why you need this equipment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>
            </div>
          )}

          {formData.type === 'Training Request' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Training Program *</label>
                <input 
                  type="text"
                  value={formData.trainingProgram || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, trainingProgram: e.target.value }))}
                  required
                  placeholder="e.g., Advanced React Course, AWS Certification"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider *</label>
                  <input 
                    type="text"
                    value={formData.provider || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                    required
                    placeholder="e.g., Coursera, Udemy, University"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost (USD) *</label>
                  <input 
                    type="number"
                    value={formData.cost || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                    required
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Priority */}
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

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows="3"
              placeholder="Provide any additional details or explanations..."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supporting Documents</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
              <CloudUpload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">Drag & drop files here or click to browse</p>
              <p className="text-xs text-gray-500 mb-4">Supports PDF, DOC, JPG, PNG up to 10MB each</p>
              <input
                type="file"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                id="file-upload"
              />
              <label 
                htmlFor="file-upload"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer"
              >
                Browse Files
              </label>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">{file.size} • {file.type}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition duration-200"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-3 text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition duration-200"
            >
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// New Memo Modal for Employee
const NewMemoModal = ({ onClose, onSave, employee }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Announcement',
    priority: 'medium',
    content: '',
    recipients: ['HR Department', 'Team Lead'],
    attachments: []
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const memoData = {
      title: formData.title,
      category: formData.category,
      priority: formData.priority,
      summary: formData.content.substring(0, 100) + '...',
      attachments: uploadedFiles.length,
      actionsRequired: formData.category === 'Request',
      recipients: formData.recipients
    };

    onSave(memoData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Compose New Memo</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Sender Info */}
          <div className="bg-blue-50 p-4 rounded-xl">
            <p className="text-sm text-blue-600 font-medium mb-2">From</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {employee.avatar}
              </div>
              <div>
                <p className="font-medium">{employee.name}</p>
                <p className="text-sm text-gray-600">{employee.department}</p>
              </div>
            </div>
          </div>

          {/* Memo Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input 
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
                placeholder="Memo title..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
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
                <option value="Request">Request</option>
                <option value="Update">Update</option>
                <option value="Question">Question</option>
                <option value="Feedback">Feedback</option>
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
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipients *</label>
              <select 
                value={formData.recipients[0]}
                onChange={(e) => setFormData(prev => ({ ...prev, recipients: [e.target.value] }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              >
                <option value="HR Department">HR Department</option>
                <option value="Team Lead">Team Lead</option>
                <option value="Manager">Manager</option>
                <option value="IT Department">IT Department</option>
                <option value="Finance Department">Finance Department</option>
              </select>
            </div>
          </div>

          {/* Memo Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <textarea 
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              required
              rows="6"
              placeholder="Write your memo here..."
              className="w-full px-3 py-3 border border-gray-300 rounded-xl"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attachments (Optional)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
              <Paperclip className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">Add supporting documents if needed</p>
              <p className="text-xs text-gray-500 mb-4">Max file size: 10MB each</p>
              <button
                type="button"
                onClick={() => document.getElementById('memo-file-upload').click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
              >
                Add Files
              </button>
              <input
                type="file"
                multiple
                onChange={(e) => setUploadedFiles(prev => [...prev, ...Array.from(e.target.files)])}
                className="hidden"
                id="memo-file-upload"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition duration-200"
            >
              Save Draft
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-3 text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition duration-200"
            >
              Send Memo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Application Detail Modal (View only for employee)
const ApplicationDetailModal = ({ application, onClose }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'in_review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'in_review': return 'In Review';
      default: return 'Unknown';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{application.type}</h3>
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
              {/* Status Banner */}
              <div className={`p-4 rounded-xl ${getStatusColor(application.status)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {application.status === 'approved' && <CheckCircle className="h-6 w-6" />}
                    {application.status === 'rejected' && <AlertCircle className="h-6 w-6" />}
                    {application.status === 'pending' && <Clock className="h-6 w-6" />}
                    {application.status === 'in_review' && <Eye className="h-6 w-6" />}
                    <div>
                      <h4 className="font-semibold">Status: {getStatusText(application.status)}</h4>
                      <p className="text-sm opacity-90">
                        Submitted on {application.submissionDate} • Last updated {application.lastUpdated}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Application Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Application Type</p>
                    <p className="font-medium">{application.type}</p>
                  </div>
                  
                  {application.startDate && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Start Date</p>
                      <p className="font-medium">{application.startDate}</p>
                    </div>
                  )}
                  
                  {application.endDate && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">End Date</p>
                      <p className="font-medium">{application.endDate}</p>
                    </div>
                  )}
                  
                  {application.requestedItem && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Requested Item</p>
                      <p className="font-medium">{application.requestedItem}</p>
                    </div>
                  )}
                  
                  {application.trainingProgram && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Training Program</p>
                      <p className="font-medium">{application.trainingProgram}</p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {application.notes && (
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 mb-2">Your Notes</p>
                    <p className="text-gray-900">{application.notes}</p>
                  </div>
                )}

                {/* Additional Info */}
                {application.approvedBy && (
                  <div className="bg-green-50 p-4 rounded-xl">
                    <p className="text-sm text-green-600 font-medium mb-1">Approved By</p>
                    <p className="font-medium">{application.approvedBy}</p>
                    {application.approvedDate && (
                      <p className="text-sm text-green-600 mt-1">On {application.approvedDate}</p>
                    )}
                  </div>
                )}

                {application.rejectionReason && (
                  <div className="bg-red-50 p-4 rounded-xl">
                    <p className="text-sm text-red-600 font-medium mb-1">Reason for Rejection</p>
                    <p className="font-medium">{application.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Documents */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Documents</h4>
                <div className="space-y-2">
                  {application.documents?.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-gray-500">Uploaded {doc.uploaded}</p>
                        </div>
                      </div>
                      <button className="p-1 hover:bg-gray-200 rounded">
                        <Download className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Actions</h4>
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100">
                    <Download className="h-4 w-4" />
                    Download All
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100">
                    <Printer className="h-4 w-4" />
                    Print Application
                  </button>
                  {application.status === 'pending' && (
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-600 rounded-xl hover:bg-yellow-100">
                      <Edit className="h-4 w-4" />
                      Edit Application
                    </button>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Timeline</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Submitted</p>
                      <p className="text-sm text-gray-600">{application.submissionDate}</p>
                    </div>
                  </div>
                  
                  {application.approvedDate && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Approved</p>
                        <p className="text-sm text-gray-600">{application.approvedDate}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memo Detail Modal (View only for employee)
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
              {/* Memo Header */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {memo.priority === 'urgent' && <AlertCircle className="h-5 w-5 text-red-500" />}
                    {memo.priority === 'high' && <AlertCircle className="h-5 w-5 text-orange-500" />}
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {memo.category}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Sent on {memo.date}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    From: {memo.from}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    To: {memo.recipients?.join(', ') || 'All Employees'}
                  </span>
                </div>
              </div>

              {/* Memo Content */}
              <div className="prose max-w-none">
                <h4 className="font-semibold text-gray-900 mb-4">Memo Content</h4>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <p className="text-gray-900 whitespace-pre-line">{memo.summary}</p>
                </div>
              </div>

              {/* Actions Required */}
              {memo.actionsRequired && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <h4 className="font-semibold text-yellow-900">Action Required</h4>
                  </div>
                  <p className="text-sm text-yellow-800">
                    Please take appropriate action as requested in this memo. 
                    {memo.deadline && ` Deadline: ${memo.deadline}`}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Status */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Status</h4>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="space-y-3">
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
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Priority</span>
                      <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full capitalize">
                        {memo.priority}
                      </span>
                    </div>
                    
                    {memo.attachments > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Attachments</span>
                        <span className="flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          <span>{memo.attachments}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Actions</h4>
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100">
                    <Download className="h-4 w-4" />
                    Download Memo
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100">
                    <Check className="h-4 w-4" />
                    Mark as Complete
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100">
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                </div>
              </div>

              {/* Related Info */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Related Information</h4>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-2">If you have questions about this memo:</p>
                  <div className="space-y-2">
                    <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800">
                      Contact {memo.from.split('(')[0]}
                    </button>
                    <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800">
                      View related documents
                    </button>
                    <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800">
                      View similar memos
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationsMemosEmployee;
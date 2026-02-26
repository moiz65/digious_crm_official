import React, { useState, useEffect } from 'react';
import {
  Calendar, MapPin, Briefcase,
  FileCheck, ClipboardList, Plus, Search,
  Clock, AlertCircle, CheckCircle, XCircle, X, Download,
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
  ShieldCheck, ShieldAlert, ShieldOff,
  Truck, Wrench, Loader,
  ChevronUp, ChevronDown, ArrowRight
} from 'lucide-react';
import { endpoints, apiRequest, getAuthHeaders } from '../config/api';

const ApplicationsMemosEmployee = () => {
  const [employee, setEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('applications');
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [showNewMemoModal, setShowNewMemoModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [applications, setApplications] = useState([]);
  const [assignedToMeApps, setAssignedToMeApps] = useState([]);
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    myApplications: 0,
    pendingApps: 0,
    approvedApps: 0,
    assignedToMe: 0,
    myMemos: 0,
    unreadMemos: 0
  });

  // Fetch employee data and applications on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get employee ID from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        // Get employee ID from user object in localStorage
        let employeeId = null;
        try {
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          employeeId = userData.employeeId || userData.employee_id || userData.id;
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
        
        if (!employeeId) {
          setError('Employee ID not found. Please login again.');
          setLoading(false);
          return;
        }

        // Fetch employee's applications
        const appsResponse = await fetch(
          endpoints.applications.getByEmployee(employeeId),
          {
            method: 'GET',
            headers: getAuthHeaders(),
          }
        );

        if (!appsResponse.ok) {
          throw new Error('Failed to fetch applications');
        }

        const appsData = await appsResponse.json();
        
        // Format applications data from API
        const formattedApps = (appsData.data || []).map(app => ({
          id: app.id,
          applicationNumber: app.application_number,
          type: app.application_type,
          submissionDate: app.submission_date ? app.submission_date.split('T')[0] : '',
          status: app.status || 'pending',
          priority: app.priority || 'medium',
          department: app.department,
          subject: app.subject,
          notes: app.description,
          assignedTo: app.assigned_to_name || app.assigned_to || null,
          assignedToEmployeeId: app.assigned_to_employee_id,
          assignedToName: app.assigned_to_name,
          assignedToDesignation: app.assigned_to_designation,
          assignedToDepartment: app.assigned_to_department,
          assignees: app.assignees || [],
          currentStep: app.current_step || 0,
          totalSteps: app.total_steps || 0,
          isMultiAssign: app.is_multi_assign || false,
          ccDepartment: app.cc_department,
          lastUpdated: app.last_updated ? app.last_updated.split('T')[0] : app.submission_date?.split('T')[0],
          documents: app.documents ? (typeof app.documents === 'string' ? JSON.parse(app.documents) : app.documents) : [],
          metadata: app.metadata ? (typeof app.metadata === 'string' ? JSON.parse(app.metadata) : app.metadata) : {},
          approved_by: app.approved_by,
          approved_date: app.approved_date ? app.approved_date.split('T')[0] : null,
          rejection_reason: app.rejection_reason
        }));

        setApplications(formattedApps);

        // Fetch applications assigned to this employee
        try {
          const assignedResponse = await fetch(
            endpoints.applications.assignedToMe,
            { method: 'GET', headers: getAuthHeaders() }
          );
          if (assignedResponse.ok) {
            const assignedData = await assignedResponse.json();
            const formattedAssigned = (assignedData.data || []).map(app => ({
              id: app.id,
              applicationNumber: app.application_number,
              type: app.application_type,
              submissionDate: app.submission_date ? app.submission_date.split('T')[0] : '',
              status: app.status || 'pending',
              priority: app.priority || 'medium',
              department: app.department,
              subject: app.subject,
              notes: app.description,
              applicantName: app.applicant_name,
              applicantEmail: app.applicant_email,
              applicantDesignation: app.applicant_designation,
              applicantDepartment: app.applicant_department,
              assignedToName: app.assigned_to_name,
              assignees: app.assignees || [],
              currentStep: app.current_step || 0,
              totalSteps: app.total_steps || 0,
              isMultiAssign: app.is_multi_assign || false,
              isMyTurn: app.is_my_turn || false,
              myStepOrder: app.my_step_order || 0,
              myStepStatus: app.my_step_status || 'pending',
              ccDepartment: app.cc_department,
              lastUpdated: app.last_updated ? app.last_updated.split('T')[0] : app.submission_date?.split('T')[0],
              documents: app.documents ? (typeof app.documents === 'string' ? JSON.parse(app.documents) : app.documents) : [],
              approved_by: app.approved_by,
              approved_date: app.approved_date ? app.approved_date.split('T')[0] : null,
              rejection_reason: app.rejection_reason
            }));
            setAssignedToMeApps(formattedAssigned);
          }
        } catch (assignErr) {
          console.error('Error fetching assigned applications:', assignErr);
        }

        // Calculate stats
        const pending = formattedApps.filter(a => a.status === 'pending').length;
        const approved = formattedApps.filter(a => a.status === 'approved').length;

        setStats({
          myApplications: formattedApps.length,
          pendingApps: pending,
          approvedApps: approved,
          assignedToMe: 0,
          myMemos: 0,
          unreadMemos: 0
        });

        // Set basic employee info from localStorage or use defaults
        const empName = localStorage.getItem('employeeName') || 'Employee';
        const empEmail = localStorage.getItem('employeeEmail') || '';
        const empDept = localStorage.getItem('employeeDepartment') || '';

        setEmployee({
          id: employeeId,
          name: empName,
          email: empEmail,
          phone: localStorage.getItem('employeePhone') || '',
          department: empDept,
          position: localStorage.getItem('employeePosition') || '',
          employeeId: employeeId,
          joinDate: localStorage.getItem('employeeJoinDate') || '',
          status: 'active',
          avatar: empName.split(' ').map(n => n[0]).join('')
        });

      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message || 'Failed to load applications');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAddApplication = async (applicationData) => {
    try {
      // Do NOT send employeeId - backend gets it from JWT token
      const payload = {
        department: applicationData.department,
        application_type: applicationData.type,
        subject: applicationData.type,
        description: applicationData.notes,
        priority: applicationData.priority || 'medium',
        assignees: applicationData.assignees || [],
        assigned_to_employee_id: applicationData.assignedToEmployeeId || null,
        assigned_to: applicationData.assignedToName || null,
        cc_department: applicationData.ccDepartment || null,
        metadata: applicationData.metadata || null
      };
      
      const response = await fetch(endpoints.applications.create, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create application');
      }

      const result = await response.json();
      const newApp = {
        id: result.data.id,
        application_number: result.data.application_number,
        submissionDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0],
        status: 'pending',
        ...applicationData
      };
      
      setApplications(prev => [...prev, newApp]);
      setShowNewAppModal(false);
      alert(`Application ${result.data.application_number} created successfully!`);
    } catch (error) {
      console.error('Error creating application:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Update existing application (employee owner only)
  const handleUpdateApplication = async (updatedData) => {
    if (!editingApplication) return;

    try {
      const payload = {
        department: updatedData.department,
        application_type: updatedData.type,
        subject: updatedData.type,
        description: updatedData.notes,
        priority: updatedData.priority || 'medium',
        assignees: updatedData.assignees || [],
        assigned_to_employee_id: updatedData.assignedToEmployeeId || null,
        assigned_to: updatedData.assignedToName || null,
        cc_department: updatedData.ccDepartment || null,
        metadata: updatedData.metadata || null
      };

      const response = await fetch(`${endpoints.applications.base}/${editingApplication.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update application');
      }

      // Optimistic update: replace the application in state
      setApplications(prev => prev.map(a => a.id === editingApplication.id ? ({ ...a, ...updatedData, priority: updatedData.priority || a.priority }) : a));
      setEditingApplication(null);
      setShowNewAppModal(false);
      alert('Application updated successfully');
    } catch (err) {
      console.error('Error updating application:', err);
      alert(err.message || 'Failed to update application');
    }
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Applications & Memos</h1>
            <p className="text-gray-600 mt-2">Manage your applications and view memos â€” submit requests, track status, and stay informed.</p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading your applications...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Content */}
        {!loading && employee && (
          <>
            {/* <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
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
                <p className="text-xl font-bold">0</p>
              </div>
            </div>
          </div>
        </div> */}



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
                  onClick={() => setActiveTab('assigned')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap ${activeTab === 'assigned' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <UserPlus className="h-4 w-4" />
                  Assigned to Me ({assignedToMeApps.length})
                </button>
                <button
                  onClick={() => setActiveTab('memos')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap ${activeTab === 'memos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <ClipboardList className="h-4 w-4" />
                  My Memos ({memos.length})
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
            {activeTab === 'assigned' && (
              <AssignedToMeTab 
                applications={assignedToMeApps}
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
          </div>
        </div>

        {/* Modals */}
        {showNewAppModal && (
          <NewApplicationModal
            onClose={() => { setShowNewAppModal(false); setEditingApplication(null); }}
            onSave={editingApplication ? handleUpdateApplication : handleAddApplication}
            employee={employee}
            initialData={editingApplication}
            isEdit={!!editingApplication}
          />
        )}



        {selectedApplication && (
          <ApplicationDetailModal
            application={selectedApplication}
            onClose={() => setSelectedApplication(null)}
            employee={employee}
            onEdit={(app) => {
              setEditingApplication({
                id: app.id,
                department: app.department,
                type: app.type,
                customSubject: app.customSubject || '',
                description: app.notes || app.description || '',
                priority: app.priority || 'medium',
                assignTo: app.assignedTo ? 'person' : 'department',
                assignedToEmployeeId: app.assignedToEmployeeId || app.assigned_to_employee_id || null,
                assignedToName: app.assignedTo || app.assignedToName || null,
                ccDepartment: app.ccDepartment || app.cc_department || null,
                documents: app.documents || []
              });
              setShowNewAppModal(true);
            }}
          />
        )}

        {selectedMemo && (
          <MemoDetailModal
            memo={selectedMemo}
            onClose={() => setSelectedMemo(null)}
            onMarkAsRead={handleMarkAsRead}
          />
        )}
          </>
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

// Assigned to Me Tab Component
const AssignedToMeTab = ({ applications, onSelect }) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredApplications = applications.filter(app => {
    if (filter !== 'all' && app.status !== filter) return false;
    if (search && !app.type?.toLowerCase().includes(search.toLowerCase()) && 
        !app.applicationNumber?.toLowerCase().includes(search.toLowerCase()) &&
        !app.applicantName?.toLowerCase().includes(search.toLowerCase())) {
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

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Urgent</span>;
      case 'high':
        return <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">High</span>;
      case 'medium':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Medium</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Low</span>;
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
              placeholder="Search assigned applications..."
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
                <div className="p-2 bg-purple-50 rounded-lg">
                  <UserPlus className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{app.type}</h4>
                  <p className="text-sm text-gray-600">{app.applicationNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(app.status)}
                {getPriorityBadge(app.priority)}
              </div>
            </div>

            {/* Applicant Info */}
            <div className="bg-blue-50 p-3 rounded-lg mb-3">
              <p className="text-xs text-blue-600 font-medium mb-1">From</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold text-blue-800">
                  {app.applicantName ? app.applicantName.split(' ').map(n => n[0]).join('') : '?'}
                </div>
                <div>
                  <p className="font-medium text-sm">{app.applicantName || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{app.applicantDesignation || ''} {app.applicantDepartment ? `â€¢ ${app.applicantDepartment}` : ''}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Department</p>
                <p className="font-medium text-sm">{app.department}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Submitted</p>
                <p className="font-medium text-sm">{app.submissionDate}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">CC</p>
                <p className="font-medium text-sm">{app.ccDepartment || 'None'}</p>
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
                className="px-3 py-1 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredApplications.length === 0 && (
        <div className="text-center py-12">
          <UserPlus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assigned applications</h3>
          <p className="text-gray-600">No applications have been assigned to you yet.</p>
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
                    <Users className="h-3 w-3" />
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




// New Application Modal for Employee (supports create + edit)
const NewApplicationModal = ({ onClose, onSave, employee, initialData = null, isEdit = false }) => {
  // Generate unique application number
  const generateApplicationNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `APP-${timestamp.slice(-4)}-${random}`;
  };

  const [formData, setFormData] = useState({
    department: '', // Department
    type: '', // Application Type
    customSubject: '', // Custom subject when "Other" is selected
    description: '', // Description
    priority: 'medium',
    assignTo: 'department', // 'department' or 'person'
    documents: [],
    leaveFromDate: '',
    leaveToDate: ''
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [applicationNumber, setApplicationNumber] = useState(generateApplicationNumber());
  
  // Employee search states (multi-assign)
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]); // Array of { employee_id, name, designation, department, email }
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Prefill form when editing
  useEffect(() => {
    if (!initialData) return;

    setFormData(prev => ({
      ...prev,
      department: initialData.department || prev.department,
      type: initialData.type || prev.type,
      customSubject: initialData.customSubject || prev.customSubject || '',
      description: initialData.description || initialData.notes || prev.description,
      priority: initialData.priority || prev.priority,
      assignTo: initialData.assignTo || ((initialData.assignees && initialData.assignees.length > 0) || initialData.assignedToName ? 'person' : 'department'),
      documents: initialData.documents || prev.documents || []
    }));

    if (initialData.documents && Array.isArray(initialData.documents)) {
      setUploadedFiles(initialData.documents.map(d => ({ name: d.name, size: d.size || 'â€”', type: d.type || 'pdf' })));
    }

    // Prefill multi-assign employees
    if (initialData.assignees && initialData.assignees.length > 0) {
      setSelectedEmployees(initialData.assignees.map(a => ({
        employee_id: a.employee_id,
        name: a.employee_name,
        designation: a.designation || '',
        department: a.emp_department || a.department || '',
        email: a.email || ''
      })));
    } else if (initialData.assignedToEmployeeId || initialData.assignedToName) {
      setSelectedEmployees([{ employee_id: initialData.assignedToEmployeeId, name: initialData.assignedToName, designation: '', department: '', email: '' }]);
    }

    if (initialData.applicationNumber) {
      setApplicationNumber(initialData.applicationNumber);
    }
  }, [initialData]);

  // Department options
  const departments = [
    { value: 'HR', label: 'Human Resources (HR)' },
    { value: 'Operations', label: 'Operations' },
    { value: 'Productions', label: 'Productions' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Sales', label: 'Sales' }
  ];

  // Department-wise application types
  const departmentApplicationTypes = {
    'HR': [
      { value: 'Annual Leave Request', label: 'Annual Leave Request' },
      { value: 'Remote Work Request', label: 'Remote Work Request' },
      { value: 'Overtime Request', label: 'Overtime Request' },
      { value: 'Resignation Request', label: 'Resignation Request' },
      { value: 'Promotion Request', label: 'Promotion Request' },
      { value: 'Transfer Request', label: 'Transfer Request' },
      { value: 'Salary Revision', label: 'Salary Revision' },
      { value: 'Employee Grievance', label: 'Employee Grievance' },
      { value: 'Other', label: 'Other' }
    ],
    'Operations': [
      { value: 'Equipment Request', label: 'Equipment Request' },
      { value: 'Vehicle Request', label: 'Vehicle Request' },
      { value: 'Maintenance Request', label: 'Maintenance Request' },
      { value: 'Safety Equipment Request', label: 'Safety Equipment Request' },
      { value: 'Inventory Request', label: 'Inventory Request' },
      { value: 'Site Visit Request', label: 'Site Visit Request' },
      { value: 'Operational Report', label: 'Operational Report' },
      { value: 'Vendor Complaint', label: 'Vendor Complaint' },
      { value: 'Other', label: 'Other' }
    ],
    'Productions': [
      { value: 'Raw Material Request', label: 'Raw Material Request' },
      { value: 'Machine Maintenance', label: 'Machine Maintenance' },
      { value: 'Production Report', label: 'Production Report' },
      { value: 'Quality Inspection', label: 'Quality Inspection' },
      { value: 'Shift Change Request', label: 'Shift Change Request' },
      { value: 'Production Target Change', label: 'Production Target Change' },
      { value: 'Line Maintenance', label: 'Line Maintenance' },
      { value: 'Safety Concern', label: 'Safety Concern' },
      { value: 'Other', label: 'Other' }
    ],
    'Finance': [
      { value: 'Expense Reimbursement', label: 'Expense Reimbursement' },
      { value: 'Advance Salary', label: 'Advance Salary' },
      { value: 'Loan Request', label: 'Loan Request' },
      { value: 'Invoice Processing', label: 'Invoice Processing' },
      { value: 'Budget Approval', label: 'Budget Approval' },
      { value: 'Payment Request', label: 'Payment Request' },
      { value: 'Tax Query', label: 'Tax Query' },
      { value: 'Audit Support', label: 'Audit Support' },
      { value: 'Other', label: 'Other' }
    ],
    'Sales': [
      { value: 'Sales Report Submission', label: 'Sales Report Submission' },
      { value: 'Client Visit Request', label: 'Client Visit Request' },
      { value: 'Sales Target Revision', label: 'Sales Target Revision' },
      { value: 'Discount Approval Request', label: 'Discount Approval Request' },
      { value: 'Sales Material Request', label: 'Sales Material Request' },
      { value: 'CRM Access Request', label: 'CRM Access Request' },
      { value: 'Sales Training Request', label: 'Sales Training Request' },
      { value: 'Customer Complaint', label: 'Customer Complaint' },
      { value: 'Other', label: 'Other' }
    ]
  };

  // Get application types for selected department
  const getApplicationTypes = () => {
    if (!formData.department) return [];
    return departmentApplicationTypes[formData.department] || [];
  };

  // Check if "Other" is selected
  const isOtherSelected = formData.type === 'Other';

  // Determine if HR is the target department
  const isHRDepartment = formData.department === 'HR';

  // CC logic: HR is always in CC unless application IS for HR
  const ccDepartment = isHRDepartment ? null : 'HR';

  // Employee search with debounce
  const handleEmployeeSearch = (value) => {
    setEmployeeSearch(value);
    
    if (searchTimeout) clearTimeout(searchTimeout);
    
    if (value.length < 2) {
      setEmployeeSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const url = `${endpoints.applications.searchEmployees}?q=${encodeURIComponent(value)}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const data = await response.json();
          // Filter out already selected employees
          const filtered = (data.data || []).filter(
            emp => !selectedEmployees.some(sel => sel.employee_id === emp.employee_id)
          );
          setEmployeeSuggestions(filtered);
        }
      } catch (err) {
        console.error('Error searching employees:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    
    setSearchTimeout(timeout);
  };

  const handleSelectEmployee = (emp) => {
    setSelectedEmployees(prev => [...prev, emp]);
    setEmployeeSearch('');
    setEmployeeSuggestions([]);
  };

  const handleRemoveEmployee = (employeeId) => {
    setSelectedEmployees(prev => prev.filter(e => e.employee_id !== employeeId));
  };

  const handleClearAllEmployees = () => {
    setSelectedEmployees([]);
    setEmployeeSearch('');
    setEmployeeSuggestions([]);
  };

  // Reorder assignees (move up/down in priority)
  const handleMoveEmployee = (index, direction) => {
    const newList = [...selectedEmployees];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newList.length) return;
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    setSelectedEmployees(newList);
  };

  const handleFileUpload = (files) => {
    // Only accept single PDF file (replace any existing)
    const file = files[0];
    if (!file) return;
    
    const newFile = {
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: 'pdf',
      file: file
    };
    
    // Replace any existing file with the new one (single PDF only)
    setUploadedFiles([newFile]);
  };

  const handleRemoveFile = (index) => {
    setUploadedFiles([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Use custom subject if "Other" is selected, otherwise use the selected type
    const subjectValue = isOtherSelected ? formData.customSubject : formData.type;
    
    // Build assignees array from selectedEmployees
    const assigneesPayload = formData.assignTo === 'person' && selectedEmployees.length > 0
      ? selectedEmployees.map(emp => ({
          employee_id: emp.employee_id,
          employee_name: emp.name
        }))
      : [];

    const applicationData = {
      department: formData.department,
      type: subjectValue,
      notes: formData.description,
      priority: formData.priority || 'medium',
      assignees: assigneesPayload,
      assignedToEmployeeId: assigneesPayload.length === 1 ? assigneesPayload[0].employee_id : null,
      assignedToName: assigneesPayload.length === 1 ? assigneesPayload[0].employee_name : null,
      ccDepartment: ccDepartment,
      documents: uploadedFiles.map(file => ({
        name: file.name,
        size: file.size,
        uploaded: new Date().toISOString().split('T')[0]
      })),
      metadata: (subjectValue && subjectValue.includes('Leave Request') && formData.leaveFromDate && formData.leaveToDate)
        ? { leave_start_date: formData.leaveFromDate, leave_end_date: formData.leaveToDate }
        : null
    };

    onSave(applicationData);
  };

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
          {/* Application Number (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Application Number</label>
            <div className="relative">
              <input 
                type="text"
                value={applicationNumber}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 text-gray-700 font-medium cursor-not-allowed"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                <span className="text-xs text-gray-500">Auto-generated</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Unique identifier for your application</p>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
            <select 
              value={formData.department}
              onChange={(e) => {
                setFormData(prev => ({ 
                  ...prev, 
                  department: e.target.value,
                  type: '', 
                  customSubject: '',
                  assignTo: 'department'
                }));
                setSelectedEmployees([]);
                setEmployeeSearch('');
                setEmployeeSuggestions([]);
              }}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl"
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <select 
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                type: e.target.value,
                customSubject: e.target.value === 'Other' ? '' : prev.customSubject
              }))}
              required
              disabled={!formData.department}
              className={`w-full px-3 py-2 border border-gray-300 rounded-xl ${!formData.department ? 'bg-gray-100 text-gray-500' : ''}`}
            >
              <option value="">
                {formData.department 
                  ? `Select ${formData.department} Subject` 
                  : 'Select Department First'}
              </option>
              {getApplicationTypes().map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {!formData.department && (
              <p className="text-xs text-gray-500 mt-1">Please select a department first</p>
            )}
          </div>

          {/* Custom Subject Input (shown when "Other" is selected) */}
          {isOtherSelected && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specify Subject *</label>
              <input 
                type="text"
                value={formData.customSubject}
                onChange={(e) => setFormData(prev => ({ ...prev, customSubject: e.target.value }))}
                required
                placeholder="Enter your custom subject..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              />
            </div>
          )}

          {/* Leave Date Range (shown for leave requests) */}
          {formData.type && formData.type.includes('Leave Request') && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-teal-800">Leave Duration</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">From Date *</label>
                  <input
                    type="date"
                    value={formData.leaveFromDate}
                    onChange={e => setFormData(prev => ({ ...prev, leaveFromDate: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">To Date *</label>
                  <input
                    type="date"
                    value={formData.leaveToDate}
                    min={formData.leaveFromDate}
                    onChange={e => setFormData(prev => ({ ...prev, leaveToDate: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
              </div>
              {formData.leaveFromDate && formData.leaveToDate && (
                <p className="text-xs text-teal-600">
                  {Math.max(1, Math.round((new Date(formData.leaveToDate) - new Date(formData.leaveFromDate)) / 86400000) + 1)} day(s) requested
                </p>
              )}
            </div>
          )}

          {/* Assign To Section */}
          {formData.department && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Assign To</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, assignTo: 'department' }));
                    handleClearAllEmployees();
                  }}
                  className={`flex-1 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                    formData.assignTo === 'department' 
                      ? 'bg-blue-50 border-blue-300 text-blue-700' 
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Building className="h-4 w-4 inline mr-2" />
                  Entire Department
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, assignTo: 'person' }))}
                  className={`flex-1 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                    formData.assignTo === 'person' 
                      ? 'bg-purple-50 border-purple-300 text-purple-700' 
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Users className="h-4 w-4 inline mr-2" />
                  Assign People
                </button>
              </div>

              {formData.assignTo === 'department' && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
                  <p className="text-sm text-blue-700">
                    <Building className="h-4 w-4 inline mr-1" />
                    This application will be sent to all members of <strong>{formData.department}</strong> department.
                  </p>
                </div>
              )}

              {formData.assignTo === 'person' && (
                <div className="space-y-3">
                  {/* Multi-assign info banner */}
                  <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl">
                    <p className="text-xs text-purple-700">
                      <Users className="h-3 w-3 inline mr-1" />
                      Add multiple people in priority order. Approval flows sequentially: Person 1 approves â†’ Person 2 â†’ ... â†’ Final approval.
                      {!isHRDepartment && <span className="font-medium"> HR gives the final sign-off.</span>}
                    </p>
                  </div>

                  {/* Search input */}
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={employeeSearch}
                      onChange={(e) => handleEmployeeSearch(e.target.value)}
                      placeholder="Search employee to add..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {searchLoading && (
                      <Loader className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" />
                    )}
                  </div>

                  {/* Suggestions Dropdown */}
                  {employeeSuggestions.length > 0 && (
                    <div className="border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto bg-white">
                      {employeeSuggestions.map(emp => (
                        <button
                          key={emp.employee_id}
                          type="button"
                          onClick={() => handleSelectEmployee(emp)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-800">
                            {emp.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{emp.name}</p>
                            <p className="text-xs text-gray-500">{emp.designation} â€¢ {emp.department}</p>
                          </div>
                          <span className="text-xs text-purple-600 font-medium">+ Add</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {employeeSearch.length > 0 && employeeSearch.length < 2 && (
                    <p className="text-xs text-gray-500">Type at least 2 characters to search</p>
                  )}

                  {/* Selected Employees List (Ordered) */}
                  {selectedEmployees.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">Approval Chain ({selectedEmployees.length} {selectedEmployees.length === 1 ? 'person' : 'people'})</p>
                        {selectedEmployees.length > 1 && (
                          <button type="button" onClick={handleClearAllEmployees} className="text-xs text-red-500 hover:text-red-700">
                            Clear All
                          </button>
                        )}
                      </div>
                      {selectedEmployees.map((emp, index) => (
                        <div key={emp.employee_id} className="bg-purple-50 border border-purple-200 p-3 rounded-xl">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {/* Step number badge */}
                              <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                {index + 1}
                              </div>
                              <div className="w-9 h-9 rounded-full bg-purple-200 flex items-center justify-center text-sm font-bold text-purple-800 flex-shrink-0">
                                {emp.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 text-sm truncate">{emp.name}</p>
                                <p className="text-xs text-gray-500 truncate">
                                  {emp.designation ? `${emp.designation} â€¢ ` : ''}{emp.department || ''}{emp.employee_id ? ` â€¢ ID: ${emp.employee_id}` : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {/* Move up */}
                              {index > 0 && (
                                <button type="button" onClick={() => handleMoveEmployee(index, 'up')} className="p-1 hover:bg-purple-100 rounded text-purple-600" title="Move up">
                                  <ChevronUp className="h-4 w-4" />
                                </button>
                              )}
                              {/* Move down */}
                              {index < selectedEmployees.length - 1 && (
                                <button type="button" onClick={() => handleMoveEmployee(index, 'down')} className="p-1 hover:bg-purple-100 rounded text-purple-600" title="Move down">
                                  <ChevronDown className="h-4 w-4" />
                                </button>
                              )}
                              {/* Remove */}
                              <button type="button" onClick={() => handleRemoveEmployee(emp.employee_id)} className="p-1 hover:bg-red-100 rounded text-red-500 ml-1" title="Remove">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!isHRDepartment && (
                        <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            {selectedEmployees.length + 1}
                          </div>
                          <p className="text-xs text-amber-700 font-medium">HR Department â€” Final Approval (auto-added)</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CC Info */}
          {formData.department && (
            <div className={`p-3 rounded-xl border ${isHRDepartment ? 'bg-gray-50 border-gray-200' : 'bg-amber-50 border-amber-200'}`}>
              <p className="text-sm font-medium text-gray-700 mb-1">CC (Carbon Copy)</p>
              {isHRDepartment ? (
                <p className="text-xs text-gray-500">No CC needed â€” this application is directed to HR department.</p>
              ) : (
                <p className="text-xs text-amber-700">
                  <Shield className="h-3 w-3 inline mr-1" />
                  HR Department will be in CC for this application.
                </p>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
              rows="4"
              placeholder="Describe your application in detail..."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl"
            />
          </div>

          {/* Supporting Documents */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supporting Document (Optional)
            </label>
            
            {/* Important Notice about Single PDF */}
            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800">
                  <p className="font-medium mb-1">ðŸ“„ Single PDF Only</p>
                  <p>Only <strong>ONE PDF file</strong> is allowed per application (max 10MB).</p>
                  <p className="mt-1">If you have multiple documents, please merge them into a single PDF file using:</p>
                  <ul className="list-disc list-inside mt-1 ml-2">
                    <li><a href="https://www.ilovepdf.com/merge_pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ilovepdf.com</a></li>
                    <li><a href="https://smallpdf.com/merge-pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">smallpdf.com</a></li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
              <CloudUpload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">Click to upload your PDF document</p>
              <p className="text-xs text-gray-500 mb-4">PDF only, max 10MB</p>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    // Validate PDF
                    if (file.type !== 'application/pdf') {
                      alert('Please upload a PDF file only.');
                      e.target.value = '';
                      return;
                    }
                    // Validate size (10MB)
                    if (file.size > 10 * 1024 * 1024) {
                      alert('File size must be less than 10MB. Please compress your PDF.');
                      e.target.value = '';
                      return;
                    }
                    handleFileUpload([file]);
                  }
                }}
                className="hidden"
                id="file-upload"
              />
              <label 
                htmlFor="file-upload"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer"
              >
                Choose PDF File
              </label>
            </div>

            {/* Uploaded File Display (Single PDF) */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{uploadedFiles[0].name}</p>
                      <p className="text-xs text-gray-500">{uploadedFiles[0].size} â€¢ PDF Document</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedFiles([]);
                      document.getElementById('file-upload').value = '';
                    }}
                    className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                    title="Remove file"
                  >
                    <X className="h-5 w-5 text-green-700" />
                  </button>
                </div>
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
              disabled={
                !formData.department || 
                !formData.type || 
                (isOtherSelected && !formData.customSubject) || 
                !formData.description
              }
              className="flex-1 px-4 py-3 text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};



// Application Detail Modal (View only for employee)
const ApplicationDetailModal = ({ application, onClose, employee, onEdit }) => {
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Get current employee ID from JWT token
  const getCurrentEmployeeId = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      // JWT format: header.payload.signature
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded?.employeeId || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const currentEmployeeId = getCurrentEmployeeId();
  const isOwner = application.employee_id && currentEmployeeId && String(application.employee_id) === String(currentEmployeeId);
  const isPending = application.status === 'pending';
  const canEdit = isOwner && isPending;
  const canWithdraw = isOwner && !isPending;
  
  // Multi-assign approval handling - check if user is in approval chain
  const myAssignee = application.assignees?.find(a => String(a.employee_id) === String(currentEmployeeId));
  const isMyTurn = myAssignee && (application.current_step || application.currentStep) === myAssignee.step_order;
  const canApproveReject = myAssignee && isMyTurn;

  const handleEditApplication = () => {
    // Delegate editing action to parent via onEdit prop (avoids referencing parent state inside this child)
    if (typeof onEdit === 'function') {
      onEdit({
        id: application.id,
        department: application.department,
        type: application.type,
        customSubject: application.customSubject || '',
        description: application.notes || application.description || '',
        priority: application.priority || 'medium',
        assignTo: (application.assignees && application.assignees.length > 0) || application.assignedTo ? 'person' : 'department',
        assignees: application.assignees || [],
        assignedToEmployeeId: application.assignedToEmployeeId || application.assigned_to_employee_id || null,
        assignedToName: application.assignedTo || application.assignedToName || null,
        ccDepartment: application.ccDepartment || application.cc_department || null,
        documents: application.documents || []
      });
      onClose();
      return;
    }

    // Fallback: do nothing if parent didn't provide handler
    console.warn('onEdit not provided to ApplicationDetailModal');
  };

  const handleWithdrawApplication = async () => {
    if (!window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://digious-crm-official.onrender.com/api/v1/applications/${application.id}/withdraw`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Application withdrawn successfully');
        onClose();
        // Refresh the page or trigger a refetch
        window.location.reload();
      } else {
        const error = await response.json();
        alert('Failed to withdraw application: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
      alert('Error withdrawing application: ' + error.message);
    }
  };

  const handleApproveApplication = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://digious-crm-official.onrender.com/api/v1/applications/${application.id}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'approved', notes: approveNotes || '' })
      });

      if (response.ok) {
        const result = await response.json();
        const msg = result.message || `Application approved and forwarded.`;
        alert(msg);
        setShowApproveForm(false);
        setApproveNotes('');
        onClose();
        window.location.reload();
      } else {
        const error = await response.json();
        alert('Failed to approve: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error approving application:', error);
      alert('Error: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectApplication = async () => {
    if (!rejectReason.trim()) {
      alert('Rejection reason is required');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://digious-crm-official.onrender.com/api/v1/applications/${application.id}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejection_reason: rejectReason })
      });

      if (response.ok) {
        alert(`Application has been rejected.`);
        setShowRejectForm(false);
        setRejectReason('');
        onClose();
        window.location.reload();
      } else {
        const error = await response.json();
        alert('Failed to reject: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Error: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'in_review': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-indigo-100 text-indigo-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'in_review': return 'In Review';
      case 'in-progress': return 'In Progress';
      case 'withdrawn': return 'Withdrawn';
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
                        Submitted on {application.submissionDate}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Application Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {application.department && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Department</p>
                      <p className="font-medium">{application.department}</p>
                    </div>
                  )}
                  
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Application Type</p>
                    <p className="font-medium">{application.type}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Application Number</p>
                    <p className="font-medium">{application.applicationNumber}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Submission Date</p>
                    <p className="font-medium">{application.submissionDate}</p>
                  </div>
                </div>

                {/* Approval Chain / Assigned To */}
                {application.assignees && application.assignees.length > 0 ? (
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                    <p className="text-sm text-purple-600 font-medium mb-3">
                      <Users className="h-4 w-4 inline mr-1" />
                      Approval Chain ({application.assignees.length} {application.assignees.length === 1 ? 'step' : 'steps'})
                    </p>
                    <div className="space-y-2">
                      {application.assignees.map((assignee, index) => {
                        const isCurrent = application.currentStep === assignee.step_order;
                        const isApproved = assignee.status === 'approved';
                        const isRejected = assignee.status === 'rejected';
                        const isPastStep = assignee.step_order < application.currentStep;
                        
                        return (
                          <div key={assignee.id || index} className={`flex items-center gap-3 p-2 rounded-lg ${
                            isCurrent ? 'bg-purple-100 border border-purple-300' : 
                            isApproved ? 'bg-green-50 border border-green-200' : 
                            isRejected ? 'bg-red-50 border border-red-200' : 
                            'bg-white border border-gray-100'
                          }`}>
                            {/* Step indicator */}
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              isApproved ? 'bg-green-500 text-white' : 
                              isRejected ? 'bg-red-500 text-white' : 
                              isCurrent ? 'bg-purple-600 text-white' : 
                              'bg-gray-300 text-gray-600'
                            }`}>
                              {isApproved ? <Check className="h-3 w-3" /> : isRejected ? <X className="h-3 w-3" /> : index + 1}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-xs font-bold text-purple-800 flex-shrink-0">
                              {assignee.employee_name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{assignee.employee_name}</p>
                              <p className="text-xs text-gray-500">
                                {assignee.designation ? `${assignee.designation} â€¢ ` : ''}
                                {isApproved ? 'Approved' : isRejected ? 'Rejected' : isCurrent ? 'Awaiting action' : 'Pending'}
                                {assignee.action_date ? ` â€¢ ${new Date(assignee.action_date).toLocaleDateString()}` : ''}
                              </p>
                            </div>
                            {isCurrent && (
                              <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full flex-shrink-0">Current</span>
                            )}
                          </div>
                        );
                      })}
                      {/* HR final approval indicator for non-HR apps */}
                      {application.department !== 'HR' && application.department !== 'Human Resources' && (
                        <div className={`flex items-center gap-3 p-2 rounded-lg ${
                          application.currentStep > application.totalSteps && application.status !== 'approved' 
                            ? 'bg-amber-50 border border-amber-300' 
                            : application.status === 'approved' ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-100'
                        }`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            application.status === 'approved' ? 'bg-green-500 text-white' : 
                            application.currentStep > application.totalSteps ? 'bg-amber-500 text-white' : 
                            'bg-gray-300 text-gray-600'
                          }`}>
                            {application.status === 'approved' ? <Check className="h-3 w-3" /> : application.assignees.length + 1}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold text-amber-800 flex-shrink-0">
                            HR
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">HR Department</p>
                            <p className="text-xs text-gray-500">
                              {application.status === 'approved' ? `Approved by ${application.approved_by || 'HR'}` : 
                               application.currentStep > application.totalSteps ? 'Awaiting HR final approval' : 'Final Approval'}
                            </p>
                          </div>
                          {application.currentStep > application.totalSteps && application.status !== 'approved' && (
                            <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full flex-shrink-0">Current</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : application.assignedTo ? (
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                    <p className="text-sm text-purple-600 font-medium mb-2">
                      <UserPlus className="h-4 w-4 inline mr-1" />
                      Assigned To
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-purple-200 flex items-center justify-center text-sm font-bold text-purple-800">
                        {application.assignedTo.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{application.assignedTo}</p>
                        {application.assignedToDepartment && (
                          <p className="text-xs text-gray-600">{application.assignedToDesignation} â€¢ {application.assignedToDepartment}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* CC Department */}
                {application.ccDepartment && (
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                    <p className="text-sm text-amber-700">
                      <Shield className="h-3 w-3 inline mr-1" />
                      <span className="font-medium">CC:</span> {application.ccDepartment} Department
                    </p>
                  </div>
                )}

                {/* Description */}
                {application.notes && (
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 mb-2">Description</p>
                    <p className="text-gray-900 whitespace-pre-line">{application.notes}</p>
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

                {(application.rejection_reason || application.rejectionReason) && (
                  <div className="bg-red-50 p-4 rounded-xl">
                    <p className="text-sm text-red-600 font-medium mb-1">Reason for Rejection</p>
                    <p className="font-medium">{application.rejection_reason || application.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Documents */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Supporting Documents</h4>
                {application.documents && application.documents.length > 0 ? (
                  <div className="space-y-2">
                    {application.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">{doc.name}</p>
                            <p className="text-xs text-gray-500">{doc.size} â€¢ Uploaded {doc.uploaded}</p>
                          </div>
                        </div>
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <Download className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No supporting documents</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Actions</h4>

                {/* Approval status indicator */}
                {canApproveReject && (
                  <div className="mb-3 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-xs text-purple-700 font-medium">ðŸŸ£ It's your turn to review this application</p>
                  </div>
                )}

                {/* Inline Approve Form */}
                {showApproveForm && (
                  <div className="mb-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <h5 className="text-sm font-semibold text-green-800 mb-2">Approve & Forward to Next Step</h5>
                    <textarea
                      value={approveNotes}
                      onChange={(e) => setApproveNotes(e.target.value)}
                      rows="3"
                      placeholder="Add approval remarks (optional)..."
                      className="w-full px-3 py-2 border border-green-300 rounded-lg text-sm focus:ring-2 focus:ring-green-400 focus:border-green-400"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleApproveApplication}
                        disabled={actionLoading}
                        className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                      >
                        {actionLoading ? 'Processing...' : 'Confirm Approval'}
                      </button>
                      <button
                        onClick={() => { setShowApproveForm(false); setApproveNotes(''); }}
                        className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Reject Form */}
                {showRejectForm && (
                  <div className="mb-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <h5 className="text-sm font-semibold text-red-800 mb-2">Reject Application</h5>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows="3"
                      placeholder="Provide reason for rejection (required)..."
                      className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400"
                    />
                    {!rejectReason.trim() && (
                      <p className="text-xs text-red-500 mt-1">* Rejection reason is required</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleRejectApplication}
                        disabled={actionLoading || !rejectReason.trim()}
                        className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                      >
                        {actionLoading ? 'Processing...' : 'Confirm Rejection'}
                      </button>
                      <button
                        onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
                        className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {!showApproveForm && !showRejectForm && (
                  <div className="space-y-2">
                    {application.documents && application.documents.length > 0 && (
                      <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100">
                        <Download className="h-4 w-4" />
                        Download All
                      </button>
                    )}
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100">
                      <Printer className="h-4 w-4" />
                      Print Application
                    </button>
                    
                    {/* Approve Button - Show if in approval chain and it's their turn */}
                    {canApproveReject && (
                      <button 
                        onClick={() => setShowApproveForm(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 font-medium">
                        <CheckCircle className="h-4 w-4" />
                        Approve & Forward
                      </button>
                    )}
                    
                    {/* Reject Button - Show if in approval chain and it's their turn */}
                    {canApproveReject && (
                      <button 
                        onClick={() => setShowRejectForm(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-medium">
                        <XCircle className="h-4 w-4" />
                        Reject Application
                      </button>
                    )}
                    
                    {/* Edit Button - Only for owner with pending status */}
                    {canEdit && (
                      <button 
                        onClick={handleEditApplication}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-600 rounded-xl hover:bg-yellow-100 font-medium">
                        <Edit className="h-4 w-4" />
                        Edit Application
                      </button>
                    )}
                    
                    {/* Withdraw Button - For owner with non-pending status */}
                    {canWithdraw && (
                      <button 
                        onClick={handleWithdrawApplication}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-medium">
                        <X className="h-4 w-4" />
                        Withdraw Application
                      </button>
                    )}
                    
                    {/* Info message if not owner */}
                    {!isOwner && (
                      <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-600 text-center">
                        You can only edit your own applications
                      </div>
                    )}
                  </div>
                )}
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
                  
                  {/* Show approval chain timeline */}
                  {application.assignees && application.assignees.filter(a => a.status === 'approved' || a.status === 'rejected').map((assignee, index) => (
                    <div key={assignee.id || index} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        assignee.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {assignee.status === 'approved' 
                          ? <CheckCircle className="h-4 w-4 text-green-600" />
                          : <X className="h-4 w-4 text-red-600" />
                        }
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {assignee.status === 'approved' ? 'Approved' : 'Rejected'} by {assignee.employee_name}
                        </p>
                        <p className="text-xs text-gray-600">
                          Step {assignee.step_order}
                          {assignee.action_date ? ` â€¢ ${new Date(assignee.action_date).toLocaleDateString()}` : ''}
                        </p>
                        {assignee.notes && (
                          <p className="text-xs text-gray-500 italic">"{assignee.notes}"</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {application.approved_by && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Final Approval by {application.approved_by}</p>
                        <p className="text-sm text-gray-600">{application.approvedDate || application.approved_date}</p>
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
                    <Users className="h-3 w-3" />
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
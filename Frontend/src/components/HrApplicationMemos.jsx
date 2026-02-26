import React, { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  Download,
  Filter,
  Plus,
  Search,
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
  Briefcase,
  Building,
  GraduationCap,
  DollarSign,
  MapPin,
  Link,
  MessageSquare,
  CheckSquare,
  FileCheck,
  Archive,
  Send,
  Bell,
  Star,
  Inbox,
  FileUp,
  FileDown,
  Printer,
  Share2,
  Copy,
  Tag,
  Folder,
  FolderOpen,
  X,
  User,
  Paperclip,
  Check,
  ExternalLink,
  ArrowUpRight,
  FilePlus,
  MailIcon,
  CloudUpload,
  ChevronUp,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { getCurrentEmployeeId, endpoints, getAuthHeaders } from "../config/api";

// Simple date formatting function
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const options = { month: 'short', day: '2-digit', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

// Simple time formatting function
const formatTime = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const getStartOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 2).toISOString().split('T')[0];
};

const getEndOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0];
};

// Generate application number
const generateApplicationNumber = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `APP-${year}-${randomNum}`;
};

// Generate tracking ID
const generateTrackingId = () => {
  return `TRK-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
};

// Applied Applications (Applications submitted by users) - Subject removed
const appliedApplications = [
  {
    id: 201,
    applicationNumber: "APP-2026-201",
    department: "Human Resources",
    applicantName: "John Doe",
    applicantId: "EMP-001",
    applicantDesignation: "HR Manager",
    applicationType: "Annual Leave Request",
    appliedDate: "2026-04-20",
    appliedTime: "09:15 AM",
    status: "submitted",
    priority: "high",
    attachments: ["leave_application.pdf"],
    estimatedProcessingTime: "2 days",
    currentStatus: "Under Review by Sarah Johnson",
    lastUpdated: "2026-04-20",
    trackingId: "TRK-0012345",
    notes: "Family vacation",
  },
  {
    id: 202,
    applicationNumber: "APP-2026-202",
    department: "Finance",
    applicantName: "Sarah Smith",
    applicantId: "EMP-002",
    applicantDesignation: "Finance Executive",
    applicationType: "Business Trip Request",
    appliedDate: "2026-04-18",
    appliedTime: "11:30 AM",
    status: "in-progress",
    priority: "medium",
    attachments: ["travel_request.pdf", "flight_quotes.pdf"],
    estimatedProcessingTime: "3 days",
    currentStatus: "Approval Pending from Finance Director",
    lastUpdated: "2026-04-19",
    trackingId: "TRK-0012346",
    notes: "Client meeting scheduled",
  },
  {
    id: 203,
    applicationNumber: "APP-2026-203",
    department: "Operations",
    applicantName: "Michael Brown",
    applicantId: "EMP-003",
    applicantDesignation: "Operations Head",
    applicationType: "Purchase Request",
    appliedDate: "2026-04-22",
    appliedTime: "02:45 PM",
    status: "approved",
    priority: "high",
    attachments: ["purchase_request.pdf", "quotes.xlsx"],
    estimatedProcessingTime: "7 days",
    currentStatus: "Approved by Emma Wilson",
    lastUpdated: "2026-04-25",
    trackingId: "TRK-0012347",
    approvedDate: "2026-04-25",
    approvedBy: "Emma Wilson",
    notes: "For new hires",
  },
  {
    id: 204,
    applicationNumber: "APP-2026-204",
    department: "Administration",
    applicantName: "Emma Wilson",
    applicantId: "EMP-004",
    applicantDesignation: "Admin Manager",
    applicationType: "Expense Claim",
    appliedDate: "2026-04-15",
    appliedTime: "10:00 AM",
    status: "rejected",
    priority: "low",
    attachments: ["expense_report.pdf", "receipts.pdf"],
    estimatedProcessingTime: "5 days",
    currentStatus: "Rejected - Insufficient documentation",
    lastUpdated: "2026-04-18",
    trackingId: "TRK-0012348",
    rejectedDate: "2026-04-18",
    rejectedBy: "Robert Chen",
    rejectionReason: "Missing original receipts",
    notes: "Team bonding activity",
  },
  {
    id: 205,
    applicationNumber: "APP-2026-205",
    department: "IT Support",
    applicantName: "Robert Chen",
    applicantId: "EMP-005",
    applicantDesignation: "IT Support Lead",
    applicationType: "Maintenance Request",
    appliedDate: "2026-04-25",
    appliedTime: "08:30 AM",
    status: "completed",
    priority: "high",
    attachments: ["maintenance_form.pdf"],
    estimatedProcessingTime: "2 days",
    currentStatus: "Completed - Maintenance done",
    lastUpdated: "2026-04-27",
    trackingId: "TRK-0012349",
    completedDate: "2026-04-27",
    completedBy: "Lisa Taylor",
    notes: "Urgent repair needed",
  },
];

// Receiving Applications (Applications received for processing) - Subject removed
const receivingApplications = [
  {
    id: 1,
    applicationNumber: "APP-2026-001",
    department: "Human Resources",
    applicantName: "John Doe",
    applicantDesignation: "HR Manager",
    applicationType: "Annual Leave Request",
    receivedDate: "2026-04-20",
    receivedTime: "09:15 AM",
    priority: "high",
    status: "received",
    attachments: ["leave_application.pdf"],
    estimatedProcessingTime: "2 days",
    assignedTo: "Sarah Johnson",
    dueDate: "2026-04-22",
    actionRequired: "Review and initial approval",
    notes: "Annual leave request",
  },
  {
    id: 2,
    applicationNumber: "APP-2026-002",
    department: "Finance",
    applicantName: "Sarah Smith",
    applicantDesignation: "Finance Executive",
    applicationType: "Business Trip Request",
    receivedDate: "2026-04-18",
    receivedTime: "11:30 AM",
    priority: "medium",
    status: "processing",
    attachments: ["travel_request.pdf", "flight_quotes.pdf"],
    estimatedProcessingTime: "3 days",
    assignedTo: "Michael Brown",
    dueDate: "2026-04-21",
    actionRequired: "Verify budget allocation",
    notes: "Important client meeting",
  },
  {
    id: 3,
    applicationNumber: "APP-2026-003",
    department: "Operations",
    applicantName: "Michael Brown",
    applicantDesignation: "Operations Head",
    applicationType: "Purchase Request",
    receivedDate: "2026-04-22",
    receivedTime: "02:45 PM",
    priority: "high",
    status: "pending-approval",
    attachments: ["purchase_request.pdf", "quotes.xlsx"],
    estimatedProcessingTime: "7 days",
    assignedTo: "Emma Wilson",
    dueDate: "2026-04-29",
    actionRequired: "Director level approval needed",
    notes: "New hires equipment",
  },
  {
    id: 4,
    applicationNumber: "APP-2026-004",
    department: "Administration",
    applicantName: "Emma Wilson",
    applicantDesignation: "Admin Manager",
    applicationType: "Expense Claim",
    receivedDate: "2026-04-15",
    receivedTime: "10:00 AM",
    priority: "low",
    status: "approved",
    attachments: ["expense_report.pdf", "receipts.pdf"],
    estimatedProcessingTime: "5 days",
    assignedTo: "Robert Chen",
    dueDate: "2026-04-20",
    processedDate: "2026-04-19",
    approvedBy: "David Lee",
    actionRequired: "Payment processing",
    notes: "Team lunch reimbursement",
  },
  {
    id: 5,
    applicationNumber: "APP-2026-005",
    department: "IT Support",
    applicantName: "Robert Chen",
    applicantDesignation: "IT Support Lead",
    applicationType: "Maintenance Request",
    receivedDate: "2026-04-25",
    receivedTime: "08:30 AM",
    priority: "high",
    status: "processing",
    attachments: ["maintenance_form.pdf"],
    estimatedProcessingTime: "2 days",
    assignedTo: "Lisa Taylor",
    dueDate: "2026-04-27",
    actionRequired: "Assign to maintenance team",
    notes: "Server overheating issue",
  },
];

// Active memos/notes
const activeMemos = [
  {
    id: 1,
    memoNumber: "MEMO-2024-001",
    title: "New Leave Application Process",
    from: "HR Department",
    author: {
      id: 1,
      name: "Jane Manager",
      avatar: "JM",
      department: "Human Resources",
      position: "HR Director",
      email: "jane@company.com",
    },
    type: "process",
    category: "HR",
    date: "2024-01-15",
    createdDate: "2024-01-15",
    lastUpdated: "2024-01-15",
    status: "active",
    priority: "high",
    content: "Updated leave application submission and approval process effective from May 2026...",
    summary: "Updated guidelines for remote work arrangements effective February 1st.",
    attachments: ["leave_process_v2.pdf", "approval_flow.pdf"],
    readers: 45,
    comments: 12,
    actionsRequired: true,
    deadline: "2024-01-25"
  },
  {
    id: 2,
    memoNumber: "MEMO-2024-002",
    title: "Expense Claim Guidelines",
    from: "Finance Department",
    author: {
      id: 2,
      name: "Mark Director",
      avatar: "MD",
      department: "Finance",
      position: "Finance Director",
      email: "mark@company.com",
    },
    type: "guideline",
    category: "Finance",
    date: "2024-01-14",
    createdDate: "2024-01-14",
    lastUpdated: "2024-01-14",
    status: "active",
    priority: "high",
    content: "Updated expense claim submission guidelines and approval matrix...",
    summary: "Updated expense claim submission guidelines and approval matrix...",
    attachments: ["expense_guidelines.pdf"],
    readers: 38,
    comments: 8,
    actionsRequired: false,
    deadline: "2024-01-20"
  },
  {
    id: 3,
    memoNumber: "MEMO-2024-003",
    title: "Office Maintenance Request Process",
    from: "IT Security Team",
    author: {
      id: 3,
      name: "Lisa Taylor",
      avatar: "LT",
      department: "Facilities",
      position: "Facilities Manager",
      email: "lisa@company.com",
    },
    type: "process",
    category: "Security",
    date: "2024-01-12",
    createdDate: "2024-01-12",
    lastUpdated: "2024-01-12",
    status: "active",
    priority: "urgent",
    content: "Standard operating procedure for submitting and tracking maintenance requests...",
    summary: "Important security updates required for all development environments.",
    attachments: ["maintenance_process.pdf", "request_form.docx"],
    readers: 25,
    comments: 5,
    actionsRequired: true,
    deadline: "2024-01-14"
  },
];

// Department options (matching employee version)
const departmentsList = [
  { value: 'Human Resources', label: 'Human Resources (HR)' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Administration', label: 'Administration' },
  { value: 'IT Support', label: 'IT Support' },
  { value: 'Facilities', label: 'Facilities' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Productions', label: 'Productions' },
  { value: 'All Departments', label: 'All Departments' }
];

// Department-wise application types (matching employee version)
const departmentApplicationTypes = {
  'Human Resources': [
    { value: 'Annual Leave Request', label: 'Annual Leave Request' },
    { value: 'Casual Leave Request', label: 'Casual Leave Request' },
    { value: 'Sick Leave Request', label: 'Sick Leave Request' },
    { value: 'Remote Work Request', label: 'Remote Work Request' },
    { value: 'Overtime Request', label: 'Overtime Request' },
    { value: 'Resignation Request', label: 'Resignation Request' },
    { value: 'Promotion Request', label: 'Promotion Request' },
    { value: 'Transfer Request', label: 'Transfer Request' },
    { value: 'Salary Revision', label: 'Salary Revision' },
    { value: 'Employee Grievance', label: 'Employee Grievance' },
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
  'Administration': [
    { value: 'Travel Request', label: 'Travel Request' },
    { value: 'Stationery Request', label: 'Stationery Request' },
    { value: 'Office Supplies Request', label: 'Office Supplies Request' },
    { value: 'Meeting Room Booking', label: 'Meeting Room Booking' },
    { value: 'Visitor Pass Request', label: 'Visitor Pass Request' },
    { value: 'Other', label: 'Other' }
  ],
  'IT Support': [
    { value: 'Hardware Request', label: 'Hardware Request' },
    { value: 'Software Request', label: 'Software Request' },
    { value: 'Access Request', label: 'Access Request' },
    { value: 'Technical Support', label: 'Technical Support' },
    { value: 'System Maintenance', label: 'System Maintenance' },
    { value: 'Other', label: 'Other' }
  ],
  'Facilities': [
    { value: 'Maintenance Request', label: 'Maintenance Request' },
    { value: 'Repair Request', label: 'Repair Request' },
    { value: 'Cleaning Request', label: 'Cleaning Request' },
    { value: 'Security Request', label: 'Security Request' },
    { value: 'Other', label: 'Other' }
  ],
  'Sales': [
    { value: 'Sales Report Submission', label: 'Sales Report Submission' },
    { value: 'Client Visit Request', label: 'Client Visit Request' },
    { value: 'Sales Target Revision', label: 'Sales Target Revision' },
    { value: 'Discount Approval Request', label: 'Discount Approval Request' },
    { value: 'Sales Material Request', label: 'Sales Material Request' },
    { value: 'Other', label: 'Other' }
  ],
  'Productions': [
    { value: 'Raw Material Request', label: 'Raw Material Request' },
    { value: 'Machine Maintenance', label: 'Machine Maintenance' },
    { value: 'Production Report', label: 'Production Report' },
    { value: 'Quality Inspection', label: 'Quality Inspection' },
    { value: 'Shift Change Request', label: 'Shift Change Request' },
    { value: 'Other', label: 'Other' }
  ]
};

export default function OfficeApplicationsSystem() {
  const [activeTab, setActiveTab] = useState('all-applications');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedApplicationType, setSelectedApplicationType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({
    start: getStartOfMonth(),
    end: getEndOfMonth(),
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedView, setSelectedView] = useState('today');
  const [memoType, setMemoType] = useState('all');
  
  // Popup states
  const [popupType, setPopupType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Form states - Subject removed from new application form
  const [newApplicationForm, setNewApplicationForm] = useState({
    department: '',
    applicationType: '',
    description: '',
    priority: 'medium',
    attachments: []
  });
  
  const [newMemoForm, setNewMemoForm] = useState({
    title: '',
    type: 'process',
    category: '',
    priority: 'medium',
    summary: '',
    content: '',
    attachments: []
  });

  const [replyMemoForm, setReplyMemoForm] = useState({
    comment: '',
    attachments: []
  });

  const [processApplicationForm, setProcessApplicationForm] = useState({
    status: 'processing',
    assignedTo: '',
    dueDate: '',
    comments: '',
    action: ''
  });

  const [approveApplicationForm, setApproveApplicationForm] = useState({
    approvedBy: '',
    approvalDate: new Date().toISOString().split('T')[0],
    comments: ''
  });

  const [rejectApplicationForm, setRejectApplicationForm] = useState({
    rejectedBy: '',
    rejectionDate: new Date().toISOString().split('T')[0],
    reason: '',
    comments: ''
  });

  const [exportReportForm, setExportReportForm] = useState({
    reportType: 'applications',
    format: 'pdf',
    dateRange: 'custom',
    startDate: getStartOfMonth(),
    endDate: getEndOfMonth(),
    includeAttachments: false,
    departments: ['all'],
    statuses: ['all']
  });

  const [currentUser, setCurrentUser] = useState({
    name: "",
    id: null,
    designation: "",
    department: ""
  });

  // Real data states
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get current employee ID on mount and populate currentUser from JWT
  useEffect(() => {
    const empId = getCurrentEmployeeId();
    setCurrentEmployeeId(empId);
    
    // Populate currentUser from JWT token
    const decoded = JSON.parse(atob(localStorage.getItem('token')?.split('.')[1] || '') || '{}');
    if (decoded) {
      setCurrentUser({
        name: decoded.name || '',
        id: decoded.employeeId || null,
        designation: decoded.designation || '',
        department: decoded.department || 'Human Resources'
      });
    }
  }, []);

  // Fetch applications data
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch('https://digious-crm-official.onrender.com/api/v1/applications/all', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          setApplications(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch applications');
        }
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  // Stats calculations
  const stats = useMemo(() => {
    const totalApplied = applications.filter(app => app.employee_id === currentUser.id).length;
    const totalReceiving = applications.filter(app => app.employee_id !== currentUser.id).length;
    const approvedApplied = applications.filter(app => app.employee_id === currentUser.id && (app.status === 'approved' || app.status === 'completed')).length;
    const processedReceiving = applications.filter(app => app.employee_id !== currentUser.id && (app.status === 'approved' || app.status === 'processing')).length;
    
    return {
      totalApplied,
      totalReceiving,
      approvedApplied,
      processedReceiving,
      approvalRate: totalApplied > 0 ? ((approvedApplied / totalApplied) * 100).toFixed(1) : '0',
      processingRate: totalReceiving > 0 ? ((processedReceiving / totalReceiving) * 100).toFixed(1) : '0',
      pendingApps: applications.filter(app => app.employee_id === currentUser.id && (app.status === 'submitted' || app.status === 'in-progress')).length,
      unreadMemos: activeMemos.filter(memo => memo.status === 'unread').length,
      drafts: 2
    };
  }, [applications, currentUser.id]);

  // Filter all applications (combined applied and receiving) - Subject removed from search
  const filteredAllApplications = useMemo(() => {
    let filtered = applications;
    
    if (selectedView === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(app => 
        app.submission_date?.split('T')[0] === today
      );
    } else if (selectedView === 'pending') {
      filtered = filtered.filter(app => 
        app.status === 'pending' ||
        app.status === 'submitted' || 
        app.status === 'in-progress' || 
        app.status === 'received' || 
        app.status === 'processing' ||
        app.status === 'pending-approval'
      );
    } else if (selectedView === 'approved') {
      filtered = filtered.filter(app => app.status === 'approved' || app.status === 'completed');
    } else if (selectedView === 'overdue') {
      filtered = filtered.filter(app => {
        // For now, assume no due date in the table, or add logic later
        return false;
      });
    }
    
    return filtered.filter(app => {
      const matchesDepartment = selectedDepartment === 'all' || app.department === selectedDepartment;
      const matchesStatus = selectedStatus === 'all' || app.status === selectedStatus;
      const matchesType = selectedApplicationType === 'all' || 
        (app.application_type && app.application_type === selectedApplicationType);
      const matchesSearch = searchQuery === '' || 
        app.applicationNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.applicantName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesDepartment && matchesStatus && matchesType && matchesSearch;
    });
  }, [applications, selectedDepartment, selectedStatus, selectedApplicationType, searchQuery, selectedView]);

  // Filter applied applications - Subject removed from search
  const filteredAppliedApplications = useMemo(() => {
    let filtered = applications.filter(app => app.employee_id === currentUser.id);
    
    if (selectedView === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(app => app.submission_date?.split('T')[0] === today);
    } else if (selectedView === 'pending') {
      filtered = filtered.filter(app => app.status === 'pending' || app.status === 'submitted' || app.status === 'in-progress');
    } else if (selectedView === 'approved') {
      filtered = filtered.filter(app => app.status === 'approved' || app.status === 'completed');
    }
    
    return filtered.filter(app => {
      const matchesDepartment = selectedDepartment === 'all' || app.department === selectedDepartment;
      const matchesStatus = selectedStatus === 'all' || app.status === selectedStatus;
      const matchesType = selectedApplicationType === 'all' || app.application_type === selectedApplicationType;
      const matchesSearch = searchQuery === '' || 
        app.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.applicantName.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesDepartment && matchesStatus && matchesType && matchesSearch;
    });
  }, [applications, currentUser.id, selectedDepartment, selectedStatus, selectedApplicationType, searchQuery, selectedView]);

  // Filter receiving applications - Subject removed from search
  const filteredReceivingApplications = useMemo(() => {
    let filtered = applications.filter(app => app.employee_id !== currentUser.id);
    
    if (selectedView === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(app => app.submission_date?.split('T')[0] === today);
    } else if (selectedView === 'pending') {
      filtered = filtered.filter(app => app.status === 'pending' || app.status === 'received' || app.status === 'processing');
    } else if (selectedView === 'overdue') {
      // For now, no due date logic
      filtered = [];
    }
    
    return filtered.filter(app => {
      const matchesDepartment = selectedDepartment === 'all' || app.department === selectedDepartment;
      const matchesStatus = selectedStatus === 'all' || app.status === selectedStatus;
      const matchesType = selectedApplicationType === 'all' || app.application_type === selectedApplicationType;
      const matchesSearch = searchQuery === '' || 
        app.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.applicantName.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesDepartment && matchesStatus && matchesType && matchesSearch;
    });
  }, [applications, currentUser.id, selectedDepartment, selectedStatus, selectedApplicationType, searchQuery, selectedView]);

  // Filter applications assigned to current user
  const filteredAssignedToMeApplications = useMemo(() => {
    if (!currentEmployeeId) return [];
    
    let filtered = applications.filter(app => 
      app.assignees?.some(a => String(a.employee_id) === String(currentEmployeeId)) ||
      String(app.assigned_to_employee_id) === String(currentEmployeeId)
    );

    // Attach multi-assign meta to each app
    filtered = filtered.map(app => {
      const myAssignee = app.assignees?.find(a => String(a.employee_id) === String(currentEmployeeId));
      return {
        ...app,
        isMyTurn: myAssignee ? app.current_step === myAssignee.step_order : false,
        myStepOrder: myAssignee?.step_order || null,
        myStepStatus: myAssignee?.status || null,
      };
    });

    // Apply search filter
    return filtered.filter(app => {
      const matchesSearch = searchQuery === '' || 
        app.application_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.subject?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
  }, [applications, currentEmployeeId, searchQuery]);

  // Filter active memos
  const filteredMemos = useMemo(() => {
    return activeMemos.filter(memo => {
      const matchesDepartment = selectedDepartment === 'all' || memo.author.department === selectedDepartment;
      const matchesStatus = selectedStatus === 'all' || memo.status === selectedStatus;
      const matchesType = memoType === 'all' || memo.type === memoType;
      const matchesSearch = searchQuery === '' || 
        memo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memo.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memo.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesDepartment && matchesStatus && matchesType && matchesSearch;
    });
  }, [selectedDepartment, selectedStatus, memoType, searchQuery]);

  // Handle application actions
  const handleApplicationAction = (appId, action) => {
    console.log(`${action} application ${appId}`);
  };

  // Handle new application form submission - Subject removed
  const handleNewApplicationSubmit = (e) => {
    e.preventDefault();
    console.log('New application submitted:', newApplicationForm);
    setPopupType(null);
    setNewApplicationForm({
      department: '',
      applicationType: '',
      description: '',
      priority: 'medium',
      attachments: []
    });
  };

  // Handle new memo form submission
  const handleNewMemoSubmit = (e) => {
    e.preventDefault();
    console.log('New memo submitted:', newMemoForm);
    setPopupType(null);
    setNewMemoForm({
      title: '',
      type: 'process',
      category: '',
      priority: 'medium',
      summary: '',
      content: '',
      attachments: []
    });
  };

  // Handle reply to memo
  const handleReplyMemoSubmit = (e) => {
    e.preventDefault();
    console.log('Reply to memo:', selectedItem?.id, replyMemoForm);
    setPopupType(null);
    setReplyMemoForm({
      comment: '',
      attachments: []
    });
  };

  // Handle process application
  const handleProcessApplicationSubmit = (e) => {
    e.preventDefault();
    console.log('Process application:', selectedItem?.id, processApplicationForm);
    setPopupType(null);
    setProcessApplicationForm({
      status: 'processing',
      assignedTo: '',
      dueDate: '',
      comments: '',
      action: ''
    });
  };

  // Handle approve application
  const handleApproveApplicationSubmit = (e) => {
    e.preventDefault();
    console.log('Approve application:', selectedItem?.id, approveApplicationForm);
    setPopupType(null);
    setApproveApplicationForm({
      approvedBy: '',
      approvalDate: new Date().toISOString().split('T')[0],
      comments: ''
    });
  };

  // Handle reject application
  const handleRejectApplicationSubmit = (e) => {
    e.preventDefault();
    console.log('Reject application:', selectedItem?.id, rejectApplicationForm);
    setPopupType(null);
    setRejectApplicationForm({
      rejectedBy: '',
      rejectionDate: new Date().toISOString().split('T')[0],
      reason: '',
      comments: ''
    });
  };

  // Handle export report
  const handleExportReportSubmit = (e) => {
    e.preventDefault();
    console.log('Export report:', exportReportForm);
    setPopupType(null);
    setExportReportForm({
      reportType: 'applications',
      format: 'pdf',
      dateRange: 'custom',
      startDate: getStartOfMonth(),
      endDate: getEndOfMonth(),
      includeAttachments: false,
      departments: ['all'],
      statuses: ['all']
    });
  };

  // Handle mark as read
  const handleMarkAsRead = (memoId) => {
    console.log('Mark memo as read:', memoId);
  };

  // Handle view details
  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setPopupType('view-details');
  };

  // Edit functionality removed - handlers deleted

  // Handle delete
  const handleDelete = (item) => {
    setSelectedItem(item);
    setPopupType('delete-confirm');
  };

  // Handle process action
  const handleProcess = (app) => {
    setSelectedItem(app);
    setPopupType('process-application');
  };

  // Handle approve
  const handleApprove = (app) => {
    setSelectedItem(app);
    setPopupType('approve-application');
  };

  // Handle reject
  const handleReject = (app) => {
    setSelectedItem(app);
    setPopupType('reject-application');
  };

  // Handle reply to memo
  const handleReplyToMemo = (memo) => {
    setSelectedItem(memo);
    setPopupType('reply-memo');
  };

  // Handle new application
  const handleNewApplication = () => {
    setPopupType('new-application');
  };

  // Handle new memo
  const handleNewMemo = () => {
    setPopupType('new-memo');
  };

  // Handle export report
  const handleExportReport = () => {
    setPopupType('export-report');
  };

  // Close popup
  const closePopup = () => {
    setPopupType(null);
    setSelectedItem(null);
  };

  // Popup Modal Component
  const PopupModal = () => {
    if (!popupType) return null;

    const getTitle = () => {
      switch(popupType) {
        case 'new-application': return 'New Application';
        case 'new-memo': return 'New Memo';
        case 'view-details': return `View ${selectedItem?.applicationNumber || selectedItem?.memoNumber || 'Details'}`;
        case 'delete-confirm': return 'Confirm Delete';
        case 'process-application': return `Process Application - ${selectedItem?.applicationNumber}`;
        case 'approve-application': return `Approve Application - ${selectedItem?.applicationNumber}`;
        case 'reject-application': return `Reject Application - ${selectedItem?.applicationNumber}`;
        case 'reply-memo': return `Reply to Memo - ${selectedItem?.title}`;
        case 'export-report': return 'Export Report';
        default: return 'Popup';
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">{getTitle()}</h2>
            <button
              onClick={closePopup}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* New Application Form - Subject removed */}
            {popupType === 'new-application' && (
              <form onSubmit={handleNewApplicationSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={newApplicationForm.department}
                      onChange={(e) => setNewApplicationForm({...newApplicationForm, department: e.target.value})}
                      required
                    >
                      <option value="">Select Department</option>
                      {departmentsList.filter(d => d.value !== 'All Departments').map(dept => (
                        <option key={dept.value} value={dept.value}>{dept.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Application Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={newApplicationForm.applicationType}
                      onChange={(e) => setNewApplicationForm({...newApplicationForm, applicationType: e.target.value})}
                      required
                      disabled={!newApplicationForm.department}
                    >
                      <option value="">Select Application Type</option>
                      {newApplicationForm.department && departmentApplicationTypes[newApplicationForm.department]?.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows="4"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Provide detailed description"
                      value={newApplicationForm.description}
                      onChange={(e) => setNewApplicationForm({...newApplicationForm, description: e.target.value})}
                      required
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Priority
                    </label>
                    <select
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={newApplicationForm.priority}
                      onChange={(e) => setNewApplicationForm({...newApplicationForm, priority: e.target.value})}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Attachments
                    </label>
                    <div className="flex items-center">
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium cursor-pointer">
                        <CloudUpload size={16} />
                        Upload Files
                        <input type="file" multiple className="hidden" />
                      </label>
                      <span className="ml-2 text-xs text-slate-500">Max 10MB per file</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={closePopup}
                    className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            )}

            {/* New Memo Form */}
            {popupType === 'new-memo' && (
              <form onSubmit={handleNewMemoSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter memo title"
                      value={newMemoForm.title}
                      onChange={(e) => setNewMemoForm({...newMemoForm, title: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={newMemoForm.type}
                      onChange={(e) => setNewMemoForm({...newMemoForm, type: e.target.value})}
                      required
                    >
                      <option value="policy">Policy</option>
                      <option value="process">Process</option>
                      <option value="guideline">Guideline</option>
                      <option value="announcement">Announcement</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., HR, Finance, IT"
                      value={newMemoForm.category}
                      onChange={(e) => setNewMemoForm({...newMemoForm, category: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Priority
                    </label>
                    <select
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={newMemoForm.priority}
                      onChange={(e) => setNewMemoForm({...newMemoForm, priority: e.target.value})}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Summary <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Brief summary of the memo"
                      value={newMemoForm.summary}
                      onChange={(e) => setNewMemoForm({...newMemoForm, summary: e.target.value})}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows="6"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter detailed memo content"
                      value={newMemoForm.content}
                      onChange={(e) => setNewMemoForm({...newMemoForm, content: e.target.value})}
                      required
                    ></textarea>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Attachments
                    </label>
                    <div className="flex items-center">
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium cursor-pointer">
                        <CloudUpload size={16} />
                        Upload Files
                        <input type="file" multiple className="hidden" />
                      </label>
                      <span className="ml-2 text-xs text-slate-500">Max 10MB per file</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={closePopup}
                    className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                  >
                    Create Memo
                  </button>
                </div>
              </form>
            )}

            {/* View Details - Subject removed from application display */}
            {popupType === 'view-details' && selectedItem && (
              <div className="space-y-6">
                {selectedItem.applicationNumber ? (
                  // Application Details - Subject removed
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs text-slate-500">Application Number</p>
                        <p className="text-sm font-medium text-slate-900">{selectedItem.applicationNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Tracking ID</p>
                        <p className="text-sm font-medium text-slate-900">{selectedItem.trackingId || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Type</p>
                        <p className="text-sm font-medium text-slate-900">{selectedItem.applicationType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Department</p>
                        <p className="text-sm font-medium text-slate-900">{selectedItem.department}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Applicant</p>
                        <p className="text-sm font-medium text-slate-900">{selectedItem.applicantName}</p>
                        <p className="text-xs text-slate-500">{selectedItem.applicantId} • {selectedItem.applicantDesignation}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Applied Date</p>
                        <p className="text-sm font-medium text-slate-900">{formatDate(selectedItem.appliedDate || selectedItem.receivedDate)}</p>
                        <p className="text-xs text-slate-500">{selectedItem.appliedTime || selectedItem.receivedTime}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-slate-500">Description</p>
                        <p className="text-sm text-slate-900">{selectedItem.notes || 'No description provided'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-slate-500">Status</p>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                          selectedItem.status === 'approved' || selectedItem.status === 'completed' ? 'bg-green-100 text-green-800' :
                          selectedItem.status === 'in-progress' || selectedItem.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          selectedItem.status === 'submitted' || selectedItem.status === 'received' ? 'bg-amber-100 text-amber-800' :
                          selectedItem.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {selectedItem.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                      </div>
                      {selectedItem.attachments && selectedItem.attachments.length > 0 && (
                        <div className="col-span-2">
                          <p className="text-xs text-slate-500 mb-2">Attachments</p>
                          <div className="space-y-2">
                            {selectedItem.attachments.map((file, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                                <FileText size={16} className="text-slate-400" />
                                <span className="text-sm text-slate-700">{file}</span>
                                <button className="ml-auto text-blue-600 hover:text-blue-800 text-xs font-medium">
                                  <Download size={14} className="inline mr-1" />
                                  Download
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Memo Details
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs text-slate-500">Memo Number</p>
                        <p className="text-sm font-medium text-slate-900">{selectedItem.memoNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Title</p>
                        <p className="text-sm font-medium text-slate-900">{selectedItem.title}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Type</p>
                        <p className="text-sm font-medium text-slate-900 capitalize">{selectedItem.type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Category</p>
                        <p className="text-sm font-medium text-slate-900">{selectedItem.category}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Author</p>
                        <p className="text-sm font-medium text-slate-900">{selectedItem.author.name}</p>
                        <p className="text-xs text-slate-500">{selectedItem.author.position} • {selectedItem.author.department}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Created Date</p>
                        <p className="text-sm font-medium text-slate-900">{formatDate(selectedItem.createdDate)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-slate-500">Summary</p>
                        <p className="text-sm text-slate-900">{selectedItem.summary}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-slate-500">Content</p>
                        <p className="text-sm text-slate-900 whitespace-pre-line">{selectedItem.content}</p>
                      </div>
                      {selectedItem.attachments && selectedItem.attachments.length > 0 && (
                        <div className="col-span-2">
                          <p className="text-xs text-slate-500 mb-2">Attachments</p>
                          <div className="space-y-2">
                            {selectedItem.attachments.map((file, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                                <FileText size={16} className="text-slate-400" />
                                <span className="text-sm text-slate-700">{file}</span>
                                <button className="ml-auto text-blue-600 hover:text-blue-800 text-xs font-medium">
                                  <Download size={14} className="inline mr-1" />
                                  Download
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={closePopup}
                    className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50"
                  >
                    Close
                  </button>
                  {selectedItem.applicationNumber && selectedItem.status === 'received' && (
                    <>
                      <button
                        onClick={() => {
                          setPopupType('process-application');
                        }}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                      >
                        Process
                      </button>
                      <button
                        onClick={() => {
                          setPopupType('approve-application');
                        }}
                        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setPopupType('reject-application');
                        }}
                        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Process Application Form */}
            {popupType === 'process-application' && selectedItem && (
              <form onSubmit={handleProcessApplicationSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Application <span className="text-slate-900 font-normal ml-2">{selectedItem.applicationNumber}</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={processApplicationForm.status}
                      onChange={(e) => setProcessApplicationForm({...processApplicationForm, status: e.target.value})}
                      required
                    >
                      <option value="processing">Processing</option>
                      <option value="pending-approval">Pending Approval</option>
                      <option value="in-review">In Review</option>
                      <option value="on-hold">On Hold</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Assign To
                    </label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter assignee name"
                      value={processApplicationForm.assignedTo}
                      onChange={(e) => setProcessApplicationForm({...processApplicationForm, assignedTo: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={processApplicationForm.dueDate}
                      onChange={(e) => setProcessApplicationForm({...processApplicationForm, dueDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Action Required
                    </label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Review documents, Verify information"
                      value={processApplicationForm.action}
                      onChange={(e) => setProcessApplicationForm({...processApplicationForm, action: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Comments
                    </label>
                    <textarea
                      rows="3"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add processing comments"
                      value={processApplicationForm.comments}
                      onChange={(e) => setProcessApplicationForm({...processApplicationForm, comments: e.target.value})}
                    ></textarea>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={closePopup}
                    className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                  >
                    Update Processing Status
                  </button>
                </div>
              </form>
            )}

            {/* Approve Application Form */}
            {popupType === 'approve-application' && selectedItem && (
              <form onSubmit={handleApproveApplicationSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Application <span className="text-slate-900 font-normal ml-2">{selectedItem.applicationNumber}</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Approved By <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter approver name"
                      value={approveApplicationForm.approvedBy}
                      onChange={(e) => setApproveApplicationForm({...approveApplicationForm, approvedBy: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Approval Date
                    </label>
                    <input
                      type="date"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={approveApplicationForm.approvalDate}
                      onChange={(e) => setApproveApplicationForm({...approveApplicationForm, approvalDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Approval Comments
                    </label>
                    <textarea
                      rows="3"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add approval comments"
                      value={approveApplicationForm.comments}
                      onChange={(e) => setApproveApplicationForm({...approveApplicationForm, comments: e.target.value})}
                    ></textarea>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={closePopup}
                    className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                  >
                    Approve Application
                  </button>
                </div>
              </form>
            )}

            {/* Reject Application Form */}
            {popupType === 'reject-application' && selectedItem && (
              <form onSubmit={handleRejectApplicationSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Application <span className="text-slate-900 font-normal ml-2">{selectedItem.applicationNumber}</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Rejected By <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter rejector name"
                      value={rejectApplicationForm.rejectedBy}
                      onChange={(e) => setRejectApplicationForm({...rejectApplicationForm, rejectedBy: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Rejection Date
                    </label>
                    <input
                      type="date"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={rejectApplicationForm.rejectionDate}
                      onChange={(e) => setRejectApplicationForm({...rejectApplicationForm, rejectionDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Rejection Reason <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={rejectApplicationForm.reason}
                      onChange={(e) => setRejectApplicationForm({...rejectApplicationForm, reason: e.target.value})}
                      required
                    >
                      <option value="">Select reason</option>
                      <option value="Insufficient documentation">Insufficient documentation</option>
                      <option value="Budget constraints">Budget constraints</option>
                      <option value="Policy violation">Policy violation</option>
                      <option value="Incomplete information">Incomplete information</option>
                      <option value="Duplicate request">Duplicate request</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Additional Comments
                    </label>
                    <textarea
                      rows="3"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add rejection comments"
                      value={rejectApplicationForm.comments}
                      onChange={(e) => setRejectApplicationForm({...rejectApplicationForm, comments: e.target.value})}
                    ></textarea>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={closePopup}
                    className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                  >
                    Reject Application
                  </button>
                </div>
              </form>
            )}

            {/* Reply to Memo Form */}
            {popupType === 'reply-memo' && selectedItem && (
              <form onSubmit={handleReplyMemoSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-xs text-slate-500">Replying to:</p>
                    <p className="text-sm font-medium text-slate-900">{selectedItem.title}</p>
                    <p className="text-xs text-slate-500 mt-1">From: {selectedItem.author.name} • {selectedItem.author.department}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Comment <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows="4"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Type your comment or reply..."
                      value={replyMemoForm.comment}
                      onChange={(e) => setReplyMemoForm({...replyMemoForm, comment: e.target.value})}
                      required
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Attachments
                    </label>
                    <div className="flex items-center">
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium cursor-pointer">
                        <Paperclip size={16} />
                        Attach Files
                        <input type="file" multiple className="hidden" />
                      </label>
                      <span className="ml-2 text-xs text-slate-500">Max 5 files, 10MB each</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={closePopup}
                    className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                  >
                    <Send size={16} className="inline mr-2" />
                    Post Reply
                  </button>
                </div>
              </form>
            )}

            {/* Export Report Form */}
            {popupType === 'export-report' && (
              <form onSubmit={handleExportReportSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Report Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={exportReportForm.reportType}
                      onChange={(e) => setExportReportForm({...exportReportForm, reportType: e.target.value})}
                      required
                    >
                      <option value="applications">Applications Report</option>
                      <option value="memos">Memos Report</option>
                      <option value="processing">Processing Time Report</option>
                      <option value="approval">Approval Rate Report</option>
                      <option value="department">Department-wise Summary</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Format
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          className="mr-2"
                          name="format"
                          value="pdf"
                          checked={exportReportForm.format === 'pdf'}
                          onChange={(e) => setExportReportForm({...exportReportForm, format: e.target.value})}
                        />
                        PDF
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          className="mr-2"
                          name="format"
                          value="excel"
                          checked={exportReportForm.format === 'excel'}
                          onChange={(e) => setExportReportForm({...exportReportForm, format: e.target.value})}
                        />
                        Excel
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          className="mr-2"
                          name="format"
                          value="csv"
                          checked={exportReportForm.format === 'csv'}
                          onChange={(e) => setExportReportForm({...exportReportForm, format: e.target.value})}
                        />
                        CSV
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Date Range
                    </label>
                    <select
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
                      value={exportReportForm.dateRange}
                      onChange={(e) => setExportReportForm({...exportReportForm, dateRange: e.target.value})}
                    >
                      <option value="today">Today</option>
                      <option value="this-week">This Week</option>
                      <option value="this-month">This Month</option>
                      <option value="last-month">Last Month</option>
                      <option value="this-quarter">This Quarter</option>
                      <option value="this-year">This Year</option>
                      <option value="custom">Custom Range</option>
                    </select>
                    {exportReportForm.dateRange === 'custom' && (
                      <div className="flex gap-2">
                        <input
                          type="date"
                          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={exportReportForm.startDate}
                          onChange={(e) => setExportReportForm({...exportReportForm, startDate: e.target.value})}
                        />
                        <span className="self-center">to</span>
                        <input
                          type="date"
                          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={exportReportForm.endDate}
                          onChange={(e) => setExportReportForm({...exportReportForm, endDate: e.target.value})}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={exportReportForm.includeAttachments}
                        onChange={(e) => setExportReportForm({...exportReportForm, includeAttachments: e.target.checked})}
                      />
                      <span className="text-sm text-slate-700">Include attachments in report</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={closePopup}
                    className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                  >
                    <Download size={16} className="inline mr-2" />
                    Generate Report
                  </button>
                </div>
              </form>
            )}

            {/* Delete Confirmation */}
            {popupType === 'delete-confirm' && selectedItem && (
              <div className="space-y-6">
                <div className="flex items-center justify-center text-red-600 mb-4">
                  <AlertCircle size={48} />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Confirm Delete</h3>
                  <p className="text-sm text-slate-600">
                    Are you sure you want to delete{' '}
                    <span className="font-medium text-slate-900">
                      {selectedItem.applicationNumber || selectedItem.title}
                    </span>
                    ? This action cannot be undone.
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={closePopup}
                    className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Delete confirmed:', selectedItem);
                      setPopupType(null);
                      setSelectedItem(null);
                    }}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6 space-y-6">
      {/* Popup Modal */}
      <PopupModal />

      {/* Header with 4 Tabs in One Line */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="p-2">
          <div className="flex flex-wrap gap-1 border-b border-slate-200">
            {/* Tab 1: All Applications */}
            <button
              onClick={() => setActiveTab('all-applications')}
              className={`px-4 py-3 font-medium text-sm rounded-t-lg transition-colors flex items-center ${
                activeTab === 'all-applications'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Briefcase className="mr-2" size={16} />
              All Applications ({appliedApplications.length + receivingApplications.length})
            </button>
            
            {/* Tab 2: Applied Applications */}
            <button
              onClick={() => setActiveTab('applied')}
              className={`px-4 py-3 font-medium text-sm rounded-t-lg transition-colors flex items-center ${
                activeTab === 'applied'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileUp className="mr-2" size={16} />
              Applied ({appliedApplications.length})
            </button>
            
            {/* Tab 3: Receive Applications */}
            <button
              onClick={() => setActiveTab('receive')}
              className={`px-4 py-3 font-medium text-sm rounded-t-lg transition-colors flex items-center ${
                activeTab === 'receive'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Inbox className="mr-2" size={16} />
              Receive ({receivingApplications.length})
            </button>
            
            {/* Tab 4: Memos */}
            <button
              onClick={() => setActiveTab('memos')}
              className={`px-4 py-3 font-medium text-sm rounded-t-lg transition-colors flex items-center ${
                activeTab === 'memos'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="mr-2" size={16} />
              Memos ({activeMemos.length})
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
                  activeTab === 'memos' 
                    ? "Search memos, guidelines, or authors..." 
                    : "Search by application number or applicant name..."
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
              {departmentsList.map(dept => (
                <option key={dept.value} value={dept.value}>{dept.label}</option>
              ))}
            </select>
            <select
              className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm min-w-[140px]"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              {activeTab === 'all-applications' ? (
                <>
                  <option value="submitted">Submitted</option>
                  <option value="received">Received</option>
                  <option value="in-progress">In Progress</option>
                  <option value="processing">Processing</option>
                  <option value="pending-approval">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </>
              ) : activeTab === 'applied' ? (
                <>
                  <option value="submitted">Submitted</option>
                  <option value="in-progress">In Progress</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </>
              ) : activeTab === 'receive' ? (
                <>
                  <option value="received">Received</option>
                  <option value="processing">Processing</option>
                  <option value="pending-approval">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </>
              ) : (
                <>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </>
              )}
            </select>
            
            {/* Application Type Filter */}
            {activeTab !== 'memos' && (
              <select
                className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm min-w-[140px]"
                value={selectedApplicationType}
                onChange={(e) => setSelectedApplicationType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="Annual Leave Request">Annual Leave Request</option>
                <option value="Business Trip Request">Business Trip Request</option>
                <option value="Expense Claim">Expense Claim</option>
                <option value="Purchase Request">Purchase Request</option>
                <option value="Maintenance Request">Maintenance Request</option>
                <option value="Remote Work Request">Remote Work Request</option>
                <option value="Expense Reimbursement">Expense Reimbursement</option>
              </select>
            )}

            {/* Memo Type Filter */}
            {activeTab === 'memos' && (
              <select
                className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm min-w-[140px]"
                value={memoType}
                onChange={(e) => setMemoType(e.target.value)}
              >
                <option value="all">All Memo Types</option>
                <option value="policy">Policy</option>
                <option value="process">Process</option>
                <option value="guideline">Guideline</option>
                <option value="announcement">Announcement</option>
              </select>
            )}

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
            >
              <Filter size={16} />
              More Filters
            </button>
            <button 
              onClick={handleExportReport}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              <Download size={16} />
              Export Report
            </button>
            <button 
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
              title="Refresh data"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* View Type Filter */}
        {(activeTab === 'all-applications' || activeTab === 'applied' || activeTab === 'receive') && (
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-700 font-medium">View:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setSelectedView('today')}
                  className={`px-3 py-1.5 text-sm rounded-lg ${selectedView === 'today' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Today's
                </button>
                <button
                  onClick={() => setSelectedView('pending')}
                  className={`px-3 py-1.5 text-sm rounded-lg ${selectedView === 'pending' ? 'bg-amber-100 text-amber-700' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Pending
                </button>
                {(activeTab === 'all-applications' || activeTab === 'my-applications') ? (
                  <button
                    onClick={() => setSelectedView('approved')}
                    className={`px-3 py-1.5 text-sm rounded-lg ${selectedView === 'approved' ? 'bg-green-100 text-green-700' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    Approved
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedView('overdue')}
                    className={`px-3 py-1.5 text-sm rounded-lg ${selectedView === 'overdue' ? 'bg-red-100 text-red-700' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    Overdue
                  </button>
                )}
                <button
                  onClick={() => setSelectedView('all')}
                  className={`px-3 py-1.5 text-sm rounded-lg ${selectedView === 'all' ? 'bg-slate-100 text-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  All
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
                <label className="block text-sm font-medium text-slate-700 mb-2">Priority Level</label>
                <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Processing Time</label>
                <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                  <option value="all">Any Duration</option>
                  <option value="0-1">Within 1 Day</option>
                  <option value="1-3">1-3 Days</option>
                  <option value="3-7">3-7 Days</option>
                  <option value="7+">Over 7 Days</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content based on Active Tab */}
      {activeTab === 'all-applications' && (
        <div className="space-y-6">
          {/* Combined Applications Table - Subject column removed */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  All Applications ({filteredAllApplications.length})
                </h3>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleNewApplication}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    New Application
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium">
                    <Printer size={16} />
                    Print List
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Application No.</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Type</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Applicant</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Department</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Date</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Assigned To</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="py-12 px-6 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <RefreshCw size={32} className="text-slate-400 animate-spin mb-3" />
                          <p className="text-slate-500 font-medium">Loading applications...</p>
                          <p className="text-slate-400 text-sm mt-1">Please wait while we fetch the data</p>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="9" className="py-12 px-6 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <AlertCircle size={32} className="text-red-400 mb-3" />
                          <p className="text-red-600 font-medium">Error loading applications</p>
                          <p className="text-red-500 text-sm mt-1">{error}</p>
                          <button 
                            onClick={() => window.location.reload()}
                            className="mt-3 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium"
                          >
                            Try Again
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredAllApplications.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-12 px-6 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <FileText size={48} className="text-slate-300 mb-3" />
                          <p className="text-slate-500 font-medium">No applications found</p>
                          <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or create a new application</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAllApplications.map((app, index) => (
                    <tr key={`${app.id}-${index}`} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-900">{app.application_number}</div>
                        <div className="text-xs text-slate-500 mt-1">{app.application_type}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          app.employee_id === currentUser.id ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {app.employee_id === currentUser.id ? 'Applied' : 'Receiving'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-slate-900">{app.applicant_name}</p>
                          <p className="text-xs text-slate-500">{app.employee_id} • {app.applicant_designation}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          <Building size={12} />
                          {app.department}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {formatDate(app.submission_date)}
                          </p>
                          <p className="text-xs text-slate-500">{formatTime(app.submission_date)}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {app.assigned_to_name ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-800">
                              {app.assigned_to_name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{app.assigned_to_name}</p>
                              <p className="text-xs text-slate-500">{app.assigned_to_designation}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Dept-wide</span>
                        )}
                        {app.cc_department && (
                          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-700">
                            CC: {app.cc_department}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                            app.status === 'approved' || app.status === 'completed' ? 'bg-green-100 text-green-800' :
                            app.status === 'in-progress' || app.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            app.status === 'submitted' || app.status === 'received' ? 'bg-amber-100 text-amber-800' :
                            app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            app.status === 'pending-approval' ? 'bg-purple-100 text-purple-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {app.status === 'approved' || app.status === 'completed' ? <CheckCircle size={12} /> :
                             app.status === 'in-progress' || app.status === 'processing' ? <Clock size={12} /> :
                             app.status === 'submitted' || app.status === 'received' ? <AlertCircle size={12} /> :
                             app.status === 'rejected' ? <XCircle size={12} /> :
                             app.status === 'pending-approval' ? <AlertCircle size={12} /> :
                             <Inbox size={12} />}
                            {app.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </span>
                          <span className={`text-xs font-medium ${
                            app.priority === 'high' ? 'text-red-600' :
                            app.priority === 'medium' ? 'text-amber-600' :
                            'text-green-600'
                          }`}>
                            {app.priority ? app.priority.charAt(0).toUpperCase() + app.priority.slice(1) + ' Priority' : 'Normal Priority'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleViewDetails(app)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(app)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                          {app.status === 'received' && (
                            <>
                              <button 
                                onClick={() => handleProcess(app)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Process"
                              >
                                <Clock size={16} />
                              </button>
                              <button 
                                onClick={() => handleApprove(app)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                title="Approve"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button 
                                onClick={() => handleReject(app)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Reject"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'my-applications' && (
        <div className="space-y-6">
          {/* Applied Applications Table - Subject column removed */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  My Applications ({filteredAppliedApplications.length})
                </h3>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleNewApplication}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    New Application
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium">
                    <Printer size={16} />
                    Print List
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Application No.</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Applicant</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Department</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Applied On</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppliedApplications.map((app) => (
                    <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-900">{app.applicationNumber}</div>
                        <div className="text-xs text-slate-500 mt-1">{app.applicationType}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-slate-900">{app.applicantName}</p>
                          <p className="text-xs text-slate-500">{app.applicantId} • {app.applicantDesignation}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          <Building size={12} />
                          {app.department}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{formatDate(app.appliedDate)}</p>
                          <p className="text-xs text-slate-500">{app.appliedTime}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                            app.status === 'approved' || app.status === 'completed' ? 'bg-green-100 text-green-800' :
                            app.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            app.status === 'submitted' ? 'bg-amber-100 text-amber-800' :
                            app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {app.status === 'approved' || app.status === 'completed' ? <CheckCircle size={12} /> :
                             app.status === 'in-progress' ? <Clock size={12} /> :
                             app.status === 'submitted' ? <AlertCircle size={12} /> :
                             app.status === 'rejected' ? <XCircle size={12} /> :
                             <Inbox size={12} />}
                            {app.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </span>
                          <span className={`text-xs font-medium ${
                            app.priority === 'high' ? 'text-red-600' :
                            app.priority === 'medium' ? 'text-amber-600' :
                            'text-green-600'
                          }`}>
                            {app.priority.charAt(0).toUpperCase() + app.priority.slice(1)} Priority
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleViewDetails(app)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(app)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredAppliedApplications.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 px-6 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <FileText size={48} className="text-slate-300 mb-3" />
                          <p className="text-slate-500 font-medium">No applications submitted yet</p>
                          <p className="text-slate-400 text-sm mt-1">Click "New Application" to submit your first application</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAppliedApplications.map((app, index) => (
                      <tr key={`${app.id}-${index}`} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 px-6">
                          <div className="font-medium text-slate-900">{app.application_number}</div>
                          <div className="text-xs text-slate-500 mt-1">{app.application_type}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Submitted
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="max-w-xs">
                            <p className="font-medium text-slate-900 truncate">{app.subject}</p>
                            {app.attachments && app.attachments.length > 0 && (
                              <p className="text-xs text-slate-500 mt-1">{app.attachments.length} attachment(s)</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {formatDate(app.submission_date)}
                            </p>
                            <p className="text-xs text-slate-500">{formatTime(app.submission_date)}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                              app.status === 'approved' || app.status === 'completed' ? 'bg-green-100 text-green-800' :
                              app.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                              app.status === 'submitted' ? 'bg-amber-100 text-amber-800' :
                              app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-slate-100 text-slate-800'
                            }`}>
                              {app.status === 'approved' || app.status === 'completed' ? <CheckCircle size={12} /> :
                               app.status === 'in-progress' ? <Clock size={12} /> :
                               app.status === 'submitted' ? <AlertCircle size={12} /> :
                               app.status === 'rejected' ? <XCircle size={12} /> :
                               <Inbox size={12} />}
                              {app.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleViewDetails(app)}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium"
                            >
                              <Eye size={12} className="inline mr-1" />
                              View
                            </button>
                            <button className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                              <Edit size={12} className="inline mr-1" />
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assigned-to-me' && (
        <div className="space-y-6">
          {/* Receiving Applications Table - Subject column removed */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Assigned to Me ({filteredAssignedToMeApplications.length})
                </h3>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium">
                    <Printer size={16} />
                    Print List
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Application No.</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Type</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Applicant</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Department</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Received On</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceivingApplications.map((app) => (
                    <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-900">{app.applicationNumber}</div>
                        <div className="text-xs text-slate-500 mt-1">{app.applicationType}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-slate-900">{app.applicantName}</p>
                          <p className="text-xs text-slate-500">{app.applicantDesignation}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          <Building size={12} />
                          {app.department}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{formatDate(app.receivedDate)}</p>
                          <p className="text-xs text-slate-500">{app.receivedTime}</p>
                          <p className="text-xs text-slate-500 mt-1">Due: {formatDate(app.dueDate)}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAssignedToMeApplications.map((app, index) => (
                      <tr key={`${app.id}-${index}`} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 px-6">
                          <div className="font-medium text-slate-900">{app.application_number}</div>
                          <div className="text-xs text-slate-500 mt-1">{app.application_type}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <Building size={12} />
                            {app.application_type}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-slate-900">{app.applicant_name}</p>
                            <p className="text-xs text-slate-500">{app.employee_id}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm font-medium text-slate-900">{app.subject}</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm font-medium text-slate-900">{formatDate(app.submission_date)}</p>
                          <p className="text-xs text-slate-500">{formatTime(app.submission_date)}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                            app.status === 'approved' ? 'bg-green-100 text-green-800' :
                            app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            app.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            app.status === 'withdrawn' ? 'bg-orange-100 text-orange-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {app.status === 'approved' ? <CheckCircle size={12} /> :
                             app.status === 'pending' ? <Clock size={12} /> :
                             app.status === 'rejected' ? <XCircle size={12} /> :
                             <AlertCircle size={12} />}
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                          {app.isMyTurn && (
                            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                              Your Turn
                            </span>
                          )}
                          {app.current_step > app.total_steps && app.status !== 'approved' && app.status !== 'rejected' && (
                            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              HR Final
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <button 
                            onClick={() => handleViewDetails(app)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => handleProcess(app)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Process"
                          >
                            <Clock size={16} />
                          </button>
                          <button 
                            onClick={() => handleApprove(app)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button 
                            onClick={() => handleReject(app)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Reject"
                          >
                            <XCircle size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}




      {activeTab === 'memos' && (
        <div className="space-y-6">
          {/* Memos Grid - Edit button removed */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMemos.map((memo) => (
              <div key={memo.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      memo.type === 'process' ? 'bg-blue-100 text-blue-800' :
                      memo.type === 'guideline' ? 'bg-green-100 text-green-800' :
                      memo.type === 'policy' ? 'bg-purple-100 text-purple-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {memo.type.charAt(0).toUpperCase() + memo.type.slice(1)}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 ml-2">
                      {memo.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      memo.priority === 'high' ? 'bg-red-100 text-red-800' :
                      memo.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {memo.priority}
                    </span>
                  </div>
                </div>
                
                <h4 className="font-semibold text-slate-900 text-lg mb-3">{memo.title}</h4>
                <p className="text-sm text-slate-600 mb-4 line-clamp-3">{memo.summary}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                      <span className="text-sm font-medium text-blue-700">{memo.author.avatar}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{memo.author.name}</p>
                      <p className="text-xs text-slate-500">{memo.author.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Created</p>
                    <p className="text-sm font-medium text-slate-900">{formatDate(memo.createdDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center text-slate-600">
                      <Eye size={14} className="mr-1" />
                      {memo.readers}
                    </span>
                    <span className="flex items-center text-slate-600">
                      <MessageSquare size={14} className="mr-1" />
                      {memo.comments}
                    </span>
                    {memo.attachments && memo.attachments.length > 0 && (
                      <span className="flex items-center text-slate-600">
                        <FileText size={14} className="mr-1" />
                        {memo.attachments.length}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleViewDetails(memo)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => handleReplyToMemo(memo)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Reply"
                    >
                      <MessageSquare size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* New Memo Button */}
          <div className="flex justify-end">
            <button 
              onClick={handleNewMemo}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              New Memo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

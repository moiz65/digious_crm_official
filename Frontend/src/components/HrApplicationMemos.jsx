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

// Applied Applications (Applications submitted by users)
const appliedApplications = [
  {
    id: 201,
    applicationNumber: "APP-2026-201",
    department: "Human Resources",
    applicantName: "John Doe",
    applicantId: "EMP-001",
    applicantDesignation: "HR Manager",
    applicationType: "Annual Leave Request",
    subject: "Annual Leave Application - 2 Weeks",
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
    subject: "Business Trip - Client Meeting in NYC",
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
    subject: "New Office Equipment Purchase",
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
    subject: "Monthly Team Lunch Expenses",
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
    subject: "Server Room AC Repair",
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

// Receiving Applications (Applications received for processing)
const receivingApplications = [
  {
    id: 1,
    applicationNumber: "APP-2026-001",
    department: "Human Resources",
    applicantName: "John Doe",
    applicantDesignation: "HR Manager",
    applicationType: "Annual Leave Request",
    subject: "Annual Leave Application - 2 Weeks",
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
    subject: "Business Trip - Client Meeting in NYC",
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
    subject: "New Office Equipment Purchase",
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
    subject: "Monthly Team Lunch Expenses",
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
    subject: "Server Room AC Repair",
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
  const [viewDetailsModal, setViewDetailsModal] = useState(null);
  const [selectedView, setSelectedView] = useState('today');
  const [memoType, setMemoType] = useState('all');
  const [newApplicationForm, setNewApplicationForm] = useState({
    department: '',
    applicationType: '',
    subject: '',
    description: '',
    priority: 'medium',
    attachments: []
  });
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  const [showNewMemoModal, setShowNewMemoModal] = useState(false);
  
  // Get current user's employee ID from JWT token
  const [currentEmployeeId, setCurrentEmployeeId] = useState(null);
  
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
        const response = await fetch('http://localhost:5000/api/v1/applications/all', {
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

  // Filter all applications (combined applied and receiving)
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
        app.application_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.subject?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesDepartment && matchesStatus && matchesType && matchesSearch;
    });
  }, [applications, selectedDepartment, selectedStatus, selectedApplicationType, searchQuery, selectedView]);

  // Filter applied applications
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
        app.application_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.subject?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesDepartment && matchesStatus && matchesType && matchesSearch;
    });
  }, [applications, currentUser.id, selectedDepartment, selectedStatus, selectedApplicationType, searchQuery, selectedView]);

  // Filter receiving applications
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
        app.application_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.subject?.toLowerCase().includes(searchQuery.toLowerCase());
      
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

  // Handle new application form submission
  const handleNewApplicationSubmit = async (applicationData) => {
    try {
      const payload = {
        department: applicationData.department,
        application_type: applicationData.type,
        subject: applicationData.type,
        description: applicationData.description || applicationData.notes,
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
      alert(`Application ${result.data.application_number} created successfully!`);
      setShowNewAppModal(false);
      setActiveTab('my-applications');
      // Reload to refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error creating application:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Handle new memo form submission
  const handleNewMemoSubmit = (memoData) => {
    console.log('New memo submitted:', memoData);
    setShowNewMemoModal(false);
  };

  // Handle mark as read
  const handleMarkAsRead = (memoId) => {
    console.log('Mark memo as read:', memoId);
  };

  // Handle view details
  const handleViewDetails = (item) => {
    setViewDetailsModal(item);
  };

  // Close view modal
  const closeViewModal = () => {
    setViewDetailsModal(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6 space-y-6">
      {/* Header with 5 Tabs in One Line */}
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
            
            {/* Tab 2: My Applications */}
            <button
              onClick={() => setActiveTab('my-applications')}
              className={`px-4 py-3 font-medium text-sm rounded-t-lg transition-colors flex items-center ${
                activeTab === 'my-applications'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <User className="mr-2" size={16} />
              My Applications ({appliedApplications.length})
            </button>
            
            {/* Tab 3: Assigned to Me */}
            <button
              onClick={() => setActiveTab('assigned-to-me')}
              className={`px-4 py-3 font-medium text-sm rounded-t-lg transition-colors flex items-center ${
                activeTab === 'assigned-to-me'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="mr-2" size={16} />
              Assigned to Me ({filteredAssignedToMeApplications.length})
            </button>

            

            
            {/* Tab 5: Memos */}
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
                    : "Search by application number, applicant, or subject..."
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
              ) : activeTab === 'my-applications' ? (
                <>
                  <option value="submitted">Submitted</option>
                  <option value="in-progress">In Progress</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
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
                <option value="Casual Leave Request">Casual Leave Request</option>
                <option value="Sick Leave Request">Sick Leave Request</option>
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
            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
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
        {(activeTab === 'all-applications' || activeTab === 'my-applications') && (
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
          {/* Combined Applications Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  All Applications ({filteredAllApplications.length})
                </h3>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowNewAppModal(true)}
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
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Subject</th>
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
                        <div className="max-w-xs">
                          <p className="font-medium text-slate-900 truncate">{app.subject}</p>
                          {app.documents && app.document_count > 0 && (
                            <p className="text-xs text-slate-500 mt-1">{app.document_count} attachment(s)</p>
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
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium"
                          >
                            <Eye size={12} className="inline mr-1" />
                            View
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

      {activeTab === 'my-applications' && (
        <div className="space-y-6">
          {/* My Applications - Combined HR's own submissions and applications */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  My Applications ({filteredAppliedApplications.length})
                </h3>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowNewAppModal(true)}
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
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Subject</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Submitted Date</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-12 px-6 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <RefreshCw size={32} className="text-slate-400 animate-spin mb-3" />
                          <p className="text-slate-500 font-medium">Loading applications...</p>
                          <p className="text-slate-400 text-sm mt-1">Please wait while we fetch the data</p>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="6" className="py-12 px-6 text-center">
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
          {/* Assigned to Me - Applications delegated to current HR manager */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Assigned to Me ({filteredAssignedToMeApplications.length})
                </h3>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium">
                  <Printer size={16} />
                  Print List
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Application No.</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Type</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Applicant</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Subject</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Date</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-12 px-6 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <RefreshCw size={32} className="text-slate-400 animate-spin mb-3" />
                          <p className="text-slate-500 font-medium">Loading applications...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredAssignedToMeApplications.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 px-6 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <FileText size={48} className="text-slate-300 mb-3" />
                          <p className="text-slate-500 font-medium">No applications assigned to you</p>
                          <p className="text-slate-400 text-sm mt-1">Applications will appear here when they are assigned to you</p>
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
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium"
                          >
                            <Eye size={12} className="inline mr-1" />
                            View
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
          {/* Memos Grid */}
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
                  <button 
                    onClick={() => handleViewDetails(memo)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* New Memo Button */}
          <div className="flex justify-end">
            <button 
              onClick={() => setShowNewMemoModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              New Memo
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showNewAppModal && (
        <NewApplicationModal
          onClose={() => setShowNewAppModal(false)}
          onSave={handleNewApplicationSubmit}
        />
      )}

      {showNewMemoModal && (
        <NewMemoModal
          onClose={() => setShowNewMemoModal(false)}
          onSave={handleNewMemoSubmit}
        />
      )}

      {viewDetailsModal && (
        <ApplicationDetailModal
          application={viewDetailsModal}
          onClose={closeViewModal}
          onMarkAsRead={handleMarkAsRead}
          isMemo={activeTab === 'memos'}
          currentEmployeeId={currentEmployeeId}
        />
      )}
    </div>
  );
}

// New Application Modal for HR
const NewApplicationModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    department: '',
    applicationType: '',
    customSubject: '',
    description: '',
    priority: 'medium',
    assignTo: 'person',
    attachments: [],
    leaveFromDate: '',
    leaveToDate: ''
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  // Multi-assign states
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeSearchResults, setEmployeeSearchResults] = useState([]);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

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

  // Employee search handler
  const handleEmployeeSearch = async (query) => {
    setEmployeeSearch(query);
    if (query.length < 2) {
      setEmployeeSearchResults([]);
      setShowEmployeeDropdown(false);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/v1/applications/employees/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        const filtered = (result.data || []).filter(
          emp => !selectedEmployees.some(sel => sel.employee_id === emp.employee_id)
        );
        setEmployeeSearchResults(filtered);
        setShowEmployeeDropdown(true);
      }
    } catch (err) {
      console.error('Employee search error:', err);
    }
  };

  const handleSelectEmployee = (emp) => {
    setSelectedEmployees(prev => [...prev, emp]);
    setEmployeeSearch('');
    setEmployeeSearchResults([]);
    setShowEmployeeDropdown(false);
  };

  const handleRemoveEmployee = (employeeId) => {
    setSelectedEmployees(prev => prev.filter(e => e.employee_id !== employeeId));
  };

  const handleClearAllEmployees = () => {
    setSelectedEmployees([]);
  };

  const handleMoveEmployee = (index, direction) => {
    const newList = [...selectedEmployees];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= newList.length) return;
    [newList[index], newList[swapIndex]] = [newList[swapIndex], newList[index]];
    setSelectedEmployees(newList);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const isOtherSelected = formData.applicationType === 'Other';
    const subjectValue = isOtherSelected ? formData.customSubject : formData.applicationType;
    
    if (!formData.department || !formData.applicationType || (isOtherSelected && !formData.customSubject) || !formData.description) {
      alert('Please fill all required fields marked with *');
      return;
    }

    // Build assignees payload from selectedEmployees
    const assigneesPayload = selectedEmployees.length > 0
      ? selectedEmployees.map(emp => ({
          employee_id: emp.employee_id,
          employee_name: emp.name || emp.employee_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim()
        }))
      : [];

    const applicationData = {
      department: formData.department,
      type: subjectValue,
      description: formData.description,
      priority: formData.priority,
      assignees: assigneesPayload,
      assignedToEmployeeId: selectedEmployees.length > 0 ? selectedEmployees[0].employee_id : null,
      assignedToName: selectedEmployees.length > 0 ? (selectedEmployees[0].name || selectedEmployees[0].employee_name) : null,
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

  // Reset form
  const resetForm = () => {
    setFormData({
      department: '',
      applicationType: '',
      customSubject: '',
      description: '',
      priority: 'medium',
      assignTo: 'person',
      attachments: []
    });
    setUploadedFiles([]);
    setSelectedEmployees([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Get application types for selected department
  const getApplicationTypes = () => {
    if (!formData.department) return [];
    return departmentApplicationTypes[formData.department] || [];
  };

  const isOtherSelected = formData.applicationType === 'Other';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Submit New Application</h3>
          <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
            <select 
              value={formData.department}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                department: e.target.value,
                applicationType: '',
                customSubject: ''
              }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl"
            >
              <option value="">Select Department</option>
              {departmentsList.map(dept => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <select 
              value={formData.applicationType}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                applicationType: e.target.value,
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
          </div>

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
          {formData.applicationType && formData.applicationType.includes('Leave Request') && (
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select 
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          {/* Assign To - Multi Employee Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To (Approval Chain)</label>
            <div className="relative">
              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                <Search className="h-4 w-4 text-gray-400 ml-3" />
                <input
                  type="text"
                  value={employeeSearch}
                  onChange={(e) => handleEmployeeSearch(e.target.value)}
                  onFocus={() => employeeSearchResults.length > 0 && setShowEmployeeDropdown(true)}
                  placeholder="Search employees to assign..."
                  className="w-full px-3 py-2 border-0 focus:ring-0 focus:outline-none"
                />
              </div>
              {showEmployeeDropdown && employeeSearchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {employeeSearchResults.map(emp => (
                    <button
                      key={emp.employee_id}
                      type="button"
                      onClick={() => handleSelectEmployee(emp)}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3 border-b last:border-b-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                        {(emp.name || emp.first_name || '?').charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim()}</p>
                        <p className="text-xs text-gray-500">{emp.employee_id} {emp.designation ? `• ${emp.designation}` : ''}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Employees - Approval Chain */}
            {selectedEmployees.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Approval Chain ({selectedEmployees.length} {selectedEmployees.length === 1 ? 'person' : 'people'})</p>
                  {selectedEmployees.length > 1 && (
                    <button type="button" onClick={handleClearAllEmployees} className="text-xs text-red-500 hover:text-red-700">Clear All</button>
                  )}
                </div>
                {selectedEmployees.map((emp, index) => (
                  <div key={emp.employee_id} className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-purple-200 flex items-center justify-center text-xs font-bold text-purple-800 flex-shrink-0">
                      {(emp.name || emp.employee_name || '?').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{emp.name || emp.employee_name}</p>
                      <p className="text-xs text-gray-500">{emp.employee_id}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button type="button" onClick={() => handleMoveEmployee(index, -1)} disabled={index === 0}
                        className="p-1 hover:bg-purple-100 rounded disabled:opacity-30">
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button type="button" onClick={() => handleMoveEmployee(index, 1)} disabled={index === selectedEmployees.length - 1}
                        className="p-1 hover:bg-purple-100 rounded disabled:opacity-30">
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      <button type="button" onClick={() => handleRemoveEmployee(emp.employee_id)}
                        className="p-1 hover:bg-red-100 rounded text-red-500">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    {index < selectedEmployees.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-purple-400 flex-shrink-0" />
                    )}
                  </div>
                ))}
                {/* HR Final Approval indicator - since HR creates this, last assignee is final */}
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-6 h-6 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {selectedEmployees.length + 1}
                  </div>
                  <div className="w-7 h-7 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold text-amber-800 flex-shrink-0">
                    HR
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">HR Final Approval</p>
                    <p className="text-xs text-gray-400">Auto-added as last step for non-HR applications</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supporting Documents (Optional)</label>
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

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition duration-200"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={
                !formData.department || 
                !formData.applicationType || 
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

// New Memo Modal for HR
const NewMemoModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Announcement',
    priority: 'medium',
    content: '',
    recipients: ['HR Department', 'Team Lead'],
    attachments: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const memoData = {
      title: formData.title,
      category: formData.category,
      priority: formData.priority,
      summary: formData.content.substring(0, 100) + '...',
      content: formData.content,
      attachments: formData.attachments.length,
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
                <option value="All Departments">All Departments</option> 
              </select>
            </div>
          </div>

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

// Application/Memo Detail Modal for HR
const ApplicationDetailModal = ({ application, onClose, onMarkAsRead, isMemo, currentEmployeeId }) => {
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferDepartment, setTransferDepartment] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Multi-assign awareness
  const myAssignee = application.assignees?.find(a => String(a.employee_id) === String(currentEmployeeId));
  const isAssignee = !!myAssignee || (currentEmployeeId && String(application.assigned_to_employee_id) === String(currentEmployeeId));
  const isMyTurn = myAssignee ? application.current_step === myAssignee.step_order : false;
  const isHrFinalApproval = application.current_step > application.total_steps && application.status !== 'approved' && application.status !== 'rejected';
  const isPending = application.status === 'pending';
  const canWithdraw = isAssignee && !isPending;
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'submitted':
      case 'received': return 'bg-yellow-100 text-yellow-800';
      case 'approved':
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'in-progress':
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending-approval': return 'bg-amber-100 text-amber-800';
      case 'withdrawn': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
      case 'submitted': return 'Submitted';
      case 'received': return 'Received';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'in-progress':
      case 'processing': return 'In Progress';
      case 'pending-approval': return 'Pending Approval';
      case 'completed': return 'Completed';
      case 'withdrawn': return 'Withdrawn';
      default: return 'Unknown';
    }
  };

  // Allow HR to change priority
  const handleChangePriority = async (newPriority) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/v1/applications/${application.id}/priority`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ priority: newPriority })
      });

      if (response.ok) {
        alert('Priority updated');
        // local update
        application.priority = newPriority;
        onClose();
        window.location.reload();
      } else {
        const error = await response.json();
        alert('Failed to update priority: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating priority:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleAction = (action) => {
    switch (action) {
      case 'approve':
        setShowApproveForm(true);
        setShowRejectForm(false);
        break;
      case 'reject':
        setShowRejectForm(true);
        setShowApproveForm(false);
        break;
      case 'in-progress':
        handleMarkInProgress();
        break;
      case 'transfer':
        setShowTransferModal(true);
        break;
      case 'withdraw':
        handleWithdrawAssignment();
        break;
      default:
        break;
    }
  };

  const handleApproveApplication = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/v1/applications/${application.id}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'approved', notes: approveNotes || '' })
      });

      if (response.ok) {
        const result = await response.json();
        const msg = result.message || `Application ${application.application_number} has been approved.`;
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
      const response = await fetch(`http://localhost:5000/api/v1/applications/${application.id}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejection_reason: rejectReason })
      });

      if (response.ok) {
        alert(`Application ${application.application_number} has been rejected.`);
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

  const handleMarkInProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/v1/applications/${application.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'in-progress' })
      });

      if (response.ok) {
        alert(`Application ${application.application_number} is now marked as In Progress.`);
        onClose();
        window.location.reload();
      } else {
        const error = await response.json();
        alert('Failed to update status: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleWithdrawAssignment = async () => {
    if (!window.confirm('Are you sure you want to withdraw your assignment from this application?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/v1/applications/${application.id}/withdraw-assignment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Assignment withdrawn successfully.');
        onClose();
        window.location.reload();
      } else {
        const error = await response.json();
        alert('Failed to withdraw: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error withdrawing assignment:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleTransfer = () => {
    if (!transferDepartment) {
      alert('Please select a department to transfer to.');
      return;
    }
    
    console.log(`Transferring application ${application.id} to ${transferDepartment}`, transferNotes);
    alert(`Application ${application.application_number} has been transferred to ${transferDepartment}.`);
    setShowTransferModal(false);
    onClose();
  };

  // Only show action buttons for receiving applications (not memos)
  // For multi-assign: show if it's my turn, or if I'm HR and it's HR final approval time
  const shouldShowActions = !isMemo && (
    application.status !== 'approved' && 
    application.status !== 'rejected' && 
    application.status !== 'withdrawn' && (
      isMyTurn || 
      isHrFinalApproval || 
      application.status === 'received' || 
      application.status === 'processing' || 
      application.status === 'pending-approval' || 
      application.status === 'pending' ||
      application.status === 'in-progress'
    )
  );

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isMemo ? application.title : application.subject}
              </h3>
              <p className="text-sm text-gray-600">
                {isMemo ? application.memoNumber : application.application_number}
              </p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className={`p-4 rounded-xl ${getStatusColor(application.status)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {application.status === 'approved' && <CheckCircle className="h-6 w-6" />}
                      {application.status === 'rejected' && <AlertCircle className="h-6 w-6" />}
                      {application.status === 'pending' && <Clock className="h-6 w-6" />}
                      {application.status === 'in-progress' && <Eye className="h-6 w-6" />}
                      <div>
                        <h4 className="font-semibold">Status: {getStatusText(application.status)}</h4>
                        <p className="text-sm opacity-90">
                          {isMemo ? `Sent on ${application.date}` : `Submitted on ${application.submission_date ? formatDate(application.submission_date) : 'N/A'}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">{isMemo ? 'Memo Details' : 'Application Details'}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {!isMemo && (
                      <>
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <p className="text-sm text-gray-500 mb-1">Department</p>
                          <p className="font-medium">{application.department}</p>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <p className="text-sm text-gray-500 mb-1">Application Type</p>
                          <p className="font-medium">{application.application_type}</p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl">
                          <p className="text-sm text-gray-500 mb-1">Priority</p>
                          <div className="flex items-center gap-2">
                            <p className="font-medium capitalize">{application.priority || 'medium'}</p>
                            <select
                              value={application.priority || 'medium'}
                              onChange={(e) => handleChangePriority(e.target.value)}
                              className="ml-auto px-2 py-1 border rounded bg-white text-sm"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="urgent">Urgent</option>
                            </select>
                          </div>
                        </div>
                      </>
                    )}
                    
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">
                        {isMemo ? 'Memo Number' : 'Application Number'}
                      </p>
                      <p className="font-medium">{isMemo ? application.memoNumber : application.application_number}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">
                        {isMemo ? 'Date' : 'Submission Date'}
                      </p>
                      <p className="font-medium">{isMemo ? application.date : (application.submission_date ? formatDate(application.submission_date) : 'N/A')}</p>
                    </div>
                  </div>

                  {/* Approval Chain / Assigned To */}
                  {!isMemo && application.assignees && application.assignees.length > 0 ? (
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                      <p className="text-sm text-purple-600 font-medium mb-3">
                        <Users className="h-4 w-4 inline mr-1" />
                        Approval Chain ({application.assignees.length} {application.assignees.length === 1 ? 'step' : 'steps'})
                      </p>
                      <div className="space-y-2">
                        {application.assignees.map((assignee, index) => {
                          const isCurrent = application.current_step === assignee.step_order;
                          const isApproved = assignee.status === 'approved';
                          const isRejected = assignee.status === 'rejected';
                          
                          return (
                            <div key={assignee.id || index} className={`flex items-center gap-3 p-2 rounded-lg ${
                              isCurrent ? 'bg-purple-100 border border-purple-300' : 
                              isApproved ? 'bg-green-50 border border-green-200' : 
                              isRejected ? 'bg-red-50 border border-red-200' : 
                              'bg-white border border-gray-100'
                            }`}>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                isApproved ? 'bg-green-500 text-white' : 
                                isRejected ? 'bg-red-500 text-white' : 
                                isCurrent ? 'bg-purple-600 text-white' : 
                                'bg-gray-300 text-gray-600'
                              }`}>
                                {isApproved ? <Check className="h-3 w-3" /> : isRejected ? <X className="h-3 w-3" /> : index + 1}
                              </div>
                              <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-xs font-bold text-purple-800 flex-shrink-0">
                                {assignee.employee_name?.split(' ').map(n => n[0]).join('') || '?'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{assignee.employee_name}</p>
                                <p className="text-xs text-gray-500">
                                  {isApproved ? 'Approved' : isRejected ? 'Rejected' : isCurrent ? 'Awaiting action' : 'Pending'}
                                  {assignee.action_date ? ` • ${new Date(assignee.action_date).toLocaleDateString()}` : ''}
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
                            isHrFinalApproval
                              ? 'bg-amber-50 border border-amber-300' 
                              : application.status === 'approved' ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-100'
                          }`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              application.status === 'approved' ? 'bg-green-500 text-white' : 
                              isHrFinalApproval ? 'bg-amber-500 text-white' : 
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
                                 isHrFinalApproval ? 'Awaiting HR final approval' : 'Final Approval'}
                              </p>
                            </div>
                            {isHrFinalApproval && (
                              <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full flex-shrink-0">Current</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : !isMemo && (application.assigned_to_name || application.cc_department) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {application.assigned_to_name && (
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                          <p className="text-sm text-purple-600 font-medium mb-2">Assigned To</p>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-purple-200 flex items-center justify-center text-sm font-bold text-purple-800">
                              {application.assigned_to_name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{application.assigned_to_name}</p>
                              {application.assigned_to_designation && (
                                <p className="text-xs text-gray-600">{application.assigned_to_designation} • {application.assigned_to_department}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      {application.cc_department && (
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                          <p className="text-sm text-amber-700 font-medium mb-2">CC (Carbon Copy)</p>
                          <p className="font-medium text-amber-800">{application.cc_department} Department</p>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* CC Department for multi-assign */}
                  {!isMemo && application.assignees?.length > 0 && application.cc_department && (
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                      <p className="text-sm text-amber-700">
                        <span className="font-medium">CC:</span> {application.cc_department} Department
                      </p>
                    </div>
                  )}

                  {isMemo ? (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 mb-2">Content</p>
                      <p className="text-gray-900 whitespace-pre-line">{application.summary || application.content}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 mb-2">Description</p>
                      <p className="text-gray-900 whitespace-pre-line">{application.description}</p>
                    </div>
                  )}

                  {!isMemo && application.approved_by && (
                    <div className="bg-green-50 p-4 rounded-xl">
                      <p className="text-sm text-green-600 font-medium mb-1">Approved By</p>
                      <p className="font-medium">{application.approved_by}</p>
                      {application.approved_date && (
                        <p className="text-sm text-green-600 mt-1">On {formatDate(application.approved_date)}</p>
                      )}
                    </div>
                  )}

                  {!isMemo && (application.rejection_reason || application.rejectionReason) && (
                    <div className="bg-red-50 p-4 rounded-xl">
                      <p className="text-sm text-red-600 font-medium mb-1">Reason for Rejection</p>
                      <p className="font-medium">{application.rejection_reason || application.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {/* Action Buttons Section - Only for receiving applications */}
                {shouldShowActions && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Quick Actions</h4>
                    
                    {/* Multi-assign context indicator */}
                    {application.assignees?.length > 0 && (
                      <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-700">
                          {isMyTurn ? '🟢 It\'s your turn to review' : 
                           isHrFinalApproval ? '🟡 Awaiting your HR final approval' :
                           '⏳ Waiting for other assignees'}
                        </p>
                      </div>
                    )}
                    
                    {/* Inline Approve Form */}
                    {showApproveForm && (
                      <div className="mb-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                        <h5 className="text-sm font-semibold text-green-800 mb-2">
                          {isHrFinalApproval ? 'HR Final Approval' : 
                           isMyTurn && application.is_multi_assign ? 'Approve & Forward to Next' : 
                           'Approve Application'}
                        </h5>
                        <textarea
                          value={approveNotes}
                          onChange={(e) => setApproveNotes(e.target.value)}
                          rows="3"
                          placeholder="Add approval notes (optional)..."
                          className="w-full px-3 py-2 border border-green-300 rounded-lg text-sm focus:ring-2 focus:ring-green-400 focus:border-green-400"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={handleApproveApplication}
                            disabled={actionLoading}
                            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                          >
                            {actionLoading ? 'Processing...' : 'Confirm Approve'}
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
                            {actionLoading ? 'Processing...' : 'Confirm Reject'}
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
                      <div className="grid grid-cols-1 gap-2">
                        {/* Withdraw Assignment Button */}
                        {canWithdraw && (
                          <button 
                            onClick={() => handleAction('withdraw')}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-700 border border-orange-200 rounded-xl hover:bg-orange-100 transition-colors font-medium"
                          >
                            <X className="h-4 w-4" />
                            Withdraw Assignment
                          </button>
                        )}
                        
                        {/* Approve - show when it's my turn or HR final approval */}
                        {(isMyTurn || isHrFinalApproval || !application.assignees?.length) && (
                          <button 
                            onClick={() => handleAction('approve')}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 transition-colors font-medium"
                          >
                            <CheckCircle className="h-4 w-4" />
                            {isHrFinalApproval ? 'Give HR Final Approval' : 
                             isMyTurn && application.is_multi_assign ? 'Approve & Forward' : 'Approve Application'}
                          </button>
                        )}
                        
                        {/* Reject - show when it's my turn or HR final approval */}
                        {(isMyTurn || isHrFinalApproval || !application.assignees?.length) && (
                          <button 
                            onClick={() => handleAction('reject')}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-100 transition-colors font-medium"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject Application
                          </button>
                        )}
                        
                        <button 
                          onClick={() => handleAction('in-progress')}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                        >
                          <Clock className="h-4 w-4" />
                          Mark as In Progress
                        </button>
                        
                        <button 
                          onClick={() => handleAction('transfer')}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Transfer to Department
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Existing Documents Section */}
                {!isMemo && application.attachments && application.attachments.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Supporting Documents</h4>
                    <div className="space-y-2">
                      {application.attachments.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">{doc}</p>
                            </div>
                          </div>
                          <button className="p-1 hover:bg-gray-200 rounded">
                            <Download className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Actions Section */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Additional Actions</h4>
                  <div className="space-y-2">
                    {!isMemo && (
                      <>
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100">
                          <Download className="h-4 w-4" />
                          Download All Documents
                        </button>
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100">
                          <Printer className="h-4 w-4" />
                          Print Application
                        </button>
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100">
                          <Share2 className="h-4 w-4" />
                          Share Application
                        </button>
                      </>
                    )}
                    {isMemo && (
                      <>
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100">
                          <Download className="h-4 w-4" />
                          Download Memo
                        </button>
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100">
                          <Check className="h-4 w-4" />
                          Mark as Complete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Transfer Application</h3>
              <button onClick={() => setShowTransferModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transfer to Department *
                </label>
                <select 
                  value={transferDepartment}
                  onChange={(e) => setTransferDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                >
                  <option value="">Select Department</option>
                  {departmentsList
                    .filter(dept => dept.value !== application.department)
                    .map(dept => (
                      <option key={dept.value} value={dept.value}>
                        {dept.label}
                      </option>
                    ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transfer Notes (Optional)
                </label>
                <textarea 
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  rows="3"
                  placeholder="Add notes about why this application is being transferred..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleTransfer}
                  disabled={!transferDepartment}
                  className="flex-1 px-4 py-3 text-white bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Transfer Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
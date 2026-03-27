import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const HrManageReport = () => {
  const [activeTab, setActiveTab] = useState('applications');
  const [filters, setFilters] = useState({
    department: 'all',
    dateRange: 'current_month',
    employee: 'all',
    status: 'all',
    priority: 'all',
    type: 'all'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [applicationsData, setApplicationsData] = useState([]);
  const [memosData, setMemosData] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState('individual');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Departments
  const departments = ['all', 'HR', 'IT', 'Sales', 'Marketing', 'Operations', 'Production', 'Finance'];
  
  // Employees
  const employees = [
    { id: 'EMP001', name: 'John Smith', department: 'HR', email: 'john.smith@company.com' },
    { id: 'EMP002', name: 'Sarah Johnson', department: 'IT', email: 'sarah.j@company.com' },
    { id: 'EMP003', name: 'Michael Brown', department: 'Sales', email: 'michael.b@company.com' },
    { id: 'EMP004', name: 'Emily Davis', department: 'Marketing', email: 'emily.d@company.com' },
    { id: 'EMP005', name: 'Robert Wilson', department: 'Operations', email: 'robert.w@company.com' },
    { id: 'EMP006', name: 'Lisa Anderson', department: 'Production', email: 'lisa.a@company.com' },
    { id: 'EMP007', name: 'David Lee', department: 'HR', email: 'david.l@company.com' },
    { id: 'EMP008', name: 'Jennifer Taylor', department: 'IT', email: 'jennifer.t@company.com' },
    { id: 'EMP009', name: 'William Clark', department: 'Finance', email: 'william.c@company.com' },
    { id: 'EMP010', name: 'Amanda White', department: 'Sales', email: 'amanda.w@company.com' }
  ];

  // Sample applications data
  const sampleApplicationsData = [
    {
      id: 1,
      applicationNumber: 'APP-2024-001',
      employeeId: 'EMP001',
      employeeName: 'John Smith',
      department: 'HR',
      applicationType: 'Leave Application',
      subject: 'Annual Leave Request - 2 Weeks',
      appliedDate: '2024-01-10',
      status: 'approved',
      priority: 'high',
      approvedBy: 'Sarah Manager',
      approvedDate: '2024-01-12',
      notes: 'Vacation planning',
      attachments: ['leave_form.pdf']
    },
    {
      id: 2,
      applicationNumber: 'APP-2024-002',
      employeeId: 'EMP003',
      employeeName: 'Michael Brown',
      department: 'Sales',
      applicationType: 'Travel Request',
      subject: 'Client Meeting in New York',
      appliedDate: '2024-01-08',
      status: 'pending',
      priority: 'medium',
      estimatedCost: '$2,500',
      notes: 'Important quarterly review',
      attachments: ['travel_request.pdf', 'flight_quotes.pdf']
    },
    {
      id: 3,
      applicationNumber: 'APP-2024-003',
      employeeId: 'EMP004',
      employeeName: 'Emily Davis',
      department: 'Marketing',
      applicationType: 'Expense Claim',
      subject: 'Conference Expenses - Digital Summit',
      appliedDate: '2024-01-05',
      status: 'approved',
      priority: 'normal',
      approvedBy: 'Robert Director',
      approvedDate: '2024-01-07',
      amount: '$1,200',
      notes: 'Team training conference',
      attachments: ['expense_report.pdf', 'receipts.pdf']
    },
    {
      id: 4,
      applicationNumber: 'APP-2024-004',
      employeeId: 'EMP008',
      employeeName: 'Jennifer Taylor',
      department: 'IT',
      applicationType: 'Equipment Request',
      subject: 'New Laptop - Development Work',
      appliedDate: '2024-01-12',
      status: 'processing',
      priority: 'high',
      estimatedCost: '$1,800',
      notes: 'Current laptop outdated',
      attachments: ['equipment_request.pdf', 'quotes.pdf']
    },
    {
      id: 5,
      applicationNumber: 'APP-2024-005',
      employeeId: 'EMP009',
      employeeName: 'William Clark',
      department: 'Finance',
      applicationType: 'Training Request',
      subject: 'Advanced Excel Certification',
      appliedDate: '2024-01-03',
      status: 'rejected',
      priority: 'low',
      rejectedBy: 'Finance Head',
      rejectionReason: 'Budget constraints',
      notes: 'Skill development',
      attachments: ['training_request.pdf']
    },
    {
      id: 6,
      applicationNumber: 'APP-2024-006',
      employeeId: 'EMP002',
      employeeName: 'Sarah Johnson',
      department: 'IT',
      applicationType: 'Remote Work Request',
      subject: 'Work from Home - 3 days/week',
      appliedDate: '2024-01-15',
      status: 'approved',
      priority: 'medium',
      approvedBy: 'IT Manager',
      approvedDate: '2024-01-16',
      notes: 'Better work-life balance',
      attachments: ['remote_work_form.pdf']
    },
    {
      id: 7,
      applicationNumber: 'APP-2024-007',
      employeeId: 'EMP005',
      employeeName: 'Robert Wilson',
      department: 'Operations',
      applicationType: 'Overtime Request',
      subject: 'Weekend Project Work',
      appliedDate: '2024-01-14',
      status: 'pending',
      priority: 'high',
      estimatedHours: '16',
      notes: 'Urgent project deadline',
      attachments: ['overtime_request.pdf']
    },
    {
      id: 8,
      applicationNumber: 'APP-2024-008',
      employeeId: 'EMP007',
      employeeName: 'David Lee',
      department: 'HR',
      applicationType: 'Promotion Request',
      subject: 'Senior HR Executive Position',
      appliedDate: '2024-01-09',
      status: 'processing',
      priority: 'high',
      notes: 'Completed 3 years in current role',
      attachments: ['promotion_request.pdf', 'performance_review.pdf']
    },
    {
      id: 9,
      applicationNumber: 'APP-2024-009',
      employeeId: 'EMP010',
      employeeName: 'Amanda White',
      department: 'Sales',
      applicationType: 'Advance Salary Request',
      subject: 'Medical Emergency',
      appliedDate: '2024-01-11',
      status: 'approved',
      priority: 'urgent',
      approvedBy: 'Finance Manager',
      approvedDate: '2024-01-12',
      amount: '$3,000',
      notes: 'Medical treatment expenses',
      attachments: ['medical_certificate.pdf']
    },
    {
      id: 10,
      applicationNumber: 'APP-2024-010',
      employeeId: 'EMP006',
      employeeName: 'Lisa Anderson',
      department: 'Production',
      applicationType: 'Resignation Request',
      subject: 'Career Move to New Company',
      appliedDate: '2024-01-13',
      status: 'processing',
      priority: 'high',
      notes: 'Last working day: 2024-02-15',
      attachments: ['resignation_letter.pdf']
    }
  ];

  // Sample memos data
  const sampleMemosData = [
    {
      id: 1,
      memoNumber: 'MEMO-2024-001',
      title: 'New Leave Policy Implementation',
      author: 'HR Department',
      department: 'HR',
      issueDate: '2024-01-02',
      type: 'policy',
      priority: 'high',
      status: 'active',
      recipients: 'All Employees',
      summary: 'Updated leave policy effective from February 1st, 2024',
      content: 'The new leave policy includes revised annual leave entitlements, sick leave procedures, and remote work guidelines.',
      attachments: ['leave_policy_v2.pdf'],
      readers: 145,
      comments: 23
    },
    {
      id: 2,
      memoNumber: 'MEMO-2024-002',
      title: 'Quarterly Performance Review Schedule',
      author: 'Performance Management Team',
      department: 'HR',
      issueDate: '2024-01-05',
      type: 'announcement',
      priority: 'medium',
      status: 'active',
      recipients: 'Department Heads',
      summary: 'Schedule for Q1 performance reviews and evaluation process',
      content: 'Performance reviews will be conducted between January 15th and February 15th. Please submit all evaluations by the deadline.',
      attachments: ['performance_review_schedule.pdf'],
      readers: 45,
      comments: 8
    },
    {
      id: 3,
      memoNumber: 'MEMO-2024-003',
      title: 'Office Security Guidelines Update',
      author: 'Security Team',
      department: 'Administration',
      issueDate: '2024-01-08',
      type: 'guideline',
      priority: 'high',
      status: 'active',
      recipients: 'All Staff',
      summary: 'Enhanced security protocols for office access and visitor management',
      content: 'New security measures include mandatory badge access after 7 PM, visitor registration at reception, and updated emergency procedures.',
      attachments: ['security_guidelines.pdf', 'emergency_procedures.pdf'],
      readers: 120,
      comments: 15
    },
    {
      id: 4,
      memoNumber: 'MEMO-2024-004',
      title: 'IT System Maintenance Notice',
      author: 'IT Department',
      department: 'IT',
      issueDate: '2024-01-10',
      type: 'notice',
      priority: 'urgent',
      status: 'active',
      recipients: 'All Users',
      summary: 'Scheduled system maintenance this weekend - All systems unavailable',
      content: 'All company systems will be unavailable from Saturday 10 PM to Sunday 6 AM for essential maintenance and security updates.',
      attachments: ['maintenance_schedule.pdf'],
      readers: 180,
      comments: 12
    },
    {
      id: 5,
      memoNumber: 'MEMO-2024-005',
      title: 'Annual Company Meeting Announcement',
      author: 'CEO Office',
      department: 'Administration',
      issueDate: '2024-01-12',
      type: 'announcement',
      priority: 'high',
      status: 'active',
      recipients: 'All Employees',
      summary: 'Annual company meeting details, agenda, and participation guidelines',
      content: 'The annual company meeting will be held on January 30th at 2 PM in the main auditorium. Attendance is mandatory for all employees.',
      attachments: ['meeting_agenda.pdf', 'venue_map.pdf'],
      readers: 200,
      comments: 35
    },
    {
      id: 6,
      memoNumber: 'MEMO-2024-006',
      title: 'Expense Claim Submission Deadline',
      author: 'Finance Department',
      department: 'Finance',
      issueDate: '2024-01-14',
      type: 'notice',
      priority: 'medium',
      status: 'active',
      recipients: 'All Employees',
      summary: 'Monthly expense claim submission deadline reminder',
      content: 'All expense claims for January must be submitted by January 25th to ensure timely processing and payment.',
      attachments: ['expense_submission_guidelines.pdf'],
      readers: 95,
      comments: 7
    },
    {
      id: 7,
      memoNumber: 'MEMO-2024-007',
      title: 'Health Insurance Policy Update',
      author: 'HR Department',
      department: 'HR',
      issueDate: '2024-01-16',
      type: 'policy',
      priority: 'high',
      status: 'active',
      recipients: 'All Employees',
      summary: 'Updated health insurance coverage and claim procedures',
      content: 'New health insurance benefits include extended coverage for dependents, reduced co-pay amounts, and simplified claim submission process.',
      attachments: ['health_insurance_policy.pdf', 'claim_form.pdf'],
      readers: 160,
      comments: 28
    },
    {
      id: 8,
      memoNumber: 'MEMO-2024-008',
      title: 'Office Renovation Schedule',
      author: 'Facilities Management',
      department: 'Administration',
      issueDate: '2024-01-18',
      type: 'announcement',
      priority: 'medium',
      status: 'active',
      recipients: 'Floor 3 & 4 Employees',
      summary: 'Renovation schedule for office floors 3 and 4',
      content: 'Renovation work will be carried out from January 22nd to February 5th. Alternate seating arrangements have been made.',
      attachments: ['renovation_schedule.pdf', 'seating_arrangement.pdf'],
      readers: 65,
      comments: 14
    }
  ];

  // Sample summary statistics
  const sampleSummaryStats = {
    totalEmployees: 10,
    pendingApplications: 4,
    approvedApplications: 5,
    rejectedApplications: 1,
    activeMemos: 8,
    highPriorityApplications: 3,
    totalApplications: 10,
    totalMemos: 8,
    urgentItems: 2,
    newThisWeek: 7
  };

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setApplicationsData(sampleApplicationsData);
      setMemosData(sampleMemosData);
      setSummaryStats(sampleSummaryStats);
      setIsLoading(false);
    }, 500);
  }, []);

  // Filter data based on current filters
  const getFilteredData = () => {
    const data = activeTab === 'applications' ? applicationsData : memosData;
    
    return data.filter(item => {
      // Department filter
      if (filters.department !== 'all' && item.department !== filters.department) {
        return false;
      }
      
      // Status filter
      if (filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }
      
      // Priority filter
      if (filters.priority !== 'all' && item.priority !== filters.priority) {
        return false;
      }
      
      // Employee filter
      if (activeTab === 'applications' && filters.employee !== 'all' && item.employeeId !== filters.employee) {
        return false;
      }
      
      // Type filter for memos
      if (activeTab === 'memos' && filters.type !== 'all' && item.type !== filters.type) {
        return false;
      }
      
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchFields = [
          item.title || item.subject || '',
          item.employeeName || item.author || '',
          item.department,
          item.applicationNumber || item.memoNumber || '',
          item.notes || item.summary || '',
          item.applicationType || item.type || ''
        ];
        
        return searchFields.some(field => 
          field && field.toString().toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = (data) => {
    const sortedData = [...data];
    if (sortConfig.key) {
      sortedData.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortedData;
  };

  // Helper functions for status and priority
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
      case 'active': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending':
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'pending': return 'Pending';
      case 'processing': return 'Processing';
      case 'active': return 'Active';
      default: return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
      case 'urgent': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'low':
      case 'normal': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityLabel = (priority) => {
    if (!priority) return 'Normal';
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const getMemoTypeColor = (type) => {
    switch (type) {
      case 'policy': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'announcement': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'guideline': return 'bg-green-50 text-green-700 border-green-200';
      case 'notice': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleViewDetails = (item, type) => {
    setSelectedDetail({ ...item, type });
    setShowDetailModal(true);
  };

  // Export functionality
  const handleExport = (format, type, data = null) => {
    const exportData = data || getFilteredData();
    const fileName = `${type}_${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'csv') {
      // Generate CSV
      if (exportData.length === 0) {
        toast.error('No data to export');
        return;
      }
      
      const headers = Object.keys(exportData[0]).join(',');
      const rows = exportData.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' ? `"${value}"` : value
        ).join(',')
      ).join('\n');
      
      const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${fileName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'pdf') {
      toast.success(`Exporting ${exportData.length} items as PDF...`);
      // In real app, you would generate PDF here
    } else if (format === 'excel') {
      toast.success(`Exporting ${exportData.length} items as Excel...`);
      // In real app, you would generate Excel here
    }
  };

  const handleIndividualExport = (employee, format) => {
    const employeeData = {
      employeeId: employee.id,
      name: employee.name,
      department: employee.department,
      email: employee.email,
      exportDate: new Date().toISOString().split('T')[0]
    };

    if (format === 'csv') {
      const csvContent = `data:text/csv;charset=utf-8,${Object.entries(employeeData)
        .map(([key, value]) => `${key},${value}`)
        .join('\n')}`;
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${employee.name}_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.success(`Exporting ${employee.name}'s report in ${format.toUpperCase()} format...`);
    }
  };

  const handleBulkExport = (format, type) => {
    let dataToExport = [];
    let fileName = '';

    switch (type) {
      case 'applications':
        dataToExport = getFilteredData();
        fileName = 'applications_report';
        break;
      case 'memos':
        dataToExport = getFilteredData();
        fileName = 'memos_report';
        break;
      default:
        fileName = 'hr_report';
    }

    if (format === 'csv') {
      if (dataToExport.length === 0) {
        toast.error('No data to export');
        return;
      }
      
      const headers = Object.keys(dataToExport[0]).join(',');
      const rows = dataToExport.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' ? `"${value}"` : value
        ).join(',')
      ).join('\n');
      
      const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.success(`Exporting ${dataToExport.length} items as ${format.toUpperCase()}...`);
    }
  };

  const openExportModal = (type, employee = null) => {
    setExportType(type);
    setSelectedEmployee(employee);
    setShowExportModal(true);
  };

  // Bulk actions handler - FIXED: Removed confirm
  const handleBulkActions = (action) => {
    if (selectedItems.length === 0) {
      toast.error('Please select items first');
      return;
    }
    
    switch (action) {
      case 'export':
        const selectedData = getFilteredData().filter(item => selectedItems.includes(item.id));
        handleExport('pdf', activeTab, selectedData);
        break;
      case 'delete':
        // Show custom delete confirmation modal instead of confirm
        setShowDeleteConfirm(true);
        break;
    }
  };

  const handleDeleteConfirm = () => {
    // In a real app, you would make an API call here
    toast.success(`${selectedItems.length} items marked for deletion`);
    setSelectedItems([]);
    setShowDeleteConfirm(false);
  };

  // Grid View Components
  const ApplicationCard = ({ app }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-medium text-gray-900">{app.subject}</h4>
          <p className="text-xs text-gray-500">{app.applicationNumber}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(app.status)}`}>
          {getStatusLabel(app.status)}
        </span>
      </div>
      
      <div className="flex items-center mb-3">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium mr-2">
          {app.employeeName.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <p className="text-sm font-medium">{app.employeeName}</p>
          <p className="text-xs text-gray-500">{app.department}</p>
        </div>
      </div>
      
      <div className="mb-3">
        <span className={`px-2 py-1 text-xs font-semibold rounded border ${getPriorityColor(app.priority)}`}>
          {getPriorityLabel(app.priority)}
        </span>
        <span className="ml-2 text-xs text-gray-600">{app.applicationType}</span>
      </div>
      
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{app.notes}</p>
      
      <div className="flex justify-between text-xs text-gray-500 mb-4">
        <span>Applied: {app.appliedDate}</span>
        <span>{app.attachments?.length || 0} attachments</span>
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={() => handleViewDetails(app, 'application')}
          className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm"
        >
          View Details
        </button>
        <button
          onClick={() => openExportModal('individual', employees.find(e => e.id === app.employeeId))}
          className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
        >
          Export
        </button>
      </div>
    </div>
  );

  const MemoCard = ({ memo }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-medium text-gray-900">{memo.title}</h4>
          <p className="text-xs text-gray-500">{memo.memoNumber}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded ${getMemoTypeColor(memo.type)}`}>
          {memo.type.charAt(0).toUpperCase() + memo.type.slice(1)}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{memo.summary}</p>
      
      <div className="mb-3">
        <span className={`px-2 py-1 text-xs font-semibold rounded border ${getPriorityColor(memo.priority)}`}>
          {getPriorityLabel(memo.priority)}
        </span>
        <span className="ml-2 text-xs text-gray-600">{memo.department}</span>
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div>
          <p className="font-medium">{memo.author}</p>
          <p className="text-xs">To: {memo.recipients}</p>
        </div>
        <div className="text-right">
          <p>{memo.issueDate}</p>
          <div className="flex items-center justify-end space-x-2 text-xs mt-1">
            <span className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {memo.readers}
            </span>
            <span className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              {memo.comments}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={() => handleViewDetails(memo, 'memo')}
          className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm"
        >
          View Details
        </button>
        <button
          onClick={() => handleExport('pdf', 'memo', [memo])}
          className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
        >
          Export
        </button>
      </div>
    </div>
  );

  // Grid View
  const GridView = () => {
    const data = getFilteredData();
    
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-48"></div>
          ))}
        </div>
      );
    }
    
    if (data.length === 0) {
      return (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500">No {activeTab} found matching your criteria</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTab === 'applications' 
          ? getSortedData(data).map(app => <ApplicationCard key={app.id} app={app} />)
          : getSortedData(data).map(memo => <MemoCard key={memo.id} memo={memo} />)
        }
      </div>
    );
  };

  // Table View
  const TableView = () => {
    const data = getFilteredData();
    const sortedData = getSortedData(data);
    
    const handleSelectAll = (e) => {
      if (e.target.checked) {
        setSelectedItems(sortedData.map(item => item.id));
      } else {
        setSelectedItems([]);
      }
    };
    
    const handleSelectItem = (id) => {
      setSelectedItems(prev => 
        prev.includes(id) 
          ? prev.filter(itemId => itemId !== id)
          : [...prev, id]
      );
    };
    
    if (isLoading) {
      return (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">
                  {activeTab === 'applications' ? 'Application Details' : 'Memo Details'}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={activeTab === 'applications' ? 9 : 8} className="px-6 py-8 text-center">
                  <div className="animate-pulse">Loading data...</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }
    
    if (sortedData.length === 0) {
      return (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">
                  {activeTab === 'applications' ? 'Application Details' : 'Memo Details'}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={activeTab === 'applications' ? 9 : 8} className="px-6 py-12 text-center text-gray-500">
                  No {activeTab} found matching your criteria
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }
    
    if (activeTab === 'applications') {
      return (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-600">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedItems.length === sortedData.length && sortedData.length > 0}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Application #</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Employee</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Department</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Subject</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Applied Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Priority</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(app.id)}
                      onChange={() => handleSelectItem(app.id)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-blue-600">{app.applicationNumber}</div>
                    <div className="text-xs text-gray-500">{app.applicationType}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium mr-3">
                        {app.employeeName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium">{app.employeeName}</div>
                        <div className="text-xs text-gray-500">{app.employeeId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {app.department}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{app.subject}</div>
                    {app.notes && <div className="text-xs text-gray-500 truncate">{app.notes}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{app.appliedDate}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(app.status)}`}>
                      {getStatusLabel(app.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded border ${getPriorityColor(app.priority)}`}>
                      {getPriorityLabel(app.priority)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(app, 'application')}
                        className="px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openExportModal('individual', employees.find(e => e.id === app.employeeId))}
                        className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                      >
                        Export
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else {
      return (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-600">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedItems.length === sortedData.length && sortedData.length > 0}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Memo #</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Author/Department</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Issue Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Priority</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.map((memo) => (
                <tr key={memo.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(memo.id)}
                      onChange={() => handleSelectItem(memo.id)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-purple-600">{memo.memoNumber}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{memo.title}</div>
                    <div className="text-xs text-gray-500 line-clamp-2">{memo.summary}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{memo.author}</div>
                    <div className="text-xs text-gray-500">{memo.department}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded border ${getMemoTypeColor(memo.type)}`}>
                      {memo.type.charAt(0).toUpperCase() + memo.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{memo.issueDate}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded border ${getPriorityColor(memo.priority)}`}>
                      {getPriorityLabel(memo.priority)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(memo, 'memo')}
                        className="px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleExport('pdf', 'memo', [memo])}
                        className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                      >
                        Export
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  };

  // Employee Reports Table
  const EmployeeReportsTable = () => {
    const getEmployeeStats = (employeeId) => {
      const empApplications = applicationsData.filter(app => app.employeeId === employeeId);
      const empMemos = memosData.filter(memo => 
        memo.author.includes(employees.find(e => e.id === employeeId)?.name.split(' ')[0]) || 
        memo.department === employees.find(e => e.id === employeeId)?.department
      );
      
      return {
        totalApplications: empApplications.length,
        approvedApplications: empApplications.filter(app => app.status === 'approved').length,
        pendingApplications: empApplications.filter(app => app.status === 'pending' || app.status === 'processing').length,
        rejectedApplications: empApplications.filter(app => app.status === 'rejected').length,
        memosCreated: empMemos.length
      };
    };

    return (
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-600">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Employee</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Department</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Total Apps</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Approved</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Pending</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Rejected</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Memos</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center">
                  <div className="animate-pulse">Loading employee data...</div>
                </td>
              </tr>
            ) : (
              employees.map((employee) => {
                const stats = getEmployeeStats(employee.id);
                
                return (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium mr-3">
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-xs text-gray-500">{employee.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {employee.department}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{stats.totalApplications}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-green-600 font-medium">{stats.approvedApplications}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-yellow-600 font-medium">{stats.pendingApplications}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-red-600 font-medium">{stats.rejectedApplications}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{stats.memosCreated}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openExportModal('individual', employee)}
                        className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                      >
                        Export Report
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Detail Modal
  const DetailModal = () => {
    if (!selectedDetail) return null;
    
    const isApplication = selectedDetail.type === 'application';
    const detail = selectedDetail;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  {isApplication ? detail.subject : detail.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {isApplication ? detail.applicationNumber : detail.memoNumber}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedDetail(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Type</p>
                <p className="font-medium">
                  {isApplication ? detail.applicationType : detail.type}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(detail.status)}`}>
                  {getStatusLabel(detail.status)}
                </span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Priority</p>
                <span className={`px-2 py-1 text-xs font-semibold rounded border ${getPriorityColor(detail.priority)}`}>
                  {getPriorityLabel(detail.priority)}
                </span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Department</p>
                <p className="font-medium">{detail.department}</p>
              </div>
            </div>
            
            {isApplication ? (
              <>
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Employee Information</h4>
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg mr-4">
                      {detail.employeeName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{detail.employeeName}</p>
                      <p className="text-sm text-gray-600">ID: {detail.employeeId}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Applied Date:</span>
                      <span className="font-medium">{detail.appliedDate}</span>
                    </div>
                    {detail.approvedDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Approved Date:</span>
                        <span className="font-medium">{detail.approvedDate}</span>
                      </div>
                    )}
                    {detail.approvedBy && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Approved By:</span>
                        <span className="font-medium">{detail.approvedBy}</span>
                      </div>
                    )}
                    {detail.amount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium">{detail.amount}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {detail.notes && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                    <p className="text-gray-600">{detail.notes}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
                  <p className="text-gray-600">{detail.summary}</p>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Content</h4>
                  <p className="text-gray-600">{detail.content}</p>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Author:</span>
                      <span className="font-medium">{detail.author}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Recipients:</span>
                      <span className="font-medium">{detail.recipients}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issue Date:</span>
                      <span className="font-medium">{detail.issueDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Views/Comments:</span>
                      <span className="font-medium">{detail.readers} / {detail.comments}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {detail.attachments && detail.attachments.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments ({detail.attachments.length})</h4>
                <div className="space-y-2">
                  {detail.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm text-gray-600">{file}</span>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedDetail(null);
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleExport('pdf', isApplication ? 'application' : 'memo', [detail]);
                  setShowDetailModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Delete Confirmation Modal
  const DeleteConfirmationModal = () => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">
            Confirm Delete
          </h3>
          
          <p className="text-gray-600 text-center mb-6">
            Are you sure you want to delete {selectedItems.length} selected item{selectedItems.length > 1 ? 's' : ''}? 
            This action cannot be undone.
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const filteredData = getFilteredData();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header with Summary Stats */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            
          </div>
          
          <div className="flex items-center space-x-4">
            
            
            <button
              onClick={() => openExportModal('bulk')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export All
            </button>
          </div>
        </div>

        {/* Summary Statistics Cards */}
        

        {/* Tabs */}
        <div className="flex flex-wrap border-b border-gray-200">
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'applications' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
          >
            Applications
            <span className="ml-2 bg-blue-100 text-blue-600 text-xs font-medium px-2 py-0.5 rounded-full">
              {applicationsData.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('memos')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'memos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
          >
            Memos & Notices
            <span className="ml-2 bg-purple-100 text-purple-600 text-xs font-medium px-2 py-0.5 rounded-full">
              {memosData.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('employee-reports')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'employee-reports' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
          >
            Employee Reports
            <span className="ml-2 bg-green-100 text-green-600 text-xs font-medium px-2 py-0.5 rounded-full">
              {employees.length}
            </span>
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
  {/* Search and Bulk Actions */}
  <div className="p-4 border-b border-gray-100">
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 relative">
        {/* <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} /> */}
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
        />
      </div>
      
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium text-blue-700">
            {selectedItems.length} selected
          </span>
          <div className="w-px h-4 bg-blue-200 mx-1" />
          <button
            onClick={() => handleBulkActions('export')}
            className="text-xs px-2 py-1 bg-white text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
          >
            Export
          </button>
          <button
            onClick={() => handleBulkActions('delete')}
            className="text-xs px-2 py-1 bg-white text-red-600 rounded-md hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  </div>

  {/* Filter Chips - Quick Filters */}
 

  {/* Filter Grid - Compact 2-row layout */}
  <div className="p-4">
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* Department Filter */}
      <div className="relative">
        <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
        <select
          value={filters.department}
          onChange={(e) => setFilters({...filters, department: e.target.value})}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors appearance-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
        >
          <option value="all">All Departments</option>
          {departments.filter(d => d !== 'all').map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Status Filter */}
      <div className="relative">
        <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
        <select
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors appearance-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="processing">Processing</option>
          <option value="active">Active</option>
        </select>
      </div>

      {/* Priority Filter */}
      <div className="relative">
        <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
        <select
          value={filters.priority}
          onChange={(e) => setFilters({...filters, priority: e.target.value})}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors appearance-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
        >
          <option value="all">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
        </select>
      </div>

      {/* Employee/Author Filter */}
      {activeTab !== 'employee-reports' && (
        <div className="relative">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {activeTab === 'applications' ? 'Employee' : 'Author'}
          </label>
          <select
            value={filters.employee}
            onChange={(e) => setFilters({...filters, employee: e.target.value})}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors appearance-none truncate"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
          >
            <option value="all">All {activeTab === 'applications' ? 'Employees' : 'Authors'}</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Memo Type Filter */}
      {activeTab === 'memos' && (
        <div className="relative">
          <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors appearance-none"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
          >
            <option value="all">All Types</option>
            <option value="policy">Policy</option>
            <option value="announcement">Announcement</option>
            <option value="guideline">Guideline</option>
            <option value="notice">Notice</option>
          </select>
        </div>
      )}

      {/* Date Range Filter */}
      <div className="relative">
        <label className="block text-xs font-medium text-gray-500 mb-1">Date Range</label>
        <select
          value={filters.dateRange}
          onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors appearance-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
        >
          <option value="current_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="current_quarter">This Quarter</option>
          <option value="last_quarter">Last Quarter</option>
          <option value="current_year">This Year</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>
    </div>

    {/* Footer Actions */}
    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
      <button
        onClick={() => {
          setFilters({
            department: 'all',
            dateRange: 'current_month',
            employee: 'all',
            status: 'all',
            priority: 'all',
            type: 'all'
          });
          setSearchQuery('');
          setSelectedItems([]);
        }}
        className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center gap-1.5"
      >
        {/* <RefreshCw size={14} /> */}
        Clear All Filters
      </button>
      
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">
          Showing <span className="font-medium text-gray-900">{filteredData.length}</span>
        </span>
        <span className="text-gray-300">|</span>
        <span className="text-xs text-gray-500">
          Total <span className="font-medium text-gray-900">
            {activeTab === 'applications' ? applicationsData.length :
             activeTab === 'memos' ? memosData.length :
             employees.length}
          </span>
        </span>
      </div>
    </div>
  </div>

  {/* Custom Date Range Panel - Shown when 'custom' is selected */}
  {filters.dateRange === 'custom' && (
    <div className="mx-4 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-3">
        {/* <Calendar size={16} className="text-gray-500" /> */}
        <input
          type="date"
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500"
          placeholder="Start date"
        />
        <span className="text-gray-500">—</span>
        <input
          type="date"
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500"
          placeholder="End date"
        />
        <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Apply
        </button>
      </div>
    </div>
  )}
</div>

      {/* Main Content */}
      {activeTab === 'employee-reports' ? (
        <EmployeeReportsTable />
      ) : viewMode === 'table' ? (
        <TableView />
      ) : (
        <GridView />
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">1</span> to{' '}
          <span className="font-medium">
            {activeTab === 'applications' ? Math.min(10, filteredData.length) :
             activeTab === 'memos' ? Math.min(10, filteredData.length) :
             employees.length}
          </span> of{' '}
          <span className="font-medium">
            {activeTab === 'applications' ? filteredData.length :
             activeTab === 'memos' ? filteredData.length :
             employees.length}
          </span> records
        </div>
        <div className="flex space-x-2">
          <button className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            Previous
          </button>
          <button className="px-3 py-2 text-sm text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700">
            1
          </button>
          <button className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {exportType === 'individual' && selectedEmployee 
                    ? `Export Report for ${selectedEmployee.name}` 
                    : 'Export All Data'}
                </h3>
                <button
                  onClick={() => {
                    setShowExportModal(false);
                    setSelectedEmployee(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {exportType === 'individual' && selectedEmployee && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg mr-4">
                      {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{selectedEmployee.name}</h4>
                      <p className="text-sm text-gray-600">{selectedEmployee.department}</p>
                      <p className="text-xs text-gray-500">{selectedEmployee.email}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Choose Export Format</h4>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      if (exportType === 'individual' && selectedEmployee) {
                        handleIndividualExport(selectedEmployee, 'pdf');
                      } else {
                        handleBulkExport('pdf', activeTab);
                      }
                      setShowExportModal(false);
                    }}
                    className="px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors duration-200 flex flex-col items-center justify-center"
                  >
                    <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm font-medium">PDF</span>
                    <span className="text-xs text-gray-500 mt-1">Detailed Report</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      if (exportType === 'individual' && selectedEmployee) {
                        handleIndividualExport(selectedEmployee, 'excel');
                      } else {
                        handleBulkExport('excel', activeTab);
                      }
                      setShowExportModal(false);
                    }}
                    className="px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors duration-200 flex flex-col items-center justify-center"
                  >
                    <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm font-medium">Excel</span>
                    <span className="text-xs text-gray-500 mt-1">Data Sheet</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      if (exportType === 'individual' && selectedEmployee) {
                        handleIndividualExport(selectedEmployee, 'csv');
                      } else {
                        handleBulkExport('csv', activeTab);
                      }
                      setShowExportModal(false);
                    }}
                    className="px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors duration-200 flex flex-col items-center justify-center"
                  >
                    <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="text-sm font-medium">CSV</span>
                    <span className="text-xs text-gray-500 mt-1">Simple Data</span>
                  </button>
                </div>
              </div>

              {exportType === 'bulk' && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Report Type</h4>
                  <select 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    onChange={(e) => setActiveTab(e.target.value)}
                    value={activeTab}
                  >
                    <option value="applications">Applications Report</option>
                    <option value="memos">Memos Report</option>
                    <option value="employee-reports">Employee Reports</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowExportModal(false);
                    setSelectedEmployee(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 mr-3"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && <DetailModal />}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && <DeleteConfirmationModal />}
    </div>
  );
};

export default HrManageReport;
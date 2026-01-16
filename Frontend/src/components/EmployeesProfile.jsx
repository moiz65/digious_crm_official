// components/EmployeesProfile.jsx

import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, CheckCircle, XCircle, Clock, 
  TrendingUp, DollarSign, ClipboardList, Filter, 
  Search, MoreVertical, Edit, Trash2, Eye, 
  Plus, ChevronRight, Home, BarChart3, 
  ArrowUpDown, CheckSquare, Square, Calendar,
  Briefcase, ChevronDown, Download, FileText,
  Target, Palette, Cpu, Shield, Building,
  Award, Star, Zap, Activity, RefreshCw,
  Mail, Phone, Code, Database, Layers,
  ExternalLink, MessageSquare, Globe, MapPin,
  X, Save, Tag, PlusCircle, MinusCircle,
  User, Lock, Key, Upload, Image, EyeOff,
  CalendarDays, GitBranch, DollarSign as Dollar, 
  TrendingUp as Trending, Bug, 
  Users as UsersIcon, Palette as PaletteIcon,
  Target as TargetIcon
} from 'lucide-react';
import { endpoints } from '../config/api';

const EmployeeProfile = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch employees from API on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch(endpoints.employees.base);
        const data = await response.json();
        
        if (data.success) {
          // Transform API data to match component format
          const transformedEmployees = (data.data || []).map((emp) => ({
            id: emp.id,
            name: emp.name || 'Unknown',
            username: emp.employee_id || emp.name?.toLowerCase().replace(/\s+/g, '.') || 'unknown',
            role: emp.sub_department || emp.position || 'Employee',
            email: emp.email || '',
            phone: emp.phone || '',
            status: emp.status === 'Active' ? 'active' : 'inactive',
            department: emp.department || 'Unknown',
            joiningDate: emp.join_date || new Date().toISOString().split('T')[0],
            experience: '-- years',
            location: 'Unknown',
            performance: 'Good',
            skills: [],
            color: ['blue', 'green', 'purple', 'orange'][Math.floor(Math.random() * 4)],
            badgeClass: ['bg-blue-transparent', 'bg-green-transparent', 'bg-purple-transparent', 'bg-orange-transparent'][Math.floor(Math.random() * 4)],
            attendance: Math.floor(Math.random() * 30) + 70,
            selected: false
          }));
          
          setEmployees(transformedEmployees);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching employees:', error);
        setLoading(false);
        setEmployees([]);
      }
    };

    fetchEmployees();
    
    // Refresh employees every 60 seconds
    const refreshInterval = setInterval(fetchEmployees, 60000);
    return () => clearInterval(refreshInterval);
  }, []);

  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [filters, setFilters] = useState({
    department: 'all',
    status: 'all',
    search: ''
  });
  const [sortBy, setSortBy] = useState('recent');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [exportFormat, setExportFormat] = useState('excel');
  const [bulkAction, setBulkAction] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showContactOptions, setShowContactOptions] = useState({});
  const [showMenuDropdown, setShowMenuDropdown] = useState({});
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportDropdown && !event.target.closest('.export-dropdown-container')) {
        setShowExportDropdown(false);
      }
      
      if (Object.values(showMenuDropdown).some(v => v) && 
          !event.target.closest('.menu-dropdown-container')) {
        setShowMenuDropdown({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown, showMenuDropdown]);

  const stats = [
    {
      title: "Total Employees",
      value: employees.length.toString(),
      badgeColor: "bg-blue-100 text-blue-800 border border-blue-200",
      trend: "+15%",
      icon: Users
    },
    {
      title: "Active",
      value: employees.filter(e => e.status === 'active').length.toString(),
      badgeColor: "bg-green-100 text-green-800 border border-green-200",
      trend: "+8%",
      icon: CheckCircle
    },
    {
      title: "Inactive",
      value: employees.filter(e => e.status === 'inactive').length.toString(),
      badgeColor: "bg-red-100 text-red-800 border border-red-200",
      trend: "-2%",
      icon: XCircle
    },
    {
      title: "Attendance Rate",
      value: `${Math.round(employees.reduce((acc, emp) => acc + emp.attendance, 0) / employees.length)}%`,
      badgeColor: "bg-purple-100 text-purple-800 border border-purple-200",
      trend: "+12%",
      icon: CalendarDays
    }
  ];

  const getColorClass = (color) => {
    const colors = {
      blue: "text-blue-600 bg-blue-500",
      green: "text-green-600 bg-green-500",
      purple: "text-purple-600 bg-purple-500",
      orange: "text-orange-600 bg-orange-500",
      yellow: "text-yellow-600 bg-yellow-500",
      red: "text-red-600 bg-red-500"
    };
    return colors[color] || "text-blue-600 bg-blue-500";
  };

  const getBadgeColorClass = (badgeClass) => {
    const badgeClasses = {
      "bg-blue-transparent": "bg-blue-100 text-blue-800 border border-blue-200",
      "bg-green-transparent": "bg-green-100 text-green-800 border border-green-200",
      "bg-purple-transparent": "bg-purple-100 text-purple-800 border border-purple-200",
      "bg-orange-transparent": "bg-orange-100 text-orange-800 border border-orange-200",
      "bg-pink-transparent": "bg-pink-100 text-pink-800 border border-pink-200",
      "bg-red-transparent": "bg-red-100 text-red-800 border border-red-200"
    };
    return badgeClasses[badgeClass] || "bg-gray-100 text-gray-800 border border-gray-300";
  };

  const getRoleIcon = (role, department) => {
    switch (department) {
      case 'Development':
        return <Code className="h-4 w-4 text-orange-600" />;
      case 'Sales':
        return <Target className="h-4 w-4 text-green-600" />;
      case 'Human Resources':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'Design':
        return <Palette className="h-4 w-4 text-purple-600" />;
      default:
        return <Briefcase className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 border border-green-200 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Active</span>;
      case 'inactive':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1"><XCircle className="h-3 w-3" /> Inactive</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 border border-gray-200">Unknown</span>;
    }
  };

  const getPerformanceBadge = (performance) => {
    switch (performance) {
      case 'Top Performer':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 flex items-center gap-1"><Star className="h-3 w-3" /> Top Performer</span>;
      case 'Excellent':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 border border-green-200 flex items-center gap-1"><Zap className="h-3 w-3" /> Excellent</span>;
      case 'Good':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1"><Activity className="h-3 w-3" /> Good</span>;
      case 'Average':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 border border-gray-200">Average</span>;
      default:
        return null;
    }
  };

  const getSkillIcon = (skill) => {
    const skillLower = skill.toLowerCase();
    if (skillLower.includes('react') || skillLower.includes('javascript') || skillLower.includes('node')) {
      return <Code className="h-3 w-3" />;
    } else if (skillLower.includes('aws') || skillLower.includes('docker') || skillLower.includes('postgres')) {
      return <Database className="h-3 w-3" />;
    } else if (skillLower.includes('adobe') || skillLower.includes('photoshop') || skillLower.includes('figma')) {
      return <Palette className="h-3 w-3" />;
    } else if (skillLower.includes('sales') || skillLower.includes('crm') || skillLower.includes('lead')) {
      return <Target className="h-3 w-3" />;
    } else if (skillLower.includes('hr') || skillLower.includes('training') || skillLower.includes('recruitment')) {
      return <Shield className="h-3 w-3" />;
    }
    return <Layers className="h-3 w-3" />;
  };

  const getDepartmentIcon = (department) => {
    switch (department) {
      case 'Development':
        return <Cpu className="h-4 w-4 text-orange-500" />;
      case 'Sales':
        return <Target className="h-4 w-4 text-green-500" />;
      case 'Human Resources':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'Design':
        return <Palette className="h-4 w-4 text-purple-500" />;
      default:
        return <Building className="h-4 w-4 text-gray-500" />;
    }
  };

  // Selection Functions
  const handleSelectEmployee = (id) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEmployees(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedEmployees.size === filteredEmployees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(filteredEmployees.map(emp => emp.id)));
    }
  };

  // CRUD Operations
  const handleAddEmployee = (employeeData) => {
    const newEmployee = {
      id: Math.max(...employees.map(e => e.id)) + 1,
      ...employeeData,
      selected: false,
      attendance: Math.floor(Math.random() * 30) + 70,
      // Role-specific default metrics
      ...(employeeData.department === 'Development' ? {
        projects: Math.floor(Math.random() * 20) + 15,
        projectdone: Math.floor(Math.random() * 200) + 100,
        pullRequests: Math.floor(Math.random() * 50) + 20,
        bugsFixed: Math.floor(Math.random() * 80) + 40
      } : employeeData.department === 'Sales' ? {
        target: Math.floor(Math.random() * 100000) + 100000,
        achieved: Math.floor(Math.random() * 150000) + 50000,
        dealsClosed: Math.floor(Math.random() * 30) + 15,
        newClients: Math.floor(Math.random() * 15) + 5
      } : employeeData.department === 'Human Resources' ? {
        projects: Math.floor(Math.random() * 10) + 8,
        candidates: Math.floor(Math.random() * 50) + 30,
        interviews: Math.floor(Math.random() * 30) + 15,
        hires: Math.floor(Math.random() * 10) + 5
      } : employeeData.department === 'Design' ? {
        projects: Math.floor(Math.random() * 15) + 10,
        designs: Math.floor(Math.random() * 40) + 20,
        revisions: Math.floor(Math.random() * 20) + 5
      } : {
        projects: Math.floor(Math.random() * 15) + 10,
        done: Math.floor(Math.random() * 12) + 5,
        progress: Math.floor(Math.random() * 8) + 2
      }),
      performance: ['Good', 'Average', 'Excellent'][Math.floor(Math.random() * 3)],
      color: getRoleColor(employeeData.role),
      badgeClass: getRoleBadgeClass(employeeData.role),
      skills: employeeData.skills || getDefaultSkills(employeeData.role),
      email: `${employeeData.name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
      phone: `+1 (555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
      username: employeeData.username || employeeData.name.toLowerCase().replace(/\s+/g, '.')
    };
    setEmployees(prev => [...prev, newEmployee]);
    setShowAddModal(false);
  };

  const getRoleColor = (role) => {
    switch (role.toLowerCase()) {
      case 'hr manager':
      case 'hr specialist':
        return 'blue';
      case 'sales executive':
        return 'green';
      case 'graphic designer':
        return 'purple';
      case 'developer':
        return 'orange';
      default:
        return 'blue';
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role.toLowerCase()) {
      case 'hr manager':
      case 'hr specialist':
        return 'bg-blue-transparent';
      case 'sales executive':
        return 'bg-green-transparent';
      case 'graphic designer':
        return 'bg-purple-transparent';
      case 'developer':
        return 'bg-orange-transparent';
      default:
        return 'bg-blue-transparent';
    }
  };

  const getDefaultSkills = (role) => {
    switch (role.toLowerCase()) {
      case 'hr manager':
      case 'hr specialist':
        return ['Recruitment', 'Employee Relations', 'HR Policies', 'Training'];
      case 'sales executive':
        return ['Sales Strategy', 'Client Relations', 'Negotiation', 'CRM'];
      case 'graphic designer':
        return ['Adobe Creative Suite', 'UI/UX Design', 'Branding', 'Illustration'];
      case 'developer':
        return ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Git'];
      default:
        return ['Communication', 'Teamwork', 'Problem Solving'];
    }
  };

  const handleEditEmployee = async (employeeData) => {
    try {
      // Prepare the data to send to backend
      const updatePayload = {
        name: employeeData.name,
        email: employeeData.email,
        phone: employeeData.phone,
        cnic: employeeData.cnic,
        department: employeeData.department,
        designation: employeeData.role,
        address: employeeData.location,
        emergency_contact: employeeData.phone,
        bank_account: employeeData.bankAccount,
        tax_id: employeeData.taxId,
        status: employeeData.status === 'active' ? 'Active' : 'Inactive',
        // Resources
        laptop: employeeData.resources?.laptop?.allocated || false,
        laptop_serial: employeeData.resources?.laptop?.serialNumber || null,
        charger: employeeData.resources?.charger?.allocated || false,
        charger_serial: employeeData.resources?.charger?.serialNumber || null,
        mouse: employeeData.resources?.mouse?.allocated || false,
        mouse_serial: employeeData.resources?.mouse?.serialNumber || null,
        keyboard: employeeData.resources?.keyboard?.allocated || false,
        keyboard_serial: employeeData.resources?.keyboard?.serialNumber || null,
        monitor: employeeData.resources?.monitor?.allocated || false,
        monitor_serial: employeeData.resources?.monitor?.serialNumber || null,
        mobile: employeeData.resources?.mobile?.allocated || false,
        mobile_serial: employeeData.resources?.mobile?.serialNumber || null,
        resources_note: employeeData.resources?.resourceNotes || null,
        // Allowances
        allowances: Object.entries(employeeData.allowances || {}).map(([name, amount]) => ({
          name,
          amount: parseFloat(amount) || 0
        }))
      };

      console.log('📤 Sending update payload:', updatePayload);

      const response = await fetch(endpoints.employees.update(employeeData.id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload)
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setEmployees(prev => prev.map(emp => 
          emp.id === employeeData.id ? { ...emp, ...employeeData } : emp
        ));
        setShowEditModal(false);
        setEditingEmployee(null);
        alert('✅ Employee updated successfully!');
      } else {
        alert('❌ Error updating employee: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error updating employee:', error);
      alert('❌ Failed to update employee: ' + error.message);
    }
  };

  const handleDeleteEmployee = (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      const newSelected = new Set(selectedEmployees);
      newSelected.delete(id);
      setSelectedEmployees(newSelected);
    }
  };

  // Status Management
  const handleToggleStatus = (id) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === id ? { ...emp, status: emp.status === 'active' ? 'inactive' : 'active' } : emp
    ));
  };

  // Contact Functions
  const handleSendEmail = (email) => {
    window.open(`mailto:${email}`, '_blank');
  };

  const handleCall = (phone) => {
    window.open(`tel:${phone.replace(/\D/g, '')}`, '_blank');
  };

  const toggleContactOptions = (id) => {
    setShowContactOptions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email);
    alert('Email copied to clipboard!');
  };

  const handleCopyPhone = (phone) => {
    navigator.clipboard.writeText(phone);
    alert('Phone number copied to clipboard!');
  };

  // Menu dropdown function
  const toggleMenuDropdown = (id) => {
    setShowMenuDropdown(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Bulk Operations
  const handleBulkAction = (action) => {
    switch (action) {
      case 'activate':
        setEmployees(prev => prev.map(emp => 
          selectedEmployees.has(emp.id) ? { ...emp, status: 'active' } : emp
        ));
        break;
      case 'deactivate':
        setEmployees(prev => prev.map(emp => 
          selectedEmployees.has(emp.id) ? { ...emp, status: 'inactive' } : emp
        ));
        break;
      case 'delete':
        if (window.confirm(`Delete ${selectedEmployees.size} selected employees?`)) {
          setEmployees(prev => prev.filter(emp => !selectedEmployees.has(emp.id)));
          setSelectedEmployees(new Set());
        }
        break;
      case 'export':
        handleExportSelected();
        break;
      default:
        break;
    }
    setBulkAction('');
  };

  // Export Functions
  const handleExportSelected = () => {
    const selected = employees.filter(emp => selectedEmployees.has(emp.id));
    alert(`Exported ${selected.length} employees to ${exportFormat.toUpperCase()}`);
  };

  const handleExportAll = () => {
    alert(`Exported all ${filteredEmployees.length} employees to ${exportFormat.toUpperCase()}`);
  };

  // Search and Filter Functions
  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      department: 'all',
      status: 'all',
      search: ''
    });
  };

  // View Profile Function
  const handleViewProfile = async (employee) => {
    try {
      // Fetch full employee details including resources and allowances
      const response = await fetch(endpoints.employees.getById(employee.id));
      const data = await response.json();
      
      if (data.success && data.data) {
        // Merge fetched data with local employee data
        const fullEmployee = {
          ...employee,
          ...data.data,
          // Ensure compatibility with existing fields
          name: data.data.name || employee.name,
          email: data.data.email || employee.email,
          phone: data.data.phone || employee.phone,
          department: data.data.department || employee.department,
          designation: data.data.designation || data.data.sub_department || data.data.position || employee.role,
          employee_id: data.data.employee_id || employee.id,
          allowances: data.data.allowances || employee.allowances || [],
          laptop: data.data.laptop || false,
          charger: data.data.charger || false,
          mouse: data.data.mouse || false,
          keyboard: data.data.keyboard || false,
          monitor: data.data.monitor || false,
          mobile: data.data.mobile || false,
          laptop_serial: data.data.laptop_serial || '',
          charger_serial: data.data.charger_serial || '',
          mouse_serial: data.data.mouse_serial || '',
          keyboard_serial: data.data.keyboard_serial || '',
          monitor_serial: data.data.monitor_serial || '',
          mobile_serial: data.data.mobile_serial || '',
          resources_note: data.data.resources_note || ''
        };
        setSelectedProfile(fullEmployee);
      } else {
        setSelectedProfile(employee);
      }
    } catch (error) {
      console.error('Error fetching full employee details:', error);
      setSelectedProfile(employee);
    }
    
    setShowProfileModal(true);
  };

  // Sort Functions
  const handleSortChange = (value) => {
    setSortBy(value);
  };

  // Filter and sort employees
  const filteredEmployees = employees.filter(employee => {
    const matchesDepartment = filters.department === 'all' || employee.department === filters.department;
    const matchesStatus = filters.status === 'all' || employee.status === filters.status;
    const matchesSearch = !filters.search || 
      employee.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      employee.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      employee.role.toLowerCase().includes(filters.search.toLowerCase()) ||
      employee.skills.some(skill => skill.toLowerCase().includes(filters.search.toLowerCase()));
    
    return matchesDepartment && matchesStatus && matchesSearch;
  });

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'attendance':
        return b.attendance - a.attendance;
      case 'projects':
        return b.projects - a.projects;
      case 'recent':
        return b.id - a.id;
      case 'performance':
        const performanceOrder = ['Top Performer', 'Excellent', 'Good', 'Average'];
        return performanceOrder.indexOf(a.performance) - performanceOrder.indexOf(b.performance);
      case 'revenue':
        if (a.department === 'Sales' && b.department === 'Sales') {
          return (b.achieved || 0) - (a.achieved || 0);
        }
        return a.department === 'Sales' ? -1 : b.department === 'Sales' ? 1 : 0;
      case 'projectdones':
        if (a.department === 'Development' && b.department === 'Development') {
          return (b.projectdone || 0) - (a.projectdone || 0);
        }
        return a.department === 'Development' ? -1 : b.department === 'Development' ? 1 : 0;
      case 'hires':
        if (a.department === 'Human Resources' && b.department === 'Human Resources') {
          return (b.hires || 0) - (a.hires || 0);
        }
        return a.department === 'Human Resources' ? -1 : b.department === 'Human Resources' ? 1 : 0;
      case 'designs':
        if (a.department === 'Design' && b.department === 'Design') {
          return (b.designs || 0) - (a.designs || 0);
        }
        return a.department === 'Design' ? -1 : b.department === 'Design' ? 1 : 0;
      default:
        return b.id - a.id;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-sky-100 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse"></div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>

      <div className="relative z-10 p-6">
        {/* Breadcrumb and Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employee Profiles</h1>
              <p className="text-gray-600">Manage HR, Sales, Design, and Development teams</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Export Dropdown */}
              <div className="relative export-dropdown-container">
                <button 
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition duration-200 shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  Export
                  <ChevronDown className="h-4 w-4" />
                </button>
                {showExportDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 animate-fadeIn">
                    <div className="p-2">
                      <button 
                        onClick={() => {
                          handleExportAll();
                          setShowExportDropdown(false);
                        }}
                        className="flex items-center gap-2 p-2 w-full text-left rounded-lg hover:bg-gray-100 transition duration-200"
                      >
                        <FileText className="h-4 w-4" />
                        Export All
                      </button>
                      <button 
                        onClick={() => {
                          if (selectedEmployees.size > 0) {
                            handleBulkAction('export');
                            setShowExportDropdown(false);
                          }
                        }}
                        disabled={selectedEmployees.size === 0}
                        className={`flex items-center gap-2 p-2 w-full text-left rounded-lg transition duration-200 ${selectedEmployees.size === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                      >
                        <Download className="h-4 w-4" />
                        Export Selected ({selectedEmployees.size})
                      </button>
                      <div className="border-t border-gray-200 my-2"></div>
                      <select 
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#349dff]"
                      >
                        <option value="excel">Excel Format</option>
                        <option value="pdf">PDF Format</option>
                        <option value="csv">CSV Format</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Employee Button */}
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#349dff] text-white rounded-xl hover:bg-[#2980db] transition duration-200 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Add Employee
              </button>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Home className="h-4 w-4" />
              <ChevronRight className="h-4 w-4" />
              <span>Employee</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-[#349dff] font-medium">Employee Profiles</span>
            </div>
            <div className="flex items-center gap-2">
              {selectedEmployees.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{selectedEmployees.size} selected</span>
                  <select 
                    value={bulkAction}
                    onChange={(e) => handleBulkAction(e.target.value)}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[#349dff]"
                  >
                    <option value="">Bulk Actions</option>
                    <option value="activate">Activate Selected</option>
                    <option value="deactivate">Deactivate Selected</option>
                    <option value="export">Export Selected</option>
                    <option value="delete">Delete Selected</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-3 rounded-full ${index === 0 ? 'bg-blue-100 text-blue-600' : index === 1 ? 'bg-green-100 text-green-600' : index === 2 ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-500 truncate">{stat.title}</p>
                    <h4 className="text-2xl font-bold text-gray-900">{stat.value}</h4>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs ${stat.badgeColor}`}>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {stat.trend}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees by name, email, role, or skills..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Department Filter */}
              <select 
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff]"
              >
                <option value="all">All Departments</option>
                <option value="Human Resources">HR Department</option>
                <option value="Sales">Sales Department</option>
                <option value="Design">Design Department</option>
                <option value="Development">Development Department</option>
              </select>

              {/* Status Filter */}
              <select 
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* Sort Options */}
              <select 
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff]"
              >
                <option value="recent">Recently Added</option>
                <option value="name">Name A-Z</option>
                <option value="attendance">Attendance</option>
                <option value="projects">Projects</option>
                <option value="performance">Performance</option>
                <option value="revenue">Revenue (Sales)</option>
                <option value="projectdones">Project Done (Dev)</option>
                <option value="hires">Hires (HR)</option>
                <option value="designs">Designs Created</option>
              </select>

              {/* Clear Filters Button */}
              {(filters.search || filters.department !== 'all' || filters.status !== 'all') && (
                <button 
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Employee Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedEmployees.map((employee) => (
            <div key={employee.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 group">
              <div className="p-4">
                {/* Header with checkbox, avatar, and dropdown */}
                <div className="flex justify-between items-start mb-4">
                  <button 
                    onClick={() => handleSelectEmployee(employee.id)}
                    className="p-1"
                  >
                    {selectedEmployees.has(employee.id) ? (
                      <CheckSquare className="h-4 w-4 text-[#349dff]" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-blue-100 p-1 mx-auto cursor-pointer hover:border-blue-300 transition duration-200"
                         onClick={() => handleViewProfile(employee)}>
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition duration-200">
                        <span className="text-gray-700 text-lg font-bold">
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${employee.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  </div>
                  
                  <div className="relative menu-dropdown-container">
                    <button 
                      onClick={() => toggleMenuDropdown(employee.id)}
                      className="p-1 hover:bg-gray-100 rounded-full transition duration-200"
                    >
                      <MoreVertical className="h-5 w-5 text-gray-400" />
                    </button>
                    {showMenuDropdown[employee.id] && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 animate-fadeIn">
                        <div className="p-2">
                          <button 
                            onClick={() => {
                              handleViewProfile(employee);
                              setShowMenuDropdown(prev => ({...prev, [employee.id]: false}));
                            }}
                            className="flex items-center gap-2 p-2 w-full text-left rounded-lg hover:bg-gray-100 transition duration-200"
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                            View Profile
                          </button>
                          <button 
                            onClick={() => {
                              setEditingEmployee(employee);
                              setShowEditModal(true);
                              setShowMenuDropdown(prev => ({...prev, [employee.id]: false}));
                            }}
                            className="flex items-center gap-2 p-2 w-full text-left rounded-lg hover:bg-gray-100 transition duration-200"
                          >
                            <Edit className="h-4 w-4 text-gray-500" />
                            Edit
                          </button>
                          <button 
                            onClick={() => {
                              handleToggleStatus(employee.id);
                              setShowMenuDropdown(prev => ({...prev, [employee.id]: false}));
                            }}
                            className="flex items-center gap-2 p-2 w-full text-left rounded-lg hover:bg-gray-100 transition duration-200"
                          >
                            {employee.status === 'active' ? (
                              <><XCircle className="h-4 w-4 text-gray-500" /> Deactivate</>
                            ) : (
                              <><CheckCircle className="h-4 w-4 text-gray-500" /> Activate</>
                            )}
                          </button>
                        
                          <div className="border-t border-gray-200 my-2"></div>
                          <button 
                            onClick={() => {
                              handleDeleteEmployee(employee.id);
                              setShowMenuDropdown(prev => ({...prev, [employee.id]: false}));
                            }}
                            className="flex items-center gap-2 p-2 w-full text-left rounded-lg hover:bg-red-50 text-red-600 transition duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Employee Info */}
                <div className="text-center mb-4">
                  <h6 className="font-semibold text-lg mb-1">
                    <button 
                      onClick={() => handleViewProfile(employee)}
                      className="hover:text-[#349dff] transition duration-200"
                    >
                      {employee.name}
                    </button>
                  </h6>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${getBadgeColorClass(employee.badgeClass)} flex items-center justify-center gap-2`}>
                    {getRoleIcon(employee.role, employee.department)}
                    {employee.role}
                  </span>
                  <div className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-500">
                    {getDepartmentIcon(employee.department)}
                    {employee.department}
                  </div>
                </div>

                {/* Role-specific Stats */}
                {employee.department === 'Development' ? (
                  <div className="grid grid-cols-3 text-center mb-4 border-t border-b border-gray-100 py-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Projects</p>
                      <h6 className="font-semibold text-lg">{employee.projects}</h6>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">projectdones</p>
                      <h6 className="font-semibold text-lg text-green-600">{employee.projectdone}</h6>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">On Progress</p>
                      <h6 className="font-semibold text-lg text-blue-600">{employee.bugsFixed}</h6>
                    </div>
                  </div>
                ) : employee.department === 'Sales' ? (
                  <div className="grid grid-cols-2 text-center mb-4 border-t border-b border-gray-100 py-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Target</p>
                      <h6 className="font-semibold text-lg">${(employee.target / 1000).toFixed(0)}K</h6>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Achieved</p>
                      <h6 className={`font-semibold text-lg ${employee.achieved >= employee.target ? 'text-green-600' : 'text-orange-600'}`}>
                        ${(employee.achieved / 1000).toFixed(0)}K
                      </h6>
                    </div>
                  </div>
                ) : employee.department === 'Human Resources' ? (
                  <div className="grid grid-cols-3 text-center mb-4 border-t border-b border-gray-100 py-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Hires</p>
                      <h6 className="font-semibold text-lg">{employee.hires}</h6>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Candidates</p>
                      <h6 className="font-semibold text-lg text-green-600">{employee.candidates}</h6>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Interviews</p>
                      <h6 className="font-semibold text-lg text-blue-600">{employee.interviews}</h6>
                    </div>
                  </div>
                ) : employee.department === 'Design' ? (
                  <div className="grid grid-cols-3 text-center mb-4 border-t border-b border-gray-100 py-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Designs</p>
                      <h6 className="font-semibold text-lg">{employee.designs}</h6>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Projects</p>
                      <h6 className="font-semibold text-lg text-purple-600">{employee.projects}</h6>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Revisions</p>
                      <h6 className="font-semibold text-lg text-orange-600">{employee.revisions}</h6>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 text-center mb-4 border-t border-b border-gray-100 py-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Projects</p>
                      <h6 className="font-semibold text-lg">{employee.projects}</h6>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Done</p>
                      <h6 className="font-semibold text-lg text-green-600">{employee.done}</h6>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Progress</p>
                      <h6 className="font-semibold text-lg text-blue-600">{employee.progress}</h6>
                    </div>
                  </div>
                )}

                {/* Skills Section */}
                {/* <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Skills</span>
                    <span className="text-xs text-gray-500">{employee.skills.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {employee.skills.slice(0, 3).map((skill, index) => (
                      <span key={index} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                        {getSkillIcon(skill)}
                        {skill}
                      </span>
                    ))}
                    {employee.skills.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                        +{employee.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div> */}

                {/* Attendance */}
                {/* <div className="mb-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Attendance</span>
                    <span className={`font-bold ${getColorClass(employee.color).split(' ')[0]}`}>
                      {employee.attendance}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getColorClass(employee.color).split(' ')[1]}`}
                      style={{ width: `${employee.attendance}%` }}
                    ></div>
                  </div>
                </div> */}
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <button className="flex items-center gap-2 px-6 py-3 bg-[#349dff] text-white rounded-xl hover:bg-[#2980db] transition duration-200 shadow-sm mx-auto">
            Load More
          </button>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddEmployeeModal 
          onClose={() => setShowAddModal(false)}
          onSave={handleAddEmployee}
        />
      )}

      {showEditModal && editingEmployee && (
        <EditEmployeeModal 
          employee={editingEmployee}
          onClose={() => {
            setShowEditModal(false);
            setEditingEmployee(null);
          }}
          onSave={handleEditEmployee}
        />
      )}

      {showProfileModal && selectedProfile && (
        <ProfileDetailModal 
          employee={selectedProfile}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedProfile(null);
          }}
          onEdit={() => {
            setShowProfileModal(false);
            setEditingEmployee(selectedProfile);
            setShowEditModal(true);
          }}
          onToggleStatus={() => handleToggleStatus(selectedProfile.id)}
          onDelete={() => handleDeleteEmployee(selectedProfile.id)}
          onSendEmail={() => handleSendEmail(selectedProfile.email)}
          onCall={() => handleCall(selectedProfile.phone)}
          onCopyEmail={() => handleCopyEmail(selectedProfile.email)}
          onCopyPhone={() => handleCopyPhone(selectedProfile.phone)}
        />
      )}
    </div>
  );
};

// Modal Components
const AddEmployeeModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    role: '',
    department: '',
    email: '',
    phone: '',
    location: '',
    experience: '',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'active',
    skills: [],
    password: '',
    confirmPassword: ''
  });
  const [currentSkill, setCurrentSkill] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    onSave(formData);
  };

  const handleRoleChange = (role) => {
    const departmentMap = {
      'HR Manager': 'Human Resources',
      'HR Specialist': 'Human Resources',
      'Sales Executive': 'Sales',
      'Graphic Designer': 'Design',
      'Developer': 'Development'
    };

    const defaultSkills = {
      'HR Manager': ['Recruitment', 'Employee Relations', 'HR Policies'],
      'HR Specialist': ['Onboarding', 'Training', 'Benefits Administration'],
      'Sales Executive': ['Sales Strategy', 'Client Relations', 'Negotiation'],
      'Graphic Designer': ['Adobe Creative Suite', 'UI/UX Design', 'Branding'],
      'Developer': ['JavaScript', 'React', 'Node.js']
    };

    setFormData(prev => ({
      ...prev,
      role,
      department: departmentMap[role] || '',
      email: role ? `${prev.name.toLowerCase().replace(/\s+/g, '.')}@company.com` : '',
      username: role ? prev.name.toLowerCase().replace(/\s+/g, '.') : '',
      skills: defaultSkills[role] || []
    }));
  };

  const addSkill = () => {
    if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, currentSkill.trim()]
      }));
      setCurrentSkill('');
    }
  };

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">Add New Employee</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData(prev => ({...prev, name: e.target.value, username: e.target.value.toLowerCase().replace(/\s+/g, '.')}))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff]"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
            <input 
              type="text" 
              value={formData.username}
              onChange={(e) => setFormData(prev => ({...prev, username: e.target.value}))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff]"
              placeholder="Enter username"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select 
              value={formData.role}
              onChange={(e) => handleRoleChange(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff]"
            >
              <option value="">Select Role</option>
              <option value="HR Manager">HR Manager</option>
              <option value="HR Specialist">HR Specialist</option>
              <option value="Sales Executive">Sales Executive</option>
              <option value="Graphic Designer">Graphic Designer</option>
              <option value="Developer">Developer</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
            <input 
              type="text" 
              value={formData.department}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff]"
              placeholder="employee@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input 
              type="tel" 
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
              required
              placeholder="+1 (555) 123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] pr-10"
                  placeholder="Enter password"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({...prev, confirmPassword: e.target.value}))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] pr-10"
                  placeholder="Confirm password"
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input 
              type="text" 
              value={formData.location}
              onChange={(e) => setFormData(prev => ({...prev, location: e.target.value}))}
              placeholder="City, Country"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
            <select 
              value={formData.experience}
              onChange={(e) => setFormData(prev => ({...prev, experience: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff]"
            >
              <option value="">Select Experience</option>
              <option value="0-1 years">0-1 years</option>
              <option value="1-2 years">1-2 years</option>
              <option value="2-5 years">2-5 years</option>
              <option value="5-10 years">5-10 years</option>
              <option value="10+ years">10+ years</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a skill (e.g., React, Sales)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff]"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-3 py-2 bg-[#349dff] text-white rounded-xl hover:bg-[#2980db] transition duration-200"
                >
                  <PlusCircle className="h-5 w-5" />
                </button>
              </div>
              
              {formData.skills.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Added Skills ({formData.skills.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                      >
                        <Tag className="h-3 w-3" />
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(index)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <MinusCircle className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition duration-200"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 text-sm text-white bg-[#349dff] rounded-xl hover:bg-[#2980db] transition duration-200"
            >
              Add Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditEmployeeModal = ({ employee, onClose, onSave }) => {
  // Transform employee data for form compatibility
  const transformEmployeeData = (emp) => {
    // Handle allowances - convert from API format (array) to form format (object) or keep as is
    let formattedAllowances = {};
    if (Array.isArray(emp.allowances)) {
      emp.allowances.forEach(allowance => {
        formattedAllowances[allowance.name?.toLowerCase().replace(/\s+/g, '_') || 'allowance'] = allowance.amount || 0;
      });
    } else if (typeof emp.allowances === 'object') {
      formattedAllowances = emp.allowances;
    } else {
      formattedAllowances = { medical: 0, housing: 0, transport: 0 };
    }

    // Handle resources - convert from API format to form format
    let formattedResources = {
      laptop: { allocated: emp.laptop || false, serialNumber: emp.laptop_serial || '' },
      charger: { allocated: emp.charger || false, serialNumber: emp.charger_serial || '' },
      mouse: { allocated: emp.mouse || false, serialNumber: emp.mouse_serial || '' },
      keyboard: { allocated: emp.keyboard || false, serialNumber: emp.keyboard_serial || '' },
      monitor: { allocated: emp.monitor || false, serialNumber: emp.monitor_serial || '' },
      mobile: { allocated: emp.mobile || false, serialNumber: emp.mobile_serial || '' },
      resourceNotes: emp.resources_note || ''
    };

    return {
      ...emp,
      firstName: emp.name?.split(' ')[0] || 'First',
      lastName: emp.name?.split(' ').slice(1).join(' ') || 'Last',
      username: emp.username || emp.employee_id || emp.email?.split('@')[0] || 'username',
      password: '',
      confirmPassword: '',
      company: emp.company || 'Company',
      employeeId: emp.employee_id || emp.id || `EMP-${String(emp.id).padStart(4, '0')}`,
      about: emp.about || `Experienced ${emp.designation || emp.role} with experience in the ${emp.department} department.`,
      role: emp.designation || emp.role || 'Employee',
      joiningDate: emp.join_date || emp.joiningDate || new Date().toISOString().split('T')[0],
      skills: emp.skills || [],
      resources: formattedResources,
      allowances: formattedAllowances
    };
  };

  const initialData = transformEmployeeData(employee);

  const [formData, setFormData] = useState({
    ...initialData,
    permissions: {
      holidays: { enabled: true, read: true, write: false, create: false, delete: true, import: false, export: false },
      leaves: { enabled: false, read: false, write: false, create: false, delete: false, import: false, export: false },
      clients: { enabled: false, read: false, write: false, create: false, delete: false, import: false, export: false },
      projects: { enabled: false, read: false, write: false, create: false, delete: false, import: false, export: false },
      tasks: { enabled: false, read: false, write: false, create: false, delete: false, import: false, export: false },
      chats: { enabled: false, read: false, write: false, create: false, delete: false, import: false, export: false },
      assets: { enabled: true, read: false, write: false, create: true, delete: false, import: true, export: false },
      timingSheets: { enabled: false, read: false, write: false, create: false, delete: false, import: false, export: false }
    }
  });
  const [currentSkill, setCurrentSkill] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newAllowanceName, setNewAllowanceName] = useState('');
  const [newAllowanceAmount, setNewAllowanceAmount] = useState('');
  const [newResourceName, setNewResourceName] = useState('');
  const [newResourceSerial, setNewResourceSerial] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    const updatedEmployee = {
      ...formData,
      name: `${formData.firstName} ${formData.lastName}`,
      skills: formData.skills,
      // Role-specific metrics
      ...(formData.department === 'Development' ? {
        projectdone: formData.projectdone || employee.projectdone || 0,
        pullRequests: formData.pullRequests || employee.pullRequests || 0,
        bugsFixed: formData.bugsFixed || employee.bugsFixed || 0
      } : formData.department === 'Sales' ? {
        target: formData.target || employee.target || 0,
        achieved: formData.achieved || employee.achieved || 0,
        dealsClosed: formData.dealsClosed || employee.dealsClosed || 0,
        newClients: formData.newClients || employee.newClients || 0
      } : formData.department === 'Human Resources' ? {
        candidates: formData.candidates || employee.candidates || 0,
        interviews: formData.interviews || employee.interviews || 0,
        hires: formData.hires || employee.hires || 0
      } : formData.department === 'Design' ? {
        designs: formData.designs || employee.designs || 0,
        revisions: formData.revisions || employee.revisions || 0
      } : {})
    };
    
    // Include resources and allowances
    updatedEmployee.resources = formData.resources;
    updatedEmployee.allowances = formData.allowances;
    
    // Remove unnecessary fields
    delete updatedEmployee.firstName;
    delete updatedEmployee.lastName;
    delete updatedEmployee.username;
    delete updatedEmployee.password;
    delete updatedEmployee.confirmPassword;
    delete updatedEmployee.company;
    delete updatedEmployee.employeeId;
    delete updatedEmployee.about;
    delete updatedEmployee.permissions;
    
    onSave(updatedEmployee);
  };

  const addSkill = () => {
    if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, currentSkill.trim()]
      }));
      setCurrentSkill('');
    }
  };

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const handlePermissionChange = (module, field, value) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [field]: value
        }
      }
    }));
  };

  const handleSelectAll = (value) => {
    const updatedPermissions = { ...formData.permissions };
    Object.keys(updatedPermissions).forEach(module => {
      updatedPermissions[module] = {
        ...updatedPermissions[module],
        read: value,
        write: value,
        create: value,
        delete: value,
        import: value,
        export: value
      };
    });
    setFormData(prev => ({
      ...prev,
      permissions: updatedPermissions
    }));
  };

  const handleEnableAll = (value) => {
    const updatedPermissions = { ...formData.permissions };
    Object.keys(updatedPermissions).forEach(module => {
      updatedPermissions[module].enabled = value;
    });
    setFormData(prev => ({
      ...prev,
      permissions: updatedPermissions
    }));
  };

  const departments = [
    'All Department',
    'Human Resources',
    'Sales',
    'Design',
    'Development',
    'Finance',
    'Marketing',
    'Operations'
  ];

  const designations = [
    'Finance',
    'HR Manager',
    'Sales Executive',
    'Developer',
    'Graphic Designer',
    'Project Manager',
    'Team Lead',
    'Analyst'
  ];

  const renderRoleSpecificFields = () => {
    switch (formData.department) {
      case 'Development':
        return (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Done</label>
              <input 
                type="number"
                value={formData.projectdone || employee.projectdone || 0}
                onChange={(e) => setFormData(prev => ({...prev, projectdone: parseInt(e.target.value) || 0}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pending</label>
              <input 
                type="number"
                value={formData.pullRequests || employee.pullRequests || 0}
                onChange={(e) => setFormData(prev => ({...prev, pullRequests: parseInt(e.target.value) || 0}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">On Progress</label>
              <input 
                type="number"
                value={formData.bugsFixed || employee.bugsFixed || 0}
                onChange={(e) => setFormData(prev => ({...prev, bugsFixed: parseInt(e.target.value) || 0}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );
      case 'Sales':
        return (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target ($)</label>
              <input 
                type="number"
                value={formData.target || employee.target || 0}
                onChange={(e) => setFormData(prev => ({...prev, target: parseInt(e.target.value) || 0}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Achieved ($)</label>
              <input 
                type="number"
                value={formData.achieved || employee.achieved || 0}
                onChange={(e) => setFormData(prev => ({...prev, achieved: parseInt(e.target.value) || 0}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deals Closed</label>
              <input 
                type="number"
                value={formData.dealsClosed || employee.dealsClosed || 0}
                onChange={(e) => setFormData(prev => ({...prev, dealsClosed: parseInt(e.target.value) || 0}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Clients</label>
              <input 
                type="number"
                value={formData.newClients || employee.newClients || 0}
                onChange={(e) => setFormData(prev => ({...prev, newClients: parseInt(e.target.value) || 0}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );
      case 'Human Resources':
        return (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Candidates</label>
              <input 
                type="number"
                value={formData.candidates || employee.candidates || 0}
                onChange={(e) => setFormData(prev => ({...prev, candidates: parseInt(e.target.value) || 0}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interviews</label>
              <input 
                type="number"
                value={formData.interviews || employee.interviews || 0}
                onChange={(e) => setFormData(prev => ({...prev, interviews: parseInt(e.target.value) || 0}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hires</label>
              <input 
                type="number"
                value={formData.hires || employee.hires || 0}
                onChange={(e) => setFormData(prev => ({...prev, hires: parseInt(e.target.value) || 0}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );
      case 'Design':
        return (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Designs Created</label>
              <input 
                type="number"
                value={formData.designs || employee.designs || 0}
                onChange={(e) => setFormData(prev => ({...prev, designs: parseInt(e.target.value) || 0}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Revisions</label>
              <input 
                type="number"
                value={formData.revisions || employee.revisions || 0}
                onChange={(e) => setFormData(prev => ({...prev, revisions: parseInt(e.target.value) || 0}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderBasicInfoTab = () => (
    <>
      <div className="modal-body pb-0 px-6 pt-6">
        <div className="row">
          <div className="col-span-12">
            <div className="flex items-center flex-wrap gap-3 bg-gray-50 w-full rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-center w-24 h-24 rounded-full border-2 border-dashed border-gray-300 mr-4 flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <span className="text-gray-700 text-2xl font-bold">
                    {formData.firstName[0]}{formData.lastName[0]}
                  </span>
                </div>
              </div>
              <div className="profile-upload flex-1">
                <div className="mb-2">
                  <h6 className="font-semibold text-gray-900 mb-1">Upload Profile Image</h6>
                  <p className="text-sm text-gray-500">Image should be below 4 mb</p>
                </div>
                <div className="profile-uploader flex items-center">
                  <button className="relative px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 text-sm mr-3">
                    Upload
                    <input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      accept="image/*"
                    />
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200 text-sm">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({...prev, firstName: e.target.value}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input 
                type="text" 
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({...prev, lastName: e.target.value}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={formData.employeeId}
                onChange={(e) => setFormData(prev => ({...prev, employeeId: e.target.value}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Joining Date <span className="text-red-500">*</span></label>
              <div className="relative">
                <input 
                  type="date" 
                  value={formData.joiningDate}
                  onChange={(e) => setFormData(prev => ({...prev, joiningDate: e.target.value}))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Calendar className="h-5 w-5 absolute right-3 top-3.5 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={formData.username}
                onChange={(e) => setFormData(prev => ({...prev, username: e.target.value}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  placeholder="Leave blank to keep current"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  <Eye className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({...prev, confirmPassword: e.target.value}))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  placeholder="Leave blank to keep current"
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  <Eye className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number <span className="text-red-500">*</span></label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={formData.company}
                onChange={(e) => setFormData(prev => ({...prev, company: e.target.value}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select 
                value={formData.department}
                onChange={(e) => setFormData(prev => ({...prev, department: e.target.value}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
              <select 
                value={formData.role}
                onChange={(e) => setFormData(prev => ({...prev, role: e.target.value}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {designations.map(des => (
                  <option key={des} value={des}>{des}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Role-specific fields */}
          {renderRoleSpecificFields()}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">About <span className="text-red-500">*</span></label>
            <textarea 
              value={formData.about}
              onChange={(e) => setFormData(prev => ({...prev, about: e.target.value}))}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a new skill"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-200"
                >
                  <PlusCircle className="h-5 w-5" />
                </button>
              </div>
              
              {formData.skills.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Skills ({formData.skills.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded-full"
                      >
                        <Tag className="h-3 w-3" />
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(index)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <MinusCircle className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-footer p-6 border-t border-gray-200">
        <button 
          type="button"
          onClick={onClose}
          className="px-6 py-3 text-sm text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition duration-200 border border-gray-300 mr-3"
        >
          Cancel
        </button>
        <button 
          type="button"
          onClick={handleSubmit}
          className="px-6 py-3 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition duration-200"
        >
          Save
        </button>
      </div>
    </>
  );

  const renderResourcesAllowancesTab = () => (
    <>
      <div className="modal-body pb-0 px-6 pt-6">
        {/* Resources Allocated Section */}
        <div className="mb-8">
          <h5 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
              <span className="text-yellow-600 text-lg">📦</span>
            </div>
            Resources Allocated
          </h5>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            {Object.entries(formData.resources).map(([key, value]) => {
              // Skip the resourceNotes field
              if (key === 'resourceNotes' || typeof value !== 'object' || !value.allocated !== undefined) return null;
              
              return (
                <div key={key} className="border border-gray-200 rounded-xl p-4 relative">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={value.allocated || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          resources: {
                            ...prev.resources,
                            [key]: { ...value, allocated: e.target.checked }
                          }
                        }))}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <label className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/_/g, ' ')}
                      </label>
                    </div>
                    {/* Delete button for custom resources (not default ones) */}
                    {!['laptop', 'charger', 'mouse', 'keyboard', 'monitor', 'mobile'].includes(key) && (
                      <button
                        type="button"
                        onClick={() => {
                          const updatedResources = { ...formData.resources };
                          delete updatedResources[key];
                          setFormData(prev => ({
                            ...prev,
                            resources: updatedResources
                          }));
                        }}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {(value.allocated || value.serialNumber) && (
                    <input 
                      type="text" 
                      placeholder="Serial #"
                      value={value.serialNumber || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        resources: {
                          ...prev.resources,
                          [key]: { ...value, serialNumber: e.target.value }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Resources Note */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Resources Note</label>
            <textarea 
              placeholder="Add any notes about resources..."
              value={formData.resources.resourceNotes}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                resources: {
                  ...prev.resources,
                  resourceNotes: e.target.value
                }
              }))}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Add New Resource */}
          <div className="mt-6 bg-yellow-50 rounded-xl p-4">
            <h6 className="text-sm font-semibold text-gray-900 mb-3">Add New Resource</h6>
            <div className="flex gap-3">
              <input 
                type="text"
                placeholder="Resource name (e.g., Desk, Chair, Headset)"
                value={newResourceName}
                onChange={(e) => setNewResourceName(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <input 
                type="text"
                placeholder="Serial #"
                value={newResourceSerial}
                onChange={(e) => setNewResourceSerial(e.target.value)}
                className="w-40 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  if (newResourceName.trim() && newResourceSerial.trim()) {
                    setFormData(prev => ({
                      ...prev,
                      resources: {
                        ...prev.resources,
                        [newResourceName.toLowerCase().replace(/\s+/g, '_')]: {
                          allocated: true,
                          serialNumber: newResourceSerial
                        }
                      }
                    }));
                    setNewResourceName('');
                    setNewResourceSerial('');
                  }
                }}
                className="px-4 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition duration-200 flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Allowances Section */}
        <div className="mb-6">
          <h5 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 text-lg">💰</span>
            </div>
            Allowances
          </h5>
          
          {/* Existing Allowances */}
          <div className="space-y-3 mb-6">
            {Object.entries(formData.allowances).map(([key, value]) => (
              <div key={key} className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {key} <span className="text-gray-500">PKR</span>
                  </label>
                  <input 
                    type="number"
                    value={value}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      allowances: {
                        ...prev.allowances,
                        [key]: parseFloat(e.target.value) || 0
                      }
                    }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Enter ${key} allowance`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const updatedAllowances = { ...formData.allowances };
                    delete updatedAllowances[key];
                    setFormData(prev => ({
                      ...prev,
                      allowances: updatedAllowances
                    }));
                  }}
                  className="px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Allowance */}
          <div className="bg-blue-50 rounded-xl p-4">
            <h6 className="text-sm font-semibold text-gray-900 mb-3">Add New Allowance</h6>
            <div className="flex gap-3">
              <input 
                type="text"
                placeholder="Allowance name (e.g., Housing, Transport)"
                value={newAllowanceName}
                onChange={(e) => setNewAllowanceName(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <input 
                type="number"
                placeholder="Amount (PKR)"
                value={newAllowanceAmount}
                onChange={(e) => setNewAllowanceAmount(e.target.value)}
                className="w-32 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  if (newAllowanceName.trim()) {
                    setFormData(prev => ({
                      ...prev,
                      allowances: {
                        ...prev.allowances,
                        [newAllowanceName.toLowerCase().replace(/\s+/g, '_')]: parseFloat(newAllowanceAmount) || 0
                      }
                    }));
                    setNewAllowanceName('');
                    setNewAllowanceAmount('');
                  }
                }}
                className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-200 flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-footer p-6 border-t border-gray-200">
        <button 
          type="button"
          onClick={onClose}
          className="px-6 py-3 text-sm text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition duration-200 border border-gray-300 mr-3"
        >
          Cancel
        </button>
        <button 
          type="button"
          onClick={handleSubmit}
          className="px-6 py-3 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition duration-200"
        >
          Save
        </button>
      </div>
    </>
  );

  const renderPermissionsTab = () => (
    <>
      <div className="modal-body pb-0 px-6 pt-6">
        <div className="card bg-gray-50 rounded-2xl shadow-none mb-6">
          <div className="card-body flex items-center justify-between flex-wrap gap-3">
            <h6 className="font-semibold text-gray-900">Enable Options</h6>
            <div className="flex items-center justify-end gap-4">
              <div className="flex items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    onChange={(e) => handleEnableAll(e.target.checked)}
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ms-3 text-sm font-medium text-gray-700">Enable all Module</span>
                </label>
              </div>
              <div className="flex items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <span className="ms-2 text-sm font-medium text-gray-700">Select All</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="table-responsive border border-gray-200 rounded-2xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="divide-y divide-gray-200">
              {Object.entries(formData.permissions).map(([module, permissions]) => (
                <tr key={module} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={permissions.enabled}
                          onChange={(e) => handlePermissionChange(module, 'enabled', e.target.checked)}
                        />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ms-3 text-sm font-medium text-gray-900 capitalize">{module}</span>
                      </label>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        checked={permissions.read}
                        onChange={(e) => handlePermissionChange(module, 'read', e.target.checked)}
                      />
                      <span className="ms-2 text-sm text-gray-700">Read</span>
                    </label>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        checked={permissions.write}
                        onChange={(e) => handlePermissionChange(module, 'write', e.target.checked)}
                      />
                      <span className="ms-2 text-sm text-gray-700">Write</span>
                    </label>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        checked={permissions.create}
                        onChange={(e) => handlePermissionChange(module, 'create', e.target.checked)}
                      />
                      <span className="ms-2 text-sm text-gray-700">Create</span>
                    </label>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        checked={permissions.delete}
                        onChange={(e) => handlePermissionChange(module, 'delete', e.target.checked)}
                      />
                      <span className="ms-2 text-sm text-gray-700">Delete</span>
                    </label>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        checked={permissions.import}
                        onChange={(e) => handlePermissionChange(module, 'import', e.target.checked)}
                      />
                      <span className="ms-2 text-sm text-gray-700">Import</span>
                    </label>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        checked={permissions.export}
                        onChange={(e) => handlePermissionChange(module, 'export', e.target.checked)}
                      />
                      <span className="ms-2 text-sm text-gray-700">Export</span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="modal-footer p-6 border-t border-gray-200">
        <button 
          type="button"
          onClick={onClose}
          className="px-6 py-3 text-sm text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition duration-200 border border-gray-300 mr-3"
        >
          Cancel
        </button>
        <button 
          type="button"
          onClick={handleSubmit}
          className="px-6 py-3 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition duration-200"
        >
          Save
        </button>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center">
            <h4 className="text-lg font-semibold text-gray-900 mr-3">Edit Employee</h4>
            <span className="text-sm text-gray-600">Employee ID : {formData.employeeId}</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 pt-6">
            <ul className="flex border-b border-gray-200" role="tablist">
              <li className="mr-2" role="presentation">
                <button
                  className={`px-4 py-3 text-sm font-medium rounded-t-lg ${activeTab === 'basic' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('basic')}
                  type="button"
                >
                  Basic Information
                </button>
              </li>
              <li className="mr-2" role="presentation">
                <button
                  className={`px-4 py-3 text-sm font-medium rounded-t-lg ${activeTab === 'resources' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('resources')}
                  type="button"
                >
                  Resources & Allowances
                </button>
              </li>
              <li role="presentation">
                <button
                  className={`px-4 py-3 text-sm font-medium rounded-t-lg ${activeTab === 'permissions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('permissions')}
                  type="button"
                >
                  Permissions
                </button>
              </li>
            </ul>
          </div>
          
          <div className="tab-content">
            {activeTab === 'basic' ? renderBasicInfoTab() : activeTab === 'resources' ? renderResourcesAllowancesTab() : renderPermissionsTab()}
          </div>
        </form>
      </div>
    </div>
  );
};

// Updated ProfileDetailModal component
const ProfileDetailModal = ({ employee, onClose, onEdit, onToggleStatus, onDelete, onSendEmail, onCall, onCopyEmail, onCopyPhone }) => {
  // Define getSkillIcon function inside the ProfileDetailModal component
  const getSkillIcon = (skill) => {
    const skillLower = skill.toLowerCase();
    if (skillLower.includes('react') || skillLower.includes('javascript') || skillLower.includes('node')) {
      return <Code className="h-3 w-3" />;
    } else if (skillLower.includes('aws') || skillLower.includes('docker') || skillLower.includes('postgres')) {
      return <Database className="h-3 w-3" />;
    } else if (skillLower.includes('adobe') || skillLower.includes('photoshop') || skillLower.includes('figma')) {
      return <Palette className="h-3 w-3" />;
    } else if (skillLower.includes('sales') || skillLower.includes('crm') || skillLower.includes('lead')) {
      return <Target className="h-3 w-3" />;
    } else if (skillLower.includes('hr') || skillLower.includes('training') || skillLower.includes('recruitment')) {
      return <Shield className="h-3 w-3" />;
    }
    return <Layers className="h-3 w-3" />;
  };

  const renderRoleSpecificMetrics = () => {
    switch (employee.department) {
      case 'Development':
        return (
          <>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-sm text-green-600">Project Done</div>
              </div>
              <div className="text-2xl font-bold">{employee.projectdone || 0}</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <GitBranch className="h-4 w-4 text-orange-600" />
                <div className="text-sm text-orange-600">Pending</div>
              </div>
              <div className="text-2xl font-bold">{employee.pullRequests || 0}</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Bug className="h-4 w-4 text-purple-600" />
                <div className="text-sm text-purple-600">On Progress</div>
              </div>
              <div className="text-2xl font-bold">{employee.bugsFixed || 0}</div>
            </div>
          </>
        );
      case 'Sales':
        return (
          <>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-green-600" />
                <div className="text-sm text-green-600">Revenue Target</div>
              </div>
              <div className="text-2xl font-bold">${(employee.target || 0).toLocaleString()}</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Dollar className="h-4 w-4 text-blue-600" />
                <div className="text-sm text-blue-600">Revenue Achieved</div>
              </div>
              <div className={`text-2xl font-bold ${employee.achieved >= employee.target ? 'text-green-600' : 'text-orange-600'}`}>
                ${(employee.achieved || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-purple-600" />
                <div className="text-sm text-purple-600">Deals Closed</div>
              </div>
              <div className="text-2xl font-bold">{employee.dealsClosed || 0}</div>
            </div>
          </>
        );
      case 'Human Resources':
        return (
          <>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <UsersIcon className="h-4 w-4 text-green-600" />
                <div className="text-sm text-green-600">Hires</div>
              </div>
              <div className="text-2xl font-bold">{employee.hires || 0}</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-blue-600" />
                <div className="text-sm text-blue-600">Candidates</div>
              </div>
              <div className="text-2xl font-bold">{employee.candidates || 0}</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <ClipboardList className="h-4 w-4 text-orange-600" />
                <div className="text-sm text-orange-600">Interviews</div>
              </div>
              <div className="text-2xl font-bold">{employee.interviews || 0}</div>
            </div>
          </>
        );
      case 'Design':
        return (
          <>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <PaletteIcon className="h-4 w-4 text-green-600" />
                <div className="text-sm text-green-600">Designs Created</div>
              </div>
              <div className="text-2xl font-bold">{employee.designs || 0}</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className="h-4 w-4 text-orange-600" />
                <div className="text-sm text-orange-600">Revisions</div>
              </div>
              <div className="text-2xl font-bold">{employee.revisions || 0}</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-purple-600" />
                <div className="text-sm text-purple-600">Projects</div>
              </div>
              <div className="text-2xl font-bold">{employee.projects || 0}</div>
            </div>
          </>
        );
      default:
        return (
          <>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-sm text-blue-600">Projects</div>
              <div className="text-2xl font-bold">{employee.projects || 0}</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-sm text-green-600">Done</div>
              <div className="text-2xl font-bold">{employee.done || 0}</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <div className="text-sm text-orange-600">Progress</div>
              <div className="text-2xl font-bold">{employee.progress || 0}</div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">Employee Profile Details</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Column - Profile Info */}
            <div className="md:w-1/3">
              <div className="text-center">
                <div className="w-32 h-32 rounded-full border-4 border-blue-100 p-1 mx-auto mb-4">
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-700 text-3xl font-bold">
                      {employee.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{employee.name}</h2>
                <p className="text-gray-600">{employee.role}</p>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-gray-600">{employee.email}</div>
                    <div className="flex gap-2 mt-1">
                      <button 
                        onClick={onSendEmail}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Email
                      </button>
                      <button 
                        onClick={onCopyEmail}
                        className="text-xs text-gray-600 hover:text-gray-800"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-gray-600">{employee.phone}</div>
                    <div className="flex gap-2 mt-1">
                      <button 
                        onClick={onCall}
                        className="text-xs text-green-600 hover:text-green-800"
                      >
                        Call
                      </button>
                      <button 
                        onClick={onCopyPhone}
                        className="text-xs text-gray-600 hover:text-gray-800"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{employee.department}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{employee.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Joined {employee.joiningDate}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{employee.experience}</span>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-2">Quick Actions</h4>
                <div className="space-y-2">
                  <button 
                    onClick={onEdit}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition duration-200"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </button>
                  <button 
                    onClick={onToggleStatus}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-600 rounded-xl hover:bg-yellow-100 transition duration-200"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {employee.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button 
                    onClick={onSendEmail}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition duration-200"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Send Message
                  </button>
                  <button 
                    onClick={onDelete}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Detailed Info */}
            <div className="md:w-2/3">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarDays className="h-4 w-4 text-blue-600" />
                    <div className="text-sm text-blue-600">Attendance</div>
                  </div>
                  <div className="text-2xl font-bold">{employee.attendance}%</div>
                </div>
                {renderRoleSpecificMetrics()}
              </div>

              {employee.department === 'Sales' && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Sales Performance</h4>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Target Achievement</span>
                    <span className={`font-bold ${(employee.achieved / employee.target * 100) >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                      {Math.round(employee.achieved / employee.target * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full ${(employee.achieved / employee.target * 100) >= 100 ? 'bg-green-500' : 'bg-orange-500'}`}
                      style={{ width: `${Math.min(employee.achieved / employee.target * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <div>
                      <div className="font-medium">Deals Closed</div>
                      <div className="text-lg font-bold">{employee.dealsClosed}</div>
                    </div>
                    <div>
                      <div className="font-medium">New Clients</div>
                      <div className="text-lg font-bold">{employee.newClients}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Skills & Expertise</h4>
                <div className="flex flex-wrap gap-2">
                  {employee.skills.map((skill, index) => (
                    <span key={index} className="inline-flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-800 rounded-lg">
                      {getSkillIcon(skill)}
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Attendance Trend</h4>
                <div className="flex items-center justify-between mb-2">
                  <span>Current Rate</span>
                  <span className="font-bold text-blue-600">{employee.attendance}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full"
                    style={{ width: `${employee.attendance}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={onToggleStatus}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 transition duration-200"
                >
                  {employee.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <button 
                  onClick={onDelete}
                  className="flex-1 px-4 py-2 text-sm bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition duration-200"
                >
                  Delete Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
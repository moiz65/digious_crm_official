import { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, CheckCircle, XCircle, RefreshCw, Calendar, 
  DollarSign, FileText, Target, Clock, LogIn, LogOut, Settings, 
  Shield, BarChart3, UserPlus, Building, Download, Upload, Filter, 
  Search, MoreVertical, Edit, Trash2, Eye, Briefcase, CreditCard, 
  PieChart, MessageSquare, ClipboardList, Mail, Star, Wallet,
  ShoppingCart, Phone, UserCheck, Key, Database, Plus,
  Save, X, ArrowUpDown, CheckSquare, Square, ChevronDown,
  ChevronRight, Home, MapPin, Globe, Award, Zap,
  BarChart, CreditCard as Card, ShoppingBag, Tag,
  FileCheck, MessageCircle, ThumbsUp, AlertTriangle,
  PieChart as ChartPie, Target as Bullseye, Rocket,
  Cpu, Server, Database as Db, Network, ShieldCheck,
  Bell, Palette, Monitor, Smartphone, Wifi,
  Activity // Added missing import
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
// import TopNavMenu from './TopNavMenu';

export function SuperAdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  // Get current module from URL
  const getCurrentModule = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'dashboard';
    if (path === '/attendance') return 'attendance';
    if (path === '/activity-tracker') return 'activity-tracker';
    if (path === '/employees') return 'employees';
    if (path === '/application-memos') return 'application-memos';
    if (path === '/employee-feedback') return 'employee-feedback';
    if (path === '/payroll') return 'payroll';
    if (path === '/expenses') return 'expenses';
    if (path === '/sales') return 'sales';
    if (path === '/customers') return 'customers';
    if (path === '/leads') return 'leads';
    if (path === '/projects') return 'projects';
    if (path === '/user-roles') return 'user-roles';
    if (path === '/system-config') return 'system-config';
    return 'dashboard';
  };

  const currentModule = getCurrentModule();

  // Sample Data
  const [dashboardData, setDashboardData] = useState({
    totalEmployees: 156,
    activeEmployees: 142,
    monthlyRevenue: 450000,
    monthlyTarget: 750000,
    totalProjects: 89,
    ongoingProjects: 23,
    attendanceRate: 94.2,
    pendingLeads: 34,
    totalCustomers: 289,
    revenueGrowth: 12.5,
    employeeGrowth: 5.2
  });

  const [employees, setEmployees] = useState([
    { 
      id: 1, 
      name: 'John Smith', 
      email: 'john@company.com', 
      department: 'Sales', 
      position: 'Manager', 
      status: 'active',
      joinDate: '2023-01-15',
      salary: 75000,
      phone: '+1 (555) 123-4567',
      avatar: '/avatars/john.jpg'
    },
    { 
      id: 2, 
      name: 'Sarah Johnson', 
      email: 'sarah@company.com', 
      department: 'Marketing', 
      position: 'Director', 
      status: 'active',
      joinDate: '2022-08-20',
      salary: 85000,
      phone: '+1 (555) 123-4568',
      avatar: '/avatars/sarah.jpg'
    },
    { 
      id: 3, 
      name: 'Mike Chen', 
      email: 'mike@company.com', 
      department: 'Production', 
      position: 'Senior Developer', 
      status: 'active',
      joinDate: '2023-03-10',
      salary: 95000,
      phone: '+1 (555) 123-4569',
      avatar: '/avatars/mike.jpg'
    }
  ]);

  const [attendance, setAttendance] = useState([
    { id: 1, employeeId: 1, employee: 'John Smith', date: '2024-01-15', checkIn: '09:00', checkOut: '17:00', status: 'Present', hours: 8 },
    { id: 2, employeeId: 2, employee: 'Sarah Johnson', date: '2024-01-15', checkIn: '09:15', checkOut: '17:30', status: 'Late', hours: 8.25 },
    { id: 3, employeeId: 3, employee: 'Mike Chen', date: '2024-01-15', checkIn: '08:45', checkOut: '17:15', status: 'Present', hours: 8.5 }
  ]);

  const [leads, setLeads] = useState([
    { 
      id: 1, 
      name: 'TechCorp Inc', 
      contact: 'bob@techcorp.com', 
      phone: '+1 (555) 987-6543',
      status: 'New', 
      value: 50000, 
      source: 'Website',
      created: '2024-01-10',
      lastContact: '2024-01-10',
      priority: 'High'
    },
    { 
      id: 2, 
      name: 'Global Solutions', 
      contact: 'alice@global.com', 
      phone: '+1 (555) 987-6544',
      status: 'Contacted', 
      value: 75000, 
      source: 'Referral',
      created: '2024-01-08',
      lastContact: '2024-01-12',
      priority: 'Medium'
    }
  ]);

  const [payroll, setPayroll] = useState([
    { 
      id: 1, 
      employeeId: 1,
      employee: 'John Smith', 
      department: 'Sales', 
      salary: 75000, 
      bonus: 5000, 
      status: 'Paid',
      payPeriod: 'January 2024',
      netPay: 5833
    },
    { 
      id: 2, 
      employeeId: 2,
      employee: 'Sarah Johnson', 
      department: 'Marketing', 
      salary: 85000, 
      bonus: 3000, 
      status: 'Pending',
      payPeriod: 'January 2024',
      netPay: 6583
    }
  ]);

  const [userRoles, setUserRoles] = useState([
    { 
      id: 1, 
      name: 'Super Admin', 
      permissions: ['all'], 
      users: 1,
      description: 'Full system access with all privileges'
    },
    { 
      id: 2, 
      name: 'Manager', 
      permissions: ['employees', 'attendance', 'projects'], 
      users: 8,
      description: 'Department management access'
    },
    { 
      id: 3, 
      name: 'Employee', 
      permissions: ['basic'], 
      users: 147,
      description: 'Basic system access for regular employees'
    }
  ]);

  const [activities, setActivities] = useState([
    { id: 1, user: 'John Smith', action: 'Logged in', timestamp: new Date(Date.now() - 300000), details: 'System access', type: 'login' },
    { id: 2, user: 'Sarah Johnson', action: 'Updated project', timestamp: new Date(Date.now() - 600000), details: 'Project Alpha milestones', type: 'update' },
    { id: 3, user: 'Mike Chen', action: 'Created lead', timestamp: new Date(Date.now() - 900000), details: 'New lead: TechCorp Inc', type: 'create' }
  ]);

  const [projects, setProjects] = useState([
    {
      id: 1,
      name: 'Website Redesign',
      status: 'In Progress',
      progress: 65,
      deadline: '2024-03-15',
      team: ['John Smith', 'Sarah Johnson'],
      budget: 50000
    },
    {
      id: 2,
      name: 'Mobile App Development',
      status: 'Planning',
      progress: 20,
      deadline: '2024-06-30',
      team: ['Mike Chen'],
      budget: 120000
    }
  ]);

  const [expenses, setExpenses] = useState([
    {
      id: 1,
      category: 'Software',
      description: 'Annual subscription',
      amount: 1200,
      date: '2024-01-10',
      status: 'Approved'
    },
    {
      id: 2,
      category: 'Office Supplies',
      description: 'Monthly stationery',
      amount: 450,
      date: '2024-01-12',
      status: 'Pending'
    }
  ]);

  // Filter data based on search
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Employee Management Functions
  const handleAddEmployee = (employeeData) => {
    const newEmployee = {
      id: Math.max(...employees.map(e => e.id)) + 1,
      ...employeeData,
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0]
    };
    setEmployees(prev => [...prev, newEmployee]);
    setDashboardData(prev => ({
      ...prev,
      totalEmployees: prev.totalEmployees + 1,
      activeEmployees: prev.activeEmployees + 1
    }));
  };

  const handleUpdateEmployee = (employeeData) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === employeeData.id ? { ...emp, ...employeeData } : emp
    ));
    setEditingEmployee(null);
  };

  const handleDeleteEmployee = (id) => {
    const employee = employees.find(emp => emp.id === id);
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    setDashboardData(prev => ({
      ...prev,
      totalEmployees: prev.totalEmployees - 1,
      activeEmployees: prev.activeEmployees - (employee.status === 'active' ? 1 : 0)
    }));
  };

  const handleToggleEmployeeStatus = (id) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === id ? { ...emp, status: emp.status === 'active' ? 'inactive' : 'active' } : emp
    ));
  };

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
        setEmployees(prev => prev.filter(emp => !selectedEmployees.has(emp.id)));
        setSelectedEmployees(new Set());
        break;
      default:
        break;
    }
  };

  const handleSelectEmployee = (id) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEmployees(newSelected);
  };

  const handleSelectAllEmployees = () => {
    if (selectedEmployees.size === filteredEmployees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(filteredEmployees.map(emp => emp.id)));
    }
  };

  // Lead Management Functions
  const handleAddLead = (leadData) => {
    const newLead = {
      id: Math.max(...leads.map(l => l.id)) + 1,
      ...leadData,
      created: new Date().toISOString().split('T')[0],
      lastContact: new Date().toISOString().split('T')[0]
    };
    setLeads(prev => [...prev, newLead]);
    setDashboardData(prev => ({
      ...prev,
      pendingLeads: prev.pendingLeads + 1
    }));
  };

  const handleUpdateLeadStatus = (leadId, newStatus) => {
    setLeads(prev => prev.map(lead => 
      lead.id === leadId ? { 
        ...lead, 
        status: newStatus,
        lastContact: new Date().toISOString().split('T')[0]
      } : lead
    ));
  };

  const handleDeleteLead = (leadId) => {
    const lead = leads.find(l => l.id === leadId);
    setLeads(prev => prev.filter(lead => lead.id !== leadId));
    if (lead.status === 'New') {
      setDashboardData(prev => ({
        ...prev,
        pendingLeads: Math.max(0, prev.pendingLeads - 1)
      }));
    }
  };

  // Payroll Functions
  const handleProcessPayroll = (payrollId) => {
    setPayroll(prev => prev.map(pay => 
      pay.id === payrollId ? { ...pay, status: 'Paid' } : pay
    ));
  };

  const handleProcessAllPayroll = () => {
    setPayroll(prev => prev.map(pay => ({ ...pay, status: 'Paid' })));
  };

  // Attendance Functions
  const handleAddAttendance = (attendanceData) => {
    const newAttendance = {
      id: Math.max(...attendance.map(a => a.id)) + 1,
      ...attendanceData
    };
    setAttendance(prev => [...prev, newAttendance]);
  };

  // Role Management Functions
  const handleUpdateRole = (roleId, updates) => {
    setUserRoles(prev => prev.map(role => 
      role.id === roleId ? { ...role, ...updates } : role
    ));
  };

  // Get page title based on current module
  const getPageTitle = () => {
    const titles = {
      'dashboard': 'Dashboard Overview',
      'attendance': 'Attendance Management',
      'activity-tracker': 'Activity Tracker',
      'employees': 'Employee Management',
      'application-memos': 'Applications & Memos',
      'employee-feedback': 'Employee Feedback',
      'payroll': 'Payroll Management',
      'expenses': 'Expenses Management',
      'sales': 'Sales Performance',
      'customers': 'Customer Management',
      'leads': 'Leads Management',
      'projects': 'Project Management',
      'user-roles': 'User Roles & Permissions',
      'system-config': 'System Configuration'
    };
    return titles[currentModule] || 'Dashboard';
  };

  // Render Content based on current module
  const renderContent = () => {
    switch (currentModule) {
      case 'dashboard':
        return <DashboardContent data={dashboardData} navigate={navigate} />;
      
      case 'attendance':
        return <AttendanceContent 
          data={attendance} 
          employees={employees}
          onAddAttendance={() => setShowAttendanceModal(true)}
        />;
      
      case 'employees':
        return <EmployeesContent 
          data={filteredEmployees}
          selectedEmployees={selectedEmployees}
          onAddEmployee={() => setShowUserModal(true)}
          onEditEmployee={setEditingEmployee}
          onDeleteEmployee={handleDeleteEmployee}
          onToggleStatus={handleToggleEmployeeStatus}
          onBulkAction={handleBulkAction}
          onSelectEmployee={handleSelectEmployee}
          onSelectAll={handleSelectAllEmployees}
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
        />;
      
      case 'activity-tracker':
        return <ActivityContent data={activities} />;
      
      case 'application-memos':
        return <ApplicationsContent />;
      
      case 'employee-feedback':
        return <FeedbackContent />;
      
      case 'payroll':
        return <PayrollContent 
          data={payroll} 
          onProcessPayroll={handleProcessPayroll}
          onProcessAll={handleProcessAllPayroll}
        />;
      
      case 'expenses':
        return <ExpensesContent data={expenses} />;
      
      case 'sales':
        return <SalesContent data={dashboardData} />;
      
      case 'customers':
        return <CustomersContent />;
      
      case 'leads':
        return <LeadsContent 
          data={filteredLeads}
          onUpdateStatus={handleUpdateLeadStatus}
          onDeleteLead={handleDeleteLead}
          onAddLead={() => setShowLeadModal(true)}
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
        />;
      
      case 'projects':
        return <ProjectsContent data={projects} />;
      
      case 'user-roles':
        return <RolesContent 
          data={userRoles} 
          onUpdateRole={setEditingRole}
        />;
      
      case 'system-config':
        return <SystemSettingsContent />;
      
      default:
        return <DashboardContent data={dashboardData} navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 relative overflow-hidden">
      {/* Top Navigation Menu */}
      {/* <TopNavMenu activeItem="dashboard" setActiveItem={() => {}} isSidebarCollapsed={false} /> */}

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-1000"></div>
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{getPageTitle()}</h1>
              <p className="text-slate-600">Complete system management and monitoring</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="h-4 w-4" />
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-xs text-gray-500">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Breadcrumb - Only show if not on dashboard */}
        {currentModule !== 'dashboard' && (
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm mb-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Home className="h-4 w-4" />
              <ChevronRight className="h-4 w-4" />
              <span className="capitalize">{currentModule.replace('-', ' ')}</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          {renderContent()}
        </div>

        {/* Modals */}
        {showUserModal && (
          <EmployeeModal 
            onClose={() => setShowUserModal(false)}
            onSave={handleAddEmployee}
            mode="add"
          />
        )}

        {editingEmployee && (
          <EmployeeModal 
            onClose={() => setEditingEmployee(null)}
            onSave={handleUpdateEmployee}
            employee={editingEmployee}
            mode="edit"
          />
        )}

        {showLeadModal && (
          <LeadModal 
            onClose={() => setShowLeadModal(false)}
            onSave={handleAddLead}
          />
        )}

        {showAttendanceModal && (
          <AddAttendanceModal
            employees={employees}
            onClose={() => setShowAttendanceModal(false)}
            onSave={handleAddAttendance}
          />
        )}

        {editingRole && (
          <EditRoleModal
            role={editingRole}
            onClose={() => setEditingRole(null)}
            onSave={(updates) => {
              handleUpdateRole(editingRole.id, updates);
              setEditingRole(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Dashboard Content Component
function DashboardContent({ data, navigate }) {
  const progressPercentage = (data.monthlyRevenue / data.monthlyTarget) * 100;

  // Sample data for new sections
  const applications = [
    { id: 1, type: 'Leave Application', employee: 'John Smith', date: '2024-01-15', status: 'Pending' },
    { id: 2, type: 'Expense Claim', employee: 'Sarah Johnson', date: '2024-01-14', status: 'Approved' },
    { id: 3, type: 'Training Request', employee: 'Mike Chen', date: '2024-01-13', status: 'Pending' },
    { id: 4, type: 'Equipment Request', employee: 'Emily Davis', date: '2024-01-12', status: 'Rejected' }
  ];

  const topSales = [
    { id: 1, name: 'John Smith', department: 'Sales', revenue: 125000, deals: 15, growth: '+12%' },
    { id: 2, name: 'Sarah Wilson', department: 'Sales', revenue: 98000, deals: 12, growth: '+8%' },
    { id: 3, name: 'Mike Johnson', department: 'Sales', revenue: 87500, deals: 10, growth: '+15%' },
    { id: 4, name: 'Lisa Brown', department: 'Sales', revenue: 76500, deals: 9, growth: '+5%' }
  ];

  const ongoingProjects = [
    { id: 1, name: 'Website Redesign', progress: 65, deadline: '2024-03-15', team: 4, status: 'On Track' },
    { id: 2, name: 'Mobile App Development', progress: 35, deadline: '2024-06-30', team: 6, status: 'Delayed' },
    { id: 3, name: 'CRM Implementation', progress: 80, deadline: '2024-02-28', team: 3, status: 'On Track' },
    { id: 4, name: 'Marketing Campaign', progress: 45, deadline: '2024-04-15', team: 5, status: 'At Risk' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'On Track': return 'bg-green-100 text-green-800';
      case 'Delayed': return 'bg-red-100 text-red-800';
      case 'At Risk': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="Total Employees" 
          value={data.totalEmployees} 
          icon={Users}
          color="blue"
          change={`+${data.employeeGrowth}%`}
        />
        <MetricCard 
          title="Monthly Revenue" 
          value={`$${(data.monthlyRevenue / 1000).toFixed(0)}K`} 
          icon={DollarSign}
          color="green"
          change={`+${data.revenueGrowth}%`}
        />
        <MetricCard 
          title="Active Projects" 
          value={data.ongoingProjects} 
          icon={ClipboardList}
          color="orange"
          change="+3"
        />
        <MetricCard 
          title="Attendance Rate" 
          value={`${data.attendanceRate}%`} 
          icon={CheckCircle}
          color="green"
          change="+2%"
        />
      </div>

      {/* Three Column Layout for New Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Applications Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Recent Applications</h3>
            <button 
              onClick={() => navigate('/application-memos')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-800">{app.type}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>{app.employee}</span>
                    <span>{app.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Pending Applications</span>
              <span className="font-semibold text-slate-800">2</span>
            </div>
          </div>
        </div>

        {/* Top Sales Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Top Sales Performers</h3>
            <button 
              onClick={() => navigate('/sales')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {topSales.map((salesperson, index) => (
              <div key={salesperson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-800">{salesperson.name}</div>
                    <div className="text-xs text-slate-600">{salesperson.department}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-800">${(salesperson.revenue / 1000).toFixed(0)}K</div>
                  <div className="text-xs text-green-600">{salesperson.growth}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total Team Revenue</span>
              <span className="font-semibold text-slate-800">$387K</span>
            </div>
          </div>
        </div>

        {/* Ongoing Projects Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Ongoing Projects</h3>
            <button 
              onClick={() => navigate('/projects')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {ongoingProjects.map((project) => (
              <div key={project.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-slate-800">{project.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Team: {project.team} members</span>
                  <span>Due: {project.deadline}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Projects at Risk</span>
              <span className="font-semibold text-orange-600">2</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="Pending Leads" 
          value={data.pendingLeads} 
          icon={TrendingUp}
          color="orange"
        />
        <MetricCard 
          title="Total Customers" 
          value={data.totalCustomers} 
          icon={Users}
          color="blue"
        />
        <MetricCard 
          title="Active Employees" 
          value={data.activeEmployees} 
          icon={UserCheck}
          color="green"
        />
        <MetricCard 
          title="Total Projects" 
          value={data.totalProjects} 
          icon={ClipboardList}
          color="purple"
        />
      </div>
      
      {/* Progress and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Monthly Target: ${(data.monthlyTarget / 1000).toFixed(0)}K</span>
                <span>Achieved: ${(data.monthlyRevenue / 1000).toFixed(0)}K</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="text-right text-sm text-gray-600 mt-1">
                {Math.round(progressPercentage)}% Complete
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/employees')}
              className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-500 transition duration-200 flex flex-col items-center"
            >
              <Users className="h-6 w-6 text-blue-500 mb-2" />
              <span className="text-sm font-medium">Manage Employees</span>
            </button>
            <button 
              onClick={() => navigate('/payroll')}
              className="p-4 bg-white rounded-xl border border-gray-200 hover:border-green-500 transition duration-200 flex flex-col items-center"
            >
              <DollarSign className="h-6 w-6 text-green-500 mb-2" />
              <span className="text-sm font-medium">Process Payroll</span>
            </button>
            <button 
              onClick={() => navigate('/leads')}
              className="p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-500 transition duration-200 flex flex-col items-center"
            >
              <TrendingUp className="h-6 w-6 text-orange-500 mb-2" />
              <span className="text-sm font-medium">View Leads</span>
            </button>
            <button 
              onClick={() => navigate('/user-roles')}
              className="p-4 bg-white rounded-xl border border-gray-200 hover:border-purple-500 transition duration-200 flex flex-col items-center"
            >
              <Settings className="h-6 w-6 text-purple-500 mb-2" />
              <span className="text-sm font-medium">System Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="mt-8 bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">New employee registered</span>
            </div>
            <span className="text-xs text-gray-500">2 min ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Payroll processed for January</span>
            </div>
            <span className="text-xs text-gray-500">1 hour ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm">New lead added from website</span>
            </div>
            <span className="text-xs text-gray-500">3 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Employees Content Component
function EmployeesContent({ 
  data, 
  selectedEmployees, 
  onAddEmployee, 
  onEditEmployee, 
  onDeleteEmployee, 
  onToggleStatus, 
  onBulkAction, 
  onSelectEmployee, 
  onSelectAll,
  searchTerm,
  onSearch 
}) {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Employee Management</h2>
          <p className="text-slate-600">Manage your team members and their information</p>
        </div>
        <button 
          onClick={onAddEmployee}
          className="flex items-center gap-2 px-4 py-2 bg-[#349dff] text-white rounded-xl hover:bg-[#2980db] transition duration-200"
        >
          <UserPlus className="h-4 w-4" />
          Add Employee
        </button>
      </div>

      {/* Search and Bulk Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
            />
          </div>
          <select className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff]">
            <option>All Departments</option>
            <option>Sales</option>
            <option>Marketing</option>
            <option>Production</option>
          </select>
        </div>
        
        {selectedEmployees.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{selectedEmployees.size} selected</span>
            <select 
              onChange={(e) => onBulkAction(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[#349dff]"
            >
              <option value="">Bulk Actions</option>
              <option value="activate">Activate</option>
              <option value="deactivate">Deactivate</option>
              <option value="delete">Delete</option>
            </select>
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 w-12">
                <button onClick={onSelectAll} className="p-1">
                  {selectedEmployees.size === data.length ? (
                    <CheckSquare className="h-4 w-4 text-[#349dff]" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Employee</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Department</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Sub-Department</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Status</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Join Date</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(employee => (
              <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <button 
                    onClick={() => onSelectEmployee(employee.id)}
                    className="p-1"
                  >
                    {selectedEmployees.has(employee.id) ? (
                      <CheckSquare className="h-4 w-4 text-[#349dff]" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {employee.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">{employee.name}</div>
                      <div className="text-sm text-slate-600">{employee.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-slate-700">{employee.department}</td>
                <td className="py-3 px-4 text-sm text-slate-700">{employee.sub_department || ''}</td>
                <td className="py-3 px-4">
                  <button 
                    onClick={() => onToggleStatus(employee.id)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                      employee.status === 'active' 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {employee.status === 'active' ? (
                      <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                    ) : (
                      <><XCircle className="h-3 w-3 mr-1" /> Inactive</>
                    )}
                  </button>
                </td>
                <td className="py-3 px-4 text-sm text-slate-700">{employee.joinDate}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onEditEmployee(employee)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition duration-200"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => onDeleteEmployee(employee.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition duration-200"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-green-600 transition duration-200" title="View">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Attendance Content Component
function AttendanceContent({ data, employees, onAddAttendance }) {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Attendance Records</h2>
          <p className="text-slate-600">Track and manage employee attendance</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition duration-200">
            <Calendar className="h-4 w-4" />
            This Week
          </button>
          <button 
            onClick={onAddAttendance}
            className="flex items-center gap-2 px-4 py-2 bg-[#349dff] text-white rounded-xl hover:bg-[#2980db] transition duration-200"
          >
            <Plus className="h-4 w-4" />
            Add Record
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Present</p>
              <p className="text-2xl font-bold text-green-900">42</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Late</p>
              <p className="text-2xl font-bold text-yellow-900">8</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Absent</p>
              <p className="text-2xl font-bold text-red-900">3</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">On Leave</p>
              <p className="text-2xl font-bold text-blue-900">5</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Employee</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Check In</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Check Out</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Hours</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map(record => (
              <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {record.employee.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{record.employee}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-700">{record.date}</td>
                <td className="py-3 px-4 text-sm text-gray-700">{record.checkIn}</td>
                <td className="py-3 px-4 text-sm text-gray-700">{record.checkOut}</td>
                <td className="py-3 px-4 text-sm text-gray-700">{record.hours}h</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    record.status === 'Present' 
                      ? 'bg-green-100 text-green-800'
                      : record.status === 'Late'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {record.status === 'Present' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {record.status === 'Late' && <Clock className="h-3 w-3 mr-1" />}
                    {record.status === 'Absent' && <XCircle className="h-3 w-3 mr-1" />}
                    {record.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Leads Content Component
function LeadsContent({ data, onUpdateStatus, onDeleteLead, onAddLead, searchTerm, onSearch }) {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Leads Management</h2>
          <p className="text-gray-600">Track and manage potential customers</p>
        </div>
        <button 
          onClick={onAddLead}
          className="flex items-center gap-2 px-4 py-2 bg-[#349dff] text-white rounded-xl hover:bg-[#2980db] transition duration-200"
        >
          <Plus className="h-4 w-4" />
          Add Lead
        </button>
      </div>

      {/* Stats and Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">New Leads</p>
              <p className="text-2xl font-bold text-blue-900">12</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Contacted</p>
              <p className="text-2xl font-bold text-yellow-900">8</p>
            </div>
            <Phone className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Qualified</p>
              <p className="text-2xl font-bold text-green-900">15</p>
            </div>
            <UserCheck className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">Total Value</p>
              <p className="text-2xl font-bold text-purple-900">$350K</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
            />
          </div>
          <select className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff]">
            <option>All Status</option>
            <option>New</option>
            <option>Contacted</option>
            <option>Qualified</option>
            <option>Closed</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 border border-gray-300 rounded-xl hover:bg-gray-50">
            <Filter className="h-4 w-4" />
          </button>
          <button className="p-2 border border-gray-300 rounded-xl hover:bg-gray-50">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Company</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Contact</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Value</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Source</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Priority</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(lead => (
              <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-900">{lead.name}</div>
                  <div className="text-xs text-gray-500">Created: {lead.created}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm text-gray-900">{lead.contact}</div>
                  <div className="text-xs text-gray-600">{lead.phone}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm font-medium text-gray-900">${lead.value.toLocaleString()}</div>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800">
                    {lead.source}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                    lead.priority === 'High' 
                      ? 'bg-red-100 text-red-800'
                      : lead.priority === 'Medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {lead.priority}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <select 
                    value={lead.status}
                    onChange={(e) => onUpdateStatus(lead.id, e.target.value)}
                    className={`text-sm border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#349dff] ${
                      lead.status === 'New' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      lead.status === 'Contacted' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                      lead.status === 'Qualified' ? 'bg-green-100 text-green-800 border-green-200' :
                      'bg-gray-100 text-gray-800 border-gray-200'
                    }`}
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Closed">Closed</option>
                  </select>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button className="p-1 text-gray-400 hover:text-blue-600 transition duration-200">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-green-600 transition duration-200">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => onDeleteLead(lead.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Payroll Content Component
function PayrollContent({ data, onProcessPayroll, onProcessAll }) {
  const pendingCount = data.filter(pay => pay.status === 'Pending').length;
  const totalPayout = data.reduce((sum, pay) => sum + pay.netPay, 0);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Payroll Management</h2>
          <p className="text-gray-600">Process and manage employee payments</p>
        </div>
        {pendingCount > 0 && (
          <button 
            onClick={onProcessAll}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition duration-200"
          >
            <CheckCircle className="h-4 w-4" />
            Process All ({pendingCount})
          </button>
        )}
      </div>

      {/* Payroll Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Total Payout</p>
              <p className="text-2xl font-bold text-blue-900">${totalPayout.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Processed</p>
              <p className="text-2xl font-bold text-green-900">{data.filter(p => p.status === 'Paid').length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Employee</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Department</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Salary</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Bonus</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Net Pay</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Pay Period</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(pay => (
              <tr key={pay.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {pay.employee.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="font-medium text-gray-900">{pay.employee}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-700">{pay.department}</td>
                <td className="py-3 px-4 text-sm text-gray-700">${pay.salary.toLocaleString()}</td>
                <td className="py-3 px-4 text-sm text-gray-700">${pay.bonus.toLocaleString()}</td>
                <td className="py-3 px-4 text-sm font-medium text-gray-900">${pay.netPay.toLocaleString()}</td>
                <td className="py-3 px-4 text-sm text-gray-700">{pay.payPeriod}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    pay.status === 'Paid' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {pay.status === 'Paid' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {pay.status === 'Pending' && <Clock className="h-3 w-3 mr-1" />}
                    {pay.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {pay.status !== 'Paid' && (
                    <button 
                      onClick={() => onProcessPayroll(pay.id)}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition duration-200"
                    >
                      Process
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Projects Content Component
function ProjectsContent({ data }) {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Project Management</h2>
          <p className="text-gray-600">Track and manage all ongoing projects</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#349dff] text-white rounded-xl hover:bg-[#2980db] transition duration-200">
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Total Projects</p>
              <p className="text-2xl font-bold text-blue-900">{data.length}</p>
            </div>
            <ClipboardList className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600">In Progress</p>
              <p className="text-2xl font-bold text-orange-900">{data.filter(p => p.status === 'In Progress').length}</p>
            </div>
            <RefreshCw className="h-8 w-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Completed</p>
              <p className="text-2xl font-bold text-green-900">24</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">Total Budget</p>
              <p className="text-2xl font-bold text-purple-900">$1.2M</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {data.map(project => (
          <div key={project.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                <p className="text-gray-600">Deadline: {project.deadline}</p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                project.status === 'In Progress' 
                  ? 'bg-blue-100 text-blue-800'
                  : project.status === 'Planning'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {project.status}
              </span>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {project.team.map((member, index) => (
                    <div key={index} className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium">
                      {member.split(' ').map(n => n[0]).join('')}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-gray-600">{project.team.length} team members</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">${project.budget.toLocaleString()}</div>
                <div className="text-xs text-gray-600">Budget</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Activity Content Component
function ActivityContent({ data }) {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'login': return <LogIn className="h-4 w-4 text-blue-500" />;
      case 'update': return <Edit className="h-4 w-4 text-green-500" />;
      case 'create': return <Plus className="h-4 w-4 text-purple-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'login': return 'bg-blue-50 border-blue-200';
      case 'update': return 'bg-green-50 border-green-200';
      case 'create': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Activity Tracker</h2>
          <p className="text-gray-600">Monitor system activities and user actions</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition duration-200">
            Today
          </button>
          <button className="px-3 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition duration-200">
            This Week
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {data.map(activity => (
          <div key={activity.id} className={`flex items-center justify-between p-4 rounded-xl border ${getActivityColor(activity.type)}`}>
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                {getActivityIcon(activity.type)}
              </div>
              <div>
                <div className="font-medium text-gray-900">{activity.user}</div>
                <div className="text-sm text-gray-600">{activity.action} - {activity.details}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-900">{activity.timestamp.toLocaleTimeString()}</div>
              <div className="text-xs text-gray-500">{activity.timestamp.toLocaleDateString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Expenses Content Component
function ExpensesContent({ data }) {
  const totalExpenses = data.reduce((sum, expense) => sum + expense.amount, 0);
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Expenses Management</h2>
          <p className="text-gray-600">Track and approve company expenses</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#349dff] text-white rounded-xl hover:bg-[#2980db] transition duration-200">
          <Plus className="h-4 w-4" />
          Add Expense
        </button>
      </div>

      {/* Expense Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Total Expenses</p>
              <p className="text-2xl font-bold text-blue-900">${totalExpenses.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Approved</p>
              <p className="text-2xl font-bold text-green-900">{data.filter(e => e.status === 'Approved').length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">{data.filter(e => e.status === 'Pending').length}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Category</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Description</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Amount</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(expense => (
              <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {expense.category}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-900">{expense.description}</td>
                <td className="py-3 px-4 text-sm font-medium text-gray-900">${expense.amount}</td>
                <td className="py-3 px-4 text-sm text-gray-700">{expense.date}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    expense.status === 'Approved' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {expense.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {expense.status === 'Pending' && (
                      <>
                        <button className="px-2 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600">
                          Approve
                        </button>
                        <button className="px-2 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600">
                          Reject
                        </button>
                      </>
                    )}
                    <button className="p-1 text-gray-400 hover:text-blue-600">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Roles Content Component
function RolesContent({ data, onUpdateRole }) {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">User Roles & Permissions</h2>
          <p className="text-gray-600">Manage user access levels and permissions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#349dff] text-white rounded-xl hover:bg-[#2980db] transition duration-200">
          <Plus className="h-4 w-4" />
          Add Role
        </button>
      </div>

      <div className="grid gap-4">
        {data.map(role => (
          <div key={role.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                    <p className="text-sm text-gray-600">{role.description}</p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    {role.users} users
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-gray-700">Permissions:</span>
                  <div className="flex gap-1 flex-wrap">
                    {role.permissions.map((perm, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-100 text-green-800">
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <button 
                  onClick={() => onUpdateRole(role)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition duration-200"
                  title="Edit Role"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-600 transition duration-200" title="Delete Role">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Applications Content Component
function ApplicationsContent() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Applications & Memos</h2>
          <p className="text-gray-600">Manage employee applications and official memos</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#349dff] text-white rounded-xl hover:bg-[#2980db] transition duration-200">
          <Plus className="h-4 w-4" />
          New Memo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Pending Applications</p>
              <p className="text-2xl font-bold text-blue-900">8</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Active Memos</p>
              <p className="text-2xl font-bold text-green-900">12</p>
            </div>
            <ClipboardList className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      <div className="text-center py-12">
        <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No pending applications</h3>
        <p className="text-gray-600">All applications have been processed and memos are up to date.</p>
      </div>
    </div>
  );
}

// Feedback Content Component
function FeedbackContent() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Employee Feedback</h2>
          <p className="text-gray-600">Review and respond to employee feedback</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#349dff] text-white rounded-xl hover:bg-[#2980db] transition duration-200">
          <MessageSquare className="h-4 w-4" />
          Send Announcement
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">New Feedback</p>
              <p className="text-2xl font-bold text-blue-900">5</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Positive</p>
              <p className="text-2xl font-bold text-green-900">23</p>
            </div>
            <ThumbsUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600">Needs Action</p>
              <p className="text-2xl font-bold text-orange-900">3</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="text-center py-12">
        <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No new feedback submissions</h3>
        <p className="text-gray-600">Employee feedback will appear here for your review.</p>
      </div>
    </div>
  );
}

// Sales Content Component
function SalesContent({ data }) {
  const progressPercentage = (data.monthlyRevenue / data.monthlyTarget) * 100;
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Sales Performance</h2>
          <p className="text-gray-600">Track sales metrics and performance indicators</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#349dff] text-white rounded-xl hover:bg-[#2980db] transition duration-200">
          <BarChart className="h-4 w-4" />
          Generate Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="Monthly Revenue" 
          value={`$${(data.monthlyRevenue / 1000).toFixed(0)}K`} 
          icon={DollarSign}
          color="green"
          change={`+${data.revenueGrowth}%`}
        />
        <MetricCard 
          title="Target Progress" 
          value={`${Math.round(progressPercentage)}%`} 
          icon={Target}
          color="blue"
        />
        <MetricCard 
          title="New Customers" 
          value="24" 
          icon={UserPlus}
          color="orange"
          change="+12%"
        />
        <MetricCard 
          title="Conversion Rate" 
          value="18.5%" 
          icon={TrendingUp}
          color="purple"
          change="+2.3%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Target Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Monthly Target: ${(data.monthlyTarget / 1000).toFixed(0)}K</span>
                <span>Achieved: ${(data.monthlyRevenue / 1000).toFixed(0)}K</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="text-right text-sm text-gray-600 mt-1">
                {Math.round(progressPercentage)}% Complete
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Top Performing Products</h3>
          <div className="space-y-3">
            {['Enterprise Suite', 'Business Pro', 'Starter Package'].map((product, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                <span className="text-sm font-medium">{product}</span>
                <span className="text-sm text-green-600">+15.2%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Customers Content Component
function CustomersContent() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Customer Management</h2>
          <p className="text-gray-600">Manage customer relationships and information</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#349dff] text-white rounded-xl hover:bg-[#2980db] transition duration-200">
          <UserPlus className="h-4 w-4" />
          Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Total Customers</p>
              <p className="text-2xl font-bold text-blue-900">289</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Active</p>
              <p className="text-2xl font-bold text-green-900">254</p>
            </div>
            <UserCheck className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600">New This Month</p>
              <p className="text-2xl font-bold text-orange-900">24</p>
            </div>
            <UserPlus className="h-8 w-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">Satisfaction</p>
              <p className="text-2xl font-bold text-purple-900">94%</p>
            </div>
            <Star className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="text-center py-12">
        <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Customer management features coming soon</h3>
        <p className="text-gray-600">We're working on comprehensive customer management tools.</p>
      </div>
    </div>
  );
}

// System Settings Content Component
function SystemSettingsContent() {
  const [settings, setSettings] = useState({
    companyName: 'Your Company',
    timezone: 'UTC',
    language: 'English',
    dateFormat: 'MM/DD/YYYY',
    notifications: true,
    autoBackup: true
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">System Configuration</h2>
          <p className="text-gray-600">Manage system settings and preferences</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition duration-200">
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-500" />
            General Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input 
                type="text" 
                value={settings.companyName}
                onChange={(e) => setSettings(prev => ({...prev, companyName: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select 
                value={settings.timezone}
                onChange={(e) => setSettings(prev => ({...prev, timezone: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff]"
              >
                <option>UTC</option>
                <option>EST</option>
                <option>PST</option>
                <option>CET</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select 
                value={settings.language}
                onChange={(e) => setSettings(prev => ({...prev, language: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff]"
              >
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-green-500" />
            Notification Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Email Notifications</div>
                <div className="text-sm text-gray-600">Receive email alerts for important events</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.notifications}
                  onChange={(e) => setSettings(prev => ({...prev, notifications: e.target.checked}))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#349dff]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Auto Backup</div>
                <div className="text-sm text-gray-600">Automatically backup system data daily</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.autoBackup}
                  onChange={(e) => setSettings(prev => ({...prev, autoBackup: e.target.checked}))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#349dff]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Server className="h-5 w-5 text-purple-500" />
            System Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
              <Cpu className="h-8 w-8 text-blue-500" />
              <div>
                <div className="font-medium text-gray-900">System Version</div>
                <div className="text-sm text-gray-600">v2.1.0</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
              <Database className="h-8 w-8 text-green-500" />
              <div>
                <div className="font-medium text-gray-900">Database</div>
                <div className="text-sm text-gray-600">MySQL 8.0</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
              <ShieldCheck className="h-8 w-8 text-orange-500" />
              <div>
                <div className="font-medium text-gray-900">Security</div>
                <div className="text-sm text-gray-600">SSL Enabled</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
              <Network className="h-8 w-8 text-purple-500" />
              <div>
                <div className="font-medium text-gray-900">Uptime</div>
                <div className="text-sm text-gray-600">99.9%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal Components
function EmployeeModal({ onClose, onSave, employee, mode }) {
  const [formData, setFormData] = useState(employee || {
    name: '',
    email: '',
    department: '',
    position: '',
    phone: '',
    salary: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'add' ? 'Add New Employee' : 'Edit Employee'}
          </h3>
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
              onChange={(e) => handleChange('name', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
            <select 
              value={formData.department}
              onChange={(e) => handleChange('department', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
            >
              <option value="">Select Department</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="Production">Production</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
            <input 
              type="text" 
              value={formData.position}
              onChange={(e) => handleChange('position', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input 
              type="tel" 
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
            <input 
              type="number" 
              value={formData.salary}
              onChange={(e) => handleChange('salary', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
            />
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
              {mode === 'add' ? 'Add Employee' : 'Update Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LeadModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    phone: '',
    value: '',
    source: 'Website',
    status: 'New'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      value: parseInt(formData.value)
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add New Lead</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
            <input 
              type="email" 
              value={formData.contact}
              onChange={(e) => handleChange('contact', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input 
              type="tel" 
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Value *</label>
            <input 
              type="number" 
              value={formData.value}
              onChange={(e) => handleChange('value', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <select 
              value={formData.source}
              onChange={(e) => handleChange('source', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
            >
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Conference">Conference</option>
              <option value="Social Media">Social Media</option>
              <option value="Other">Other</option>
            </select>
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
              Add Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddAttendanceModal({ employees, onClose, onSave }) {
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:00',
    checkOut: '17:00',
    status: 'Present'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const employee = employees.find(emp => emp.id === parseInt(formData.employeeId));
    onSave({
      ...formData,
      employee: employee.name,
      employeeId: parseInt(formData.employeeId),
      hours: 8
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add Attendance Record</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
            <select 
              value={formData.employeeId}
              onChange={(e) => handleChange('employeeId', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input 
              type="date" 
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check In *</label>
              <input 
                type="time" 
                value={formData.checkIn}
                onChange={(e) => handleChange('checkIn', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check Out *</label>
              <input 
                type="time" 
                value={formData.checkOut}
                onChange={(e) => handleChange('checkOut', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
            <select 
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
            >
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
            </select>
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
              Add Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditRoleModal({ role, onClose, onSave }) {
  const [formData, setFormData] = useState(role);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit Role</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
            />
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
              Update Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({ title, value, icon: Icon, color, change }) {
  const colorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    orange: 'text-orange-500',
    purple: 'text-purple-500'
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <Icon className={`h-5 w-5 ${colorClasses[color]}`} />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {change && (
        <p className="text-sm text-green-600 mt-1 flex items-center">
          <TrendingUp className="h-4 w-4 mr-1" />
          {change}
        </p>
      )}
    </div>
  );
}

export default SuperAdminDashboard;
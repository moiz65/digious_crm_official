import { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, Users, CheckCircle, XCircle, RefreshCw, Calendar, 
  DollarSign, FileText, Target, Clock, LogIn, LogOut, Settings, 
  Shield, BarChart3, UserPlus, Building, Download, Upload, Filter, 
  Search, MoreVertical, Edit, Trash2, Eye, Briefcase, CreditCard, 
  PieChart, MessageSquare, ClipboardList, Mail, Star, Wallet,
  ShoppingCart, Phone, UserCheck, Key, Database, Plus,
  Save, X, ArrowUpDown, CheckSquare, Square, ChevronDown,
  ChevronRight, Home, MapPin, Globe, Award, Zap,
  BarChart, Card, ShoppingBag, Tag,
  FileCheck, MessageCircle, ThumbsUp, AlertTriangle,
  ChartPie, Bullseye, Rocket,
  Cpu, Server, Db, Network, ShieldCheck,
  Bell, Palette, Monitor, Smartphone, Wifi,
  Activity, Coffee, Timer, UsersIcon, BriefcaseIcon,
  TrendingDown, LayoutDashboard, Gift, Sparkles, Loader2
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { endpoints } from '../config/api';
import toast from 'react-hot-toast';

export function SuperAdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState({
    totalActiveEmployees: 0,
    monthlySalesRevenue: 0,
    absentToday: 0,
    monthlyExpenses: 0,
    salesTarget: 0,
    expenseTarget: 0
  });
  
  // Employees Data
  const [employees, setEmployees] = useState([]);
  const [attendanceToday, setAttendanceToday] = useState([]);
  const [activeBreaks, setActiveBreaks] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [salesTargets, setSalesTargets] = useState({});

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const todayStr = currentDate.toISOString().split('T')[0];
      
      // Fetch employees
      const employeesRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://100.126.74.55:5000'}/api/v1/employees?limit=1000`, { headers });
      const employeesData = await employeesRes.json();
      
      // Fetch today's attendance
      const attendanceRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://100.126.74.55:5000'}/api/v1/attendance/all?limit=1000`, { headers });
      const attendanceData = await attendanceRes.json();
      
      // Fetch sales for current month
      const salesRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://100.126.74.55:5000'}/api/v1/sales/all?from=${currentYear}-${String(currentMonth).padStart(2, '0')}-01&to=${currentYear}-${String(currentMonth).padStart(2, '0')}-${new Date(currentYear, currentMonth, 0).getDate()}`, { headers });
      const salesDataRes = await salesRes.json();
      
      // Fetch expenses
      const expensesRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://100.126.74.55:5000'}/api/v1/expenses?month=${currentMonth}&year=${currentYear}`, { headers });
      const expensesData = await expensesRes.json();
      
      // Process data
      const activeEmployees = (employeesData.data || []).filter(e => e.status === 'Active');
      const todayAttendance = (attendanceData.data || []).filter(a => a.attendance_date === todayStr);
      const checkedInEmployees = todayAttendance.filter(a => a.check_in_time);
      const absentCount = activeEmployees.length - checkedInEmployees.length;
      
      // Calculate total upfront payments for current month
      const monthlyRevenue = (salesDataRes.data || []).reduce((sum, sale) => sum + (parseFloat(sale.upfront_payment) || 0), 0);
      
      // Calculate total expenses for current month
      const monthlyExpenses = (expensesData.data || []).reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
      
      // Get sales targets for employees
      const salesTargetPromises = (employeesData.data || [])
        .filter(e => e.department === 'Sales' && e.status === 'Active')
        .map(async (emp) => {
          try {
            const targetRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://100.126.74.55:5000'}/api/v1/sales-targets/${emp.id}?month=${currentMonth}&year=${currentYear}`, { headers });
            const targetData = await targetRes.json();
            return { employeeId: emp.id, target: targetData.data?.monthly_target || 0, achieved: targetData.data?.achieved || 0 };
          } catch { return { employeeId: emp.id, target: 0, achieved: 0 }; }
        });
      
      const salesTargetsData = await Promise.all(salesTargetPromises);
      const salesTargetMap = {};
      salesTargetsData.forEach(t => { salesTargetMap[t.employeeId] = { target: t.target, achieved: t.achieved }; });
      
      setDashboardData({
        totalActiveEmployees: activeEmployees.length,
        monthlySalesRevenue: monthlyRevenue,
        absentToday: absentCount,
        monthlyExpenses: monthlyExpenses,
        salesTarget: salesTargetsData.reduce((sum, t) => sum + t.target, 0),
        expenseTarget: 250000 // Default expense target
      });
      
      // Set employees with sales data
      const enrichedEmployees = (employeesData.data || []).map(emp => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        position: emp.designation,
        status: emp.status === 'Active' ? 'active' : 'inactive',
        checkInTime: todayAttendance.find(a => a.employee_id === emp.employee_id)?.check_in_time || null,
        attendanceStatus: todayAttendance.find(a => a.employee_id === emp.employee_id)?.check_in_time ? 'present' : 'absent',
        salesAchieved: salesTargetMap[emp.id]?.achieved || 0,
        salesTarget: salesTargetMap[emp.id]?.target || 0,
        projects: [] // Will be populated from projects API
      }));
      
      setEmployees(enrichedEmployees);
      setAttendanceToday(todayAttendance);
      setSalesData(salesDataRes.data || []);
      setExpenses(expensesData.data || []);
      setSalesTargets(salesTargetMap);
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://100.126.74.55:5000'}/api/v1/projects?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setProjects(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  }, []);

  // Fetch active breaks
  const fetchActiveBreaks = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://100.126.74.55:5000'}/api/v1/attendance/ongoing-breaks/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setActiveBreaks(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching active breaks:", error);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchProjects();
    fetchActiveBreaks();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchActiveBreaks();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchDashboardData, fetchProjects, fetchActiveBreaks]);

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatBreakDuration = (startTime) => {
    if (!startTime) return '0m';
    const start = new Date(startTime);
    const duration = Math.floor((Date.now() - start) / 60000);
    if (duration < 60) return `${duration}m`;
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    return `${hours}h ${mins}m`;
  };

  const absentEmployees = employees.filter(emp => emp.status === 'active' && emp.attendanceStatus === 'absent');
  const salesProgress = dashboardData.salesTarget > 0 ? (dashboardData.monthlySalesRevenue / dashboardData.salesTarget) * 100 : 0;
  const expenseProgress = dashboardData.expenseTarget > 0 ? (dashboardData.monthlyExpenses / dashboardData.expenseTarget) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
        <div className="px-8 py-5">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                  <LayoutDashboard className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Executive Dashboard
                  </h1>
                  <p className="text-slate-500 text-sm mt-0.5">Real-time workforce analytics & insights</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock className="h-4 w-4" />
                  <span className="font-mono text-sm font-medium">{currentTime.toLocaleTimeString()}</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <button 
                onClick={() => fetchDashboardData()}
                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Active Employees Card */}
          <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-3xl font-bold text-slate-800">{dashboardData.totalActiveEmployees}</span>
              </div>
              <h3 className="text-slate-600 font-medium">Active Employees</h3>
            </div>
            {/* <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600 w-0 group-hover:w-full transition-all duration-500"></div> */}
          </div>

          {/* Monthly Sales Revenue Card */}
          <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="text-3xl font-bold text-slate-800">${(dashboardData.monthlySalesRevenue / 1000).toFixed(0)}K</span>
              </div>
              <h3 className="text-slate-600 font-medium">Monthly Sales Revenue</h3>
              {/* <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Target: ${(dashboardData.salesTarget / 1000).toFixed(0)}K</span>
                  <span className="font-medium">{Math.round(salesProgress)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(salesProgress, 100)}%` }}></div>
                </div>
              </div> */}
            </div>
            {/* <div className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-600 w-0 group-hover:w-full transition-all duration-500"></div> */}
          </div>

          {/* Absent Today Card */}
          <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-rose-50 rounded-xl group-hover:bg-rose-100 transition">
                  <XCircle className="h-6 w-6 text-rose-600" />
                </div>
                <span className="text-3xl font-bold text-slate-800">{dashboardData.absentToday}</span>
              </div>
              <h3 className="text-slate-600 font-medium">Absent Today</h3>
              {/* <p className="text-xs text-slate-400 mt-2">Out of {dashboardData.totalActiveEmployees} active employees</p> */}
            </div>
            {/* <div className="h-1 bg-gradient-to-r from-rose-500 to-rose-600 w-0 group-hover:w-full transition-all duration-500"></div> */}
          </div>

          {/* Monthly Expenses Card */}
          <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition">
                  <Wallet className="h-6 w-6 text-amber-600" />
                </div>
                <span className="text-3xl font-bold text-slate-800">${(dashboardData.monthlyExpenses / 1000).toFixed(0)}K</span>
              </div>
              <h3 className="text-slate-600 font-medium">Monthly Expenses</h3>
              {/* <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Budget: ${(dashboardData.expenseTarget / 1000).toFixed(0)}K</span>
                  <span className="font-medium">{Math.round(expenseProgress)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(expenseProgress, 100)}%` }}></div>
                </div>
              </div> */}
            </div>
            {/* <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-600 w-0 group-hover:w-full transition-all duration-500"></div> */}
          </div>
        </div>

        {/* Activity Grid - 4 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          
          {/* Column 1: Absent Employees */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-rose-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-100 rounded-lg">
                    <XCircle className="h-4 w-4 text-rose-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800">Not Checked In</h3>
                </div>
                <span className="text-xs font-medium bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full">{absentEmployees.length}</span>
              </div>
            </div>
            <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
              {absentEmployees.length > 0 ? (
                absentEmployees.map(emp => (
                  <div key={emp.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        {emp.name?.split(' ').map(n => n[0]).join('') || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{emp.name}</p>
                        <p className="text-xs text-slate-400">{emp.department} • {emp.position}</p>
                      </div>
                      <div className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
                        <XCircle className="h-3 w-3" />
                        <span className="text-xs font-medium">Absent</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">All Present!</p>
                  <p className="text-xs text-slate-400 mt-1">Everyone checked in today</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: On Break */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 rounded-lg">
                    <Coffee className="h-4 w-4 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800">On Break</h3>
                </div>
                <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">{activeBreaks.length}</span>
              </div>
            </div>
            <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
              {activeBreaks.length > 0 ? (
                activeBreaks.map(breakItem => {
                  const employee = employees.find(e => e.id === breakItem.employee_id);
                  return (
                    <div key={breakItem.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                          {employee?.name?.split(' ').map(n => n[0]).join('') || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 truncate">{employee?.name || breakItem.employee_name}</p>
                          <p className="text-xs text-slate-400">{breakItem.break_type || 'Break'}</p>
                        </div>
                        <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full font-mono">
                          <Timer className="h-3 w-3" />
                          <span className="text-xs font-medium">{formatBreakDuration(breakItem.break_start_time)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center">
                  <Coffee className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No breaks</p>
                  <p className="text-xs text-slate-400 mt-1">All employees are working</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Sales Performance */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800">Sales Performance</h3>
                </div>
                <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">Sales Team</span>
              </div>
            </div>
            <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
              {employees.filter(e => e.department === 'Sales' && e.status === 'active').map(emp => {
                const progress = emp.salesTarget > 0 ? (emp.salesAchieved / emp.salesTarget) * 100 : 0;
                return (
                  <div key={emp.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        {emp.name?.split(' ').map(n => n[0]).join('') || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{emp.name}</p>
                        <p className="text-xs text-slate-400">{emp.position}</p>
                      </div>
                    </div>
                    <div className="ml-13">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-500">Achieved</span>
                        <span className="font-medium text-slate-700">${emp.salesAchieved.toLocaleString()} / ${emp.salesTarget.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-emerald-500' : 'bg-emerald-400'}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                      </div>
                      {progress >= 100 && (
                        <div className="flex items-center gap-1 mt-2 text-emerald-600">
                          <CheckCircle className="h-3 w-3" />
                          <span className="text-xs font-medium">Target achieved!</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {employees.filter(e => e.department === 'Sales' && e.status === 'active').length === 0 && (
                <div className="p-8 text-center">
                  <DollarSign className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No sales data</p>
                  <p className="text-xs text-slate-400 mt-1">No sales employees found</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 4: Projects Status */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-100 rounded-lg">
                    <ClipboardList className="h-4 w-4 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800">Projects Status</h3>
                </div>
                <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full">Active</span>
              </div>
            </div>
            <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
              {projects.filter(p => p.status !== 'Completed').map((project, idx) => (
                <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="mb-2">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-slate-800 text-sm">{project.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        project.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 
                        project.status === 'Planning' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{project.assigned_to || 'Unassigned'} • {project.department}</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Progress</span>
                      <span>{project.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-purple-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${project.progress || 0}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
              {projects.filter(p => p.status !== 'Completed').length === 0 && (
                <div className="p-8 text-center">
                  <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No active projects</p>
                  <p className="text-xs text-slate-400 mt-1">All projects are completed</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">Dashboard updates in real-time • Last sync: {currentTime.toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminDashboard;
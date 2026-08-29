import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  DollarSign,
  FileText,
  Target,
  Clock,
  LogIn,
  LogOut,
  Settings,
  Shield,
  BarChart3,
  UserPlus,
  Building,
  Download,
  Upload,
  Filter,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Briefcase,
  CreditCard,
  PieChart,
  MessageSquare,
  ClipboardList,
  Mail,
  Star,
  Wallet,
  ShoppingCart,
  Phone,
  UserCheck,
  Key,
  Database,
  Plus,
  Save,
  X,
  ArrowUpDown,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  Home,
  MapPin,
  Globe,
  Award,
  Zap,
  BarChart,
  Card,
  ShoppingBag,
  Tag,
  FileCheck,
  MessageCircle,
  ThumbsUp,
  AlertTriangle,
  ChartPie,
  Bullseye,
  Rocket,
  Cpu,
  Server,
  Db,
  Network,
  ShieldCheck,
  Bell,
  Palette,
  Monitor,
  Smartphone,
  Wifi,
  Activity,
  Coffee,
  Timer,
  UsersIcon,
  BriefcaseIcon,
  TrendingDown,
  LayoutDashboard,
  Gift,
  Sparkles,
  Loader2,
  EyeOff,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { endpoints } from "../config/api";
import toast from "react-hot-toast";

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
    expenseTarget: 0,
  });

  // Employees Data
  const [employees, setEmployees] = useState([]);
  const [attendanceToday, setAttendanceToday] = useState([]);
  const [activeBreaks, setActiveBreaks] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [salesTargets, setSalesTargets] = useState({});

  // ✅ Store absent employees list from API
  const [absentEmployeesList, setAbsentEmployeesList] = useState([]);

  const [visibleValues, setVisibleValues] = useState({
    activeEmployees: true,
    monthlySales: false,
    absentToday: true,
    monthlyExpenses: false,
  });

  const toggleValue = (key) => {
    setVisibleValues((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const todayStr = currentDate.toISOString().split("T")[0];

      // Fetch employees
      const employeesRes = await fetch(
        `${process.env.REACT_APP_API_URL || "http://100.114.9.93:5000"}/api/v1/employees?limit=1000`,
        { headers },
      );
      const employeesData = await employeesRes.json();

      // Fetch today's attendance
      const attendanceRes = await fetch(
        `${process.env.REACT_APP_API_URL || "http://100.114.9.93:5000"}/api/v1/attendance/all?limit=1000`,
        { headers },
      );
      const attendanceData = await attendanceRes.json();

      // ============================================================
      // FIX 1: Fetch and filter sales for current month ONLY
      // ============================================================
      const salesRes = await fetch(
        `${process.env.REACT_APP_API_URL || "http://100.114.9.93:5000"}/api/v1/sales`,
        { headers },
      );
      const salesDataRes = await salesRes.json();

      // Filter sales for current month only
      const currentMonthSales = (salesDataRes.data || []).filter((sale) => {
        const saleDateStr = sale.sale_date || sale.created_at || sale.date;
        if (!saleDateStr) return false;
        const saleDate = new Date(saleDateStr);
        return (
          saleDate.getMonth() + 1 === currentMonth &&
          saleDate.getFullYear() === currentYear
        );
      });

      // Calculate monthly revenue from current month sales only
      const monthlyRevenue = currentMonthSales.reduce(
        (sum, sale) => sum + (parseFloat(sale.upfront_payment) || 0),
        0,
      );


      // 2. ✅ Fetch absent employees directly from backend
      const absentRes = await fetch(
        `${process.env.REACT_APP_API_URL || "http://100.114.9.93:5000"}/api/v1/attendance/absent-today`,
        { headers },
      );
      const absentData = await absentRes.json();

      // ✅ Extract data from response
      const absentEmployeesData = absentData.absent_employees || [];
      const absentCount = absentData.absent_count || 0;
      const totalActive = absentData.total_active_employees || 0;
      const presentCount = absentData.present_count || 0;

      console.log("📊 Dashboard Data:");
      console.log("Total Active:", totalActive);
      console.log("Present Today:", presentCount);
      console.log("Absent Today:", absentCount);
      console.log("Absent Employees:", absentEmployeesData);

      // ✅ Store absent employees list for UI
      setAbsentEmployeesList(absentEmployeesData);



      // ============================================================
      // FIX 2: Fetch and filter expenses for current month ONLY
      // ============================================================
      const expensesRes = await fetch(
        `${process.env.REACT_APP_API_URL || "http://100.114.9.93:5000"}/api/v1/expenses?limit=10000`,
        { headers },
      );
      const expensesData = await expensesRes.json();

      // Filter expenses for current month only
      const currentMonthExpenses = (expensesData.data || []).filter((exp) => {
        const expDateStr = exp.expense_date || exp.date || exp.created_at;
        if (!expDateStr) return false;
        const expDate = new Date(expDateStr);
        return (
          expDate.getMonth() + 1 === currentMonth &&
          expDate.getFullYear() === currentYear
        );
      });

      // Calculate total expenses for current month ONLY
      const monthlyExpenses = currentMonthExpenses.reduce(
        (sum, exp) => sum + (parseFloat(exp.amount) || 0),
        0,
      );

      // Process employee data
      const activeEmployees = (employeesData.data || []).filter(
        (e) => e.status === "Active",
      );
      const todayAttendance = (attendanceData.data || []).filter(
        (a) => a.attendance_date === todayStr,
      );

      // Get sales targets for employees
      const salesTargetPromises = (employeesData.data || [])
        .filter((e) => e.department === "Sales" && e.status === "Active")
        .map(async (emp) => {
          try {
            const targetRes = await fetch(
              `${process.env.REACT_APP_API_URL || "http://100.114.9.93:5000"}/api/v1/sales-targets/${emp.id}?month=${currentMonth}&year=${currentYear}`,
              { headers },
            );
            const targetData = await targetRes.json();
            return {
              employeeId: emp.id,
              target: targetData.data?.monthly_target || 0,
              achieved: targetData.data?.achieved || 0,
            };
          } catch {
            return { employeeId: emp.id, target: 0, achieved: 0 };
          }
        });

      const salesTargetsData = await Promise.all(salesTargetPromises);
      const salesTargetMap = {};
      salesTargetsData.forEach((t) => {
        salesTargetMap[t.employeeId] = {
          target: t.target,
          achieved: t.achieved,
        };
      });

      setDashboardData({
        totalActiveEmployees: activeEmployees.length,
        monthlySalesRevenue: monthlyRevenue,
        absentToday: absentCount,
        monthlyExpenses: monthlyExpenses,
        salesTarget: salesTargetsData.reduce((sum, t) => sum + t.target, 0),
        expenseTarget: 250000,
      });

      // Set employees with sales data
      const enrichedEmployees = (employeesData.data || []).map((emp) => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        position: emp.designation,
        status: emp.status === "Active" ? "active" : "inactive",
        checkInTime:
          todayAttendance.find((a) => a.employee_id === emp.employee_id)
            ?.check_in_time || null,
        attendanceStatus: todayAttendance.find(
          (a) => a.employee_id === emp.employee_id,
        )?.check_in_time
          ? "present"
          : "absent",
        salesAchieved: salesTargetMap[emp.id]?.achieved || 0,
        salesTarget: salesTargetMap[emp.id]?.target || 0,
        projects: [],
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
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || "http://100.114.9.93:5000"}/api/v1/projects?limit=100`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) {
        setProjects(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  }, []);

  // Update the fetchActiveBreaks function to properly map the data
  const fetchActiveBreaks = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all active employees first
      const employeesRes = await fetch(
        `${process.env.REACT_APP_API_URL || "http://100.114.9.93:5000"}/api/v1/employees?limit=1000`,
        { headers },
      );
      const employeesData = await employeesRes.json();
      const activeEmployees = (employeesData.data || []).filter(
        (e) => e.status === "Active",
      );

      // Create a map for quick employee lookup
      const employeeMap = new Map();
      activeEmployees.forEach((emp) => {
        employeeMap.set(emp.employee_id, emp);
      });

      // Fetch breaks for all employees (if you have a bulk endpoint)
      // Or loop through each employee
      const breakPromises = activeEmployees.map(async (employee) => {
        try {
          const breakRes = await fetch(
            `${process.env.REACT_APP_API_URL || "http://100.114.9.93:5000"}/api/v1/attendance/ongoing-breaks/${employee.id}`,
            { headers },
          );
          const breakData = await breakRes.json();

          if (
            breakData.success &&
            breakData.data &&
            breakData.data.length > 0
          ) {
            return breakData.data.map((breakItem) => ({
              id: breakItem.id,
              employee_id: employee.id,
              employee_name: employee.name,
              break_type: breakItem.break_type,
              break_start_time: breakItem.break_start_time,
              break_duration_minutes: breakItem.break_duration_minutes || 0,
              status: breakItem.status,
              attendance_date: breakItem.attendance_date,
            }));
          }
          return [];
        } catch (err) {
          console.error(`Error fetching breaks for ${employee.name}:`, err);
          return [];
        }
      });

      const allBreaks = await Promise.all(breakPromises);
      const flattenedBreaks = allBreaks.flat();

      console.log("Active Breaks:", flattenedBreaks);
      setActiveBreaks(flattenedBreaks);
    } catch (error) {
      console.error("Error fetching active breaks:", error);
      setActiveBreaks([]);
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
    if (!startTime) return "0m";

    try {
      let startMinutes = 0;

      // If startTime is in "HH:MM:SS" format
      if (
        typeof startTime === "string" &&
        startTime.match(/^\d{2}:\d{2}:\d{2}$/)
      ) {
        const [hours, minutes] = startTime.split(":").map(Number);
        startMinutes = hours * 60 + minutes;

        // Get current time in minutes
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTotalMinutes = currentHours * 60 + currentMinutes;

        // Calculate duration
        let durationMinutes = currentTotalMinutes - startMinutes;

        // Handle midnight crossing (if break started before midnight)
        if (durationMinutes < 0) {
          durationMinutes += 24 * 60;
        }

        if (durationMinutes < 60) return `${durationMinutes}m`;
        const hrs = Math.floor(durationMinutes / 60);
        const mins = durationMinutes % 60;
        return `${hrs}h ${mins}m`;
      }

      // Handle ISO date string format
      const start = new Date(startTime);
      if (!isNaN(start.getTime())) {
        const duration = Math.floor((Date.now() - start) / 60000);
        if (duration < 60) return `${duration}m`;
        const hrs = Math.floor(duration / 60);
        const mins = duration % 60;
        return `${hrs}h ${mins}m`;
      }

      return "0m";
    } catch (error) {
      console.error("Error formatting break duration:", error);
      return "0m";
    }
  };

  // ✅ Use direct absentEmployeesList from API
  const absentEmployees = absentEmployeesList;
  
  const salesProgress =
    dashboardData.salesTarget > 0
      ? (dashboardData.monthlySalesRevenue / dashboardData.salesTarget) * 100
      : 0;
  const expenseProgress =
    dashboardData.expenseTarget > 0
      ? (dashboardData.monthlyExpenses / dashboardData.expenseTarget) * 100
      : 0;

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
                  <p className="text-slate-500 text-sm mt-0.5">
                    Real-time workforce analytics & insights
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock className="h-4 w-4" />
                  <span className="font-mono text-sm font-medium">
                    {currentTime.toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {currentTime.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
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
        <div className="relative">
          {/* Toggle Button for Values */}
          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {/* Active Employees Card */}
            <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-slate-600 font-medium">
                        Active Employees
                      </h3>
                      <span className="text-3xl font-bold text-slate-800">
                        {visibleValues.activeEmployees
                          ? dashboardData.totalActiveEmployees
                          : "*****"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleValue("activeEmployees")}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title={
                      visibleValues.activeEmployees
                        ? "Hide Value"
                        : "Show Value"
                    }
                  >
                    {visibleValues.activeEmployees ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Monthly Sales Revenue Card */}
            <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between ">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition">
                      <DollarSign className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-slate-600 font-medium">
                        Monthly Sales Revenue
                      </h3>
                      <span className="text-3xl font-bold text-slate-800">
                        {visibleValues.monthlySales
                          ? dashboardData.monthlySalesRevenue >= 1000000
                            ? `$${(dashboardData.monthlySalesRevenue / 1000000).toFixed(1)}M`
                            : dashboardData.monthlySalesRevenue >= 10000
                              ? `$${(dashboardData.monthlySalesRevenue / 1000).toFixed(1)}K`
                              : `$${dashboardData.monthlySalesRevenue.toLocaleString()}`
                          : "*****"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleValue("monthlySales")}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title={
                      visibleValues.monthlySales ? "Hide Value" : "Show Value"
                    }
                  >
                    {visibleValues.monthlySales ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Absent Today Card */}
            <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between ">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-rose-50 rounded-xl group-hover:bg-rose-100 transition">
                      <XCircle className="h-6 w-6 text-rose-600" />
                    </div>
                    <div>
                      <h3 className="text-slate-600 font-medium">
                        Absent Today
                      </h3>
                      <span className="text-3xl font-bold text-slate-800">
                        {visibleValues.absentToday
                          ? dashboardData.absentToday
                          : "*****"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleValue("absentToday")}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title={
                      visibleValues.absentToday ? "Hide Value" : "Show Value"
                    }
                  >
                    {visibleValues.absentToday ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Monthly Expenses Card */}
            <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition">
                      <Wallet className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-slate-600 font-medium">
                        Monthly Expenses
                      </h3>
                      <span className="text-3xl font-bold text-slate-800">
                        {visibleValues.monthlyExpenses
                          ? `Rs ${dashboardData.monthlyExpenses.toLocaleString()}`
                          : "*****"}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date().toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleValue("monthlyExpenses")}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title={
                      visibleValues.monthlyExpenses
                        ? "Hide Value"
                        : "Show Value"
                    }
                  >
                    {visibleValues.monthlyExpenses ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
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
                  <h3 className="font-semibold text-slate-800">
                    Not Checked In
                  </h3>
                </div>
                <span className="text-xs font-medium bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full">
                  {absentEmployees.length}
                </span>
              </div>
            </div>
            <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
              {absentEmployees.length > 0 ? (
                absentEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        {emp.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("") || "?"}
                      </div>
                      <div className="flex-1 min-w-100">
                        <p className="font-medium text-slate-800">{emp.name}</p>
                        <p className="text-xs text-slate-400">
                          {emp.department} • {emp.position}
                        </p>
                      </div>
                      {/* <div className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
                        <XCircle className="h-3 w-3" />
                        <span className="text-xs font-medium">Absent</span>
                      </div> */}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">All Present!</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Everyone checked in today
                  </p>
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
                <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                  {activeBreaks.length}
                </span>
              </div>
            </div>
            <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
              {activeBreaks.length > 0 ? (
                activeBreaks.map((breakItem) => {
                  const employee = employees.find(
                    (e) => e.id === breakItem.employee_id,
                  );
                  // Calculate duration from start time
                  const getDuration = (startTime) => {
                    if (!startTime) return "0m";
                    const [hours, minutes] = startTime.split(":").map(Number);
                    const startMinutes = hours * 60 + minutes;
                    const now = new Date();
                    const currentMinutes =
                      now.getHours() * 60 + now.getMinutes();
                    let diff = currentMinutes - startMinutes;
                    if (diff < 0) diff += 24 * 60;
                    if (diff < 60) return `${diff}m`;
                    const hrs = Math.floor(diff / 60);
                    const mins = diff % 60;
                    return `${hrs}h ${mins}m`;
                  };

                  return (
                    <div
                      key={breakItem.id}
                      className="p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                          {employee?.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("") || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800">
                            {employee?.name || breakItem.employee_name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {breakItem.break_type || "Break"} • Started at{" "}
                            {breakItem.break_start_time?.slice(0, 5)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full font-mono">
                          <Timer className="h-3 w-3" />
                          <span className="text-xs font-medium">
                            {getDuration(breakItem.break_start_time)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center">
                  <Coffee className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No breaks</p>
                  <p className="text-xs text-slate-400 mt-1">
                    All employees are working
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Sales Performance - Sorted Descending */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800">
                    Sales Performance
                  </h3>
                </div>
                <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                  Sales Team
                </span>
              </div>
            </div>
            <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
              {employees
                .filter(
                  (e) => e.department === "Sales" && e.status === "active",
                )
                .sort((a, b) => b.salesAchieved - a.salesAchieved) // Sort descending by achieved
                .map((emp) => {
                  const progress =
                    emp.salesTarget > 0
                      ? (emp.salesAchieved / emp.salesTarget) * 100
                      : 0;
                  return (
                    <div
                      key={emp.id}
                      className="p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                          {emp.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("") || "?"}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">
                            {emp.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {emp.position}
                          </p>
                        </div>
                      </div>
                      <div className="ml-13">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-slate-500">Achieved</span>
                          <span className="font-medium text-slate-700">
                            ${emp.salesAchieved.toLocaleString()} / $
                            {emp.salesTarget.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${progress >= 100 ? "bg-emerald-500" : "bg-emerald-400"}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                        {progress >= 100 && (
                          <div className="flex items-center gap-1 mt-2 text-emerald-600">
                            <CheckCircle className="h-3 w-3" />
                            <span className="text-xs font-medium">
                              Target achieved!
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              {employees.filter(
                (e) => e.department === "Sales" && e.status === "active",
              ).length === 0 && (
                  <div className="p-8 text-center">
                    <DollarSign className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No sales data</p>
                    <p className="text-xs text-slate-400 mt-1">
                      No sales employees found
                    </p>
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
                  <h3 className="font-semibold text-slate-800">
                    Projects Status
                  </h3>
                </div>
                <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full">
                  Active
                </span>
              </div>
            </div>
            <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
              {projects
                .filter((p) => p.status !== "Completed")
                .map((project, idx) => (
                  <div
                    key={idx}
                    className="p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="mb-2">
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-medium text-slate-800 text-sm">
                          {project.name}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${project.status === "In Progress"
                            ? "bg-blue-100 text-blue-700"
                            : project.status === "Planning"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-green-100 text-green-700"
                            }`}
                        >
                          {project.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {project.assigned_to || "Unassigned"} •{" "}
                        {project.department}
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Progress</span>
                        <span>{project.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              {projects.filter((p) => p.status !== "Completed").length ===
                0 && (
                  <div className="p-8 text-center">
                    <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">
                      No active projects
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      All projects are completed
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            Dashboard updates in real-time • Last sync:{" "}
            {currentTime.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminDashboard;

import React, { useState, useEffect, useCallback } from "react";
import HrSidebar from "../../components/HrSidebar";
import { config, endpoints } from "../../config/api";
import {
  DashboardHeader,
  RoleBasedNav,
} from "../../components/DashboardComponents";
import { useAuth } from "../../context/AuthContext";
import {
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Calendar,
  User,
  Download,
  Coffee,
  Timer,
  Brain,
} from "lucide-react";
import { getPakistanDateString } from "../../utils/timezone";
import PagePreloader from "../../components/PagePreloader";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const API_URL = config.FULL_API_URL;

const HRDashboard = () => {
  const { role } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("dashboard");
  const [activeBreaks, setActiveBreaks] = useState([]);
  const [stats, setStats] = useState([
    {
      label: "Total Present",
      value: "0",
      icon: CheckCircle,
      color: "from-blue-500 to-cyan-600",
    },
    {
      label: "Total Absent",
      value: "0",
      icon: XCircle,
      color: "from-red-500 to-pink-600",
    },
    {
      label: "Total Late",
      value: "0",
      icon: Clock,
      color: "from-orange-500 to-red-600",
    },
    {
      label: "Total ML",
      value: "0",
      icon: Brain,
      color: "from-purple-500 to-indigo-600",
    },
    {
      label: "Avg Attendance",
      value: "0%",
      icon: TrendingUp,
      color: "from-green-500 to-emerald-600",
    },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Chart states
  const [monthlyData, setMonthlyData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [chartLoading, setChartLoading] = useState(false);
  const [allAttendanceData, setAllAttendanceData] = useState([]);

  // Helper: Get auth headers
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });

  // Fetch dashboard data (today's metrics for all employees)
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const today = getPakistanDateString();

      // Fetch all attendance records for today's metrics
      const [attendanceRes, employeesRes] = await Promise.all([
        fetch(`${API_URL}/attendance/all?limit=10000`, {
          method: "GET",
          headers: getAuthHeaders(),
        }),
        fetch(`${API_URL}/employees`, {
          method: "GET",
          headers: getAuthHeaders(),
        }),
      ]);

      const attendanceResponse = await attendanceRes.json();
      const employeesResponse = await employeesRes.json();

      let allAttendance = [];
      if (attendanceResponse.success && attendanceResponse.data) {
        allAttendance = attendanceResponse.data;
      }

      let allEmployees = [];
      if (employeesResponse.success && Array.isArray(employeesResponse.data)) {
        allEmployees = employeesResponse.data;
        setEmployees(allEmployees);
      }

      setAllAttendanceData(allAttendance);

      // Get today's attendance records
      const todayAttendance = allAttendance.filter((record) => {
        return record.attendance_date === today;
      });

      // Get unique employee IDs who checked in today
      const checkedInEmployeeIds = new Set(
        todayAttendance.map((r) => r.employee_id),
      );

      // Calculate dynamic absent: Total employees - employees who checked in
      const totalEmployees = allEmployees.length;
      const dynamicAbsent = totalEmployees - checkedInEmployeeIds.size;

      const presentOntime = todayAttendance.filter(
        (r) => r.status === "Present",
      ).length;
      const totalLate = todayAttendance.filter(
        (r) => r.status === "Late",
      ).length;
      const totalML = todayAttendance.filter((r) => r.status === "ML").length;

      const avgAttendance =
        totalEmployees > 0
          ? Math.round((checkedInEmployeeIds.size / totalEmployees) * 100)
          : 0;

      setStats([
        {
          label: "Total Present",
          value: presentOntime.toString(),
          icon: CheckCircle,
          color: "from-blue-500 to-cyan-600",
        },
        {
          label: "Total Absent",
          value: dynamicAbsent.toString(),
          icon: XCircle,
          color: "from-red-500 to-pink-600",
        },
        {
          label: "Total Late",
          value: totalLate.toString(),
          icon: Clock,
          color: "from-orange-500 to-red-600",
        },
        {
          label: "Total ML",
          value: totalML.toString(),
          icon: Brain,
          color: "from-purple-500 to-indigo-600",
        },
        {
          label: "Avg Attendance",
          value: `${avgAttendance}%`,
          icon: TrendingUp,
          color: "from-green-500 to-emerald-600",
        },
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/employees`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setEmployees(data.data);
        console.log(`Loaded ${data.data.length} employees`);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
      setEmployees([]);
    }
  }, []);

  const fetchActiveBreaks = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all active employees first
      const employeesRes = await fetch(
        `${process.env.REACT_APP_API_URL || "http://100.118.172.21:5000"}/api/v1/employees?limit=1000`,
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
            `${process.env.REACT_APP_API_URL || "http://100.118.172.21:5000"}/api/v1/attendance/ongoing-breaks/${employee.id}`,
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
    fetchActiveBreaks();

    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      fetchActiveBreaks();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchActiveBreaks]);

  // Fetch monthly attendance data using the dedicated API
  const fetchMonthlyAttendance = useCallback(async () => {
    try {
      setChartLoading(true);
      setError(null);

      console.log("=== Fetching Monthly Attendance ===");
      console.log(`Selected: ${selectedYear}-${selectedMonth + 1}`);
      console.log(`Selected Employee: ${selectedEmployee}`);

      let attendanceRecords = [];
      let totalEmployeesCount = employees.length;

      if (selectedEmployee === "all") {
        // Fetch all employees attendance
        console.log("Fetching all employees attendance...");
        const response = await fetch(`${API_URL}/attendance/all?limit=10000`, {
          method: "GET",
          headers: getAuthHeaders(),
        });
        const data = await response.json();
        attendanceRecords = data.data || [];
        console.log(`Fetched ${attendanceRecords.length} total records`);
      } else {
        // Fetch specific employee's monthly attendance using dedicated API
        console.log(`Fetching attendance for employee: ${selectedEmployee}`);
        const response = await fetch(
          endpoints.attendance.monthly(
            selectedEmployee,
            selectedYear,
            selectedMonth + 1,
          ),
          {
            method: "GET",
            headers: getAuthHeaders(),
          },
        );
        const data = await response.json();

        if (data.success && data.data) {
          attendanceRecords = data.data;
          console.log(
            `Fetched ${attendanceRecords.length} records for employee ${selectedEmployee}`,
          );
          console.log("Sample record:", attendanceRecords[0]);
        } else {
          attendanceRecords = [];
        }
      }

      // Get days in month
      const daysInMonth = new Date(
        selectedYear,
        selectedMonth + 1,
        0,
      ).getDate();

      // Create a map of date -> attendance data
      const attendanceMap = new Map();

      attendanceRecords.forEach((record) => {
        const date = record.attendance_date;
        const status = record.status;

        if (!attendanceMap.has(date)) {
          attendanceMap.set(date, { present: 0, absent: 0, late: 0, ml: 0 });
        }

        const statusData = attendanceMap.get(date);
        if (status === "Present") statusData.present++;
        else if (status === "Absent") statusData.absent++;
        else if (status === "Late") statusData.late++;
        else if (status === "ML") statusData.ml++;
      });

      // Build daily stats for ALL days in the month
      const dailyStats = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        // Get attendance data for this date
        const dayData = attendanceMap.get(dateStr) || {
          present: 0,
          absent: 0,
          late: 0,
          ml: 0,
        };

        let present = dayData.present;
        let absent = dayData.absent;
        let late = dayData.late;
        let ml = dayData.ml;

        if (selectedEmployee === "all") {
          // For all employees: Calculate dynamic absent based on total employees
          const totalCheckedIn = present + late + ml;
          absent = totalEmployeesCount - totalCheckedIn;
        } else {
          // For specific employee: Data already comes from backend with absent records
          // No need to recalculate
          absent = dayData.absent;
        }

        // Apply status filter
        if (selectedStatus !== "all") {
          if (selectedStatus === "Present") {
            late = 0;
            ml = 0;
            absent = 0;
          } else if (selectedStatus === "Absent") {
            present = 0;
            late = 0;
            ml = 0;
          } else if (selectedStatus === "Late") {
            present = 0;
            ml = 0;
            absent = 0;
          } else if (selectedStatus === "ML") {
            present = 0;
            late = 0;
            absent = 0;
          }
        }

        dailyStats.push({
          day: day,
          date: dateStr,
          present,
          absent,
          late,
          ml,
          total: present + absent + late + ml,
        });
      }

      console.log(`Generated ${dailyStats.length} days for chart`);
      setMonthlyData(dailyStats);
    } catch (error) {
      console.error("Error fetching monthly attendance:", error);
      setError(error.message);
    } finally {
      setChartLoading(false);
    }
  }, [
    selectedEmployee,
    selectedMonth,
    selectedYear,
    employees.length,
    selectedStatus,
  ]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
    fetchEmployees();
  }, [fetchDashboardData, fetchEmployees]);

  // Fetch monthly attendance when filters change
  useEffect(() => {
    if (employees.length > 0) {
      fetchMonthlyAttendance();
    }
  }, [fetchMonthlyAttendance]);

  // Custom tooltip for stacked chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 min-w-[220px]">
          <p className="font-semibold text-gray-900 mb-2">
            Day {label} ({data.date})
          </p>
          <div className="space-y-1">
            <p className="text-sm text-green-600">✓ Present: {data.present}</p>
            <p className="text-sm text-red-600">✗ Absent: {data.absent}</p>
            <p className="text-sm text-orange-600">⏰ Late: {data.late}</p>
            <p className="text-sm text-purple-600">🧠 ML: {data.ml}</p>
            <p className="text-sm text-gray-600 border-t mt-2 pt-2 font-bold">
              Total: {data.total}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Date", "Day", "Present", "Absent", "Late", "ML", "Total"];
    const csvData = monthlyData.map((d) => [
      d.date,
      d.day,
      d.present,
      d.absent,
      d.late,
      d.ml,
      d.total,
    ]);
    const csvContent = [headers, ...csvData]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${selectedYear}_${selectedMonth + 1}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get available months from data
  const getAvailableMonths = () => {
    const months = new Set();
    allAttendanceData.forEach((record) => {
      if (record.attendance_date) {
        months.add(record.attendance_date.substring(0, 7));
      }
    });
    return Array.from(months).sort();
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <HrSidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          title="HR Dashboard"
          subtitle="Manage your team and monitor attendance"
        />
        <RoleBasedNav role={role} />

        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-10">
          <PagePreloader loading={loading} message="Loading dashboard data...">
            <div className="w-full">
              {/* Stats Grid */}
              <div className="mb-12 w-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Today Metrics ({getPakistanDateString()})
                  </h2>
                  <button
                    onClick={() => fetchDashboardData()}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-8 w-full">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300 group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">
                              {stat.label}
                            </p>
                            <p className="text-4xl font-bold text-gray-900 mt-3 group-hover:text-blue-600 transition">
                              {loading ? "..." : stat.value}
                            </p>
                          </div>
                          <div
                            className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg shadow-opacity-30 group-hover:scale-110 transition-transform duration-300`}
                          >
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Welcome Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 w-full">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">
                      Welcome to HR Portal
                    </h2>
                    <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full"></div>
                  </div>
                  <p className="text-gray-600 text-base leading-relaxed mb-8">
                    Manage your team efficiently with comprehensive tools for
                    attendance tracking, employee management, and application
                    processing.
                  </p>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                      <div className="text-3xl mb-3">👥</div>
                      <h3 className="font-bold text-blue-900 mb-2 text-lg">
                        Team Management
                      </h3>
                      <p className="text-sm text-blue-700">
                        View and manage team members
                      </p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                      <div className="text-3xl mb-3">📋</div>
                      <h3 className="font-bold text-green-900 mb-2 text-lg">
                        Attendance
                      </h3>
                      <p className="text-sm text-green-700">
                        Monitor attendance records
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 h-fit sticky top-24">
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
                </div>
              </div>

              {/* Monthly Attendance Bar Chart Section */}
              <div className="mt-12 w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Monthly Attendance Overview
                    </h2>
                    <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full mt-2"></div>
                    {/* <p className="text-xs text-gray-500 mt-1">
                      {selectedEmployee === "all" 
                        ? "Using API: /attendance/all | Absent = Total Employees - Checked-in Employees"
                        : `Using API: /attendance/monthly/${selectedEmployee} | Backend returns complete attendance data`
                      }
                    </p> */}
                  </div>
                  <button
                    onClick={exportToCSV}
                    disabled={monthlyData.length === 0}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-all disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <select
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">
                        All Employees ({employees.length})
                      </option>
                      {employees.map((emp) => (
                        <option
                          key={emp.id || emp._id}
                          value={emp.id || emp._id}
                        >
                          {emp.name} (ID: {emp.employee_id || emp.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">
                        All Status
                      </option>
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Late">Late</option>
                      <option value="ML">ML</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div className="flex gap-2 flex-1">
                      <select
                        value={selectedMonth}
                        onChange={(e) =>
                          setSelectedMonth(parseInt(e.target.value))
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {[
                          "Jan",
                          "Feb",
                          "Mar",
                          "Apr",
                          "May",
                          "Jun",
                          "Jul",
                          "Aug",
                          "Sep",
                          "Oct",
                          "Nov",
                          "Dec",
                        ].map((month, idx) => (
                          <option key={idx} value={idx}>
                            {month}
                          </option>
                        ))}
                      </select>
                      <select
                        value={selectedYear}
                        onChange={(e) =>
                          setSelectedYear(parseInt(e.target.value))
                        }
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {[2023, 2024, 2025, 2026].map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* STACKED Bar Chart */}
                {chartLoading ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
                      <p className="text-gray-500">
                        Fetching attendance data from API...
                      </p>
                    </div>
                  </div>
                ) : monthlyData.length === 0 ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <p className="text-gray-500 mb-2">
                        No attendance data for{" "}
                        {new Date(selectedYear, selectedMonth).toLocaleString(
                          "default",
                          { month: "long" },
                        )}{" "}
                        {selectedYear}
                      </p>
                      {employees.length > 0 && selectedEmployee !== "all" && (
                        <p className="text-sm text-gray-400">
                          Try selecting "All Employees" or a different month
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ width: "100%", height: "450px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        barCategoryGap={2}
                        barGap={0}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="day"
                          label={{
                            value: "Day of Month",
                            position: "insideBottom",
                            offset: -5,
                          }}
                          interval={0}
                          tick={{ fontSize: 11 }}
                        />
                        {/* <YAxis label={{ angle: -90, position: "insideLeft" }} /> */}
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          verticalAlign="top"
                          height={36}
                          wrapperStyle={{ paddingBottom: 10 }}
                        />

                        <Bar
                          dataKey="present"
                          name="Present"
                          fill="#10b981"
                          stackId="attendance"
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar
                          dataKey="absent"
                          name="Absent"
                          fill="#ef4444"
                          stackId="attendance"
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar
                          dataKey="late"
                          name="Late"
                          fill="#f59e0b"
                          stackId="attendance"
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar
                          dataKey="ml"
                          name="ML"
                          fill="#8b5cf6"
                          stackId="attendance"
                          radius={[0, 0, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Summary Stats */}
                {!chartLoading && monthlyData.length > 0 && (
                  <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {monthlyData.reduce((sum, d) => sum + d.present, 0)}
                      </p>
                      <p className="text-sm text-gray-600">Total Present</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">
                        {monthlyData.reduce((sum, d) => sum + d.absent, 0)}
                      </p>
                      <p className="text-sm text-gray-600">Total Absent</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">
                        {monthlyData.reduce((sum, d) => sum + d.late, 0)}
                      </p>
                      <p className="text-sm text-gray-600">Total Late</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {monthlyData.reduce((sum, d) => sum + d.ml, 0)}
                      </p>
                      <p className="text-sm text-gray-600">Total ML</p>
                    </div>
                  </div>
                )}
              </div>


            </div>
          </PagePreloader>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
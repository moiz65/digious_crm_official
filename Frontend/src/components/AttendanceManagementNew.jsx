// AttendanceManagement.jsx - Updated with Employee Filter + Calendar Range
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { endpoints } from "../config/api";
import PagePreloader from "./PagePreloader";
import {
  CheckCircle,
  Clock,
  Download,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Activity,
  Coffee,
  LogIn,
  LogOut,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  UserCheck,
  UserX,
  Zap,
  BarChart3,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import Chart from "chart.js/auto";

const formatTimeShort = (timeStr) => {
  if (!timeStr || timeStr === "N/A" || timeStr === "-") return "-";
  const parts = timeStr.split(":");
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return timeStr;
};

const formatMinutesShort = (mins) => {
  if (!mins || mins <= 0) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const AttendanceManagement = () => {
  // State Management
  const [attendanceData, setAttendanceData] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedBreakStatus, setSelectedBreakStatus] = useState("All");

  // Date States
  const [viewMode, setViewMode] = useState("today"); // 'today' or 'monthly'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [liveUpdates, setLiveUpdates] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [nowTime, setNowTime] = useState(Date.now());

  // Get user info for auth
  const user = JSON.parse(localStorage.getItem("userInfo") || "{}");
  const token = localStorage.getItem("token");

  // Fetch all employees for department filter
  const fetchAllEmployees = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || "http://100.118.172.21:5000"}/api/v1/employees?limit=1000`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const result = await response.json();
      if (result.success && result.data) {
        setAllEmployees(result.data);
        return result.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching employees:", error);
      return [];
    }
  }, [token]);

  // Fetch attendance based on view mode
  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      let attendanceRecords = [];

      if (viewMode === "today") {
        // Fetch today's attendance for all employees
        // For admin/HR view, we need all employees' today attendance
        // Since your endpoint is per employee, we need to fetch for all employees
        const employees = await fetchAllEmployees();

        // Fetch attendance for each employee (or use bulk endpoint if available)
        const attendancePromises = employees.map(async (employee) => {
          try {
            const response = await fetch(
              endpoints.attendance.today(employee.id),
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );
            const result = await response.json();
            if (result.success && result.data) {
              return {
                ...result.data,
                name: employee.name,
                email: employee.email,
                department: employee.department,
                employee_id: employee.employee_id,
              };
            } else {
              // No attendance record - mark as absent
              return {
                id: `absent-${employee.id}`,
                employee_id: employee.employee_id,
                name: employee.name,
                email: employee.email,
                department: employee.department,
                attendance_date: new Date().toISOString().split("T")[0],
                check_in_time: null,
                check_out_time: null,
                status: "Absent",
                is_absent: true,
                late_by_minutes: 0,
                net_working_time_minutes: 0,
                total_breaks_taken: 0,
                total_break_duration_minutes: 0,
                on_time: 0,
                overtime_minutes: 0,
                breaks: [],
              };
            }
          } catch (err) {
            console.error(
              `Error fetching attendance for ${employee.name}:`,
              err,
            );
            return null;
          }
        });

        const results = await Promise.all(attendancePromises);
        attendanceRecords = results.filter((r) => r !== null);
      } else if (viewMode === "monthly") {
        // Fetch monthly attendance for all employees
        const employees = await fetchAllEmployees();

        const attendancePromises = employees.map(async (employee) => {
          try {
            const response = await fetch(
              endpoints.attendance.monthly(
                employee.id,
                selectedYear,
                selectedMonth,
              ),
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );
            const result = await response.json();
            if (result.success && result.data) {
              // result.data is an array of attendance records for the month
              return result.data.map((record) => ({
                ...record,
                name: employee.name,
                email: employee.email,
                department: employee.department,
                employee_id: employee.id,
              }));
            }
            return [];
          } catch (err) {
            console.error(
              `Error fetching monthly attendance for ${employee.name}:`,
              err,
            );
            return [];
          }
        });

        const results = await Promise.all(attendancePromises);
        attendanceRecords = results.flat();
      }

      setAttendanceData(attendanceRecords);
      setTotalRecords(attendanceRecords.length);
      setFilteredRecords(attendanceRecords.length);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  }, [viewMode, selectedMonth, selectedYear, token, fetchAllEmployees]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchAttendance();

    if (autoRefresh) {
      const interval = setInterval(fetchAttendance, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchAttendance, autoRefresh, viewMode, selectedMonth, selectedYear]);

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set(
      attendanceData.map((r) => r.department).filter(Boolean),
    );
    return ["All Departments", ...Array.from(depts)];
  }, [attendanceData]);

  // Update nowTime
  useEffect(() => {
    if (!liveUpdates) return;
    const interval = setInterval(() => setNowTime(Date.now()), 60 * 1000);
    return () => clearInterval(interval);
  }, [liveUpdates]);

  // Filter data
  const filteredData = useMemo(() => {
    return attendanceData.filter((record) => {
      const matchesSearch =
        !searchQuery ||
        record.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (record.employee_id &&
          String(record.employee_id)
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));

      const matchesDepartment =
        selectedDepartment === "All Departments" ||
        record.department === selectedDepartment;

      const isAbsent =
        !record.check_in_time ||
        record.status === "Absent" ||
        record.is_absent === true;

      let matchesStatus = selectedStatus === "All";
      if (selectedStatus !== "All") {
        if (selectedStatus === "Absent") {
          matchesStatus = isAbsent;
        } else if (selectedStatus === "Late") {
          matchesStatus = record.status === "Late";
        } else if (selectedStatus === "ML") {
          matchesStatus = record.status === "ML";
        } else if (selectedStatus === "Leave") {
          matchesStatus =
            record.status === "Leave" || record.status === "On Leave";
        } else if (selectedStatus === "Present") {
          matchesStatus = record.status === "Present" && record.check_in_time;
        } else {
          matchesStatus = record.status === selectedStatus;
        }
      }

      let matchesBreakStatus = selectedBreakStatus === "All";
      if (selectedBreakStatus !== "All") {
        const hasTakenBreaks = (record.total_breaks_taken || 0) > 0;
        matchesBreakStatus =
          selectedBreakStatus === "On Break" ? hasTakenBreaks : !hasTakenBreaks;
      }

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesStatus &&
        matchesBreakStatus
      );
    });
  }, [
    attendanceData,
    searchQuery,
    selectedDepartment,
    selectedStatus,
    selectedBreakStatus,
  ]);

  useEffect(() => {
    setFilteredRecords(filteredData.length);
  }, [filteredData]);

  // Calculate statistics
  const stats = useMemo(() => {
    const s = attendanceData.reduce(
      (acc, r) => {
        const isAbsent =
          !r.check_in_time || r.status === "Absent" || r.is_absent === true;

        if (r.status === "Present" && r.check_in_time) acc.present++;
        if (isAbsent) acc.absent++;
        if (
          r.check_out_time === null &&
          r.status === "Present" &&
          r.check_in_time
        )
          acc.active++;
        if (r.check_out_time !== null || isAbsent) acc.inactive++;
        acc.totalBreaks += r.total_breaks_taken || 0;
        acc.totalWorkMinutes += r.net_working_time_minutes || 0;
        if (r.late_by_minutes > 0) acc.late++;
        if (r.on_time === 1) acc.onTime++;
        return acc;
      },
      {
        present: 0,
        absent: 0,
        active: 0,
        inactive: 0,
        totalBreaks: 0,
        totalWorkMinutes: 0,
        late: 0,
        onTime: 0,
      },
    );

    s.avgWorkingHours =
      attendanceData.length > 0
        ? (s.totalWorkMinutes / attendanceData.length / 60).toFixed(1)
        : "0.0";
    return s;
  }, [attendanceData]);

  // Navigation functions
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const getDateDisplay = () => {
    if (viewMode === "today") {
      return selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else {
      return new Date(selectedYear, selectedMonth - 1).toLocaleDateString(
        "en-US",
        {
          month: "long",
          year: "numeric",
        },
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="p-8 max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Attendance Management
              </h1>
              <p className="text-slate-600 font-medium">
                📅 {getDateDisplay()} • {attendanceData.length} total records
              </p>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Download className="h-5 w-5" />
              Export Report
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <UserCheck className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.present}</div>
                <div className="text-emerald-100 text-xs">Present</div>
              </div>
            </div>
          </div> */}

          <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-5 text-white shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <UserX className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.absent}</div>
                <div className="text-rose-100 text-xs">Absent</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.onTime}</div>
                <div className="text-blue-100 text-xs">On Time</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.late}</div>
                <div className="text-amber-100 text-xs">Late</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Activity className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.active}</div>
                <div className="text-indigo-100 text-xs">Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Filters Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-800">Filters</h3>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                {filteredRecords} records
              </span>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg">
                <input
                  type="checkbox"
                  checked={liveUpdates}
                  onChange={(e) => setLiveUpdates(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span className="font-medium">Live Updates</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span className="font-medium">Auto Refresh</span>
              </label>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setViewMode("today")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                viewMode === "today"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Today's Attendance
            </button>
            <button
              onClick={() => setViewMode("monthly")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                viewMode === "monthly"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Monthly Attendance
            </button>
          </div>

          {/* Date Navigation */}
          {viewMode === "today" ? (
            <div className="flex items-center gap-2"></div>
          ) : (
            <div className="mb-6 p-4 bg-slate-50 rounded-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-700">
                    {viewMode === "today" || "Select Month:"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>
                        {new Date(2024, m - 1).toLocaleDateString("en-US", {
                          month: "long",
                        })}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    {[2023, 2024, 2025, 2026].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={goToNextMonth}
                    className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by employee name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-medium"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-medium"
              >
                <option>All</option>
                <option>Present</option>
                <option>Absent</option>
                <option>Late</option>
                <option>ML</option>
                <option>Leave</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Break Status
              </label>
              <select
                value={selectedBreakStatus}
                onChange={(e) => setSelectedBreakStatus(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-medium"
              >
                <option>All</option>
                <option>On Break</option>
                <option>Not On Break</option>
              </select>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <AttendanceTable
          data={filteredData}
          loading={loading}
          onViewDetails={setSelectedEmployee}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
        />

        {/* Employee Detail Modal */}
        {selectedEmployee && (
          <EmployeeDetailModal
            employee={selectedEmployee}
            onClose={() => setSelectedEmployee(null)}
            nowTime={nowTime}
          />
        )}
      </div>
    </div>
  );
};

// Attendance Overview Card Component
const AttendanceOverviewCard = ({ stats, totalEmployees, dateDisplay }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext("2d");

      const data = {
        labels: ["Present", "Absent", "On Time", "Late"],
        datasets: [
          {
            data: [stats.present, stats.absent, stats.onTime, stats.late],
            backgroundColor: [
              "rgba(16, 185, 129, 0.8)",
              "rgba(239, 68, 68, 0.8)",
              "rgba(16, 185, 129, 0.8)",
              "rgba(251, 146, 60, 0.8)",
            ],
            borderColor: ["#10B981", "#EF4444", "#3B82F6", "#FB923C"],
            borderWidth: 3,
            hoverOffset: 20,
          },
        ],
      };

      chartInstance.current = new Chart(ctx, {
        type: "doughnut",
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "70%",
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              padding: 12,
              titleFont: { size: 14, weight: "bold" },
              bodyFont: { size: 13 },
              borderColor: "rgba(255, 255, 255, 0.2)",
              borderWidth: 1,
            },
          },
          animation: {
            animateScale: true,
            animateRotate: true,
          },
        },
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [stats]);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-xl">
          <BarChart3 className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-800">
            Attendance Overview
          </h3>
          <p className="text-sm text-slate-600">{dateDisplay}</p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6">
        <div className="relative w-64 h-64">
          <canvas ref={chartRef} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-sm font-semibold text-slate-600">Total</div>
              <div className="text-4xl font-bold text-slate-800">
                {totalEmployees}
              </div>
              <div className="text-sm text-slate-500 mt-1">Employees</div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        {/* <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
          <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
          <div>
            <div className="text-xs text-slate-600">Present</div>
            <div className="text-lg font-bold text-slate-800">
              {stats.present}
            </div>
          </div>
        </div> */}
        <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl">
          <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
          <div>
            <div className="text-xs text-slate-600">Absent</div>
            <div className="text-lg font-bold text-slate-800">
              {stats.absent}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <div>
            <div className="text-xs text-slate-600">On Time</div>
            <div className="text-lg font-bold text-slate-800">
              {stats.onTime}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
          <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
          <div>
            <div className="text-xs text-slate-600">Late</div>
            <div className="text-lg font-bold text-slate-800">{stats.late}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Attendance Table Component
// Attendance Table Component (keep as is from previous code)
const AttendanceTable = ({
  data,
  loading,
  onViewDetails,
  currentPage,
  setCurrentPage,
  itemsPerPage,
}) => {
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length, setCurrentPage]);

  if (loading) {
    return (
      <PagePreloader
        loading={true}
        variant="table"
        message="Loading attendance records..."
      />
    );
  }

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Emp ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Check In/Out
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Breaks
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedData.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {record.employee_id || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {record.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">
                          {record.name || "Unknown"}
                        </div>
                        <div className="text-sm text-slate-500">
                          {record.email || "Unknown"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {record.attendance_date
                      ? new Date(record.attendance_date).toLocaleDateString(
                          "en-CA",
                        )
                      : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <LogIn className="h-4 w-4 text-emerald-600" />
                        <span className="text-slate-700">
                          {record.check_in_time
                            ? formatTimeShort(record.check_in_time)
                            : "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <LogOut className="h-4 w-4 text-blue-600" />
                        <span className="text-slate-700">
                          {record.check_out_time
                            ? formatTimeShort(record.check_out_time)
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Coffee className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-semibold text-slate-800">
                        {record.total_breaks_taken || 0}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {(record.total_break_duration_minutes || 0) > 0
                        ? `${record.total_break_duration_minutes}m`
                        : "0m"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        record.status === "Present"
                          ? "bg-emerald-100 text-emerald-700"
                          : record.status === "Absent"
                            ? "bg-rose-100 text-rose-700"
                            : record.status === "Late"
                              ? "bg-amber-100 text-amber-700"
                              : record.status === "ML"
                                ? "bg-blue-900 text-white"
                                : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {record.status || "Unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onViewDetails(record)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="text-sm font-medium">View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.length > itemsPerPage && (
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-lg border border-slate-200">
          <div className="text-sm text-slate-600">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, data.length)} of {data.length}{" "}
            records
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-slate-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Employee Detail Modal Component
const EmployeeDetailModal = ({ employee, onClose, nowTime }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            Employee Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <X className="h-6 w-6 text-slate-600" />
          </button>
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
              {employee.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1">
              <div className="text-lg font-bold text-slate-800">
                {employee.name}
              </div>
              <div className="text-sm text-slate-500">{employee.email}</div>
              <div className="text-xs text-slate-400 mt-1">
                {employee.attendance_date}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-xl border">
              <div className="text-xs font-semibold text-slate-500 mb-1">
                Check In
              </div>
              <div className="text-lg font-bold text-slate-800">
                {formatTimeShort(employee.check_in_time)}
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl border">
              <div className="text-xs font-semibold text-slate-500 mb-1">
                Check Out
              </div>
              <div className="text-lg font-bold text-slate-800">
                {formatTimeShort(employee.check_out_time)}
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl border">
              <div className="text-xs font-semibold text-slate-500 mb-1">
                Total Breaks
              </div>
              <div className="text-lg font-bold text-slate-800">
                {employee.total_breaks_taken || 0}
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl border">
              <div className="text-xs font-semibold text-slate-500 mb-1">
                Working Time
              </div>
              <div className="text-lg font-bold text-slate-800">
                {formatMinutesShort(employee.net_working_time_minutes || 0)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;

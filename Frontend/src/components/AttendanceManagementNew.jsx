// AttendanceManagement.jsx - Filter by Employee Status (Active/Inactive)
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

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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
  const [selectedActiveStatus, setSelectedActiveStatus] = useState("Active"); // Default: Active (based on employee.status)

  // Date States
  const [viewMode, setViewMode] = useState("today");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Monthly view states
  const [selectedEmployeeForMonthly, setSelectedEmployeeForMonthly] = useState(null);
  const [monthlyAttendanceRecords, setMonthlyAttendanceRecords] = useState([]);
  const [showMonthlyDetail, setShowMonthlyDetail] = useState(false);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // Monthly detail month/year selection
  const [detailMonth, setDetailMonth] = useState(new Date().getMonth() + 1);
  const [detailYear, setDetailYear] = useState(new Date().getFullYear());

  const [liveUpdates, setLiveUpdates] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [nowTime, setNowTime] = useState(Date.now());

  // Get user info for auth
  const user = JSON.parse(localStorage.getItem("userInfo") || "{}");
  const token = localStorage.getItem("token");

  // Fetch all employees for department filter
  const fetchAllEmployees = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || "http://100.114.9.93:5000"}/api/v1/employees?limit=1000`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const result = await response.json();
      if (result.success && result.data) {
        setAllEmployees(result.data);
        console.log("Fetched all employees:", result.data);
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
        const employees = await fetchAllEmployees();

        const attendancePromises = employees.map(async (employee) => {
          try {
            const empId = employee.id || employee._id;
            const response = await fetch(
              `${process.env.REACT_APP_API_URL || "http://100.118.172.21:5000"}/api/v1/attendance/today/${empId}`,
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
                employee_id: employee.employee_id || employee.id,
                _id: employee.id || employee._id,
                employee_status: employee.status || "Active", // Add employee status
              };
            } else {
              return {
                id: `absent-${employee.id}`,
                employee_id: employee.employee_id || employee.id,
                _id: employee.id || employee._id,
                name: employee.name,
                email: employee.email,
                department: employee.department,
                employee_status: employee.status || "Active",
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
        setAttendanceData(attendanceRecords);
        setTotalRecords(attendanceRecords.length);
        setFilteredRecords(attendanceRecords.length);
      } else if (viewMode === "monthly") {
        const employees = await fetchAllEmployees();
        setAllEmployees(employees);
        setAttendanceData(employees.map(emp => ({
          ...emp,
          _id: emp.id || emp._id,
          employee_status: emp.status || "Active",
          total_present: 0,
          total_absent: 0,
          total_late: 0,
          total_working_hours: 0,
        })));
        setTotalRecords(employees.length);
        setFilteredRecords(employees.length);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  }, [viewMode, token, fetchAllEmployees]);

  // Fetch monthly attendance for a specific employee
  const fetchEmployeeMonthlyAttendance = useCallback(async (employee, month, year) => {
    const employeeId = employee?._id || employee?.id;

    let actualEmployeeId = employeeId;

    if (!actualEmployeeId || actualEmployeeId === employee?.id) {
      const foundEmployee = allEmployees.find(
        emp => emp.employee_id === employee?.employee_id || emp.id === employee?._id
      );
      if (foundEmployee) {
        actualEmployeeId = foundEmployee.id || foundEmployee._id;
        console.log(`Found actual employee ID: ${actualEmployeeId} from employee_id: ${employee?.employee_id}`);
      }
    }

    if (!actualEmployeeId) {
      console.error("No employee ID found in:", employee);
      setMonthlyAttendanceRecords([]);
      setShowMonthlyDetail(true);
      setMonthlyLoading(false);
      return;
    }

    console.log(`Using employee ID: ${actualEmployeeId} for API call`);

    setMonthlyLoading(true);
    try {
      const m = month || detailMonth || selectedMonth;
      const y = year || detailYear || selectedYear;

      const url = `${process.env.REACT_APP_API_URL || "http://100.118.172.21:5000"}/api/v1/attendance/monthly/${actualEmployeeId}?year=${y}&month=${m}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log("Monthly attendance response:", result);

      if (result.success && result.data) {
        let records = [];
        if (Array.isArray(result.data)) {
          records = result.data;
        } else if (result.data.attendance) {
          records = result.data.attendance;
        } else if (result.data.records) {
          records = result.data.records;
        } else {
          records = [result.data];
        }
        setMonthlyAttendanceRecords(records.filter(r => r !== null && r !== undefined));
        setShowMonthlyDetail(true);
      } else {
        console.warn("No attendance data found or API error:", result);
        setMonthlyAttendanceRecords([]);
        setShowMonthlyDetail(true);
      }
    } catch (error) {
      console.error("Error fetching monthly attendance:", error);
      setMonthlyAttendanceRecords([]);
      setShowMonthlyDetail(true);
    } finally {
      setMonthlyLoading(false);
    }
  }, [selectedMonth, selectedYear, detailMonth, detailYear, token, allEmployees]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchAttendance();

    if (autoRefresh && viewMode === "today") {
      const interval = setInterval(fetchAttendance, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchAttendance, autoRefresh, viewMode]);

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

  // Filter data - Active/Inactive filter based on employee.status field
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

      // Status filter for today view only
      let matchesStatus = selectedStatus === "All";
      if (viewMode === "today" && selectedStatus !== "All") {
        const isAbsent =
          !record.check_in_time ||
          record.status === "Absent" ||
          record.is_absent === true;

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
      } else if (viewMode === "monthly") {
        matchesStatus = true;
      }

      // Active/Inactive filter - Based on employee.status field
      let matchesActiveStatus = selectedActiveStatus === "All";
      if (selectedActiveStatus !== "All") {
        const employeeStatus = record.employee_status || "Active";
        matchesActiveStatus = employeeStatus === selectedActiveStatus;
      }

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesStatus &&
        matchesActiveStatus
      );
    });
  }, [
    attendanceData,
    searchQuery,
    selectedDepartment,
    selectedStatus,
    selectedActiveStatus,
    viewMode,
  ]);

  useEffect(() => {
    setFilteredRecords(filteredData.length);
  }, [filteredData]);

  // Calculate statistics
  const stats = useMemo(() => {
    const s = attendanceData.reduce(
      (acc, r) => {
        if (viewMode === "today") {
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
        }
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
  }, [attendanceData, viewMode]);

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

  const handleViewMonthlyAttendance = (employee) => {
    console.log("Employee data:", employee);
    console.log("ID fields - id:", employee?.id, "_id:", employee?._id, "employee_id:", employee?.employee_id);

    setSelectedEmployeeForMonthly(employee);
    const month = selectedMonth;
    const year = selectedYear;
    setDetailMonth(month);
    setDetailYear(year);
    fetchEmployeeMonthlyAttendance(employee, month, year);
  };

  const handleDetailMonthChange = (month, year) => {
    setDetailMonth(month);
    setDetailYear(year);
    if (selectedEmployeeForMonthly) {
      fetchEmployeeMonthlyAttendance(selectedEmployeeForMonthly, month, year);
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

        {/* Stats Cards - Only show for today view */}
        {viewMode === "today" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
        )}

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
              {viewMode === "today" && (
                <>
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
                </>
              )}
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => {
                setViewMode("today");
                setShowMonthlyDetail(false);
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${viewMode === "today"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
            >
              Today's Attendance
            </button>
            <button
              onClick={() => {
                setViewMode("monthly");
                setShowMonthlyDetail(false);
                fetchAttendance();
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${viewMode === "monthly"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
            >
              Monthly Attendance
            </button>
          </div>

          {/* Date Navigation */}
          {viewMode === "today" ? (
            <div className="mb-6 p-4 bg-slate-50 rounded-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-700">
                    Today's Date:
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPreviousDay}
                    className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium">
                    {selectedDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <button
                    onClick={goToNextDay}
                    className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Today
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
            </>
            // <div className="mb-6 p-4 bg-slate-50 rounded-xl">
            //   <div className="flex flex-wrap items-center justify-between gap-4">
            //     <div className="flex items-center gap-2">
            //       <Calendar className="h-5 w-5 text-blue-600" />
            //       <span className="text-sm font-semibold text-slate-700">
            //         Select Month:
            //       </span>
            //     </div>

            //     <div className="flex items-center gap-2">
            //       <button
            //         onClick={goToPreviousMonth}
            //         className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            //       >
            //         <ChevronLeft className="h-4 w-4" />
            //       </button>
            //       <select
            //         value={selectedMonth}
            //         onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            //         className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            //       >
            //         {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
            //           <option key={m} value={m}>
            //             {new Date(2024, m - 1).toLocaleDateString("en-US", {
            //               month: "long",
            //             })}
            //           </option>
            //         ))}
            //       </select>
            //       <select
            //         value={selectedYear}
            //         onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            //         className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            //       >
            //         {[2023, 2024, 2025, 2026].map((y) => (
            //           <option key={y} value={y}>
            //             {y}
            //           </option>
            //         ))}
            //       </select>
            //       <button
            //         onClick={goToNextMonth}
            //         className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            //       >
            //         <ChevronRight className="h-4 w-4" />
            //       </button>
            //     </div>
            //   </div>
            // </div>
          )}

          {/* Search and Filters */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder={viewMode === "today" ? "Search by employee name, email, or ID..." : "Search employees by name, email, or ID..."}
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

            {viewMode === "today" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Attendance Status
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
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Employee Status
              </label>
              <select
                value={selectedActiveStatus}
                onChange={(e) => setSelectedActiveStatus(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-medium"
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Attendance Table or Employee List - No Pagination */}
        {viewMode === "today" ? (
          <AttendanceTable
            data={filteredData}
            loading={loading}
            onViewDetails={setSelectedEmployee}
          />
        ) : (
          <>
            {showMonthlyDetail ? (
              <MonthlyAttendanceDetail
                employee={selectedEmployeeForMonthly}
                records={monthlyAttendanceRecords}
                loading={monthlyLoading}
                onBack={() => {
                  setShowMonthlyDetail(false);
                  setMonthlyAttendanceRecords([]);
                  setSelectedEmployeeForMonthly(null);
                }}
                detailMonth={detailMonth}
                detailYear={detailYear}
                onMonthChange={handleDetailMonthChange}
              />
            ) : (
              <EmployeeList
                employees={filteredData}
                loading={loading}
                onViewMonthly={handleViewMonthlyAttendance}
              />
            )}
          </>
        )}

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

// Employee List Component - No Pagination
const EmployeeList = ({
  employees,
  loading,
  onViewMonthly,
}) => {
  if (loading) {
    return (
      <PagePreloader
        loading={true}
        variant="table"
        message="Loading employees..."
      />
    );
  }

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
                  Department
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Email
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
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    No employees found
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr
                    key={employee.id || employee._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {employee.employee_id || employee.id || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {employee.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">
                            {employee.name || "Unknown"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {employee.department || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {employee.email || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${employee.employee_status === "Active"
                          ? "bg-emerald-100 text-emerald-700"
                          : employee.employee_status === "Inactive"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-slate-100 text-slate-700"
                          }`}
                      >
                        {employee.employee_status || "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onViewMonthly(employee)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="text-sm font-medium">View Attendance</span>
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
  );
};

// Monthly Attendance Detail Component
const MonthlyAttendanceDetail = ({
  employee,
  records,
  loading,
  onBack,
  detailMonth,
  detailYear,
  onMonthChange,
}) => {
  const stats = useMemo(() => {
    if (!records || records.length === 0) {
      return { present: 0, absent: 0, late: 0, totalWorkMinutes: 0, avgHours: "0.0" };
    }

    const s = records.reduce(
      (acc, r) => {
        if (r.status === "Present" || r.status === "Present (Late)") {
          acc.present++;
        }
        if (r.status === "Absent") acc.absent++;
        if (r.status === "Present (Late)" || r.late_by_minutes > 0) acc.late++;
        acc.totalWorkMinutes += r.net_working_time_minutes || 0;
        return acc;
      },
      {
        present: 0,
        absent: 0,
        late: 0,
        totalWorkMinutes: 0,
      },
    );
    s.avgHours = records.length > 0 ? (s.totalWorkMinutes / records.length / 60).toFixed(1) : "0.0";
    return s;
  }, [records]);

  const handleMonthChange = (month) => {
    onMonthChange(month, detailYear);
  };

  const handleYearChange = (year) => {
    onMonthChange(detailMonth, year);
  };

  const goToPreviousMonth = () => {
    if (detailMonth === 1) {
      onMonthChange(12, detailYear - 1);
    } else {
      onMonthChange(detailMonth - 1, detailYear);
    }
  };

  const goToNextMonth = () => {
    if (detailMonth === 12) {
      onMonthChange(1, detailYear + 1);
    } else {
      onMonthChange(detailMonth + 1, detailYear);
    }
  };

  if (loading) {
    return (
      <PagePreloader
        loading={true}
        variant="table"
        message="Loading attendance records..."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Back to Employees</span>
        </button>
        <h2 className="text-xl font-bold text-slate-800">
          {employee?.name}'s Attendance
        </h2>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-slate-700">Select Month:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <select
              value={detailMonth}
              onChange={(e) => handleMonthChange(parseInt(e.target.value))}
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
              value={detailYear}
              onChange={(e) => handleYearChange(parseInt(e.target.value))}
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
              className="p-2 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <span className="text-sm text-slate-500 ml-auto">
            Showing {records.length} records
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-white/20 rounded-lg">
              <UserCheck className="h-5 w-5" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{stats.present}</div>
              <div className="text-emerald-100 text-xs">Present</div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-4 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-white/20 rounded-lg">
              <UserX className="h-5 w-5" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{stats.absent}</div>
              <div className="text-rose-100 text-xs">Absent</div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-white/20 rounded-lg">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{stats.late}</div>
              <div className="text-amber-100 text-xs">Late</div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-white/20 rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{stats.avgHours}h</div>
              <div className="text-indigo-100 text-xs">Avg Hours</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Working Hours
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Breaks
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {records.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    No attendance records found for this period
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr
                    key={record.id || record._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {formatDate(record.attendance_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {record.check_in_time ? formatTimeShort(record.check_in_time) : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {record.check_out_time ? formatTimeShort(record.check_out_time) : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                      {formatMinutesShort(record.net_working_time_minutes || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <Coffee className="h-4 w-4 text-blue-600" />
                        <span>
                          {record.total_breaks_taken || 0}
                          {record.total_break_duration_minutes > 0 &&
                            ` (${record.total_break_duration_minutes}m)`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${record.status === "Present" || record.status === "Present (Late)"
                          ? "bg-emerald-100 text-emerald-700"
                          : record.status === "Absent"
                            ? "bg-rose-100 text-rose-700"
                            : record.status === "Late" || record.status === "Present (Late)"
                              ? "bg-amber-100 text-amber-700"
                              : record.status === "ML"
                                ? "bg-blue-900 text-white"
                                : "bg-slate-100 text-slate-700"
                          }`}
                      >
                        {record.status || "Unknown"}
                      </span>
                      {record.late_by_minutes > 0 && (
                        <span className="ml-2 text-xs text-amber-600">
                          ({record.late_by_minutes}m late)
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Attendance Table Component - No Pagination
const AttendanceTable = ({
  data,
  loading,
  onViewDetails,
}) => {
  if (loading) {
    return (
      <PagePreloader
        loading={true}
        variant="table"
        message="Loading attendance records..."
      />
    );
  }

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
                  Employee Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-500">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                data.map((record) => (
                  <tr
                    key={record.id || record._id}
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
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${record.status === "Present"
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
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${record.employee_status === "Active"
                          ? "bg-emerald-100 text-emerald-700"
                          : record.employee_status === "Inactive"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-slate-100 text-slate-700"
                          }`}
                      >
                        {record.employee_status || "Active"}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
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
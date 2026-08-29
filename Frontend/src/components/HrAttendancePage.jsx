// components/HrAttendancePage.jsx

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { endpoints } from "../config/api";
import { confirmDialog } from "../utils/confirm";
import BreakSummary from "./BreakSummary";
import TodayBreaksSummary from "./TodayBreaksSummary";
import HRAttendanceEmployee, {
  BREAK_TYPES,
  EmployeeDetailView as HRAttendanceEmployeeDetail,
} from "./HRAttendanceEmployee";
import PagePreloader from "./PagePreloader";
import { getPakistanDate } from "../utils/timezone";
import { DashboardHeader, RoleBasedNav } from "./DashboardComponents";
import { useAuth } from "../context/AuthContext";
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Download,
  Filter,
  Plus,
  Search,
  AlertCircle,
  ChevronDown,
  Settings,
  Eye,
  Edit3,
  Trash2,
  MoreVertical,
  UserPlus,
  Heart,
  RotateCcw,
  BarChart3,
  Send,
  Mail,
  Bell,
  Shield,
  Zap,
  Crown,
  Coffee,
  Sun,
  Moon,
  ArrowLeft,
  ArrowRight,
  User,
  Target,
  PieChart,
  ChevronUp,
  Building,
  Grid,
  List,
  X,
  MessageCircle,
  UserCheck,
  UserX,
  Utensils,
  Sparkle,
  Cigarette,
  Wifi,
  Activity,
} from "lucide-react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
);



// Professional Chart Component with Line and Area Chart Options
const ColumnChartComponent = ({
  data,
  title,
  height = 400,
  stacked = false,
  chartType = "line",
}) => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: "bold",
          },
          color: "#4b5563",
        },
      },
      tooltip: {
        mode: stacked ? "index" : "nearest",
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: {
          size: 13,
          weight: "bold",
        },
        bodyFont: {
          size: 12,
        },
        borderColor: "#ddd",
        borderWidth: 1,
      },
      filler: {
        propagate: true,
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.05)",
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: "#6b7280",
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.08)",
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: "#6b7280",
        },
        stacked: stacked,
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  };

  const chartData = stacked
    ? {
      labels: data.map((item) => item.name),
      datasets: [
        {
          label: "Present",
          data: data.map((item) => item.present),
          backgroundColor:
            chartType === "line" ? "rgba(16, 185, 129, 0.1)" : "#10b981",
          borderColor: "#10b981",
          borderWidth: 2.5,
          tension: 0.4,
          fill: chartType === "line",
          pointRadius: 4,
          pointBackgroundColor: "#10b981",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointHoverRadius: 6,
        },
        {
          label: "Leaves",
          data: data.map((item) => item.leave),
          backgroundColor:
            chartType === "line" ? "rgba(245, 158, 11, 0.1)" : "#f59e0b",
          borderColor: "#f59e0b",
          borderWidth: 2.5,
          tension: 0.4,
          fill: chartType === "line",
          pointRadius: 4,
          pointBackgroundColor: "#f59e0b",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointHoverRadius: 6,
        },
        {
          label: "Half Days",
          data: data.map((item) => item.halfday),
          backgroundColor:
            chartType === "line" ? "rgba(59, 130, 246, 0.1)" : "#3b82f6",
          borderColor: "#3b82f6",
          borderWidth: 2.5,
          tension: 0.4,
          fill: chartType === "line",
          pointRadius: 4,
          pointBackgroundColor: "#3b82f6",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointHoverRadius: 6,
        },
        {
          label: "Absent",
          data: data.map((item) => item.absent),
          backgroundColor:
            chartType === "line" ? "rgba(239, 68, 68, 0.1)" : "#ef4444",
          borderColor: "#ef4444",
          borderWidth: 2.5,
          tension: 0.4,
          fill: chartType === "line",
          pointRadius: 4,
          pointBackgroundColor: "#ef4444",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointHoverRadius: 6,
        },
      ],
    }
    : {
      labels: data.map((item) => item.name),
      datasets: [
        {
          label: title,
          data: data.map((item) => item.value),
          backgroundColor:
            chartType === "line"
              ? data.map((item) => item.color + "20")
              : data.map((item) => item.color),
          borderColor: data.map((item) => item.color),
          borderWidth: chartType === "line" ? 2.5 : 0,
          tension: chartType === "line" ? 0.4 : undefined,
          fill: chartType === "line",
          pointRadius: chartType === "line" ? 4 : undefined,
          pointBackgroundColor:
            chartType === "line" ? data.map((item) => item.color) : undefined,
          pointBorderColor: chartType === "line" ? "#fff" : undefined,
          pointBorderWidth: chartType === "line" ? 2 : undefined,
          pointHoverRadius: chartType === "line" ? 6 : undefined,
        },
      ],
    };

  const ChartComponent = chartType === "line" ? Line : Bar;

  return (
    <div className="flex flex-col w-full" style={{ height: `${height}px` }}>
      <ChartComponent
        data={chartData}
        options={{
          ...baseOptions,
          scales: {
            ...baseOptions.scales,
            x: {
              ...baseOptions.scales.x,
              stacked: stacked,
            },
            y: {
              ...baseOptions.scales.y,
              stacked: stacked,
            },
          },
        }}
      />
    </div>
  );
};

// Doughnut Chart Component for Status Distribution
const StatusDistributionChart = ({ data, title }) => {
  const chartData = {
    labels: ["Present", "Leaves", "Half Days", "Absent"],
    datasets: [
      {
        data: [data.present, data.leave, data.halfday, data.absent],
        backgroundColor: ["#10b981", "#f59e0b", "#3b82f6", "#ef4444"],
        borderColor: ["#0f966c", "#d97706", "#2563eb", "#dc2626"],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
      title: {
        display: true,
        text: title,
      },
    },
    cutout: "60%",
  };

  return (
    <div className="flex flex-col w-full" style={{ height: "300px" }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
};



// Uninformed Tracking Component
const UnexplainedAbsenceTracking = ({
  attendanceData,
  employees,
  selectedDate,
  onMarkAsExplained,
  onSendReminder,
  onOpenExplanationModal,
}) => {
  const [selectedAbsences, setSelectedAbsences] = useState([]);

  // Get Uninformed for the selected date
  const getUnexplainedAbsences = () => {
    const todayAttendance = attendanceData.filter(
      (item) => item.date === selectedDate,
    );

    return employees
      .map((employee) => {
        const attendance = todayAttendance.find(
          (a) => a.employeeId === employee.id,
        );
        const isAbsent = attendance?.status === "absent";
        const isUnexplained =
          isAbsent &&
          (!attendance?.notes ||
            attendance.notes === "No notification" ||
            attendance.notes.includes("No explanation"));

        return isUnexplained
          ? {
            employee,
            attendance,
            date: selectedDate,
            reason: "No explanation provided",
          }
          : null;
      })
      .filter(Boolean);
  };

  const unexplainedAbsences = getUnexplainedAbsences();

  const handleSelectAll = () => {
    if (selectedAbsences.length === unexplainedAbsences.length) {
      setSelectedAbsences([]);
    } else {
      setSelectedAbsences(unexplainedAbsences.map((_, index) => index));
    }
  };

  const handleSelectAbsence = (index) => {
    setSelectedAbsences((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const handleBulkMarkAsExplained = () => {
    selectedAbsences.forEach((index) => {
      const absence = unexplainedAbsences[index];
      if (absence && absence.employee) {
        onMarkAsExplained(
          absence.employee.id,
          selectedDate,
          "Employee provided explanation",
        );
      }
    });
    setSelectedAbsences([]);
  };

  const handleBulkSendReminder = () => {
    selectedAbsences.forEach((index) => {
      const absence = unexplainedAbsences[index];
      if (absence && absence.employee) {
        onSendReminder(absence.employee.id, absence.employee.name);
      }
    });
  };

  // return (
  //   <div className="bg-white rounded-3xl p-7 border border-gray-200 shadow-md mb-6">
  //     <div className="flex items-center justify-between mb-6">
  //       <div>
  //         <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
  //           Uninformed
  //         </h2>
  //         <p className="text-gray-600 mt-1 text-sm">
  //           Employees who haven't reported their absence for{" "}
  //           {new Date(selectedDate).toLocaleDateString()}
  //         </p>
  //       </div>

  //       <div className="flex items-center space-x-3">
  //         {selectedAbsences.length > 0 && (
  //           <>
  //             <button
  //               onClick={handleBulkMarkAsExplained}
  //               className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition duration-300"
  //             >
  //               <UserCheck className="h-4 w-4 mr-2" />
  //               Mark as Explained ({selectedAbsences.length})
  //             </button>
  //             <button
  //               onClick={handleBulkSendReminder}
  //               className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition duration-300"
  //             >
  //               <MessageCircle className="h-4 w-4 mr-2" />
  //               Send Reminder ({selectedAbsences.length})
  //             </button>
  //           </>
  //         )}
  //         <span
  //           className={`px-3 py-1 rounded-full text-sm font-medium ${
  //             unexplainedAbsences.length > 0
  //               ? "bg-red-100 text-red-800"
  //               : "bg-green-100 text-green-800"
  //           }`}
  //         >
  //           {unexplainedAbsences.length} unexplained
  //         </span>
  //       </div>
  //     </div>

  //     {unexplainedAbsences.length > 0 ? (
  //       <div className="space-y-3">
  //         <div className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-300">
  //           <input
  //             type="checkbox"
  //             checked={
  //               selectedAbsences.length === unexplainedAbsences.length &&
  //               unexplainedAbsences.length > 0
  //             }
  //             onChange={handleSelectAll}
  //             className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 mr-4 cursor-pointer"
  //           />
  //           <div className="flex-1 grid grid-cols-4 gap-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
  //             <span>Employee</span>
  //             <span>Department</span>
  //             <span>Status</span>
  //             <span>Actions</span>
  //           </div>
  //         </div>

  //         {unexplainedAbsences.map((absence, index) =>
  //           absence && absence.employee ? (
  //             <div
  //               key={absence.employee.id}
  //               className="flex items-center p-5 bg-red-50 rounded-2xl border border-red-300 hover:shadow-md transition-all duration-300"
  //             >
  //               <input
  //                 type="checkbox"
  //                 checked={selectedAbsences.includes(index)}
  //                 onChange={() => handleSelectAbsence(index)}
  //                 className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 mr-4"
  //               />

  //               <div className="flex-1 grid grid-cols-4 gap-4 items-center">
  //                 <div className="flex items-center space-x-3">
  //                   <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white font-semibold">
  //                     {absence.employee.avatar}
  //                   </div>
  //                   <div>
  //                     <h4 className="font-medium text-gray-900">
  //                       {absence.employee.name}
  //                     </h4>
  //                     <p className="text-sm text-gray-600">
  //                       {absence.employee.position}
  //                     </p>
  //                   </div>
  //                 </div>

  //                 <div>
  //                   <span className="text-sm text-gray-700">
  //                     {absence.employee.department}
  //                   </span>
  //                 </div>

  //                 <div>
  //                   <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
  //                     Uninformed
  //                   </span>
  //                 </div>

  //                 <div className="flex items-center space-x-2">
  //                   <button
  //                     onClick={() =>
  //                       onOpenExplanationModal(
  //                         absence.employee.id,
  //                         absence.date,
  //                       )
  //                     }
  //                     className="flex items-center px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition duration-200"
  //                   >
  //                     <UserCheck className="h-3 w-3 mr-1" />
  //                     Explain
  //                   </button>
  //                 </div>
  //               </div>
  //             </div>
  //           ) : null,
  //         )}
  //       </div>
  //     ) : (
  //       <div className="text-center py-8">
  //         <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
  //           <UserCheck className="h-8 w-8 text-green-600" />
  //         </div>
  //         <h3 className="text-lg font-medium text-gray-900 mb-2">
  //           All absences explained
  //         </h3>
  //         <p className="text-gray-500">
  //           Great! All employees have reported their absences for today.
  //         </p>
  //       </div>
  //     )}
  //   </div>
  // );
};

// Enhanced Monthly Overview Component
const MonthlyOverview = ({
  currentDate,
  monthlyStats,
  attendanceData,
  employees,
  onFilterChange,
  activeFilter,
  timeRange,
  onTimeRangeChange,
  filters,
  onCustomDateRangeChange,
}) => {
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customRange, setCustomRange] = useState({
    start: filters.dateRange.start,
    end: filters.dateRange.end,
  });
  const [chartType, setChartType] = useState("line");

  const filterOptions = [
    { value: "leaves", label: "Leaves", icon: Calendar },
    { value: "overtime", label: "Overtime", icon: Clock },
    { value: "late", label: "Late Arrivals", icon: AlertCircle },
    { value: "stacked", label: "All Status", icon: BarChart3 },
  ];

  const timeRangeOptions = [
    { value: "today", label: "Today" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "custom", label: "Custom Range" },
  ];

  // Calculate data based on time range
  const getChartData = () => {
    switch (timeRange) {
      case "today":
        return getTodayData();
      case "weekly":
        return getWeeklyData();
      case "monthly":
        return getMonthlyComparisonData();
      case "custom":
        return getCustomRangeData();
      default:
        return getWeeklyData();
    }
  };

  // Get data for custom date range
  const getCustomRangeData = () => {
    const startDate = new Date(customRange.start);
    const endDate = new Date(customRange.end);
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 7) {
      return getDailyData(startDate, endDate);
    } else if (daysDiff <= 31) {
      return getWeeklyCustomData(startDate, endDate);
    } else {
      return getMonthlyCustomData(startDate, endDate);
    }
  };

  // Daily data for custom range
  // Get today's attendance data
  const getTodayData = () => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const todayRecords = attendanceData.filter(
      (record) => record.date === todayStr,
    );

    let presentCount = 0;
    let leaveCount = 0;
    let halfdayCount = 0;
    let absentCount = 0;
    let overtimeHours = 0;
    let lateCount = 0;

    todayRecords.forEach((record) => {
      if (record.status === "present" || record.status === "late")
        presentCount++;
      if (record.status === "leave") leaveCount++;
      if (record.status === "halfday") halfdayCount++;
      if (record.status === "absent") absentCount++;
      if (record.overtime && record.overtime !== "0.0") {
        overtimeHours += parseFloat(record.overtime);
      }
      if (record.late && record.late !== "-") lateCount++;
    });

    // Return array with single entry for today
    const data = [];
    if (activeFilter === "stacked") {
      data.push({
        name: "Today",
        present: presentCount,
        leave: leaveCount,
        halfday: halfdayCount,
        absent: absentCount,
        color: "#10b981",
      });
    } else {
      let value, color;
      switch (activeFilter) {
        case "attendance":
          value = presentCount;
          color = "#10b981";
          break;
        case "leaves":
          value = leaveCount;
          color = "#f59e0b";
          break;
        case "overtime":
          value = Math.round(overtimeHours);
          color = "#3b82f6";
          break;
        case "late":
          value = lateCount;
          color = "#ef4444";
          break;
        default:
          value = presentCount;
          color = "#10b981";
      }

      data.push({
        name: "Today",
        value: value,
        color: color,
      });
    }

    return data;
  };

  const getDailyData = (startDate, endDate) => {
    const data = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const dayRecords = attendanceData.filter(
        (record) => record.date === dateStr,
      );

      let presentCount = 0;
      let leaveCount = 0;
      let halfdayCount = 0;
      let absentCount = 0;
      let overtimeHours = 0;
      let lateCount = 0;

      dayRecords.forEach((record) => {
        if (record.status === "present" || record.status === "late")
          presentCount++;
        if (record.status === "leave") leaveCount++;
        if (record.status === "halfday") halfdayCount++;
        if (record.status === "absent") absentCount++;
        if (record.overtime && record.overtime !== "0.0") {
          overtimeHours += parseFloat(record.overtime);
        }
        if (record.late && record.late !== "-") lateCount++;
      });

      if (activeFilter === "stacked") {
        data.push({
          name: currentDate.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
          present: presentCount,
          leave: leaveCount,
          halfday: halfdayCount,
          absent: absentCount,
          color: "#10b981",
        });
      } else {
        let value, color;
        switch (activeFilter) {
          case "attendance":
            value = presentCount;
            color = "#10b981";
            break;
          case "leaves":
            value = leaveCount;
            color = "#f59e0b";
            break;
          case "overtime":
            value = Math.round(overtimeHours);
            color = "#3b82f6";
            break;
          case "late":
            value = lateCount;
            color = "#ef4444";
            break;
          default:
            value = presentCount;
            color = "#10b981";
        }

        data.push({
          name: currentDate.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
          value: value,
          color: color,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
  };

  // Weekly data for custom range
  const getWeeklyCustomData = (startDate, endDate) => {
    const data = [];
    const currentDate = new Date(startDate);
    let weekNumber = 1;

    while (currentDate <= endDate) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);

      if (weekEnd > endDate) weekEnd.setTime(endDate.getTime());

      let presentCount = 0;
      let leaveCount = 0;
      let halfdayCount = 0;
      let absentCount = 0;
      let overtimeHours = 0;
      let lateCount = 0;
      let earlyLeaveCount = 0;

      const tempDate = new Date(weekStart);
      while (tempDate <= weekEnd) {
        const dateStr = tempDate.toLocaleDateString("en-CA");
        const dayRecords = attendanceData.filter(
          (record) => record.date === dateStr,
        );

        dayRecords.forEach((record) => {
          if (record.status === "present") presentCount++;
          if (record.status === "late") lateCount++;
          if (record.status === "early-leave") earlyLeaveCount++;
          if (record.status === "leave") leaveCount++;
          if (record.status === "halfday") halfdayCount++;
          if (record.status === "absent") absentCount++;
          if (record.overtime && record.overtime !== "0.0") {
            overtimeHours += parseFloat(record.overtime);
          }
        });

        tempDate.setDate(tempDate.getDate() + 1);
      }

      if (activeFilter === "stacked") {
        data.push({
          name: `Week ${weekNumber}`,
          present: presentCount,
          leave: leaveCount,
          halfday: halfdayCount,
          absent: absentCount,
          color: "#10b981",
        });
      } else {
        let value, color;
        switch (activeFilter) {
          case "attendance":
            value = presentCount;
            color = "#10b981";
            break;
          case "leaves":
            value = leaveCount;
            color = "#f59e0b";
            break;
          case "overtime":
            value = Math.round(overtimeHours);
            color = "#3b82f6";
            break;
          case "late":
            value = lateCount;
            color = "#ef4444";
            break;
          default:
            value = presentCount;
            color = "#10b981";
        }

        data.push({
          name: `Week ${weekNumber}`,
          value: value,
          color: color,
        });
      }

      weekNumber++;
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return data;
  };

  // Monthly data for custom range
  const getMonthlyCustomData = (startDate, endDate) => {
    const data = [];
    const currentDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      1,
    );

    while (currentDate <= endDate) {
      const monthStart = new Date(currentDate);
      const monthEnd = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
      );
      if (monthEnd > endDate) monthEnd.setTime(endDate.getTime());

      let presentCount = 0;
      let leaveCount = 0;
      let halfdayCount = 0;
      let absentCount = 0;
      let overtimeHours = 0;
      let lateCount = 0;
      let earlyLeaveCount = 0;

      const tempDate = new Date(monthStart);
      while (tempDate <= monthEnd) {
        const dateStr = tempDate.toLocaleDateString("en-CA");
        const dayRecords = attendanceData.filter(
          (record) => record.date === dateStr,
        );

        dayRecords.forEach((record) => {
          if (record.status === "present") presentCount++;
          if (record.status === "late") lateCount++;
          if (record.status === "early-leave") earlyLeaveCount++;
          if (record.status === "leave") leaveCount++;
          if (record.status === "halfday") halfdayCount++;
          if (record.status === "absent") absentCount++;
          if (record.overtime && record.overtime !== "0.0") {
            overtimeHours += parseFloat(record.overtime);
          }
        });

        tempDate.setDate(tempDate.getDate() + 1);
      }

      if (activeFilter === "stacked") {
        data.push({
          name: currentDate.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          present: presentCount,
          leave: leaveCount,
          halfday: halfdayCount,
          absent: absentCount,
          color: "#10b981",
        });
      } else {
        let value, color;
        switch (activeFilter) {
          case "attendance":
            value = presentCount;
            color = "#10b981";
            break;
          case "leaves":
            value = leaveCount;
            color = "#f59e0b";
            break;
          case "overtime":
            value = Math.round(overtimeHours);
            color = "#3b82f6";
            break;
          case "late":
            value = lateCount;
            color = "#ef4444";
            break;
          default:
            value = presentCount;
            color = "#10b981";
        }

        data.push({
          name: currentDate.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          value: value,
          color: color,
        });
      }

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return data;
  };

  // Enhanced weekly data calculation with stacked bars
  const getWeeklyData = () => {
    const weeklyData = [];
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Get all dates for the current month
    const monthDates = [];
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      monthDates.push(new Date(d));
    }

    // Group by weeks
    const weeks = [];
    let currentWeek = [];

    monthDates.forEach((date) => {
      currentWeek.push(date);
      if (date.getDay() === 6 || date.getDate() === lastDay.getDate()) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    // Calculate metrics for each week
    weeks.forEach((week, weekIndex) => {
      const weekDates = week.map((d) => d.toLocaleDateString("en-CA"));

      let presentCount = 0;
      let leaveCount = 0;
      let halfdayCount = 0;
      let absentCount = 0;
      let overtimeHours = 0;
      let lateCount = 0;

      weekDates.forEach((date) => {
        const dayRecords = attendanceData.filter(
          (record) => record.date === date,
        );

        dayRecords.forEach((record) => {
          if (record.status === "present" || record.status === "late")
            presentCount++;
          if (record.status === "leave") leaveCount++;
          if (record.status === "halfday") halfdayCount++;
          if (record.status === "absent") absentCount++;
          if (record.overtime && record.overtime !== "0.0") {
            overtimeHours += parseFloat(record.overtime);
          }
          if (record.late && record.late !== "-") lateCount++;
        });
      });

      if (activeFilter === "stacked") {
        weeklyData.push({
          name: `Week ${weekIndex + 1}`,
          present: presentCount,
          leave: leaveCount,
          halfday: halfdayCount,
          absent: absentCount,
          color: "#10b981",
        });
      } else {
        let value, color;
        switch (activeFilter) {
          case "attendance":
            value = presentCount;
            color = "#10b981";
            break;
          case "leaves":
            value = leaveCount;
            color = "#f59e0b";
            break;
          case "overtime":
            value = Math.round(overtimeHours);
            color = "#3b82f6";
            break;
          case "late":
            value = lateCount;
            color = "#ef4444";
            break;
          default:
            value = presentCount;
            color = "#10b981";
        }

        weeklyData.push({
          name: `Week ${weekIndex + 1}`,
          value: value,
          color: color,
        });
      }
    });

    // Fill remaining weeks with zero values if needed
    while (weeklyData.length < 5) {
      if (activeFilter === "stacked") {
        weeklyData.push({
          name: `Week ${weeklyData.length + 1}`,
          present: 0,
          leave: 0,
          halfday: 0,
          absent: 0,
          color: "#10b981",
        });
      } else {
        weeklyData.push({
          name: `Week ${weeklyData.length + 1}`,
          value: 0,
          color:
            activeFilter === "attendance"
              ? "#10b981"
              : activeFilter === "leaves"
                ? "#f59e0b"
                : activeFilter === "overtime"
                  ? "#3b82f6"
                  : "#ef4444",
        });
      }
    }

    return weeklyData.slice(0, 5);
  };

  // Calculate monthly comparison data
  const getMonthlyComparisonData = () => {
    const currentMonth = currentDate.getMonth();
    const prevMonthPresent = Math.round(monthlyStats.present * 0.85);
    const prevMonthLeaves = Math.round(monthlyStats.leave * 0.9);
    const prevMonthOvertime = 42;
    const prevMonthLate = Math.round(monthlyStats.monthlyLate * 1.1);

    let currentValue, previousValue;

    switch (activeFilter) {
      case "attendance":
        currentValue = monthlyStats.present;
        previousValue = prevMonthPresent;
        break;
      case "leaves":
        currentValue = monthlyStats.leave;
        previousValue = prevMonthLeaves;
        break;
      case "overtime":
        currentValue = 53;
        previousValue = prevMonthOvertime;
        break;
      case "late":
        currentValue = monthlyStats.monthlyLate;
        previousValue = prevMonthLate;
        break;
      case "stacked":
        // For stacked view, return current month data
        return [
          {
            name: "Current",
            present: monthlyStats.present,
            leave: monthlyStats.leave,
            halfday: monthlyStats.halfday,
            absent: monthlyStats.absent,
            color: "#10b981",
          },
        ];
      default:
        currentValue = monthlyStats.present;
        previousValue = prevMonthPresent;
    }

    return [
      {
        name: "Previous",
        value: previousValue,
        color: "#9ca3af",
      },
      {
        name: "Current",
        value: currentValue,
        color:
          activeFilter === "attendance"
            ? "#10b981"
            : activeFilter === "leaves"
              ? "#f59e0b"
              : activeFilter === "overtime"
                ? "#3b82f6"
                : "#ef4444",
      },
    ];
  };

  // Calculate quarterly data
  const getQuarterlyData = () => {
    const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
    const quarterMonths = [
      (quarter - 1) * 3,
      (quarter - 1) * 3 + 1,
      (quarter - 1) * 3 + 2,
    ];
    const currentYear = currentDate.getFullYear();

    const quarterlyData = quarterMonths.map((month) => {
      const monthData = attendanceData.filter((record) => {
        const recordDate = new Date(record.date);
        return (
          recordDate.getMonth() === month &&
          recordDate.getFullYear() === currentYear
        );
      });

      let presentCount = 0;
      let leaveCount = 0;
      let halfdayCount = 0;
      let absentCount = 0;
      let overtimeHours = 0;
      let lateCount = 0;

      monthData.forEach((record) => {
        if (record.status === "present" || record.status === "late")
          presentCount++;
        if (record.status === "leave") leaveCount++;
        if (record.status === "halfday") halfdayCount++;
        if (record.status === "absent") absentCount++;
        if (record.overtime && record.overtime !== "0.0") {
          overtimeHours += parseFloat(record.overtime);
        }
        if (record.late && record.late !== "-") lateCount++;
      });

      const monthNames = [
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
      ];

      if (activeFilter === "stacked") {
        return {
          name: monthNames[month],
          present: presentCount,
          leave: leaveCount,
          halfday: halfdayCount,
          absent: absentCount,
          color: "#10b981",
        };
      } else {
        let value, color;
        switch (activeFilter) {
          case "attendance":
            value = presentCount;
            color = "#10b981";
            break;
          case "leaves":
            value = leaveCount;
            color = "#f59e0b";
            break;
          case "overtime":
            value = Math.round(overtimeHours);
            color = "#3b82f6";
            break;
          case "late":
            value = lateCount;
            color = "#ef4444";
            break;
          default:
            value = presentCount;
            color = "#10b981";
        }

        return {
          name: monthNames[month],
          value: value,
          color: color,
        };
      }
    });

    return quarterlyData;
  };

  const getChartTitle = () => {
    const baseTitle =
      activeFilter === "stacked"
        ? "All Status"
        : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1);

    switch (timeRange) {
      case "weekly":
        return `Weekly ${baseTitle} Trend`;
      case "monthly":
        return `Monthly ${baseTitle} Comparison`;
      case "custom":
        return `Custom Range ${baseTitle} Analysis`;
      default:
        return `${baseTitle} Distribution`;
    }
  };

  const getStatsCards = () => {
    const weeklyData = getWeeklyData();
    const currentWeekValue = weeklyData[weeklyData.length - 1]?.value || 0;
    const previousWeekValue = weeklyData[weeklyData.length - 2]?.value || 0;
    const trend = currentWeekValue - previousWeekValue;
    const trendPercentage =
      previousWeekValue > 0
        ? ((trend / previousWeekValue) * 100).toFixed(1)
        : 0;

    switch (activeFilter) {
      case "attendance":
        return [
          {
            label: "Current Week",
            value: `${currentWeekValue}`,
            color: "text-green-600",
            bg: "bg-green-50",
            trend: trend,
            trendText: `${trend >= 0 ? "+" : ""}${trendPercentage}% from last week`,
          },
          {
            label: "Monthly Average",
            value: `${monthlyStats.attendanceRate}%`,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Total Present",
            value: monthlyStats.present,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Attendance Goal",
            value: "95%",
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
        ];
      case "leaves":
        return [
          {
            label: "Current Week",
            value: currentWeekValue,
            color: "text-orange-600",
            bg: "bg-orange-50",
            trend: trend,
            trendText: `${trend >= 0 ? "+" : ""}${trend} from last week`,
          },
          {
            label: "Monthly Total",
            value: monthlyStats.leave,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Sick Leaves",
            value: Math.floor(monthlyStats.leave * 0.4),
            color: "text-red-600",
            bg: "bg-red-50",
          },
          {
            label: "Casual Leaves",
            value: Math.floor(monthlyStats.leave * 0.6),
            color: "text-yellow-600",
            bg: "bg-yellow-50",
          },
        ];
      case "overtime":
        return [
          {
            label: "Current Week",
            value: `${currentWeekValue}h`,
            color: "text-blue-600",
            bg: "bg-blue-50",
            trend: trend,
            trendText: `${trend >= 0 ? "+" : ""}${trend}h from last week`,
          },
          {
            label: "Monthly Total",
            value: "53h",
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Avg Daily OT",
            value: "2.4h",
            color: "text-cyan-600",
            bg: "bg-cyan-50",
          },
          {
            label: "OT Cost",
            value: "$1,325",
            color: "text-violet-600",
            bg: "bg-violet-50",
          },
        ];
      case "late":
        return [
          {
            label: "Current Week",
            value: currentWeekValue,
            color: "text-red-600",
            bg: "bg-red-50",
            trend: trend,
            trendText: `${trend >= 0 ? "+" : ""}${trend} from last week`,
          },
          {
            label: "Monthly Total",
            value: monthlyStats.monthlyLate,
            color: "text-rose-600",
            bg: "bg-rose-50",
          },
          {
            label: "On-time Rate",
            value: "94.2%",
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Most Late Dept",
            value: "Sales",
            color: "text-orange-600",
            bg: "bg-orange-50",
          },
        ];
      case "stacked":
        return [
          {
            label: "Total Present",
            value: monthlyStats.present,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Total Leaves",
            value: monthlyStats.leave,
            color: "text-orange-600",
            bg: "bg-orange-50",
          },
          {
            label: "Half Days",
            value: monthlyStats.halfday,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Absent",
            value: monthlyStats.absent,
            color: "text-red-600",
            bg: "bg-red-50",
          },
        ];
      default:
        return [];
    }
  };

  const handleCustomRangeApply = () => {
    onCustomDateRangeChange(customRange);
    setShowCustomRange(false);
  };

  const chartData = getChartData();
  const isStacked = activeFilter === "stacked";
  const statsCards = getStatsCards();

  // return (
  //   <div className="bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl p-8 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 mb-8">
  //     <div className="flex items-center justify-between mb-8">
  //       <div>
  //         <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent">
  //           Monthly Overview
  //         </h2>
  //         <p className="text-gray-500 text-sm mt-1 font-medium">
  //           {currentDate.toLocaleString("default", {
  //             month: "long",
  //             year: "numeric",
  //           })}{" "}
  //           Performance Analytics
  //         </p>
  //       </div>

  //       <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
  //         {/* Time Range Filter */}
  //         <div className="flex gap-2">
  //           {timeRangeOptions.map((option) => {
  //             const IconComponent =
  //               option.value === "weekly"
  //                 ? Calendar
  //                 : option.value === "monthly"
  //                   ? BarChart3
  //                   : option.value === "custom"
  //                     ? Filter
  //                     : Calendar;
  //             return (
  //               <button
  //                 key={option.value}
  //                 onClick={() => {
  //                   onTimeRangeChange(option.value);
  //                   if (option.value === "custom") {
  //                     setShowCustomRange(true);
  //                   }
  //                 }}
  //                 className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
  //                   timeRange === option.value
  //                     ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
  //                     : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
  //                 }`}
  //               >
  //                 <IconComponent className="h-4 w-4" />
  //                 {option.label}
  //               </button>
  //             );
  //           })}
  //         </div>

  //         {/* Data Type Filter */}
  //         <div className="flex gap-2 ml-4 pl-4 border-l border-gray-300">
  //           {filterOptions.map((option) => {
  //             const IconComponent = option.icon;
  //             return (
  //               <button
  //                 key={option.value}
  //                 onClick={() => onFilterChange(option.value)}
  //                 className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
  //                   activeFilter === option.value
  //                     ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md"
  //                     : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
  //                 }`}
  //               >
  //                 <IconComponent className="h-4 w-4" />
  //                 {option.label}
  //               </button>
  //             );
  //           })}
  //         </div>
  //       </div>
  //     </div>

  //     {/* Custom Date Range Picker */}
  //     {showCustomRange && (
  //       <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 shadow-sm">
  //         <div className="flex items-center justify-between mb-4">
  //           <h3 className="text-sm font-semibold text-blue-900">
  //             Select Custom Date Range
  //           </h3>
  //           <button
  //             onClick={() => setShowCustomRange(false)}
  //             className="text-blue-600 hover:text-blue-800 transition"
  //           >
  //             <X className="h-5 w-5" />
  //           </button>
  //         </div>
  //         <div className="grid grid-cols-2 gap-4 mb-4">
  //           <div>
  //             <label className="block text-xs font-semibold text-blue-800 mb-2">
  //               Start Date
  //             </label>
  //             <input
  //               type="date"
  //               value={customRange.start}
  //               onChange={(e) =>
  //                 setCustomRange((prev) => ({ ...prev, start: e.target.value }))
  //               }
  //               className="w-full px-4 py-2.5 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
  //             />
  //           </div>
  //           <div>
  //             <label className="block text-xs font-semibold text-blue-800 mb-2">
  //               End Date
  //             </label>
  //             <input
  //               type="date"
  //               value={customRange.end}
  //               onChange={(e) =>
  //                 setCustomRange((prev) => ({ ...prev, end: e.target.value }))
  //               }
  //               className="w-full px-4 py-2.5 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
  //             />
  //           </div>
  //         </div>
  //         <div className="flex justify-end gap-3">
  //           <button
  //             onClick={() => setShowCustomRange(false)}
  //             className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition"
  //           >
  //             Cancel
  //           </button>
  //           <button
  //             onClick={handleCustomRangeApply}
  //             className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-md transition"
  //           >
  //             Apply Range
  //           </button>
  //         </div>
  //       </div>
  //     )}

  //     {/* Charts Grid */}
  //     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  //       {/* Main Column Chart */}
  //       {/* <div className="lg:col-span-2 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 shadow-sm">
  //         <div className="flex items-center justify-between mb-6">
  //           <h3 className="text-lg font-bold text-gray-900">{getChartTitle()}</h3>
  //           <div className="flex gap-2">
  //             <button
  //               onClick={() => setChartType('line')}
  //               className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
  //                 chartType === 'line'
  //                   ? 'bg-blue-600 text-white shadow-md'
  //                   : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
  //               }`}
  //             >
  //               Line Chart
  //             </button>
  //             <button
  //               onClick={() => setChartType('bar')}
  //               className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
  //                 chartType === 'bar'
  //                   ? 'bg-blue-600 text-white shadow-md'
  //                   : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
  //               }`}
  //             >
  //               Bar Chart
  //             </button>
  //           </div>
  //         </div>
  //         <ColumnChartComponent 
  //           data={chartData}
  //           title={getChartTitle()}
  //           height={350}
  //           stacked={isStacked}
  //           chartType={chartType}
  //         />
  //       </div> */}

  //       {/* Stats Cards */}
  //       {statsCards && statsCards.length > 0 && (
  //         <>
  //           {statsCards.map((stat, index) => (
  //             <div
  //               key={index}
  //               className={`p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 ${
  //                 statsCards.length % 2 === 1 && index === statsCards.length - 1
  //                   ? "lg:col-span-2"
  //                   : ""
  //               }`}
  //             >
  //               <div className="flex items-center justify-between mb-3">
  //                 <h3 className="text-sm font-semibold text-gray-700">
  //                   {stat.label}
  //                 </h3>
  //                 <div
  //                   className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.bg}`}
  //                 >
  //                   <span className="text-lg font-bold">📊</span>
  //                 </div>
  //               </div>
  //               <div className={`text-3xl font-bold ${stat.color}`}>
  //                 {stat.value}
  //               </div>
  //               {stat.trendText && (
  //                 <p className="text-xs text-gray-600 mt-2">{stat.trendText}</p>
  //               )}
  //             </div>
  //           ))}
  //         </>
  //       )}
  //     </div>
  //   </div>
  // );
};



// Enhanced Overview Tab Component with Notes Editing
const OverviewTab = ({
  currentDate,
  setCurrentDate,
  selectedDate,
  setSelectedDate,
  filters,
  handleFilterChange,
  handleDateRangeChange,
  getFilteredAttendanceData,
  getCalendarAttendanceData,
  getFilteredEmployees,
  stats,
  holidays,
  attendanceSearch,
  setAttendanceSearch,
  attendanceFilter,
  setAttendanceFilter,
  attendanceSort,
  setAttendanceSort,
  getFilteredAndSortedAttendance,
  editingAttendance,
  setEditingAttendance,
  employees,
  attendanceData,
  onMarkAsExplained,
  onSendReminder,
  onUpdateAttendanceNotes,
  setExplanationData,
  setIsExplanationModalOpen,
}) => {
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState("active");

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push(date);
    }

    return days;
  };

  const timeRangeOptions = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "this_week", label: "This Week" },
    { value: "last_week", label: "Last Week" },
    { value: "this_month", label: "This Month" },
    { value: "last_month", label: "Last Month" },
    { value: "custom", label: "Custom Range" },
  ];

  const departmentOptions = [
    { value: "all", label: "All Departments" },
    { value: "Production", label: "Production" },
    { value: "Marketing", label: "Marketing" },
    { value: "HR", label: "HR" },
    { value: "Sales", label: "Sales" },
    { value: "Operations", label: "Operations" },
  ];

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "present", label: "Present" },
    { value: "absent", label: "Absent" },
    { value: "leave", label: "On Leave" },
    { value: "halfday", label: "Half Day" },
    { value: "late", label: "Late" },
  ];

  return (
    <div className="space-y-6">
      {/* Calendar Section - Now First */}
      <div className="bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl p-8 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent">
              {currentDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}{" "}
              Calendar
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Track daily attendance and patterns
            </p>
          </div>
          <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2.5 rounded-lg border border-gray-300 hover:bg-white hover:border-blue-400 transition duration-300 text-gray-700 hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition duration-300 shadow-sm hover:shadow-md"
            >
              Today
            </button>
            <span className="text-sm font-bold text-gray-700 min-w-[150px] text-center">
              {currentDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2.5 rounded-lg border border-gray-300 hover:bg-white hover:border-blue-400 transition duration-300 text-gray-700 hover:text-blue-600"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4 mb-8">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-bold tracking-wider uppercase text-gray-700 py-3 border-b-2 border-gray-200"
            >
              {day}
            </div>
          ))}

          {getDaysInMonth().map((date, index) => {
            if (!date)
              return <div key={`empty-${index}`} className="h-[110px]"></div>;

            // Use local timezone for date string
            const dateStr = date.toLocaleDateString("en-CA"); // YYYY-MM-DD in local timezone
            // Use calendar-specific data (no timeRange filter, only month filter)
            const dayAttendance = getCalendarAttendanceData().filter(
              (att) => att.date === dateStr,
            );
            const presentCount = dayAttendance.filter(
              (a) => a.status === "present",
            ).length;
            const totalCount = getFilteredEmployees().length;

            // Debug logging for all dates with attendance
            if (dayAttendance.length > 0) {
              console.log("📅 Calendar Date:", {
                dateStr,
                isToday: dateStr === getWorkDate(),
                dayAttendanceCount: dayAttendance.length,
                presentCount,
                totalCount,
                sampleAttendance: dayAttendance
                  .slice(0, 3)
                  .map((a) => ({ name: a.name, status: a.status })),
              });
            }

            const isSelected = selectedDate === dateStr;
            const isToday = dateStr === getWorkDate(); // Use work date for 'Today' badge
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            const percentage = totalCount
              ? Math.round((presentCount / totalCount) * 100)
              : 0;

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`
                  group relative p-4 rounded-2xl cursor-pointer border transition-all duration-300
                  bg-white/80 backdrop-blur-md shadow-sm

                  hover:shadow-lg hover:-translate-y-0.5

                  ${isWeekend
                    ? "border-gray-300 bg-gray-100/80"
                    : isSelected
                      ? "border-blue-300 ring-1 ring-blue-200"
                      : "border-slate-200"
                  }
                `}
              >
                {/* Accent gradient bar */}
                <div
                  className={`
                  absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl
                  ${isWeekend
                      ? "bg-gradient-to-r from-gray-400 to-gray-300"
                      : "bg-gradient-to-r from-emerald-500 to-teal-400"
                    }
                `}
                ></div>

                <div className="flex flex-col h-full justify-between">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <span
                      className={`
                      text-base font-semibold
                      ${isWeekend ? "text-gray-500" : "text-slate-800"}
                    `}
                    >
                      {date.getDate()}
                    </span>

                    {isToday && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-medium shadow">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Center Info */}
                  <div className="text-center mt-2">
                    {isWeekend ? (
                      <span className="text-xs font-medium text-gray-600 bg-gray-200/60 px-2 py-1 rounded-lg">
                        Off Day
                      </span>
                    ) : (
                      <>
                        <div className="text-sm font-semibold text-slate-700">
                          {presentCount} / {totalCount}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Present
                        </div>
                      </>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {!isWeekend && (
                    <div className="mt-3">
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Attendance Details Section - Only show when a date is explicitly selected */}
      {selectedDate && (
        <div className="bg-white rounded-3xl p-7 border border-gray-200 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Attendance for{" "}
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {
                  getFilteredAttendanceData().filter(
                    (item) => item.date === selectedDate,
                  ).length
                }{" "}
                of {getFilteredEmployees().length} employees
              </span>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#349dff] focus:border-transparent text-sm w-48"
                />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.presentToday}
              </div>
              <div className="text-xs text-gray-600 font-medium">Present</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.absent}
              </div>
              <div className="text-xs text-gray-600 font-medium">Absent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.onLeave}
              </div>
              <div className="text-xs text-gray-600 font-medium">On Leave</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.lateToday}
              </div>
              <div className="text-xs text-gray-600 font-medium">Late</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                Filter by:
              </span>
              <select
                value={attendanceFilter}
                onChange={(e) => setAttendanceFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="leave">On Leave</option>
                <option value="paid_leave">Paid Leave (PL)</option>
                <option value="halfday">Half Day</option>
                <option value="unexplained">Uninformed Absent (UA)</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                Employee status:
              </span>
              <select
                value={employeeStatusFilter}
                onChange={(e) => setEmployeeStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                Sort by:
              </span>
              <select
                value={attendanceSort}
                onChange={(e) => setAttendanceSort(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
              >
                <option value="name">Name</option>
                <option value="department">Department</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check In
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Late
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredAndSortedAttendance()
                  .filter((employee) => String(employee.status || "active").toLowerCase() === employeeStatusFilter)
                  .map((employee) => {
                  // Filter attendance data directly by selectedDate
                  const selectedDateAttendance = attendanceData.filter(
                    (item) => item.date === selectedDate,
                  );
                  const attendance = selectedDateAttendance.find(
                    (a) => a.employeeId === employee.id,
                  );
                  const rawStatus = attendance?.status || "absent";
                  const isLate =
                    rawStatus === "late" ||
                    rawStatus === "ml" ||
                    (attendance?.late && attendance.late !== "-");
                  const isPresent =
                    rawStatus === "present" || (attendance?.checkIn && attendance.checkIn !== "-" && !isLate);
                  const status = isLate ? "late" : isPresent ? "present" : rawStatus;
                  const isHoliday = holidays.some((h) => h.date === selectedDate);

                  return (
                    <tr key={employee.id} className="hover:bg-gray-50 transition-colors duration-200">
                      {/* Employee Info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                            {employee.avatar}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.department}</div>
                      </td>

                      {/* Position */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {employee.position || "-"}
                        </div>
                      </td>

                      {/* Check In */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {attendance?.checkIn || "-"}
                        </div>
                      </td>

                      {/* Check Out */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {attendance?.checkOut || "-"}
                        </div>
                      </td>

                      {/* Late */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attendance?.late && attendance.late !== "-" && !isHoliday ? (
                          <span className="text-sm text-orange-600 font-medium">
                            {attendance.late}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isHoliday ? (
                          <span className="px-3 py-1.5 rounded-md text-sm font-medium bg-purple-50 text-purple-700">
                            Holiday
                          </span>
                        ) : (
                          <span
                            className={`px-3 py-1.5 rounded-md text-sm font-medium ${status === "late"
                              ? "bg-orange-50 text-orange-700"
                              : status === "present"
                                ? "bg-green-50 text-green-700"
                                : status === "leave"
                                  ? "bg-blue-50 text-blue-700"
                                  : status === "halfday"
                                    ? "bg-yellow-50 text-yellow-700"
                                    : status === "absent"
                                      ? "bg-red-50 text-red-700"
                                      : "bg-gray-50 text-gray-700"
                              }`}
                          >
                            {status === "late"
                              ? "Late"
                              : status === "present"
                                ? "Present"
                                : status === "leave"
                                  ? "On Leave"
                                  : status === "halfday"
                                    ? "Half Day"
                                    : status === "absent"
                                      ? "Absent"
                                      : status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                  })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {getFilteredAndSortedAttendance().length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No employees found
              </h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your filters or search terms
              </p>
              <button
                onClick={() => {
                  setAttendanceSearch("");
                  setAttendanceFilter("all");
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty state when no date is selected */}
      {!selectedDate && (
        <div className="bg-white rounded-3xl p-12 border border-gray-200 shadow-md text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Calendar className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Select a Date to View Attendance
          </h2>
          <p className="text-gray-600 text-lg mb-2">
            Click on any date in the calendar above to view detailed attendance
            information for that day.
          </p>
          <p className="text-gray-500 text-sm">
            The attendance details will appear here with employee check-in
            times, breaks, and status information.
          </p>
        </div>
      )}

      {/* Uninformed Tracking - Now at the End */}
      <UnexplainedAbsenceTracking
        attendanceData={attendanceData}
        employees={employees}
        selectedDate={selectedDate}
        onMarkAsExplained={onMarkAsExplained}
        onSendReminder={onSendReminder}
        onOpenExplanationModal={(employeeId, date) => {
          setExplanationData({ employeeId, date, explanation: "" });
          setIsExplanationModalOpen(true);
        }}
      />
    </div>
  );
};

// Breaks Management Component
const BreaksManagement = ({ breaks, employees, onAddBreak, onDeleteBreak }) => {
  const [isAddBreakModalOpen, setIsAddBreakModalOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Breaks Management
        </h2>
        <button
          onClick={() => setIsAddBreakModalOpen(true)}
          className="flex items-center px-4 py-2 bg-[#349dff] text-white rounded-xl hover:bg-[#2980db] transition duration-300"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Break
        </button>
      </div>

      <div className="space-y-4">
        {breaks.map((breakItem) => {
          const employee = employees.find(
            (emp) => emp.id === breakItem.employeeId,
          );
          const breakType = BREAK_TYPES[breakItem.type] || BREAK_TYPES.short;
          const IconComponent = breakType.icon;

          return (
            <div
              key={breakItem.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#349dff] transition duration-300"
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${breakType.color}`}
                >
                  <IconComponent className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {employee?.name || "Employee"}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {breakItem.breakStart} - {breakItem.breakEnd || "Ongoing"} •{" "}
                    {breakItem.duration}min • {breakType.label}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${breakType.color}`}
                >
                  {breakItem.type}
                </span>
                <button
                  onClick={() => onDeleteBreak(breakItem.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition duration-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isAddBreakModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add Break</h2>
              <button
                onClick={() => setIsAddBreakModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Break Type
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  {Object.entries(BREAK_TYPES).map(([key, breakType]) => (
                    <option key={key} value={key}>
                      {breakType.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => setIsAddBreakModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onAddBreak({
                      employeeId: employees[0]?.id,
                      type: "lunch",
                      breakStart: "13:00",
                      breakEnd: "14:00",
                      duration: 60,
                    });
                    setIsAddBreakModalOpen(false);
                  }}
                  className="flex-1 px-4 py-2 bg-[#349dff] text-white rounded-lg hover:bg-[#2980db] transition duration-300"
                >
                  Add Break
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Holidays Management Component
const HolidaysManagement = ({ holidays, onAddHoliday, onDeleteHoliday }) => {
  const [isAddHolidayModalOpen, setIsAddHolidayModalOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Holidays Management
        </h2>
        <button
          onClick={() => setIsAddHolidayModalOpen(true)}
          className="flex items-center px-4 py-2 bg-[#349dff] text-white rounded-xl hover:bg-[#2980db] transition duration-300"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Holiday
        </button>
      </div>

      <div className="space-y-4">
        {holidays.map((holiday) => (
          <div
            key={holiday.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#349dff] transition duration-300"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{holiday.name}</h4>
                <p className="text-sm text-gray-600">
                  {new Date(holiday.date).toLocaleDateString()} • {holiday.type}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`text-xs px-2 py-1 rounded-full ${holiday.type === "public"
                  ? "bg-green-100 text-green-800"
                  : "bg-blue-100 text-blue-800"
                  }`}
              >
                {holiday.type}
              </span>
              <button
                onClick={() => onDeleteHoliday(holiday.id)}
                className="p-2 text-gray-400 hover:text-red-600 transition duration-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isAddHolidayModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add Holiday</h2>
              <button
                onClick={() => setIsAddHolidayModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Holiday Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
                  placeholder="Enter holiday name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => setIsAddHolidayModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onAddHoliday({
                      name: "New Holiday",
                      date: new Date().toISOString().split("T")[0],
                      type: "public",
                    });
                    setIsAddHolidayModalOpen(false);
                  }}
                  className="flex-1 px-4 py-2 bg-[#349dff] text-white rounded-lg hover:bg-[#2980db] transition duration-300"
                >
                  Add Holiday
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Leaves Summary Component
const LeavesSummary = ({ employees, employeeLeaves, onApproveLeave }) => {
  const handleApproveLeave = (employeeId) => {
    onApproveLeave(employeeId);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Employee Leaves Summary
      </h2>

      <div className="space-y-4">
        {employees.map((employee) => {
          const leaves = employeeLeaves.find(
            (l) => l.employeeId === employee.id,
          );
          return (
            <div
              key={employee.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#349dff] transition duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-semibold">
                  {employee.avatar}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{employee.name}</h4>
                  <p className="text-sm text-gray-600">{employee.department}</p>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {employee.leavesRemaining}
                  </div>
                  <div className="text-xs text-gray-600">Remaining</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {employee.leavesTaken}
                  </div>
                  <div className="text-xs text-gray-600">Taken</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {employee.totalLeaves}
                  </div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {leaves && (
                  <>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-blue-600">
                        {leaves.casualLeaves}
                      </div>
                      <div className="text-xs text-gray-600">Casual</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-green-600">
                        {leaves.sickLeaves}
                      </div>
                      <div className="text-xs text-gray-600">Sick</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-purple-600">
                        {leaves.annualLeaves}
                      </div>
                      <div className="text-xs text-gray-600">Annual</div>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => handleApproveLeave(employee.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300"
              >
                Approve Leave
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Modal Components
const AddEmployeeModal = ({
  isOpen,
  onClose,
  onAddEmployee,
  editingEmployee,
}) => {
  const [formData, setFormData] = useState(
    editingEmployee || {
      name: "",
      department: "Production",
      position: "",
      email: "",
      phone: "",
    },
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddEmployee(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {editingEmployee ? "Edit Employee" : "Add Employee"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              value={formData.department}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, department: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
            >
              <option value="Production">Production</option>
              <option value="Marketing">Marketing</option>
              <option value="HR">HR</option>
              <option value="Sales">Sales</option>
              <option value="Operations">Operations</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position
            </label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, position: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#349dff] text-white rounded-lg hover:bg-[#2980db] transition duration-300"
            >
              {editingEmployee ? "Update" : "Add"} Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Notification Component
const NotificationContainer = ({ notifications }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ${notification.type === "success"
            ? "bg-green-50 border-green-500 text-green-800"
            : notification.type === "error"
              ? "bg-red-50 border-red-500 text-red-800"
              : "bg-blue-50 border-blue-500 text-blue-800"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Keep numeric employee_onboarding.id — never parse DG codes like "DG-0010" as integers
const normalizeEmployeeId = (id) => {
  if (id == null) return id;
  if (typeof id === "number") return id;
  if (typeof id === "string" && /^\d+$/.test(id)) return parseInt(id, 10);
  return id;
};

const formatAttendanceDate = (attendanceDate) => {
  if (!attendanceDate) return "";
  if (
    typeof attendanceDate === "string" &&
    attendanceDate.match(/^\d{4}-\d{2}-\d{2}$/)
  ) {
    return attendanceDate;
  }
  if (typeof attendanceDate === "string" && attendanceDate.includes("T")) {
    return new Date(attendanceDate).toLocaleDateString("en-CA");
  }
  return String(attendanceDate).split("T")[0];
};

// Helper function to get current work date based on night shift schedule
// Night shift: 21:00 (9 PM) to 06:00 (6 AM)
// The shift spans two calendar days:
//   - Dec 29 9PM - Dec 30 6AM is the "Dec 29 work shift"
//
// Logic:
// - If current time is between 00:00 - 19:59 (before 8 PM): Use YESTERDAY as work date
//   (because we're still in yesterday's shift period or in the gap between shifts)
// - If current time is between 20:00 - 23:59 (8 PM onwards): Use TODAY as work date
//   (because today's night shift is about to start or has started)
const getWorkDate = (date = new Date()) => {
  const currentHour = date.getHours();
  const workDate = new Date(date);

  // Night shift: 21:00 (9 PM) to 06:00 (6 AM)
  // Key insight: The shift ENDS at 6 AM, not starts at 6 AM
  // If we're before 6 AM (00:00-05:59), we're in YESTERDAY's night shift
  // If we're 6 AM or later (06:00+), we're in TODAY's day/evening period
  if (currentHour < 6) {
    workDate.setDate(workDate.getDate() - 1);
  }
  // If >= 6 AM, use today's date

  const result = workDate.toLocaleDateString("en-CA"); // YYYY-MM-DD format
  console.log("⏰ Work Date Calculation:", {
    currentTime: date.toLocaleTimeString("en-US", { hour12: false }),
    currentHour,
    calendarDate: date.toLocaleDateString("en-CA"),
    workDate: result,
    logic:
      currentHour < 6
        ? "Before 6AM → Yesterday's night shift"
        : "After 6AM → Today's shift",
  });
  return result;
};

// Main HR Attendance Page Component
export function HrAttendancePage({ initialTab = "overview" }) {
  const { role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendanceRules, setAttendanceRules] = useState({});
  const [breaks, setBreaks] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [employeeLeaves, setEmployeeLeaves] = useState([]);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeView, setEmployeeView] = useState("list");
  const [selectedDate, setSelectedDate] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isAddHolidayModalOpen, setIsAddHolidayModalOpen] = useState(false);
  const [isAddBreakModalOpen, setIsAddBreakModalOpen] = useState(false);

  useEffect(() => {
    if (location.pathname.endsWith("/employee")) {
      setActiveTab("employees");
    } else if (location.pathname.endsWith("/overview")) {
      setActiveTab("overview");
    } else {
      setActiveTab(initialTab);
    }
  }, [initialTab, location.pathname]);

  // Explanation modal state
  const [isExplanationModalOpen, setIsExplanationModalOpen] = useState(false);
  const [explanationData, setExplanationData] = useState({
    employeeId: null,
    date: null,
    explanation: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [notifications, setNotifications] = useState([]);

  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [attendanceSort, setAttendanceSort] = useState("name");
  const [editingAttendance, setEditingAttendance] = useState(null);

  // Monthly absent summary for EmployeeListView accuracy
  const [monthlyAbsentSummary, setMonthlyAbsentSummary] = useState([]);

  // Add monthly filter state
  const [monthlyFilter, setMonthlyFilter] = useState("stacked");
  const [timeRange, setTimeRange] = useState("weekly");

  const [filters, setFilters] = useState({
    department: "all",
    status: "all",
    timeRange: "this_month",
    viewType: "calendar",
    dateRange: {
      start: new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
      ).toLocaleDateString("en-CA"),
      end: new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0,
      ).toLocaleDateString("en-CA"),
    },
  });

  // Get attendance data for calendar view (without timeRange filter, only department and status)
  const getCalendarAttendanceData = () => {
    let filteredData = [...attendanceData];

    if (filters.department !== "all") {
      const departmentEmployees = employees
        .filter((emp) => emp.department === filters.department)
        .map((emp) => emp.id);
      filteredData = filteredData.filter((att) =>
        departmentEmployees.includes(att.employeeId),
      );
    }

    if (filters.status !== "all") {
      if (filters.status === "late") {
        filteredData = filteredData.filter((att) => att.late !== "-");
      } else {
        filteredData = filteredData.filter(
          (att) => att.status === filters.status,
        );
      }
    }

    // Only filter by current month being viewed
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    filteredData = filteredData.filter((att) => {
      const attDate = new Date(att.date);
      return attDate >= startOfMonth && attDate <= endOfMonth;
    });

    return filteredData;
  };

  // Enhanced stats calculation to include Uninformed
  const calculateStats = () => {
    const filteredData = getFilteredAttendanceData();
    const filteredEmployees = getFilteredEmployees();

    // Use work date (based on 8 PM cutoff for night shift)
    const today = getWorkDate();
    let todayData = filteredData.filter((item) => item.date === today);

    // If no data for today, use the most recent date's data
    if (todayData.length === 0 && filteredData.length > 0) {
      const uniqueDates = [...new Set(filteredData.map((item) => item.date))]
        .sort()
        .reverse();
      const mostRecentDate = uniqueDates[0];
      todayData = filteredData.filter((item) => item.date === mostRecentDate);
      console.log(
        `No attendance data for ${today}, showing data from ${mostRecentDate}`,
      );
    }

    const presentCount = todayData.filter(
      (item) => item.status === "present",
    ).length;
    const leaveCount = todayData.filter(
      (item) => item.status === "leave",
    ).length;
    const halfdayCount = todayData.filter(
      (item) => item.status === "halfday",
    ).length;
    const absentCount = todayData.filter(
      (item) => item.status === "absent",
    ).length;
    const lateCount = todayData.filter((item) => item.late !== "-").length;

    // Calculate Uninformed
    const unexplainedAbsences = todayData.filter(
      (item) =>
        item.status === "absent" &&
        (!item.notes ||
          item.notes === "No notification" ||
          item.notes.includes("No explanation")),
    ).length;

    const totalBreaks = breaks.length;
    const totalHolidays = holidays.length;
    const totalLeavesTaken = employeeLeaves.reduce(
      (sum, leave) => sum + leave.totalTaken,
      0,
    );

    const monthlyData = filteredData.filter(
      (item) =>
        new Date(item.date).getMonth() === currentDate.getMonth() &&
        new Date(item.date).getFullYear() === currentDate.getFullYear(),
    );

    const monthlyPresent = monthlyData.filter(
      (item) => item.status === "present",
    ).length;
    const monthlyLeave = monthlyData.filter(
      (item) => item.status === "leave",
    ).length;
    const monthlyHalfday = monthlyData.filter(
      (item) => item.status === "halfday",
    ).length;
    const monthlyAbsent = monthlyData.filter(
      (item) => item.status === "absent",
    ).length;
    const monthlyLate = monthlyData.filter((item) => item.late !== "-").length;

    return {
      presentToday: presentCount,
      onLeave: leaveCount,
      halfDays: halfdayCount,
      absent: absentCount,
      lateToday: lateCount,
      unexplainedAbsences: unexplainedAbsences,
      totalEmployees: filteredEmployees.length,
      activeEmployees: filteredEmployees.filter(
        (emp) => emp.status === "active",
      ).length,
      totalBreaks: totalBreaks,
      totalHolidays: totalHolidays,
      totalLeavesTaken: totalLeavesTaken,
      monthlyPresent,
      monthlyLeave,
      monthlyHalfday,
      monthlyAbsent,
      monthlyLate,
      monthlyAttendanceRate:
        monthlyData.length > 0 && monthlyPresent > 0
          ? ((monthlyPresent / monthlyData.length) * 100).toFixed(1)
          : "0.0",
    };
  };

  const getFilteredAndSortedAttendance = () => {
    const filteredEmployees = getFilteredEmployees();
    const todayAttendanceData = getFilteredAttendanceData().filter(
      (item) => item.date === selectedDate,
    );

    let filtered = filteredEmployees;

    if (attendanceSearch) {
      filtered = filtered.filter(
        (emp) =>
          emp.name.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
          emp.department.toLowerCase().includes(attendanceSearch.toLowerCase()),
      );
    }

    if (attendanceFilter !== "all") {
      filtered = filtered.filter((emp) => {
        const attendance = todayAttendanceData.find(
          (a) => a.employeeId === emp.id,
        );
        const status = attendance?.status || "not-recorded";

        if (attendanceFilter === "late") {
          return attendance?.checkIn !== "-" && attendance?.checkIn > "9:15 AM";
        }
        if (attendanceFilter === "not-recorded") {
          return !attendance;
        }
        if (attendanceFilter === "unexplained") {
          return (
            status === "absent" &&
            (!attendance?.notes || attendance.notes === "No notification")
          );
        }
        return status === attendanceFilter;
      });
    }

    filtered.sort((a, b) => {
      const attendanceA = todayAttendanceData.find(
        (att) => att.employeeId === a.id,
      );
      const attendanceB = todayAttendanceData.find(
        (att) => att.employeeId === b.id,
      );

      switch (attendanceSort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "department":
          return a.department.localeCompare(b.department);
        case "checkIn":
          return (attendanceA?.checkIn || "").localeCompare(
            attendanceB?.checkIn || "",
          );
        case "status":
          return (attendanceA?.status || "not-recorded").localeCompare(
            attendanceB?.status || "not-recorded",
          );
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Updated handleManualAttendance function (simplified without check-in/check-out)
  const handleManualAttendance = (employeeId, date, status, notes = "") => {
    const existingRecord = attendanceData.find(
      (att) => att.employeeId === employeeId && att.date === date,
    );

    if (existingRecord) {
      setAttendanceData((prev) =>
        prev.map((att) =>
          att.id === existingRecord.id
            ? {
              ...att,
              status,
              notes: notes || att.notes,
            }
            : att,
        ),
      );
    } else {
      const newAttendance = {
        id: `${employeeId}-${date}`,
        employeeId,
        date,
        status,
        checkIn: "-",
        checkOut: "-",
        hours: "0.0",
        breaks: 0,
        breakDuration: 0,
        late: "-",
        overtime: "0.0",
        notes: notes,
      };
      setAttendanceData((prev) => [...prev, newAttendance]);
    }
    addNotification("Attendance updated successfully", "success");
  };

  // Add function to handle notes updates
  const handleUpdateAttendanceNotes = (attendanceId, notes) => {
    setAttendanceData((prev) =>
      prev.map((att) => (att.id === attendanceId ? { ...att, notes } : att)),
    );
    addNotification("Notes updated successfully", "success");
  };

  // HR Direct Update Attendance (no approval required)
  const handleHrUpdateAttendance = async (attendanceId, updateData) => {
    try {
      console.log(
        "🔍 Starting HR update for attendance:",
        attendanceId,
        updateData,
      );

      const token = localStorage.getItem("token");
      if (!token) {
        const errMsg = "No authentication token found. Please log in again.";
        console.error("❌ Auth Error:", errMsg);
        addNotification(errMsg, "error");
        throw new Error(errMsg);
      }

      const body = {
        check_in_time:
          updateData.check_in_time && updateData.check_in_time.trim()
            ? updateData.check_in_time
            : null,
        check_out_time:
          updateData.check_out_time && updateData.check_out_time.trim()
            ? updateData.check_out_time
            : null,
        status: updateData.status || "absent",
        remarks: updateData.remarks ? updateData.remarks.trim() : "",
      };

      console.log("📤 Sending request with body:", body);

      const endpoint = endpoints.attendance.update(attendanceId);
      console.log("🔗 API Endpoint:", endpoint);

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      console.log("📥 Response status:", response.status);

      let result;
      try {
        result = await response.json();
        console.log("📥 Response data:", result);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        const errMsg = "Invalid response from server";
        addNotification(errMsg, "error");
        throw new Error(errMsg);
      }

      if (!response.ok) {
        const errorMsg =
          result?.message || result?.error || "Failed to update attendance";
        console.error("❌ API Error:", errorMsg);
        addNotification(errorMsg, "error");
        throw new Error(errorMsg);
      }

      // Update local attendance data
      setAttendanceData((prev) =>
        prev.map((att) => {
          if (att.id === attendanceId) {
            return {
              ...att,
              checkIn: updateData.check_in_time || att.checkIn,
              checkOut: updateData.check_out_time || att.checkOut,
              status: updateData.status,
              notes: updateData.remarks,
              remarks: updateData.remarks,
            };
          }
          return att;
        }),
      );

      console.log("✅ Attendance updated successfully");
      addNotification("Attendance updated successfully", "success");
    } catch (error) {
      console.error("❌ Error updating attendance:", error.message);
      addNotification(`Failed to update attendance: ${error.message}`, "error");
      throw error;
    }
  };

  // HR Create Attendance for absent/no-record days
  const handleHrCreateAttendance = async (dateStr, formData) => {
    try {
      if (!selectedEmployee?.id) {
        throw new Error("No employee selected");
      }

      const token = localStorage.getItem("token");
      if (!token) {
        addNotification(
          "No authentication token found. Please log in again.",
          "error",
        );
        throw new Error("No authentication token");
      }

      const body = {
        employee_id: selectedEmployee.id,
        attendance_date: dateStr,
        check_in_time: formData.check_in_time?.trim() || null,
        check_out_time: formData.check_out_time?.trim() || null,
        status: formData.status || "absent",
        remarks: formData.remarks?.trim() || "",
      };

      console.log("➕ Creating attendance record:", body);

      const response = await fetch(endpoints.attendance.hrCreate, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      let result;
      try {
        result = await response.json();
      } catch (e) {
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        throw new Error(result?.message || "Failed to create attendance");
      }

      // Add the new record to local state
      const newAtt = result.data;
      if (newAtt) {
        // Calculate hours for display
        let hours = "-";
        if (newAtt.gross_working_time_minutes > 0) {
          const h = Math.floor(newAtt.gross_working_time_minutes / 60);
          const m = newAtt.gross_working_time_minutes % 60;
          hours = h > 0 ? `${h}h ${m}m` : `${m}m`;
        }

        setAttendanceData((prev) => [
          ...prev,
          {
            id: newAtt.id,
            employeeId: newAtt.employee_id,
            name: newAtt.name,
            email: newAtt.email,
            date: dateStr,
            status: newAtt.status?.toLowerCase() || formData.status,
            checkIn: newAtt.check_in_time || "-",
            checkOut: newAtt.check_out_time || "-",
            hours,
            breaks: 0,
            breakDuration: 0,
            overtime: newAtt.overtime_hours || "0.0",
            late: newAtt.late_by_minutes ? `${newAtt.late_by_minutes}m` : "-",
            remarks: newAtt.remarks || "",
            notes: newAtt.remarks || "",
          },
        ]);
      }

      console.log("✅ Attendance record created successfully");
      addNotification("Attendance record created successfully", "success");
    } catch (error) {
      console.error("❌ Error creating attendance:", error.message);
      addNotification(`Failed to create attendance: ${error.message}`, "error");
      throw error;
    }
  };

  useEffect(() => {
    setPageLoading(true);

    // Fetch employees from database
    const fetchEmployees = async () => {
      try {
        const response = await fetch(endpoints.employees.base);
        const data = await response.json();

        const employeesList = Array.isArray(data)
          ? data
          : data.data || data.employees || [];

        const employeesData = employeesList.map((emp) => ({
          id: emp.id,
          name: emp.name,
          department: emp.department,
          position: emp.designation || emp.position || "",
          email: emp.email,
          phone: emp.phone || "",
          status: emp.status || "active",
          joinDate: emp.join_date,
          avatar: emp.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2),
          totalLeaves: 20,
          leavesTaken: 0,
          leavesRemaining: 20,
        }));
        setEmployees(employeesData);
      } catch (error) {
        console.error("Error fetching employees:", error);
        setEmployees([]);
      }
    };

    // Fetch all attendance data from database
    const fetchAttendance = async () => {
      try {
        const todayDate = getWorkDate();

        // OPTIMIZED: Fetch only current month history (not 10,000 records)
        // Fetch history with reasonable limit + today's data in parallel
        const [historyResponse, todayResponse] = await Promise.all([
          fetch(endpoints.attendance.all + "?limit=500&page=1"),
          fetch(
            `${endpoints.attendance.allWithAbsent}?date=${todayDate}&limit=500`,
          ),
        ]);

        const historyData = await historyResponse.json();
        const todayData = await todayResponse.json();

        const historicalList = Array.isArray(historyData)
          ? historyData
          : historyData.data || historyData.attendance || [];
        const todayList = Array.isArray(todayData)
          ? todayData
          : todayData.data || [];

        // Combine both: today's data (with absent records) + historical data (excluding today's records)
        const combinedAttendance = [
          ...todayList,
          ...historicalList.filter((rec) => {
            const recDate = new Date(rec.attendance_date).toLocaleDateString(
              "en-CA",
            );
            return recDate !== todayDate;
          }),
        ];

        const formattedData = combinedAttendance.map((record) => {
          const attendanceDateStr = formatAttendanceDate(
            record.attendance_date,
          );

          // FIXED: Calculate working hours if missing but check-in/out exist
          let calculatedHours = "-";
          if (
            record.gross_working_time_minutes &&
            record.gross_working_time_minutes > 0
          ) {
            // Backend has calculated working hours - use it
            const totalMinutes = record.gross_working_time_minutes;
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            calculatedHours = `${hours}h ${minutes}m`;
          } else if (record.check_in_time && record.check_in_time !== "-") {
            // Frontend fallback calculation when working hours are missing
            // This handles both checked-out and still-working scenarios
            try {
              const [checkInHour, checkInMin, checkInSec = 0] =
                record.check_in_time.split(":").map(Number);

              const checkInMinutes = checkInHour * 60 + checkInMin;
              let checkOutMinutes = 0;
              let hasCheckOut = false;

              if (record.check_out_time && record.check_out_time !== "-") {
                // Employee has checked out - use checkout time
                const [checkOutHour, checkOutMin, checkOutSec = 0] =
                  record.check_out_time.split(":").map(Number);
                checkOutMinutes = checkOutHour * 60 + checkOutMin;
                hasCheckOut = true;
              } else {
                // Employee still working - use current time in Pakistan timezone
                const now = new Date();
                // Assuming getPakistanDate function exists and returns correct time
                const nowPKT =
                  typeof getPakistanDate === "function"
                    ? getPakistanDate()
                    : now;
                checkOutMinutes = nowPKT.getHours() * 60 + nowPKT.getMinutes();
              }

              let grossMinutes = 0;
              const isNightShift = checkInMinutes >= 21 * 60; // After 9 PM (21:00)

              if (isNightShift) {
                // Night shift: check-in after 21:00, checkout is next morning
                if (checkOutMinutes >= checkInMinutes) {
                  // Same day checkout (shouldn't happen for night shift, but handle it)
                  grossMinutes = checkOutMinutes - checkInMinutes;
                } else {
                  // Next day checkout (normal night shift case) - crossed midnight
                  const minutesUntilMidnight = 24 * 60 - checkInMinutes;
                  grossMinutes = minutesUntilMidnight + checkOutMinutes;
                }
              } else if (checkInMinutes < 6 * 60) {
                // Early morning check-in (before 6 AM) - continuation of previous night shift
                const minutesUntilMidnight = 24 * 60 - checkInMinutes;
                grossMinutes = minutesUntilMidnight + checkOutMinutes;
              } else {
                // Regular day shift (6 AM to 9 PM)
                grossMinutes = Math.max(0, checkOutMinutes - checkInMinutes);
              }

              const breakMinutes = record.total_break_duration_minutes || 0;
              const netMinutes = Math.max(0, grossMinutes - breakMinutes);

              // Format as "Xh Ym" with proper hour/minute conversion
              const hours = Math.floor(netMinutes / 60);
              const minutes = netMinutes % 60;

              if (hours === 0 && minutes === 0) {
                calculatedHours = "0h 0m";
              } else if (hours === 0) {
                calculatedHours = `${minutes}m`;
              } else {
                calculatedHours = `${hours}h ${minutes}m`;
              }
            } catch (e) {
              console.warn("Error calculating working hours:", e);
              calculatedHours = "-";
            }
          }

          return {
            id: record.id,
            employeeId: normalizeEmployeeId(record.employee_id),
            name: record.name,
            email: record.email,
            date: attendanceDateStr,
            status: record.status?.toLowerCase() || "absent",
            checkIn: record.check_in_time || "-",
            checkOut: record.check_out_time || "-",
            hours: calculatedHours,
            breaks: record.total_breaks_taken || 0,
            breakDuration: record.total_break_duration_minutes || 0,
            overtime: record.overtime_hours || "0.0",
            late: record.late_by_minutes ? `${record.late_by_minutes}m` : "-",
            smoke_break_count: record.smoke_break_count || 0,
            dinner_break_count: record.dinner_break_count || 0,
            washroom_break_count: record.washroom_break_count || 0,
            prayer_break_count: record.prayer_break_count || 0,
            smoke_break_duration_minutes:
              record.smoke_break_duration_minutes || 0,
            dinner_break_duration_minutes:
              record.dinner_break_duration_minutes || 0,
            washroom_break_duration_minutes:
              record.washroom_break_duration_minutes || 0,
            prayer_break_duration_minutes:
              record.prayer_break_duration_minutes || 0,
            remarks: record.remarks || "",
            notes: record.remarks || "",
          };
        });

        setAttendanceData(formattedData);
      } catch (error) {
        console.error("Error fetching attendance:", error);
        setAttendanceData([]);
      }
    };

    // Fetch rules from database
    const fetchRules = async () => {
      try {
        const response = await fetch(endpoints.rules.breakRules);
        const rules = await response.json();

        // Handle both direct array response and object with data property
        const rulesList = Array.isArray(rules)
          ? rules
          : rules.data || rules.rules || [];

        const workingHours = rulesList.find(
          (r) => r.rule_type === "WORKING_HOURS",
        );
        const sampleRules = {
          workHours: workingHours
            ? {
              start: workingHours.start_time,
              end: workingHours.end_time,
            }
            : { start: "09:00", end: "18:00" },
          breakDuration: 60,
          gracePeriod: 15,
          overtimeRate: 1.5,
          autoDeduction: true,
        };

        setAttendanceRules(sampleRules);
      } catch (error) {
        console.error("Error fetching rules:", error);
        // Fallback: set default rules
        setAttendanceRules({
          workHours: { start: "09:00", end: "18:00" },
          breakDuration: 60,
          gracePeriod: 15,
          overtimeRate: 1.5,
          autoDeduction: true,
        });
      }
    };

    // Fetch breaks from database
    const fetchBreaks = async () => {
      try {
        const response = await fetch(endpoints.attendance.base + "/breaks");
        const breaksData = await response.json();

        // Handle both direct array response and object with data property
        const breaksList = Array.isArray(breaksData)
          ? breaksData
          : breaksData.data || breaksData.breaks || [];

        const formattedBreaks = breaksList.map((br) => ({
          id: br.id,
          employeeId: br.employee_id,
          name: br.employee_name,
          breakType: br.break_type,
          date:
            br.break_start_time?.split("T")[0] ||
            new Date().toISOString().split("T")[0],
          startTime: br.break_start_time || "",
          endTime: br.break_end_time || "",
          duration: br.break_duration_minutes || 0,
          reason: br.reason || "",
        }));

        setBreaks(formattedBreaks);
      } catch (error) {
        console.error("Error fetching breaks:", error);
        // Fallback: set empty array
        setBreaks([]);
      }
    };

    // Fetch absent summary for current month
    const fetchMonthlyAbsentSummary = async () => {
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const start = new Date(year, month, 1).toLocaleDateString("en-CA");
        const end = new Date(year, month + 1, 0).toLocaleDateString("en-CA");
        const res = await fetch(endpoints.attendance.absentSummary(start, end));
        const data = await res.json();
        setMonthlyAbsentSummary(data.summary || []);
      } catch (err) {
        console.warn("Could not fetch monthly absent summary:", err);
        setMonthlyAbsentSummary([]);
      }
    };

    // OPTIMIZED: Fetch all data in parallel instead of sequentially
    Promise.all([
      fetchEmployees(),
      fetchAttendance(),
      fetchRules(),
      fetchBreaks(),
      fetchMonthlyAbsentSummary(),
    ]).finally(() => {
      setPageLoading(false);
    });

    // Set default holidays
    const sampleHolidays = [
      { id: 1, name: "New Year", date: "2025-01-01", type: "public" },
      { id: 2, name: "Christmas Day", date: "2025-12-25", type: "public" },
    ];
    setHolidays(sampleHolidays);
  }, [currentDate]);

  // Fetch complete attendance (present + absent) whenever a calendar date is selected
  useEffect(() => {
    if (!selectedDate) return;

    const fetchSelectedDateAttendance = async () => {
      try {
        const response = await fetch(
          `${endpoints.attendance.allWithAbsent}?date=${selectedDate}&limit=500`,
        );
        const data = await response.json();
        const dateRecords = Array.isArray(data) ? data : data.data || [];

        const formattedRecords = dateRecords.map((record) => {
          const attendanceDateStr = formatAttendanceDate(
            record.attendance_date,
          );

          let hoursValue = "0.0";
          if (record.check_out_time) {
            hoursValue = record.gross_working_time_minutes
              ? (record.gross_working_time_minutes / 60).toFixed(1)
              : "0.0";
          } else if (record.current_session_minutes !== undefined) {
            hoursValue = (record.current_session_minutes / 60).toFixed(1);
          }

          return {
            id: record.id,
            employeeId: normalizeEmployeeId(record.employee_id),
            name: record.name,
            email: record.email,
            date: attendanceDateStr,
            status: record.status?.toLowerCase() || "absent",
            checkIn: record.check_in_time || "-",
            checkOut: record.check_out_time || "-",
            hours: hoursValue,
            breaks: record.total_breaks_taken || 0,
            breakDuration: record.total_break_duration_minutes || 0,
            overtime: record.overtime_hours || "0.0",
            late: record.late_by_minutes ? `${record.late_by_minutes}m` : "-",
            smoke_break_count: record.smoke_break_count || 0,
            dinner_break_count: record.dinner_break_count || 0,
            washroom_break_count: record.washroom_break_count || 0,
            prayer_break_count: record.prayer_break_count || 0,
            smoke_break_duration_minutes:
              record.smoke_break_duration_minutes || 0,
            dinner_break_duration_minutes:
              record.dinner_break_duration_minutes || 0,
            washroom_break_duration_minutes:
              record.washroom_break_duration_minutes || 0,
            prayer_break_duration_minutes:
              record.prayer_break_duration_minutes || 0,
            remarks: record.remarks || "",
            notes: record.remarks || "",
          };
        });

        setAttendanceData((prev) => {
          const filtered = prev.filter((item) => item.date !== selectedDate);
          return [...filtered, ...formattedRecords];
        });
      } catch (error) {
        console.error(
          `Error fetching attendance for ${selectedDate}:`,
          error,
        );
      }
    };

    fetchSelectedDateAttendance();
  }, [selectedDate]);

  // When an employee detail view opens, load their full attendance history (last 6 months)
  // The initial load only fetches 500 total records; this ensures the specific employee has full data
  useEffect(() => {
    if (!selectedEmployee || employeeView !== "detail") return;

    const loadEmployeeHistory = async () => {
      try {
        const now = new Date();
        // Build last 6 months to fetch
        const months = [];
        for (let i = 0; i < 6; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
        }

        const responses = await Promise.all(
          months.map(({ year, month }) =>
            fetch(
              endpoints.attendance.monthly(selectedEmployee.id, year, month),
            ),
          ),
        );

        const dataArrays = await Promise.all(responses.map((r) => r.json()));

        const formatRecord = (record) => {
          const dateStr =
            typeof record.attendance_date === "string"
              ? record.attendance_date.split("T")[0]
              : new Date(record.attendance_date).toLocaleDateString("en-CA");

          let calculatedHours = "-";
          if (record.gross_working_time_minutes > 0) {
            const h = Math.floor(record.gross_working_time_minutes / 60);
            const m = record.gross_working_time_minutes % 60;
            calculatedHours = `${h}h ${m}m`;
          }

          return {
            id: record.id,
            employeeId: record.employee_id,
            name: record.name,
            email: record.email,
            date: dateStr,
            status: (record.status || "absent").toLowerCase(),
            checkIn: record.check_in_time || "-",
            checkOut: record.check_out_time || "-",
            hours: calculatedHours,
            breaks: record.total_breaks_taken || 0,
            breakDuration: record.total_break_duration_minutes || 0,
            overtime: record.overtime_hours || "0.0",
            late: record.late_by_minutes ? `${record.late_by_minutes}m` : "-",
            smoke_break_count: record.smoke_break_count || 0,
            dinner_break_count: record.dinner_break_count || 0,
            washroom_break_count: record.washroom_break_count || 0,
            prayer_break_count: record.prayer_break_count || 0,
            smoke_break_duration_minutes:
              record.smoke_break_duration_minutes || 0,
            dinner_break_duration_minutes:
              record.dinner_break_duration_minutes || 0,
            washroom_break_duration_minutes:
              record.washroom_break_duration_minutes || 0,
            prayer_break_duration_minutes:
              record.prayer_break_duration_minutes || 0,
            remarks: record.remarks || "",
            notes: record.remarks || "",
          };
        };

        const allRecords = dataArrays.flatMap((d) => {
          const list = Array.isArray(d) ? d : d.data || [];
          return list.map(formatRecord);
        });

        if (allRecords.length > 0) {
          setAttendanceData((prev) => {
            // Replace all existing records for this employee with fresh per-employee data
            const withoutEmployee = prev.filter(
              (a) => a.employeeId !== selectedEmployee.id,
            );
            return [...withoutEmployee, ...allRecords];
          });
          console.log(
            `✅ Loaded ${allRecords.length} attendance records for employee ${selectedEmployee.id}`,
          );
        }
      } catch (err) {
        console.error("Error loading employee attendance history:", err);
      }
    };

    loadEmployeeHistory();
  }, [selectedEmployee?.id, employeeView]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddEmployee = (employeeData) => {
    const newEmployee = {
      id: Math.max(...employees.map((e) => e.id)) + 1,
      ...employeeData,
      status: "active",
      avatar: employeeData.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase(),
      totalLeaves: 20,
      leavesTaken: 0,
      leavesRemaining: 20,
      joinDate: new Date().toISOString().split("T")[0],
    };
    setEmployees((prev) => [...prev, newEmployee]);
    setIsAddEmployeeModalOpen(false);
    addNotification("Employee added successfully", "success");
  };

  const handleEditEmployee = (employeeData) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === editingEmployee.id ? { ...emp, ...employeeData } : emp,
      ),
    );
    setEditingEmployee(null);
    setIsAddEmployeeModalOpen(false);
    addNotification("Employee updated successfully", "success");
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (await confirmDialog("Are you sure you want to delete this employee?")) {
      setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
      setAttendanceData((prev) =>
        prev.filter((att) => att.employeeId !== employeeId),
      );
      addNotification("Employee deleted successfully", "success");
    }
  };

  const handleAddHoliday = (holidayData) => {
    const newHoliday = {
      id: Math.max(...holidays.map((h) => h.id)) + 1,
      ...holidayData,
    };
    setHolidays((prev) => [...prev, newHoliday]);
    setIsAddHolidayModalOpen(false);
    addNotification("Holiday added successfully", "success");
  };

  const handleDeleteHoliday = async (holidayId) => {
    if (await confirmDialog("Are you sure you want to delete this holiday?")) {
      setHolidays((prev) => prev.filter((h) => h.id !== holidayId));
      addNotification("Holiday deleted successfully", "success");
    }
  };

  const handleAddBreak = (breakData) => {
    const newBreak = {
      id: Math.max(...breaks.map((b) => b.id)) + 1,
      ...breakData,
      duration: 60,
    };
    setBreaks((prev) => [...prev, newBreak]);
    setIsAddBreakModalOpen(false);
    addNotification("Break added successfully", "success");
  };

  const handleDeleteBreak = async (breakId) => {
    if (await confirmDialog("Are you sure you want to delete this break?")) {
      setBreaks((prev) => prev.filter((b) => b.id !== breakId));
      addNotification("Break deleted successfully", "success");
    }
  };

  const handleBulkAction = () => {
    if (!bulkAction || selectedEmployees.length === 0) return;

    switch (bulkAction) {
      case "approve-leave":
        selectedEmployees.forEach((empId) => {
          setEmployeeLeaves((prev) =>
            prev.map((leave) =>
              leave.employeeId === empId
                ? { ...leave, totalTaken: leave.totalTaken + 1 }
                : leave,
            ),
          );
        });
        addNotification(
          `Leave approved for ${selectedEmployees.length} employees`,
          "success",
        );
        break;

      case "export-data":
        handleBulkExport(selectedEmployees);
        break;

      case "send-reminder":
        handleBulkReminder(selectedEmployees);
        break;

      default:
        break;
    }

    setSelectedEmployees([]);
    setBulkAction("");
  };

  const handleBulkExport = (employeeIds) => {
    const dataToExport = attendanceData.filter((att) =>
      employeeIds.includes(att.employeeId),
    );
    console.log("Exporting data:", dataToExport);
    addNotification(
      `Data exported for ${employeeIds.length} employees`,
      "success",
    );
  };

  const handleBulkReminder = (employeeIds) => {
    console.log("Sending reminders to:", employeeIds);
    addNotification(
      `Reminders sent to ${employeeIds.length} employees`,
      "success",
    );
  };

  const handleApproveLeave = (employeeId) => {
    setEmployeeLeaves((prev) =>
      prev.map((leave) =>
        leave.employeeId === employeeId
          ? { ...leave, totalTaken: leave.totalTaken + 1 }
          : leave,
      ),
    );
    addNotification("Leave approved successfully", "success");
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const getFilteredEmployeesWithSearch = () => {
    let filtered = getFilteredEmployees();

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          (emp.name || "").toLowerCase().includes(term) ||
          (emp.department || "").toLowerCase().includes(term) ||
          (emp.position || "").toLowerCase().includes(term),
      );
    }

    return filtered;
  };

  const addNotification = (message, type = "info") => {
    const newNotification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date(),
    };

    setNotifications((prev) => [newNotification, ...prev.slice(0, 4)]);

    setTimeout(() => {
      setNotifications((prev) =>
        prev.filter((n) => n.id !== newNotification.id),
      );
    }, 5000);
  };

  // Functions for handling Uninformed/explanations and reminders
  const handleMarkAsExplained = (employeeId, date, explanation) => {
    setAttendanceData((prev) =>
      prev.map((att) =>
        att.employeeId === employeeId && att.date === date
          ? { ...att, notes: explanation, status: "explained" }
          : att,
      ),
    );
    addNotification(
      `Absence marked as explained with reason: ${explanation}`,
      "success",
    );
  };

  const handleExplainModalSubmit = () => {
    if (!explanationData.explanation.trim()) {
      addNotification("Please enter an explanation", "error");
      return;
    }
    handleMarkAsExplained(
      explanationData.employeeId,
      explanationData.date,
      explanationData.explanation,
    );
    setIsExplanationModalOpen(false);
    setExplanationData({ employeeId: null, date: null, explanation: "" });
  };

  const handleSendReminder = (employeeId, employeeName) => {
    // In a real app, this would send an email or notification
    console.log(`Sending reminder to ${employeeName} (ID: ${employeeId})`);
    addNotification(`Reminder sent to ${employeeName}`, "info");
  };

  const toggleEmployeeSelection = (employeeId) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId],
    );
  };

  const selectAllEmployees = () => {
    const currentEmployees = getFilteredEmployeesWithSearch();
    if (selectedEmployees.length === currentEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(currentEmployees.map((emp) => emp.id));
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleDateRangeChange = (rangeType, value) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [rangeType]: value,
      },
    }));
  };

  const getFilteredAttendanceData = () => {
    let filteredData = [...attendanceData];

    if (filters.department !== "all") {
      const departmentEmployees = employees
        .filter((emp) => emp.department === filters.department)
        .map((emp) => emp.id);
      filteredData = filteredData.filter((att) =>
        departmentEmployees.includes(att.employeeId),
      );
    }

    if (filters.status !== "all") {
      if (filters.status === "late") {
        filteredData = filteredData.filter((att) => att.late !== "-");
      } else {
        filteredData = filteredData.filter(
          (att) => att.status === filters.status,
        );
      }
    }

    // Use the calendar's current date for month-based filters when viewing calendar
    const referenceDate =
      filters.viewType === "calendar" ? currentDate : new Date();

    switch (filters.timeRange) {
      case "today":
        const today = getWorkDate(); // Use work date based on night shift schedule
        filteredData = filteredData.filter((att) => att.date === today);
        break;
      case "yesterday":
        const yesterdayDate = new Date(referenceDate);
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = yesterdayDate.toLocaleDateString("en-CA"); // Use local timezone
        filteredData = filteredData.filter((att) => att.date === yesterday);
        break;
      case "this_week":
        const startOfWeek = new Date(referenceDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        filteredData = filteredData.filter((att) => {
          const attDate = new Date(att.date);
          return attDate >= startOfWeek && attDate <= endOfWeek;
        });
        break;
      case "last_week":
        const weekAgo = new Date(referenceDate);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const startOfLastWeek = new Date(weekAgo);
        startOfLastWeek.setDate(
          startOfLastWeek.getDate() - startOfLastWeek.getDay(),
        );
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(endOfLastWeek.getDate() + 6);
        filteredData = filteredData.filter((att) => {
          const attDate = new Date(att.date);
          return attDate >= startOfLastWeek && attDate <= endOfLastWeek;
        });
        break;
      case "this_month":
        const startOfMonth = new Date(
          referenceDate.getFullYear(),
          referenceDate.getMonth(),
          1,
        );
        const endOfMonth = new Date(
          referenceDate.getFullYear(),
          referenceDate.getMonth() + 1,
          0,
        );
        filteredData = filteredData.filter((att) => {
          const attDate = new Date(att.date);
          return attDate >= startOfMonth && attDate <= endOfMonth;
        });
        break;
      case "last_month":
        const startOfLastMonth = new Date(
          referenceDate.getFullYear(),
          referenceDate.getMonth() - 1,
          1,
        );
        const endOfLastMonth = new Date(
          referenceDate.getFullYear(),
          referenceDate.getMonth(),
          0,
        );
        filteredData = filteredData.filter((att) => {
          const attDate = new Date(att.date);
          return attDate >= startOfLastMonth && attDate <= endOfLastMonth;
        });
        break;
      case "custom":
        filteredData = filteredData.filter((att) => {
          const attDate = new Date(att.date);
          return (
            attDate >= new Date(filters.dateRange.start) &&
            attDate <= new Date(filters.dateRange.end)
          );
        });
        break;
    }

    return filteredData;
  };

  // Get attendance data for calendar view (without timeRange filter, only department and status)
  // ALREADY DEFINED ABOVE - This was a duplicate that is now removed

  const getFilteredEmployees = () => {
    if (filters.department === "all") return employees;
    return employees.filter((emp) => emp.department === filters.department);
  };

  const stats = calculateStats();

  const monthlyStats = {
    present: stats.monthlyPresent,
    absent: stats.monthlyAbsent,
    leave: stats.monthlyLeave,
    halfday: stats.monthlyHalfday,
    attendanceRate: stats.monthlyAttendanceRate,
    workingDays: 22,
    totalEmployees: stats.totalEmployees,
    monthlyLate: stats.monthlyLate,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 relative overflow-hidden">
      <DashboardHeader
        title="HR Attendance Management"
        subtitle="Track attendance, breaks, holidays, and employee leaves"
      />
      <RoleBasedNav role={role} />
      {pageLoading ? (
        <PagePreloader
          loading={true}
          message="Loading attendance management data..."
        />
      ) : (
        <>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
            <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-1000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-sky-100 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse animation-delay-2000"></div>
          </div>

          <div className="relative z-10 p-6">
            {employeeView === "list" && (
              <>
                <div className="flex border-b border-gray-200 mb-8">
                  {["overview", "employees"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        if (tab === "overview") {
                          navigate("/hr/attendance/overview");
                          return;
                        }
                        if (tab === "employees") {
                          navigate("/hr/attendance/employee");
                          return;
                        }
                        setActiveTab(tab);
                      }}
                      className={`px-6 py-3 text-sm font-semibold transition duration-300 border-b-2 ${activeTab === tab
                        ? "border-emerald-600 text-emerald-700"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                        }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {/*  */}

                {activeTab === "overview" && (
                  <>
                    {/* Enhanced Monthly Overview with Chart.js */}
                    <MonthlyOverview
                      currentDate={currentDate}
                      monthlyStats={monthlyStats}
                      attendanceData={attendanceData}
                      employees={employees}
                      onFilterChange={setMonthlyFilter}
                      activeFilter={monthlyFilter}
                      timeRange={timeRange}
                      onTimeRangeChange={setTimeRange}
                      filters={filters}
                      onCustomDateRangeChange={(range) => {
                        handleDateRangeChange("start", range.start);
                        handleDateRangeChange("end", range.end);
                        setTimeRange("custom");
                      }}
                    />

                    <OverviewTab
                      currentDate={currentDate}
                      setCurrentDate={setCurrentDate}
                      selectedDate={selectedDate}
                      setSelectedDate={setSelectedDate}
                      filters={filters}
                      handleFilterChange={handleFilterChange}
                      handleDateRangeChange={handleDateRangeChange}
                      getFilteredAttendanceData={getFilteredAttendanceData}
                      getCalendarAttendanceData={getCalendarAttendanceData}
                      getFilteredEmployees={getFilteredEmployees}
                      stats={stats}
                      holidays={holidays}
                      attendanceSearch={attendanceSearch}
                      setAttendanceSearch={setAttendanceSearch}
                      attendanceFilter={attendanceFilter}
                      setAttendanceFilter={setAttendanceFilter}
                      attendanceSort={attendanceSort}
                      setAttendanceSort={setAttendanceSort}
                      getFilteredAndSortedAttendance={
                        getFilteredAndSortedAttendance
                      }
                      editingAttendance={editingAttendance}
                      setEditingAttendance={setEditingAttendance}
                      employees={employees}
                      attendanceData={attendanceData}
                      onMarkAsExplained={handleMarkAsExplained}
                      onSendReminder={handleSendReminder}
                      onUpdateAttendanceNotes={handleUpdateAttendanceNotes}
                      setExplanationData={setExplanationData}
                      setIsExplanationModalOpen={setIsExplanationModalOpen}
                    />
                  </>
                )}
                {activeTab === "employees" && (
                  <HRAttendanceEmployee
                    employees={getFilteredEmployeesWithSearch()}
                    setSelectedEmployee={setSelectedEmployee}
                    setEmployeeView={setEmployeeView}
                    attendanceData={attendanceData}
                    monthlyAbsentSummary={monthlyAbsentSummary}
                    currentDate={currentDate}
                    employeeLeaves={employeeLeaves}
                    selectedEmployees={selectedEmployees}
                    toggleEmployeeSelection={toggleEmployeeSelection}
                    onClearSelection={() => setSelectedEmployees([])}
                    bulkAction={bulkAction}
                    onBulkActionChange={setBulkAction}
                    onBulkActionApply={handleBulkAction}
                    searchTerm={searchTerm}
                    onSearchChange={handleSearch}
                  />
                )}
                {activeTab === "breaks" && (
                  <BreaksManagement
                    breaks={breaks}
                    employees={employees}
                    onAddBreak={handleAddBreak}
                    onDeleteBreak={handleDeleteBreak}
                  />
                )}
              </>
            )}

            {employeeView === "detail" && selectedEmployee && (
              <HRAttendanceEmployeeDetail
                employee={selectedEmployee}
                onBack={() => setEmployeeView("list")}
                attendanceData={attendanceData}
                holidays={holidays}
                employeeLeaves={employeeLeaves}
                onMarkAsExplained={handleMarkAsExplained}
                onUpdateAttendanceNotes={handleUpdateAttendanceNotes}
                onHrUpdateAttendance={handleHrUpdateAttendance}
                onHrCreateAttendance={handleHrCreateAttendance}
                onOpenExplanationModal={(employeeId, date) => {
                  setExplanationData({ employeeId, date, explanation: "" });
                  setIsExplanationModalOpen(true);
                }}
              />
            )}
          </div>

          <AddEmployeeModal
            isOpen={isAddEmployeeModalOpen}
            onClose={() => {
              setIsAddEmployeeModalOpen(false);
              setEditingEmployee(null);
            }}
            onAddEmployee={
              editingEmployee ? handleEditEmployee : handleAddEmployee
            }
            editingEmployee={editingEmployee}
          />

          {/* Explanation Modal */}
          {isExplanationModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    Add Explanation
                  </h3>
                  <button
                    onClick={() => {
                      setIsExplanationModalOpen(false);
                      setExplanationData({
                        employeeId: null,
                        date: null,
                        explanation: "",
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  Please provide a reason or explanation for this absence.
                </p>

                <textarea
                  value={explanationData.explanation}
                  onChange={(e) =>
                    setExplanationData((prev) => ({
                      ...prev,
                      explanation: e.target.value,
                    }))
                  }
                  placeholder="Enter reason or remarks here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows="4"
                />

                <div className="flex items-center space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setIsExplanationModalOpen(false);
                      setExplanationData({
                        employeeId: null,
                        date: null,
                        explanation: "",
                      });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExplainModalSubmit}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          <NotificationContainer notifications={notifications} />

          <style>{`
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
        </>
      )}
    </div>
  );
}

export default HrAttendancePage;

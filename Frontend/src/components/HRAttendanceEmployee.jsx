import { useState, useEffect } from "react";
import { endpoints } from "../config/api";
import BreakSummary from "./BreakSummary";
import {
    Calendar,
    Clock,
    FileText,
    Download,
    Filter,
    Search,
    Eye,
    Edit3,
    Heart,
    Send,
    Zap,
    Coffee,
    ArrowLeft,
    X,
    UserCheck,
    Utensils,
    Sparkle,
    Cigarette,
    Wifi,
    Activity,
} from "lucide-react";

// Break Types Configuration
export const BREAK_TYPES = {
    Cigarette: {
        label: "Cigarette Break",
        icon: Cigarette,
        color: "bg-orange-100 text-orange-800",
        border: "border-orange-200",
    },
    Pray: {
        label: "Pray Break",
        icon: Sparkle,
        color: "bg-purple-100 text-purple-800",
        border: "border-purple-200",
    },
    dinner: {
        label: "Dinner Break",
        icon: Utensils,
        color: "bg-red-100 text-red-800",
        border: "border-red-200",
    },
    lunch: {
        label: "Lunch Break",
        icon: Coffee,
        color: "bg-green-100 text-green-800",
        border: "border-green-200",
    },
    washroom: {
        label: "Washroom Break",
        icon: Wifi,
        color: "bg-blue-100 text-blue-800",
        border: "border-blue-200",
    },
    short: {
        label: "Short Break",
        icon: Activity,
        color: "bg-gray-100 text-gray-800",
        border: "border-gray-200",
    },
};

// Enhanced Employee Detail View Component with Notes Editing
export const EmployeeDetailView = ({
    employee,
    onBack,
    attendanceData,
    holidays,
    employeeLeaves,
    onMarkAsExplained,
    onUpdateAttendanceNotes,
    onOpenExplanationModal,
    onHrUpdateAttendance,
    onHrCreateAttendance,
}) => {
    const [isEditingAttendance, setIsEditingAttendance] = useState(null);
    const [selectedDateBreaks, setSelectedDateBreaks] = useState([]);
    const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);
    const [selectedBreakDate, setSelectedBreakDate] = useState("");
    const [editingNotes, setEditingNotes] = useState("");
    const [leaveData, setLeaveData] = useState(null);
    const [leaveLoading, setLeaveLoading] = useState(false);

    // HR Edit Modal State
    const [isHrEditModalOpen, setIsHrEditModalOpen] = useState(false);
    const [hrEditRecord, setHrEditRecord] = useState(null);
    const [hrEditForm, setHrEditForm] = useState({
        check_in_time: "",
        check_out_time: "",
        status: "",
        remarks: "",
    });
    const [hrEditSaving, setHrEditSaving] = useState(false);

    // Open HR Edit Modal (works for both existing records and absent/no-record days)
    const handleOpenHrEditModal = (record, dateStr) => {
        console.log("📋 Opening HR edit modal:", { record, dateStr });
        // If record is null (no DB record for this date), create a placeholder
        const editRecord = record
            ? { ...record, dateStr }
            : {
                id: null,
                dateStr,
                status: "absent",
                checkIn: "",
                checkOut: "",
                notes: "",
                remarks: "",
                isNewRecord: true,
            };
        setHrEditRecord(editRecord);
        setHrEditForm({
            check_in_time:
                record?.checkIn && record.checkIn !== "-" ? record.checkIn : "",
            check_out_time:
                record?.checkOut && record.checkOut !== "-" ? record.checkOut : "",
            status: record?.status || "absent",
            remarks: record?.notes || record?.remarks || "",
        });
        setIsHrEditModalOpen(true);
    };

    // Save HR Edit (handles both UPDATE existing records and CREATE new records)
    const handleSaveHrEdit = async () => {
        if (!hrEditRecord) return;

        setHrEditSaving(true);
        try {
            if (hrEditRecord.id && !hrEditRecord.isNewRecord) {
                // UPDATE existing record
                console.log("💾 Updating existing record:", hrEditRecord.id);
                await onHrUpdateAttendance(hrEditRecord.id, hrEditForm);
            } else {
                // CREATE new record (absent day with no DB record)
                console.log(
                    "➕ Creating new attendance record for date:",
                    hrEditRecord.dateStr,
                );
                await onHrCreateAttendance(hrEditRecord.dateStr, hrEditForm);
            }
            setIsHrEditModalOpen(false);
            setHrEditRecord(null);
        } catch (error) {
            console.error("❌ Failed to save HR edit:", error.message);
        } finally {
            setHrEditSaving(false);
        }
    };
    // Get employee's breaks for a specific date from attendance data
    // IMPORTANT: Only show breaks if the employee status for that date is 'Present'
    const getEmployeeBreaksForDate = (employeeId, date) => {
        // Find the attendance record for this date
        const attendanceRecord = attendanceData.find(
            (att) => att.employeeId === employeeId && att.date === date,
        );

        // CRITICAL FIX: Only return breaks if employee was PRESENT on that date
        // If status is 'Absent', 'Leave', 'Halfday', etc., return empty array (no breaks)
        if (!attendanceRecord || attendanceRecord.status !== "present") {
            return [];
        }

        // If present but no breaks taken, return empty
        if (attendanceRecord.breaks === 0 || !attendanceRecord.breaks) {
            return [];
        }

        // Get break type counts from the attendance record
        const smokeCount = attendanceRecord.smoke_break_count || 0;
        const dinnerCount = attendanceRecord.dinner_break_count || 0;
        const washroomCount = attendanceRecord.washroom_break_count || 0;
        const prayerCount = attendanceRecord.prayer_break_count || 0;

        // Get durations from the attendance record
        const smokeDuration = attendanceRecord.smoke_break_duration_minutes || 0;
        const dinnerDuration = attendanceRecord.dinner_break_duration_minutes || 0;
        const washroomDuration =
            attendanceRecord.washroom_break_duration_minutes || 0;
        const prayerDuration = attendanceRecord.prayer_break_duration_minutes || 0;

        // Build breaks array from actual break type counts with real durations
        let breaks = [];

        // Start from check-in time, or use 9:00 AM as default if check-in is not available
        let currentHour = 9;
        let currentMinute = 0;

        if (attendanceRecord.checkIn && attendanceRecord.checkIn !== "-") {
            const [hour, minute] = attendanceRecord.checkIn.split(":").map(Number);
            currentHour = hour;
            currentMinute = minute;
        }

        // Helper function to calculate end time
        const calculateEndTime = (startHour, startMin, durationMins) => {
            let endMin = startMin + durationMins;
            let endHour = startHour;

            if (endMin >= 60) {
                endHour += Math.floor(endMin / 60);
                endMin = endMin % 60;
            }

            if (endHour >= 24) {
                endHour = endHour % 24;
            }

            return {
                hour: endHour,
                minute: endMin,
            };
        };

        // Add smoke breaks
        for (let i = 0; i < smokeCount; i++) {
            const avgDuration =
                smokeCount > 0 ? Math.round(smokeDuration / smokeCount) : 0;
            const endTime = calculateEndTime(currentHour, currentMinute, avgDuration);

            breaks.push({
                id: `${employeeId}-${date}-smoke-${i}`,
                employeeId,
                date,
                type: "Cigarette",
                breakStart: `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`,
                breakEnd: `${String(endTime.hour).padStart(2, "0")}:${String(endTime.minute).padStart(2, "0")}`,
                duration: avgDuration,
                notes: `Smoke Break ${i + 1}`,
            });

            currentHour = endTime.hour;
            currentMinute = endTime.minute;
        }

        // Add dinner breaks
        for (let i = 0; i < dinnerCount; i++) {
            const avgDuration =
                dinnerCount > 0 ? Math.round(dinnerDuration / dinnerCount) : 0;
            const endTime = calculateEndTime(currentHour, currentMinute, avgDuration);

            breaks.push({
                id: `${employeeId}-${date}-dinner-${i}`,
                employeeId,
                date,
                type: "dinner",
                breakStart: `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`,
                breakEnd: `${String(endTime.hour).padStart(2, "0")}:${String(endTime.minute).padStart(2, "0")}`,
                duration: avgDuration,
                notes: `Dinner Break ${i + 1}`,
            });

            currentHour = endTime.hour;
            currentMinute = endTime.minute;
        }

        // Add washroom breaks
        for (let i = 0; i < washroomCount; i++) {
            const avgDuration =
                washroomCount > 0 ? Math.round(washroomDuration / washroomCount) : 0;
            const endTime = calculateEndTime(currentHour, currentMinute, avgDuration);

            breaks.push({
                id: `${employeeId}-${date}-washroom-${i}`,
                employeeId,
                date,
                type: "washroom",
                breakStart: `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`,
                breakEnd: `${String(endTime.hour).padStart(2, "0")}:${String(endTime.minute).padStart(2, "0")}`,
                duration: avgDuration,
                notes: `Washroom Break ${i + 1}`,
            });

            currentHour = endTime.hour;
            currentMinute = endTime.minute;
        }

        // Add prayer breaks
        for (let i = 0; i < prayerCount; i++) {
            const avgDuration =
                prayerCount > 0 ? Math.round(prayerDuration / prayerCount) : 0;
            const endTime = calculateEndTime(currentHour, currentMinute, avgDuration);

            breaks.push({
                id: `${employeeId}-${date}-prayer-${i}`,
                employeeId,
                date,
                type: "Pray",
                breakStart: `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`,
                breakEnd: `${String(endTime.hour).padStart(2, "0")}:${String(endTime.minute).padStart(2, "0")}`,
                duration: avgDuration,
                notes: `Prayer Break ${i + 1}`,
            });

            currentHour = endTime.hour;
            currentMinute = endTime.minute;
        }

        return breaks;
    };

    const handleViewBreaks = async (date) => {
        try {
            // Fetch break summary from existing API endpoint
            const response = await fetch(
                `${endpoints.attendance.breakSummary}?employee_id=${employee.id}&date=${date}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch breaks");
            }

            const result = await response.json();

            // Extract breaks from allBreaks array in the response
            const formattedBreaks = (result.data?.breakStats?.allBreaks || []).map((breakRecord) => {
                return {
                    id: breakRecord.id,
                    employeeId: employee.id,
                    date: date,
                    type: breakRecord.type,
                    breakStart: breakRecord.startTime, // Format: "01:17:57"
                    breakEnd: breakRecord.endTime,     // Format: "02:09:52"
                    duration: breakRecord.durationMinutes,
                    notes: breakRecord.reason || "",
                };
            });

            setSelectedDateBreaks(formattedBreaks);
            setSelectedBreakDate(date);
            setIsBreakModalOpen(true);
        } catch (error) {
            console.error("Error fetching breaks:", error);
            // Fallback to empty breaks if API fails
            setSelectedDateBreaks([]);
            setSelectedBreakDate(date);
            setIsBreakModalOpen(true);
        }
    };

    const fetchLeaveBalance = async () => {
        if (!employee?.id) return;

        setLeaveLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${process.env.REACT_APP_API_URL || "http://100.114.9.93:5000"}/api/v1/leaves/employee/${employee.id}/leaveBalance`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            const data = await response.json();

            if (data.success) {
                setLeaveData(data);
                console.log("✅ Leave balance fetched:", data);
            } else {
                console.error("Failed to fetch leave balance:", data.message);
                // Use fallback data
                setLeaveData({
                    casual: { used: 0, total: 8, remaining: 8 },
                    sick: { used: 0, total: 8, remaining: 8 },
                    annual: { used: 0, total: 12, remaining: 12 },
                });
            }
        } catch (error) {
            console.error("Error fetching leave balance:", error);
            // Use fallback data
            setLeaveData({
                casual: { used: 0, total: 8, remaining: 8 },
                sick: { used: 0, total: 8, remaining: 8 },
                annual: { used: 0, total: 12, remaining: 12 },
            });
        } finally {
            setLeaveLoading(false);
        }
    };

    // Fetch leave balance when employee changes
    useEffect(() => {
        if (employee?.id) {
            fetchLeaveBalance();
        }
    }, [employee?.id]);

    const getEmployeeAttendance = (employeeId) => {
        return attendanceData.filter((att) => att.employeeId === employeeId);
    };

    const getEmployeeStats = (employeeId) => {
        const empAttendance = getEmployeeAttendance(employeeId);
        // Count present AND late as attended (working)
        const present = empAttendance.filter(
            (a) => a.status === "present" || a.status === "late",
        ).length;
        const leave = empAttendance.filter((a) => a.status === "leave").length;
        const halfday = empAttendance.filter((a) => a.status === "halfday").length;
        const absent = empAttendance.filter((a) => a.status === "absent").length;
        const totalHours = empAttendance.reduce(
            (sum, a) => sum + parseFloat(a.hours),
            0,
        );
        const totalOvertime = empAttendance.reduce(
            (sum, a) => sum + parseFloat(a.overtime),
            0,
        );

        return {
            present,
            leave,
            halfday,
            absent,
            totalHours: totalHours.toFixed(1),
            totalOvertime: totalOvertime.toFixed(1),
            attendanceRate:
                empAttendance.length > 0
                    ? ((present / empAttendance.length) * 100).toFixed(1)
                    : "0.0",
        };
    };

    const getUnexplainedAbsences = () => {
        return attendanceData
            .filter(
                (att) =>
                    att.employeeId === employee.id &&
                    att.status === "absent" &&
                    (!att.notes ||
                        att.notes === "No notification" ||
                        att.notes.includes("No explanation")),
            )
            .slice(0, 5);
    };

    const handleSaveNotes = (recordId, notes) => {
        onUpdateAttendanceNotes(recordId, notes);
        setIsEditingAttendance(null);
        setEditingNotes("");
    };

    const handleEditNotes = (record) => {
        setIsEditingAttendance(record.id);
        setEditingNotes(record.notes || "");
    };

    const empAttendance = getEmployeeAttendance(employee.id);
    const empStats = getEmployeeStats(employee.id);
    const empLeaves = employeeLeaves.find((l) => l.employeeId === employee.id);
    const unexplainedAbsences = getUnexplainedAbsences();

    // Sort attendance by date (newest first, oldest last) - FIXED for proper date ordering
    const sortedEmpAttendance = empAttendance.slice().sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Descending order (latest first)
    });

    // Group attendance by month for month-wise navigation
    const monthGroups = sortedEmpAttendance
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .reduce((acc, dayData) => {
            const month = new Date(dayData.date).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
            });
            if (!acc[month]) acc[month] = [];
            acc[month].push(dayData);
            return acc;
        }, {});

    // Always include the current month so fully-absent employees still see the calendar
    const currentMonthKey = new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });
    if (!monthGroups[currentMonthKey]) monthGroups[currentMonthKey] = [];

    // Sort months newest-first
    const monthKeys = Object.keys(monthGroups).sort(
        (a, b) => new Date(b) - new Date(a),
    );
    const [selectedHistoryMonth, setSelectedHistoryMonth] = useState(
        () => monthKeys[0] || null,
    );

    // Keep selectedHistoryMonth in sync when new data loads for this employee
    useEffect(() => {
        if (
            monthKeys.length > 0 &&
            (!selectedHistoryMonth || !monthGroups[selectedHistoryMonth])
        ) {
            setSelectedHistoryMonth(monthKeys[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employee.id, monthKeys[0]]);

    // Count working weekdays in a month up to today (for accurate count display)
    const getMonthWorkingCount = (monthKey) => {
        const dbRecords = monthGroups[monthKey] || [];
        let year, monthIndex;
        if (dbRecords.length > 0) {
            const d = new Date(dbRecords[0].date);
            year = d.getFullYear();
            monthIndex = d.getMonth();
        } else {
            // "March 2026" → prepend "1 " so JS can parse it
            const parsed = new Date("1 " + monthKey);
            year = parsed.getFullYear();
            monthIndex = parsed.getMonth();
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastDayOfMonth = new Date(year, monthIndex + 1, 0);
        const countUntil =
            lastDayOfMonth < today ? lastDayOfMonth.getDate() : today.getDate();
        const isCurrentMonth =
            today.getFullYear() === year && today.getMonth() === monthIndex;
        const limit = isCurrentMonth ? countUntil : lastDayOfMonth.getDate();
        let count = 0;
        for (let d = 1; d <= limit; d++) {
            const dow = new Date(year, monthIndex, d).getDay();
            if (dow !== 0 && dow !== 6) count++;
        }
        return count;
    };
    const [monthStatusFilter, setMonthStatusFilter] = useState("all");
    const [showOnlyMatches, setShowOnlyMatches] = useState(false);

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <BreakDetailsModal
                isOpen={isBreakModalOpen}
                onClose={() => setIsBreakModalOpen(false)}
                breaks={selectedDateBreaks}
                date={selectedBreakDate}
                employeeName={employee.name}
            />

            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-5">
                        <button
                            onClick={onBack}
                            className="p-2.5 rounded-lg border border-gray-300 hover:bg-gray-100 transition duration-300"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-600" />
                        </button>
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md">
                            {employee.avatar}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                {employee.name}
                            </h1>
                            <p className="text-gray-600 text-sm mt-1">
                                {employee.position} • {employee.department}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button className="flex items-center px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition duration-300">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </button>
                        <button className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-md transition duration-300">
                            <Send className="h-4 w-4 mr-2" />
                            Send Report
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Uninformed Section */}
                {unexplainedAbsences.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-red-900">Uninformed</h3>
                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                                {unexplainedAbsences.length} need explanation
                            </span>
                        </div>

                        <div className="space-y-3">
                            {unexplainedAbsences.map((absence) =>
                                absence && absence.employee ? (
                                    <div
                                        key={absence.id}
                                        className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {new Date(absence.date).toLocaleDateString("en-US", {
                                                        weekday: "short",
                                                        month: "short",
                                                        day: "numeric",
                                                    })}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    No explanation provided
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() =>
                                                    onOpenExplanationModal(
                                                        absence.employee.id,
                                                        absence.date,
                                                    )
                                                }
                                                className="flex items-center px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition duration-200"
                                            >
                                                <UserCheck className="h-3 w-3 mr-1" />
                                                Explain
                                            </button>
                                        </div>
                                    </div>
                                ) : null,
                            )}
                        </div>
                    </div>
                )}

                {/* ✅ LEAVE SUMMARY - DYNAMIC */}
                <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        Leaves Summary
                        {leaveLoading && (
                            <span className="ml-2 text-sm text-gray-400">(Loading...)</span>
                        )}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Casual Leaves */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-lg">Casual Leaves</h4>
                                <div className="bg-white/20 backdrop-blur-md rounded-full p-3">
                                    <Calendar className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                                    <div className="text-sm text-blue-100 mb-1">Used / Total</div>
                                    <div className="text-3xl font-bold">
                                        {leaveData?.casual?.used ?? 0} / {leaveData?.casual?.total ?? 8}
                                    </div>
                                    <div className="text-xs text-blue-200 mt-1">
                                        {leaveData?.casual?.remaining ?? 8} remaining
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sick Leaves */}
                        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-lg">Sick Leaves</h4>
                                <div className="bg-white/20 backdrop-blur-md rounded-full p-3">
                                    <Heart className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                                    <div className="text-sm text-red-100 mb-1">Used / Total</div>
                                    <div className="text-3xl font-bold">
                                        {leaveData?.sick?.used ?? 0} / {leaveData?.sick?.total ?? 8}
                                    </div>
                                    <div className="text-xs text-red-200 mt-1">
                                        {leaveData?.sick?.remaining ?? 8} remaining
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Annual Leaves */}
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-lg">Annual Leaves</h4>
                                <div className="bg-white/20 backdrop-blur-md rounded-full p-3">
                                    <Zap className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                                    <div className="text-sm text-green-100 mb-1">Used / Total</div>
                                    <div className="text-3xl font-bold">
                                        {leaveData?.annual?.used ?? 0} / {leaveData?.annual?.total ?? 12}
                                    </div>
                                    <div className="text-xs text-green-200 mt-1">
                                        {leaveData?.annual?.remaining ?? 12} remaining
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Break Summary Section */}
                {selectedBreakDate && (
                    <div className="mb-8">
                        <BreakSummary employeeId={employee.id} date={selectedBreakDate} />
                    </div>
                )}

                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Attendance History
                        </h3>
                    </div>

                    {/* Month selector + calendar for selected month */}
                    {monthKeys.length > 0 ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-sm text-gray-700 font-medium">
                                    Showing month:
                                </div>
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => {
                                            const idx = monthKeys.indexOf(selectedHistoryMonth);
                                            if (idx < monthKeys.length - 1)
                                                setSelectedHistoryMonth(monthKeys[idx + 1]);
                                        }}
                                        disabled={
                                            monthKeys.indexOf(selectedHistoryMonth) >=
                                            monthKeys.length - 1
                                        }
                                        className="px-3 py-1 bg-white rounded-lg border hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Prev
                                    </button>

                                    <select
                                        value={selectedHistoryMonth || ""}
                                        onChange={(e) => setSelectedHistoryMonth(e.target.value)}
                                        className="px-3 py-1 border rounded-lg"
                                    >
                                        {monthKeys.map((m) => (
                                            <option key={m} value={m}>
                                                {m} ({getMonthWorkingCount(m)} days)
                                            </option>
                                        ))}
                                    </select>

                                    <button
                                        onClick={() => {
                                            const idx = monthKeys.indexOf(selectedHistoryMonth);
                                            if (idx > 0) setSelectedHistoryMonth(monthKeys[idx - 1]);
                                        }}
                                        disabled={monthKeys.indexOf(selectedHistoryMonth) <= 0}
                                        className="px-3 py-1 bg-white rounded-lg border hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>

                                    {/* Month-wise filters */}
                                    <div className="flex items-center space-x-2">
                                        <select
                                            value={monthStatusFilter}
                                            onChange={(e) => setMonthStatusFilter(e.target.value)}
                                            className="px-3 py-1 border rounded-lg text-sm"
                                        >
                                            <option value="all">All</option>
                                            <option value="present">Present</option>
                                            <option value="late">Late</option>
                                            <option value="leave">On Leave</option>
                                            <option value="paid_leave">Paid Leave (PL)</option>
                                            <option value="halfday">Half Day</option>
                                            <option value="absent">Absent</option>
                                            <option value="unexplained">
                                                Uninformed Absent (UA)
                                            </option>
                                            <option value="not-recorded">Not Recorded</option>
                                        </select>

                                        <label className="inline-flex items-center text-sm text-gray-600">
                                            <input
                                                type="checkbox"
                                                checked={showOnlyMatches}
                                                onChange={(e) => setShowOnlyMatches(e.target.checked)}
                                                className="mr-2 h-4 w-4 text-blue-600"
                                            />
                                            <span>Only show matches</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {selectedHistoryMonth ? (
                                (() => {
                                    const records = monthGroups[selectedHistoryMonth] || [];
                                    // Determine the month/year from the first record (fallback to current month)
                                    const sampleDate = records[0]
                                        ? new Date(records[0].date)
                                        : new Date();
                                    const year = sampleDate.getFullYear();
                                    const monthIndex = sampleDate.getMonth();
                                    const firstDay = new Date(year, monthIndex, 1).getDay(); // 0 = Sun
                                    const daysInMonth = new Date(
                                        year,
                                        monthIndex + 1,
                                        0,
                                    ).getDate();

                                    // Build calendar cells with placeholders for starting offset
                                    const cells = [];
                                    for (let i = 0; i < firstDay; i++) cells.push(null);
                                    for (let d = 1; d <= daysInMonth; d++) {
                                        const dateStr = new Date(
                                            year,
                                            monthIndex,
                                            d,
                                        ).toLocaleDateString("en-CA");
                                        const rec = records.find((r) => r.date === dateStr);
                                        cells.push({ day: d, dateStr, rec });
                                    }

                                    return (
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-sm">
                                            <div className="grid grid-cols-7 gap-2">
                                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                                                    (day) => (
                                                        <div
                                                            key={day}
                                                            className="text-center text-xs font-bold text-gray-700 py-2"
                                                        >
                                                            {day}
                                                        </div>
                                                    ),
                                                )}

                                                {cells.map((cell, idx) => {
                                                    if (!cell)
                                                        return (
                                                            <div
                                                                key={`empty-${idx}`}
                                                                className="p-2 rounded-lg bg-transparent"
                                                            />
                                                        );

                                                    const { day, dateStr, rec } = cell;
                                                    // Filter matching logic
                                                    const matchesFilter = (() => {
                                                        if (monthStatusFilter === "all") return true;
                                                        if (monthStatusFilter === "not-recorded")
                                                            return !rec;
                                                        if (monthStatusFilter === "unexplained")
                                                            return (
                                                                rec &&
                                                                ((rec.status === "absent" &&
                                                                    (!rec.notes ||
                                                                        rec.notes === "No notification" ||
                                                                        rec.notes.includes("No explanation"))) ||
                                                                    rec.status === "Uninformed Absent" ||
                                                                    rec.status === "uninformed absent")
                                                            );
                                                        if (monthStatusFilter === "paid_leave")
                                                            return (
                                                                rec &&
                                                                (rec.status === "Paid Leave" ||
                                                                    rec.status === "paid leave" ||
                                                                    rec.status === "leave")
                                                            );
                                                        return rec && rec.status === monthStatusFilter;
                                                    })();

                                                    if (!matchesFilter && showOnlyMatches) {
                                                        return (
                                                            <div
                                                                key={`empty-filtered-${idx}`}
                                                                className="p-2 rounded-lg bg-transparent"
                                                            />
                                                        );
                                                    }
                                                    const isHoliday = holidays.some(
                                                        (h) => h.date === dateStr,
                                                    );
                                                    const isWeekend =
                                                        new Date(dateStr).getDay() === 0 ||
                                                        new Date(dateStr).getDay() === 6;
                                                    const isUnexplained =
                                                        rec &&
                                                        rec.status === "absent" &&
                                                        (!rec.notes || rec.notes === "No notification");

                                                    const status = rec ? rec.status : "not-recorded";
                                                    const getBadge = () => {
                                                        if (isWeekend)
                                                            return {
                                                                text: "Off",
                                                                color: "bg-gray-400 text-white",
                                                            };
                                                        if (isHoliday)
                                                            return {
                                                                text: "Hol",
                                                                color: "bg-purple-500 text-white",
                                                            };
                                                        if (isUnexplained)
                                                            return {
                                                                text: "UA",
                                                                color: "bg-red-600 text-white",
                                                            };
                                                        if (status === "present")
                                                            return {
                                                                text: "P",
                                                                color: "bg-green-500 text-white",
                                                            };
                                                        if (status === "late")
                                                            return {
                                                                text: "L",
                                                                color: "bg-orange-500 text-white",
                                                            };
                                                        if (
                                                            status === "paid leave" ||
                                                            status === "Paid Leave"
                                                        )
                                                            return {
                                                                text: "PL",
                                                                color: "bg-teal-500 text-white",
                                                            };
                                                        if (status === "leave" || status === "On Leave")
                                                            return {
                                                                text: "PL",
                                                                color: "bg-teal-500 text-white",
                                                            };
                                                        if (status === "halfday")
                                                            return {
                                                                text: "Half",
                                                                color: "bg-yellow-500 text-white",
                                                            };
                                                        if (
                                                            status === "uninformed absent" ||
                                                            status === "Uninformed Absent"
                                                        )
                                                            return {
                                                                text: "UA",
                                                                color: "bg-red-600 text-white",
                                                            };
                                                        if (status === "absent")
                                                            return {
                                                                text: "A",
                                                                color: "bg-red-500 text-white",
                                                            };
                                                        // No DB record for a past weekday — employee did not check in, so mark Absent
                                                        if (!rec && !isWeekend && !isHoliday) {
                                                            const cellDate = new Date(dateStr);
                                                            const todayMidnight = new Date();
                                                            todayMidnight.setHours(0, 0, 0, 0);
                                                            if (cellDate < todayMidnight)
                                                                return {
                                                                    text: "A",
                                                                    color: "bg-red-500 text-white",
                                                                };
                                                        }
                                                        return {
                                                            text: "-",
                                                            color: "bg-gray-200 text-gray-700",
                                                        };
                                                    };

                                                    const badge = getBadge();

                                                    // Build hover tooltip with check-in/check-out times
                                                    const tooltipText = rec
                                                        ? `${dateStr}: ${status}${rec.checkIn && rec.checkIn !== "-" ? ` | In: ${rec.checkIn}` : ""}${rec.checkOut && rec.checkOut !== "-" ? ` | Out: ${rec.checkOut}` : ""}`
                                                        : `${dateStr}: ${status}`;

                                                    return (
                                                        <div
                                                            key={dateStr}
                                                            className={`p-2 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer ${rec ? "" : "bg-gray-50 border-dashed border-gray-200"} ${!matchesFilter ? "opacity-40 pointer-events-none" : ""}`}
                                                            title={tooltipText}
                                                        >
                                                            <div className="text-center">
                                                                <div className="text-sm font-bold text-gray-900 mb-1">
                                                                    {day}
                                                                </div>
                                                                <div
                                                                    className={`text-xs font-semibold px-1.5 py-0.5 rounded inline-block ${badge.color}`}
                                                                >
                                                                    {badge.text}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No month selected
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            No attendance records found
                        </div>
                    )}
                </div>

                {/* Detailed Attendance Table */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Detailed Attendance
                        </h3>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gradient-to-r from-blue-500 to-blue-400 text-white">
                                    <th className="text-left px-4 py-3 font-semibold">Date</th>
                                    <th className="text-left px-4 py-3 font-semibold">
                                        Check In
                                    </th>
                                    <th className="text-left px-4 py-3 font-semibold">
                                        Check Out
                                    </th>
                                    <th className="text-center px-4 py-3 font-semibold">
                                        Status
                                    </th>
                                    <th className="text-center px-4 py-3 font-semibold">
                                        Working Hours
                                    </th>
                                    <th className="text-center px-4 py-3 font-semibold">
                                        Breaks
                                    </th>
                                    <th className="text-center px-4 py-3 font-semibold">
                                        Late By
                                    </th>
                                    <th className="text-center px-4 py-3 font-semibold">
                                        Overtime
                                    </th>
                                    <th className="text-center px-4 py-3 font-semibold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    // Build complete list of weekdays for the selected month, merging DB records + absent placeholders
                                    if (!selectedHistoryMonth) return null;

                                    // Parse selected month
                                    const parsed = new Date("1 " + selectedHistoryMonth);
                                    const year = parsed.getFullYear();
                                    const mIdx = parsed.getMonth();
                                    const daysInMonth = new Date(year, mIdx + 1, 0).getDate();
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);

                                    // Get DB records for this month keyed by date string
                                    const monthRecords = sortedEmpAttendance.filter((r) => {
                                        const rm = new Date(r.date).toLocaleDateString("en-US", {
                                            month: "long",
                                            year: "numeric",
                                        });
                                        return rm === selectedHistoryMonth;
                                    });
                                    const recordsByDate = {};
                                    monthRecords.forEach((r) => {
                                        recordsByDate[r.date] = r;
                                    });

                                    // Build rows for all weekdays up to today (or end of month if past)
                                    const rows = [];
                                    for (let d = daysInMonth; d >= 1; d--) {
                                        const dateObj = new Date(year, mIdx, d);
                                        const dow = dateObj.getDay();
                                        const isWeekend = dow === 0 || dow === 6;

                                        // Don't skip weekends anymore - show them all
                                        // But don't show future dates
                                        if (dateObj > today) continue;

                                        const dateStr = dateObj.toLocaleDateString("en-CA"); // YYYY-MM-DD
                                        const record = recordsByDate[dateStr] || null;

                                        // Get day name
                                        const dayNames = [
                                            "Sunday",
                                            "Monday",
                                            "Tuesday",
                                            "Wednesday",
                                            "Thursday",
                                            "Friday",
                                            "Saturday",
                                        ];
                                        const dayName = dayNames[dow];

                                        rows.push({
                                            dateStr,
                                            dateObj,
                                            record,
                                            isWeekend,
                                            dayName,
                                        });
                                    }

                                    if (rows.length === 0) {
                                        return (
                                            <tr>
                                                <td
                                                    colSpan="9"
                                                    className="px-4 py-8 text-center text-gray-500"
                                                >
                                                    No attendance data for this month yet
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return rows.map(({ dateStr, dateObj, record }, idx) => {
                                        const status = record ? record.status : "absent";
                                        const isAbsent = status === "absent";
                                        const isPresent = status === "present";
                                        const isLate = status === "late";
                                        const isLeave =
                                            status === "leave" || status === "paid leave";
                                        const isUnexplained =
                                            isAbsent &&
                                            (!record ||
                                                !record.notes ||
                                                record.notes === "No notification");

                                        const breaksForDay = record
                                            ? getEmployeeBreaksForDate(employee.id, dateStr)
                                            : [];
                                        const totalBreakTime = breaksForDay.reduce(
                                            (total, b) => total + b.duration,
                                            0,
                                        );

                                        const statusLabel = isUnexplained
                                            ? "A"
                                            : isPresent
                                                ? "P"
                                                : isLate
                                                    ? "L"
                                                    : status === "early-leave"
                                                        ? "EL"
                                                        : isLeave
                                                            ? "PL"
                                                            : status === "half day"
                                                                ? "HD"
                                                                : isAbsent
                                                                    ? "A"
                                                                    : status?.charAt(0)?.toUpperCase() || "-";

                                        const statusColor = isUnexplained
                                            ? "bg-red-100 text-red-700"
                                            : isPresent
                                                ? "bg-green-100 text-green-700"
                                                : isLate
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : status === "early-leave"
                                                        ? "bg-cyan-100 text-cyan-700"
                                                        : isLeave
                                                            ? "bg-teal-100 text-teal-700"
                                                            : status === "half day"
                                                                ? "bg-blue-100 text-blue-700 font-bold"
                                                                : isAbsent
                                                                    ? "bg-red-100 text-red-700"
                                                                    : "bg-gray-100 text-gray-700";

                                        return (
                                            <tr
                                                key={dateStr}
                                                className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-blue-50/30" : "bg-white"} hover:bg-blue-50 transition`}
                                            >
                                                <td className="px-4 py-3 text-gray-800 font-medium whitespace-nowrap">
                                                    {dateObj.toLocaleDateString("en-US", {
                                                        weekday: "short",
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {record &&
                                                        record.checkIn &&
                                                        record.checkIn !== "-" ? (
                                                        <span className="text-green-600 font-medium">
                                                            {record.checkIn}
                                                        </span>
                                                    ) : (
                                                        <span className="text-red-500 font-medium">
                                                            No Check-in
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {record &&
                                                        record.checkOut &&
                                                        record.checkOut !== "-" ? (
                                                        <span className="text-blue-600 font-medium">
                                                            {record.checkOut}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">&mdash;</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span
                                                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${statusColor}`}
                                                    >
                                                        {statusLabel}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center text-gray-700">
                                                    {record ? record.hours || "—" : "—"}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {record && record.breaks > 0 ? (
                                                        <button
                                                            onClick={() => handleViewBreaks(dateStr)}
                                                            className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                                                        >
                                                            {record.breaks} ({totalBreakTime}m)
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-400">&mdash;</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center text-gray-700">
                                                    {record && record.late && record.late !== "-"
                                                        ? record.late
                                                        : "—"}
                                                </td>
                                                <td className="px-4 py-3 text-center text-gray-700">
                                                    {record &&
                                                        record.overtime &&
                                                        record.overtime !== "0.0" &&
                                                        record.overtime !== "0"
                                                        ? `${record.overtime}h`
                                                        : "—"}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() =>
                                                            handleOpenHrEditModal(record, dateStr)
                                                        }
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-300"
                                                        title={
                                                            record ? "Edit Attendance" : "Add Attendance"
                                                        }
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* HR Edit Attendance Modal */}
                {isHrEditModalOpen && hrEditRecord && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-gray-900">
                                        {hrEditRecord.isNewRecord
                                            ? "Add Attendance"
                                            : "Edit Attendance"}
                                    </h3>
                                    <button
                                        onClick={() => setIsHrEditModalOpen(false)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        <X className="h-5 w-5 text-gray-500" />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    {hrEditRecord.dateStr &&
                                        new Date(hrEditRecord.dateStr).toLocaleDateString("en-US", {
                                            weekday: "long",
                                            month: "long",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                </p>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={hrEditForm.status}
                                        onChange={(e) =>
                                            setHrEditForm((prev) => ({
                                                ...prev,
                                                status: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="present">Present</option>
                                        <option value="late">Late</option>
                                        <option value="absent">Absent</option>
                                        <option value="leave">Paid Leave</option>
                                        <option value="halfday">Half Day</option>
                                        <option value="early-leave">Early Leave</option>
                                    </select>
                                </div>

                                {/* Check In Time */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Check In Time
                                    </label>
                                    <input
                                        type="time"
                                        step="1"
                                        value={hrEditForm.check_in_time}
                                        onChange={(e) =>
                                            setHrEditForm((prev) => ({
                                                ...prev,
                                                check_in_time: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Check Out Time */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Check Out Time
                                    </label>
                                    <input
                                        type="time"
                                        step="1"
                                        value={hrEditForm.check_out_time}
                                        onChange={(e) =>
                                            setHrEditForm((prev) => ({
                                                ...prev,
                                                check_out_time: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Remarks */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Remarks / Notes
                                    </label>
                                    <textarea
                                        value={hrEditForm.remarks}
                                        onChange={(e) =>
                                            setHrEditForm((prev) => ({
                                                ...prev,
                                                remarks: e.target.value,
                                            }))
                                        }
                                        rows={3}
                                        placeholder="Add any notes..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsHrEditModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveHrEdit}
                                    disabled={hrEditSaving}
                                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition font-medium flex items-center gap-2 disabled:opacity-50"
                                >
                                    {hrEditSaving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Break Details Modal Component
const BreakDetailsModal = ({ isOpen, onClose, breaks, date, employeeName }) => {
    if (!isOpen) return null;

    const formatTime = (timeString) => {
        if (!timeString || timeString === "-") return "N/A";
        return timeString;
    };

    const calculateDuration = (start, end) => {
        if (!start || !end || start === "-" || end === "-") return "N/A";

        const startTime = new Date(`2000-01-01T${start}`);
        const endTime = new Date(`2000-01-01T${end}`);
        const durationMs = endTime - startTime;
        const durationMins = Math.floor(durationMs / (1000 * 60));

        return `${durationMins} min`;
    };

    const getBreakStats = () => {
        const totalBreaks = breaks.length;
        const totalDuration = breaks.reduce((total, breakItem) => {
            if (
                breakItem.breakStart &&
                breakItem.breakEnd &&
                breakItem.breakStart !== "-" &&
                breakItem.breakEnd !== "-"
            ) {
                // Parse times in HH:MM:SS format
                const [startHour, startMin, startSec = 0] = breakItem.breakStart
                    .split(":")
                    .map(Number);
                const [endHour, endMin, endSec = 0] = breakItem.breakEnd
                    .split(":")
                    .map(Number);

                // Convert to total seconds since midnight
                const startSeconds = startHour * 3600 + startMin * 60 + startSec;
                const endSeconds = endHour * 3600 + endMin * 60 + endSec;

                // Calculate duration, handling midnight crossing
                let durationSeconds = endSeconds - startSeconds;
                if (durationSeconds < 0) {
                    durationSeconds += 24 * 3600;
                }

                return total + durationSeconds / 60;
            }
            return total;
        }, 0);

        return {
            totalBreaks,
            totalDuration: Math.round(totalDuration),
            averageDuration:
                totalBreaks > 0 ? Math.round(totalDuration / totalBreaks) : 0,
        };
    };

    const breakStats = getBreakStats();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
                    <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                            Break Details
                        </h2>
                        <p className="text-gray-600 mt-1 text-sm">
                            {employeeName} •{" "}
                            {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition duration-300"
                    >
                        <X className="h-5 w-5 text-gray-600" />
                    </button>
                </div>

                {/* Break Statistics */}
                <div className="p-6 bg-white border-b border-gray-200">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="text-3xl font-bold text-blue-600">
                                {breakStats.totalBreaks}
                            </div>
                            <div className="text-sm text-blue-700 font-medium mt-2">
                                Total Breaks
                            </div>
                        </div>
                        <div className="text-center p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="text-3xl font-bold text-green-600">
                                {breakStats.totalDuration}
                            </div>
                            <div className="text-sm text-green-700 font-medium mt-2">
                                Total Minutes
                            </div>
                        </div>
                        <div className="text-center p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="text-3xl font-bold text-purple-600">
                                {breakStats.averageDuration}
                            </div>
                            <div className="text-sm text-purple-700 font-medium mt-2">
                                Avg per Break
                            </div>
                        </div>
                    </div>
                </div>

                {/* Breaks List */}
                <div className="p-6 max-h-96 overflow-y-auto">
                    {breaks.length > 0 ? (
                        <div className="space-y-4">
                            {breaks.map((breakItem, index) => {
                                const breakType =
                                    BREAK_TYPES[breakItem.type] || BREAK_TYPES.short;
                                const IconComponent = breakType.icon;
                                const duration = calculateDuration(
                                    breakItem.breakStart,
                                    breakItem.breakEnd,
                                );

                                return (
                                    <div
                                        key={breakItem.id || index}
                                        className="flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-300"
                                    >
                                        <div className="flex items-center space-x-4 flex-1">
                                            <div
                                                className={`w-12 h-12 rounded-xl flex items-center justify-center ${breakType.color}`}
                                            >
                                                <IconComponent className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3">
                                                    <h4 className="font-semibold text-gray-900">
                                                        {breakType.label}
                                                    </h4>
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-medium ${breakType.color}`}
                                                    >
                                                        {breakItem.type}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-gray-600">
                                                    <div className="flex items-center space-x-2">
                                                        <Clock className="h-4 w-4 text-gray-400" />
                                                        <span>
                                                            Start: {formatTime(breakItem.breakStart)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Clock className="h-4 w-4 text-gray-400" />
                                                        <span>End: {formatTime(breakItem.breakEnd)}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Activity className="h-4 w-4 text-gray-400" />
                                                        <span>Duration: {duration}</span>
                                                    </div>
                                                    {breakItem.notes && (
                                                        <div className="flex items-center space-x-2 col-span-2">
                                                            <FileText className="h-4 w-4 text-gray-400" />
                                                            <span>Notes: {breakItem.notes}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-sm font-medium text-gray-900">
                                                {duration}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Break #{index + 1}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Coffee className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No Breaks Recorded
                            </h3>
                            <p className="text-gray-500">
                                No break data available for this day.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                    <div className="text-sm text-gray-600">
                        Last updated: {new Date().toLocaleTimeString()}
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-md transition duration-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const HRAttendanceEmployee = ({
    employees = [],
    setSelectedEmployee = () => undefined,
    setEmployeeView = () => undefined,
    attendanceData = [],
    monthlyAbsentSummary = [],
    currentDate,
    selectedEmployees = [],
    toggleEmployeeSelection = () => undefined,
    onClearSelection = () => undefined,
    bulkAction = "",
    onBulkActionChange = () => undefined,
    onBulkActionApply = () => undefined,
    searchTerm = "",
    onSearchChange = () => undefined,
}) => {
    const [employeeStatusFilter, setEmployeeStatusFilter] = useState("active");

    const getEmployeeStats = (employeeId) => {
        const curYear = (currentDate || new Date()).getFullYear();
        const curMonth = (currentDate || new Date()).getMonth();
        const empAttendance = attendanceData.filter((att) => {
            if (att.employeeId !== employeeId) return false;
            const date = new Date(att.date);
            return date.getFullYear() === curYear && date.getMonth() === curMonth;
        });
        const present = empAttendance.filter(
            (attendance) =>
                attendance.status === "present" || attendance.status === "late",
        ).length;
        const leave = empAttendance.filter(
            (attendance) => attendance.status === "leave",
        ).length;
        const halfday = empAttendance.filter(
            (attendance) => attendance.status === "halfday",
        ).length;
        const absentSummaryEntry = (monthlyAbsentSummary || []).find(
            (summary) => String(summary.employee_id) === String(employeeId),
        );
        const absent = absentSummaryEntry
            ? absentSummaryEntry.total_absent_days
            : empAttendance.filter((attendance) => attendance.status === "absent")
                .length;
        const totalHours = empAttendance.reduce(
            (sum, attendance) => sum + (parseFloat(attendance.hours) || 0),
            0,
        );
        const totalOvertime = empAttendance.reduce(
            (sum, attendance) => sum + (parseFloat(attendance.overtime) || 0),
            0,
        );
        const totalDays = present + absent + leave + halfday;

        return {
            present,
            leave,
            halfday,
            absent,
            totalHours: totalHours.toFixed(1),
            totalOvertime: totalOvertime.toFixed(1),
            attendanceRate:
                totalDays > 0 ? ((present / totalDays) * 100).toFixed(1) : "0.0",
        };
    };

    return (
        <div className="bg-white rounded-3xl p-7 border border-gray-200 shadow-md">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Employee Attendance
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Monthly summary for{" "}
                        {(currentDate || new Date()).toLocaleString("default", {
                            month: "long",
                            year: "numeric",
                        })}
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(event) => onSearchChange(event.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
                        />
                    </div>
                    <button className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </button>
                    <select
                        value={employeeStatusFilter}
                        onChange={(event) => setEmployeeStatusFilter(event.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
                        aria-label="Filter employees by status"
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {selectedEmployees.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4">
                    <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-blue-800">
                            {selectedEmployees.length} employees selected
                        </span>
                        <select
                            value={bulkAction}
                            onChange={(event) => onBulkActionChange(event.target.value)}
                            className="px-3 py-1 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Bulk Actions</option>
                            <option value="approve-leave">Approve Leave</option>
                            <option value="export-data">Export Data</option>
                            <option value="send-reminder">Send Reminder</option>
                        </select>
                        <button
                            onClick={onBulkActionApply}
                            className="px-4 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-sm hover:shadow-md"
                        >
                            Apply
                        </button>
                    </div>
                    <button
                        onClick={onClearSelection}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        Clear
                    </button>
                </div>
            )}

            <div className="space-y-4">
                {employees
                    .filter((employee) => String(employee.status || "active").toLowerCase() === employeeStatusFilter)
                    .map((employee) => {
                    const empStats = getEmployeeStats(employee.id);
                    const isSelected = selectedEmployees.includes(employee.id);
                    const openDetails = () => {
                        setSelectedEmployee(employee);
                        setEmployeeView("detail");
                    };

                    return (
                        <div
                            key={employee.id}
                            className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${isSelected
                                ? "bg-blue-50 border-blue-300 shadow-md"
                                : "bg-white border-gray-200 hover:border-[#349dff] hover:bg-blue-50 hover:shadow-md"
                                }`}
                        >
                            <div className="flex items-center space-x-4">
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleEmployeeSelection(employee.id)}
                                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <div
                                    className="flex items-center space-x-4 flex-1"
                                    onClick={openDetails}
                                >
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-semibold">
                                        {employee.avatar}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-900">{employee.name}</h4>
                                        <p className="text-sm text-gray-600">
                                            {employee.department} • {employee.position}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-6">
                                <div className="flex items-center space-x-4">
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-green-600">{empStats.present}</div>
                                        <div className="text-xs text-gray-600">Present</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-orange-600">{empStats.leave}</div>
                                        <div className="text-xs text-gray-600">Leaves</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-red-600">{empStats.absent}</div>
                                        <div className="text-xs text-gray-600">Absent</div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <div className="text-center">
                                        <div className="text-sm font-semibold text-blue-600">
                                            {employee.leavesRemaining}
                                        </div>
                                        <div className="text-xs text-gray-600">Leaves Left</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm font-semibold text-purple-600">
                                            {empStats.attendanceRate}%
                                        </div>
                                        <div className="text-xs text-gray-600">Attendance</div>
                                    </div>
                                </div>

                                <button
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        openDetails();
                                    }}
                                    className="p-2 text-gray-400 hover:text-[#349dff] transition duration-300"
                                    aria-label={`View ${employee.name} attendance details`}
                                >
                                    <Eye className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    );
                    })}
            </div>
        </div>
    );
};

export default HRAttendanceEmployee;

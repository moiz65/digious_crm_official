import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  Clock,Save,Edit,X,Check,Settings,Calendar,
  Shield,
  Bell,
  Users,
  FileText,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Palette,
  Layout,
  Monitor,
} from "lucide-react";

export default function HrSettings() {
  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState({
    attendance: true,
    leave: false,
    notifications: false,
    appearance: false,
    general: false,
  });

  // State for edit mode per section
  const [editMode, setEditMode] = useState({
    attendance: false,
    leave: false,
    notifications: false,
    appearance: false,
    general: false,
  });

  // --- Attendance Settings (Static) ---
  const [attendanceSettings, setAttendanceSettings] = useState({
    checkInTime: "09:00",
    checkOutTime: "18:00",
    lateThresholdMinutes: 15,
    earlyLeaveThresholdMinutes: 15,
    halfDayHours: 4,
    fullDayHours: 8,
    overtimeAfterHours: 9,
    weeklyOffDays: ["Saturday", "Sunday"],
    gracePeriodMinutes: 5,
    autoAbsentAfterMinutes: 240,
  });

  // --- Leave Settings (Static) ---
  const [leaveSettings, setLeaveSettings] = useState({
    annualLeaveQuota: 20,
    sickLeaveQuota: 10,
    casualLeaveQuota: 7,
    maternityLeaveDays: 90,
    paternityLeaveDays: 7,
    carryForwardLimit: 5,
    minDaysAdvanceNotice: 3,
    maxConsecutiveDays: 15,
    requireDocumentAfterDays: 3,
    autoApproveIfBelow: 0,
  });

  // --- Notification Settings (Static) ---
  const [notificationSettings, setNotificationSettings] = useState({
    emailOnApplicationSubmit: true,
    emailOnApproval: true,
    emailOnRejection: true,
    emailOnLeaveRequest: true,
    smsAlerts: false,
    dailyDigest: true,
    weeklyReport: true,
    notifyHrOnLateCheckIn: true,
    notifyManagerOnAbsent: true,
    reminderBeforeDeadline: true,
  });

  // --- Appearance/Theme Settings (Static) ---
  const [appearanceSettings, setAppearanceSettings] = useState({
    primaryColor: "#3B82F6",
    accentColor: "#8B5CF6",
    sidebarTheme: "dark",
    headerLayout: "fixed",
    tableRowsPerPage: 25,
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    language: "English",
    compactMode: false,
    showAvatars: true,
  });

  // --- General Settings (Static) ---
  const [generalSettings, setGeneralSettings] = useState({
    companyName: "Digious Solutions",
    timezone: "Asia/Karachi",
    currency: "PKR",
    fiscalYearStart: "January",
    employeeIdPrefix: "EMP",
    applicationIdPrefix: "APP",
    passwordExpiryDays: 90,
    sessionTimeoutMinutes: 30,
    maxLoginAttempts: 5,
    twoFactorAuth: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleEdit = (section) => {
    setEditMode((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSave = (section) => {
    // Static UI only - just toggle edit mode off and show alert
    setEditMode((prev) => ({ ...prev, [section]: false }));
    toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved! (Static UI - not connected to backend)`);
  };

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const themes = ["light", "dark", "auto"];
  const layouts = ["fixed", "fluid", "compact"];
  const dateFormats = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
  const timeFormats = ["12h", "24h"];
  const languages = ["English", "Urdu", "Arabic"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const SectionHeader = ({ icon: Icon, title, section, badge }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        <div className="text-left">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {badge && <span className="text-xs text-slate-500">{badge}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!editMode[section] && expandedSections[section] && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleEdit(section);
            }}
            className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
          >
            <Edit className="h-4 w-4" />
          </button>
        )}
        {expandedSections[section] ? (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronRight className="h-5 w-5 text-slate-400" />
        )}
      </div>
    </button>
  );

  const SettingRow = ({ label, children, description }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between py-3 border-b border-slate-100 last:border-b-0 gap-2">
      <div className="md:w-1/2">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className="md:w-1/2 flex justify-end">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">HR Settings</h1>
              <p className="text-sm text-slate-500">Manage attendance rules, leave policies, notifications, and more</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium border border-amber-200">
              <AlertCircle className="h-3.5 w-3.5" />
              Static UI Preview
            </span>
          </div>
        </div>
      </div>

      {/* Attendance Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <SectionHeader icon={Clock} title="Attendance & Time Rules" section="attendance" badge="Check-in, Check-out, Overtime" />
        {expandedSections.attendance && (
          <div className="px-6 pb-6 space-y-1">
            <SettingRow label="Check-in Time" description="Expected daily check-in time">
              {editMode.attendance ? (
                <input
                  type="time"
                  value={attendanceSettings.checkInTime}
                  onChange={(e) => setAttendanceSettings((p) => ({ ...p, checkInTime: e.target.value }))}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40"
                />
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{attendanceSettings.checkInTime}</span>
              )}
            </SettingRow>

            <SettingRow label="Check-out Time" description="Expected daily check-out time">
              {editMode.attendance ? (
                <input
                  type="time"
                  value={attendanceSettings.checkOutTime}
                  onChange={(e) => setAttendanceSettings((p) => ({ ...p, checkOutTime: e.target.value }))}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40"
                />
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{attendanceSettings.checkOutTime}</span>
              )}
            </SettingRow>

            <SettingRow label="Late Threshold (minutes)" description="Minutes after check-in time to mark as late">
              {editMode.attendance ? (
                <input
                  type="number"
                  min="0"
                  value={attendanceSettings.lateThresholdMinutes}
                  onChange={(e) => setAttendanceSettings((p) => ({ ...p, lateThresholdMinutes: parseInt(e.target.value) || 0 }))}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40"
                />
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{attendanceSettings.lateThresholdMinutes} min</span>
              )}
            </SettingRow>

            <SettingRow label="Early Leave Threshold (minutes)" description="Minutes before check-out time considered early leave">
              {editMode.attendance ? (
                <input
                  type="number"
                  min="0"
                  value={attendanceSettings.earlyLeaveThresholdMinutes}
                  onChange={(e) => setAttendanceSettings((p) => ({ ...p, earlyLeaveThresholdMinutes: parseInt(e.target.value) || 0 }))}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40"
                />
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{attendanceSettings.earlyLeaveThresholdMinutes} min</span>
              )}
            </SettingRow>

            <SettingRow label="Half Day Hours" description="Minimum hours for half day">
              {editMode.attendance ? (
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={attendanceSettings.halfDayHours}
                  onChange={(e) => setAttendanceSettings((p) => ({ ...p, halfDayHours: parseInt(e.target.value) || 4 }))}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40"
                />
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{attendanceSettings.halfDayHours} hrs</span>
              )}
            </SettingRow>

            <SettingRow label="Full Day Hours" description="Minimum hours for full day attendance">
              {editMode.attendance ? (
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={attendanceSettings.fullDayHours}
                  onChange={(e) => setAttendanceSettings((p) => ({ ...p, fullDayHours: parseInt(e.target.value) || 8 }))}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40"
                />
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{attendanceSettings.fullDayHours} hrs</span>
              )}
            </SettingRow>

            <SettingRow label="Overtime After (hours)" description="Hours after which overtime starts">
              {editMode.attendance ? (
                <input
                  type="number"
                  min="1"
                  value={attendanceSettings.overtimeAfterHours}
                  onChange={(e) => setAttendanceSettings((p) => ({ ...p, overtimeAfterHours: parseInt(e.target.value) || 9 }))}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40"
                />
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{attendanceSettings.overtimeAfterHours} hrs</span>
              )}
            </SettingRow>

            <SettingRow label="Grace Period (minutes)" description="Extra grace period after late threshold">
              {editMode.attendance ? (
                <input
                  type="number"
                  min="0"
                  value={attendanceSettings.gracePeriodMinutes}
                  onChange={(e) => setAttendanceSettings((p) => ({ ...p, gracePeriodMinutes: parseInt(e.target.value) || 0 }))}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40"
                />
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{attendanceSettings.gracePeriodMinutes} min</span>
              )}
            </SettingRow>

            <SettingRow label="Auto-Absent After (minutes)" description="Auto-mark absent if no check-in after this many minutes">
              {editMode.attendance ? (
                <input
                  type="number"
                  min="0"
                  value={attendanceSettings.autoAbsentAfterMinutes}
                  onChange={(e) => setAttendanceSettings((p) => ({ ...p, autoAbsentAfterMinutes: parseInt(e.target.value) || 0 }))}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40"
                />
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{attendanceSettings.autoAbsentAfterMinutes} min</span>
              )}
            </SettingRow>

            <SettingRow label="Weekly Off Days" description="Non-working days of the week">
              {editMode.attendance ? (
                <div className="flex flex-wrap gap-1.5">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day}
                      onClick={() => {
                        setAttendanceSettings((p) => ({
                          ...p,
                          weeklyOffDays: p.weeklyOffDays.includes(day) ? p.weeklyOffDays.filter((d) => d !== day) : [...p.weeklyOffDays, day],
                        }));
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        attendanceSettings.weeklyOffDays.includes(day) ? "bg-blue-100 text-blue-700 border-blue-300" : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {attendanceSettings.weeklyOffDays.map((day) => (
                    <span key={day} className="px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-200">
                      {day}
                    </span>
                  ))}
                </div>
              )}
            </SettingRow>

            {editMode.attendance && (
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => toggleEdit("attendance")} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 text-sm font-medium">
                  <X className="h-4 w-4 inline mr-1" /> Cancel
                </button>
                <button onClick={() => handleSave("attendance")} className="px-4 py-2 text-white bg-blue-600 rounded-xl hover:bg-blue-700 text-sm font-medium">
                  <Save className="h-4 w-4 inline mr-1" /> Save Changes
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Leave Policy Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <SectionHeader icon={Calendar} title="Leave Policies" section="leave" badge="Quotas, Rules, Carry Forward" />
        {expandedSections.leave && (
          <div className="px-6 pb-6 space-y-1">
            <SettingRow label="Annual Leave Quota" description="Yearly annual leave days">
              {editMode.leave ? (
                <input type="number" min="0" value={leaveSettings.annualLeaveQuota} onChange={(e) => setLeaveSettings((p) => ({ ...p, annualLeaveQuota: parseInt(e.target.value) || 0 }))} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40" />
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{leaveSettings.annualLeaveQuota} days</span>
              )}
            </SettingRow>

            <SettingRow label="Sick Leave Quota" description="Yearly sick leave days">
              {editMode.leave ? (
                <input type="number" min="0" value={leaveSettings.sickLeaveQuota} onChange={(e) => setLeaveSettings((p) => ({ ...p, sickLeaveQuota: parseInt(e.target.value) || 0 }))} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40" />
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{leaveSettings.sickLeaveQuota} days</span>
              )}
            </SettingRow>

            <SettingRow label="Casual Leave Quota" description="Yearly casual leave days">
              {editMode.leave ? (
                <input type="number" min="0" value={leaveSettings.casualLeaveQuota} onChange={(e) => setLeaveSettings((p) => ({ ...p, casualLeaveQuota: parseInt(e.target.value) || 0 }))} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40" />
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{leaveSettings.casualLeaveQuota} days</span>
              )}
            </SettingRow>

            <SettingRow label="Maternity Leave" description="Maternity leave days">
              {editMode.leave ? (
                <input type="number" min="0" value={leaveSettings.maternityLeaveDays} onChange={(e) => setLeaveSettings((p) => ({ ...p, maternityLeaveDays: parseInt(e.target.value) || 0 }))} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40" />
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{leaveSettings.maternityLeaveDays} days</span>
              )}
            </SettingRow>

            <SettingRow label="Paternity Leave" description="Paternity leave days">
              {editMode.leave ? (
                <input type="number" min="0" value={leaveSettings.paternityLeaveDays} onChange={(e) => setLeaveSettings((p) => ({ ...p, paternityLeaveDays: parseInt(e.target.value) || 0 }))} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40" />
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{leaveSettings.paternityLeaveDays} days</span>
              )}
            </SettingRow>

            <SettingRow label="Carry Forward Limit" description="Max days that can carry forward to next year">
              {editMode.leave ? (
                <input type="number" min="0" value={leaveSettings.carryForwardLimit} onChange={(e) => setLeaveSettings((p) => ({ ...p, carryForwardLimit: parseInt(e.target.value) || 0 }))} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40" />
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{leaveSettings.carryForwardLimit} days</span>
              )}
            </SettingRow>

            <SettingRow label="Min Days Advance Notice" description="Minimum days in advance for leave request">
              {editMode.leave ? (
                <input type="number" min="0" value={leaveSettings.minDaysAdvanceNotice} onChange={(e) => setLeaveSettings((p) => ({ ...p, minDaysAdvanceNotice: parseInt(e.target.value) || 0 }))} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40" />
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{leaveSettings.minDaysAdvanceNotice} days</span>
              )}
            </SettingRow>

            <SettingRow label="Max Consecutive Days" description="Maximum consecutive leave days allowed">
              {editMode.leave ? (
                <input type="number" min="1" value={leaveSettings.maxConsecutiveDays} onChange={(e) => setLeaveSettings((p) => ({ ...p, maxConsecutiveDays: parseInt(e.target.value) || 1 }))} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40" />
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{leaveSettings.maxConsecutiveDays} days</span>
              )}
            </SettingRow>

            <SettingRow label="Require Document After (days)" description="Days of leave after which medical certificate is required">
              {editMode.leave ? (
                <input type="number" min="0" value={leaveSettings.requireDocumentAfterDays} onChange={(e) => setLeaveSettings((p) => ({ ...p, requireDocumentAfterDays: parseInt(e.target.value) || 0 }))} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40" />
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{leaveSettings.requireDocumentAfterDays} days</span>
              )}
            </SettingRow>

            {editMode.leave && (
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => toggleEdit("leave")} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 text-sm font-medium">
                  <X className="h-4 w-4 inline mr-1" /> Cancel
                </button>
                <button onClick={() => handleSave("leave")} className="px-4 py-2 text-white bg-blue-600 rounded-xl hover:bg-blue-700 text-sm font-medium">
                  <Save className="h-4 w-4 inline mr-1" /> Save Changes
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <SectionHeader icon={Bell} title="Notifications & Alerts" section="notifications" badge="Email, SMS, Reminders" />
        {expandedSections.notifications && (
          <div className="px-6 pb-6 space-y-1">
            {Object.entries({
              emailOnApplicationSubmit: { label: "Email on Application Submit", desc: "Send email when new application is submitted" },
              emailOnApproval: { label: "Email on Approval", desc: "Send email when application is approved" },
              emailOnRejection: { label: "Email on Rejection", desc: "Send email when application is rejected" },
              emailOnLeaveRequest: { label: "Email on Leave Request", desc: "Send email when leave request is made" },
              smsAlerts: { label: "SMS Alerts", desc: "Enable SMS notifications for critical events" },
              dailyDigest: { label: "Daily Digest", desc: "Send daily summary email" },
              weeklyReport: { label: "Weekly Report", desc: "Send weekly attendance/leave report" },
              notifyHrOnLateCheckIn: { label: "Notify HR on Late Check-in", desc: "Alert HR when employee checks in late" },
              notifyManagerOnAbsent: { label: "Notify Manager on Absent", desc: "Alert manager when team member is absent" },
              reminderBeforeDeadline: { label: "Deadline Reminders", desc: "Send reminders before application deadlines" },
            }).map(([key, { label, desc }]) => (
              <SettingRow key={key} label={label} description={desc}>
                {editMode.notifications ? (
                  <button
                    onClick={() => setNotificationSettings((p) => ({ ...p, [key]: !p[key] }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationSettings[key] ? "bg-blue-600" : "bg-slate-300"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings[key] ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                ) : (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${notificationSettings[key] ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {notificationSettings[key] ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    {notificationSettings[key] ? "Enabled" : "Disabled"}
                  </span>
                )}
              </SettingRow>
            ))}

            {editMode.notifications && (
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => toggleEdit("notifications")} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 text-sm font-medium">
                  <X className="h-4 w-4 inline mr-1" /> Cancel
                </button>
                <button onClick={() => handleSave("notifications")} className="px-4 py-2 text-white bg-blue-600 rounded-xl hover:bg-blue-700 text-sm font-medium">
                  <Save className="h-4 w-4 inline mr-1" /> Save Changes
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Appearance / Theme Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <SectionHeader icon={Palette} title="Appearance & Theme" section="appearance" badge="Colors, Layout, Format" />
        {expandedSections.appearance && (
          <div className="px-6 pb-6 space-y-1">
            <SettingRow label="Primary Color" description="Main brand color">
              {editMode.appearance ? (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={appearanceSettings.primaryColor}
                    onChange={(e) => setAppearanceSettings((p) => ({ ...p, primaryColor: e.target.value }))}
                    className="w-10 h-8 rounded border cursor-pointer"
                  />
                  <span className="text-xs text-slate-500 font-mono">{appearanceSettings.primaryColor}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg border border-slate-200" style={{ backgroundColor: appearanceSettings.primaryColor }} />
                  <span className="text-sm font-mono text-slate-700">{appearanceSettings.primaryColor}</span>
                </div>
              )}
            </SettingRow>

            <SettingRow label="Accent Color" description="Secondary accent color">
              {editMode.appearance ? (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={appearanceSettings.accentColor}
                    onChange={(e) => setAppearanceSettings((p) => ({ ...p, accentColor: e.target.value }))}
                    className="w-10 h-8 rounded border cursor-pointer"
                  />
                  <span className="text-xs text-slate-500 font-mono">{appearanceSettings.accentColor}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg border border-slate-200" style={{ backgroundColor: appearanceSettings.accentColor }} />
                  <span className="text-sm font-mono text-slate-700">{appearanceSettings.accentColor}</span>
                </div>
              )}
            </SettingRow>

            <SettingRow label="Sidebar Theme" description="Dark, light or auto theme for sidebar">
              {editMode.appearance ? (
                <select value={appearanceSettings.sidebarTheme} onChange={(e) => setAppearanceSettings((p) => ({ ...p, sidebarTheme: e.target.value }))} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40">
                  {themes.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg capitalize">{appearanceSettings.sidebarTheme}</span>
              )}
            </SettingRow>

            <SettingRow label="Header Layout" description="Fixed, fluid, or compact header">
              {editMode.appearance ? (
                <select value={appearanceSettings.headerLayout} onChange={(e) => setAppearanceSettings((p) => ({ ...p, headerLayout: e.target.value }))} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40">
                  {layouts.map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                </select>
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg capitalize">{appearanceSettings.headerLayout}</span>
              )}
            </SettingRow>

            <SettingRow label="Table Rows Per Page" description="Default pagination size">
              {editMode.appearance ? (
                <select value={appearanceSettings.tableRowsPerPage} onChange={(e) => setAppearanceSettings((p) => ({ ...p, tableRowsPerPage: parseInt(e.target.value) }))} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40">
                  {[10, 15, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{appearanceSettings.tableRowsPerPage}</span>
              )}
            </SettingRow>

            <SettingRow label="Date Format" description="Display format for dates">
              {editMode.appearance ? (
                <select value={appearanceSettings.dateFormat} onChange={(e) => setAppearanceSettings((p) => ({ ...p, dateFormat: e.target.value }))} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40">
                  {dateFormats.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{appearanceSettings.dateFormat}</span>
              )}
            </SettingRow>

            <SettingRow label="Time Format" description="12-hour or 24-hour format">
              {editMode.appearance ? (
                <select value={appearanceSettings.timeFormat} onChange={(e) => setAppearanceSettings((p) => ({ ...p, timeFormat: e.target.value }))} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40">
                  {timeFormats.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{appearanceSettings.timeFormat}</span>
              )}
            </SettingRow>

            <SettingRow label="Language" description="Interface language">
              {editMode.appearance ? (
                <select value={appearanceSettings.language} onChange={(e) => setAppearanceSettings((p) => ({ ...p, language: e.target.value }))} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40">
                  {languages.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{appearanceSettings.language}</span>
              )}
            </SettingRow>

            <SettingRow label="Compact Mode" description="Reduce spacing and padding">
              {editMode.appearance ? (
                <button
                  onClick={() => setAppearanceSettings((p) => ({ ...p, compactMode: !p.compactMode }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${appearanceSettings.compactMode ? "bg-blue-600" : "bg-slate-300"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${appearanceSettings.compactMode ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              ) : (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${appearanceSettings.compactMode ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                  {appearanceSettings.compactMode ? "On" : "Off"}
                </span>
              )}
            </SettingRow>

            <SettingRow label="Show Avatars" description="Display user avatars in lists">
              {editMode.appearance ? (
                <button
                  onClick={() => setAppearanceSettings((p) => ({ ...p, showAvatars: !p.showAvatars }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${appearanceSettings.showAvatars ? "bg-blue-600" : "bg-slate-300"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${appearanceSettings.showAvatars ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              ) : (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${appearanceSettings.showAvatars ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                  {appearanceSettings.showAvatars ? "On" : "Off"}
                </span>
              )}
            </SettingRow>

            {editMode.appearance && (
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => toggleEdit("appearance")} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 text-sm font-medium">
                  <X className="h-4 w-4 inline mr-1" /> Cancel
                </button>
                <button onClick={() => handleSave("appearance")} className="px-4 py-2 text-white bg-blue-600 rounded-xl hover:bg-blue-700 text-sm font-medium">
                  <Save className="h-4 w-4 inline mr-1" /> Save Changes
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* General / System Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <SectionHeader icon={Shield} title="General & Security" section="general" badge="Company, Auth, System" />
        {expandedSections.general && (
          <div className="px-6 pb-6 space-y-1">
            <SettingRow label="Company Name" description="Organization name displayed in the system">
              {editMode.general ? (
                <input type="text" value={generalSettings.companyName} onChange={(e) => setGeneralSettings((p) => ({ ...p, companyName: e.target.value }))} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-52" />
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{generalSettings.companyName}</span>
              )}
            </SettingRow>

            <SettingRow label="Timezone" description="System timezone">
              {editMode.general ? (
                <select value={generalSettings.timezone} onChange={(e) => setGeneralSettings((p) => ({ ...p, timezone: e.target.value }))} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-52">
                  <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                </select>
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{generalSettings.timezone}</span>
              )}
            </SettingRow>

            <SettingRow label="Currency" description="Default currency for financial data">
              {editMode.general ? (
                <select value={generalSettings.currency} onChange={(e) => setGeneralSettings((p) => ({ ...p, currency: e.target.value }))} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-52">
                  <option value="PKR">PKR - Pakistani Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="AED">AED - UAE Dirham</option>
                </select>
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{generalSettings.currency}</span>
              )}
            </SettingRow>

            <SettingRow label="Fiscal Year Start" description="Month when fiscal year begins">
              {editMode.general ? (
                <select value={generalSettings.fiscalYearStart} onChange={(e) => setGeneralSettings((p) => ({ ...p, fiscalYearStart: e.target.value }))} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-52">
                  {months.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{generalSettings.fiscalYearStart}</span>
              )}
            </SettingRow>

            <SettingRow label="Employee ID Prefix" description="Prefix for employee IDs (e.g., EMP-001)">
              {editMode.general ? (
                <input type="text" value={generalSettings.employeeIdPrefix} onChange={(e) => setGeneralSettings((p) => ({ ...p, employeeIdPrefix: e.target.value }))} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-52" />
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{generalSettings.employeeIdPrefix}</span>
              )}
            </SettingRow>

            <SettingRow label="Application ID Prefix" description="Prefix for application numbers">
              {editMode.general ? (
                <input type="text" value={generalSettings.applicationIdPrefix} onChange={(e) => setGeneralSettings((p) => ({ ...p, applicationIdPrefix: e.target.value }))} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-52" />
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{generalSettings.applicationIdPrefix}</span>
              )}
            </SettingRow>

            <SettingRow label="Password Expiry (days)" description="Force password change after days">
              {editMode.general ? (
                <input type="number" min="0" value={generalSettings.passwordExpiryDays} onChange={(e) => setGeneralSettings((p) => ({ ...p, passwordExpiryDays: parseInt(e.target.value) || 0 }))} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-52" />
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{generalSettings.passwordExpiryDays} days</span>
              )}
            </SettingRow>

            <SettingRow label="Session Timeout (minutes)" description="Auto-logout after inactivity">
              {editMode.general ? (
                <input type="number" min="5" value={generalSettings.sessionTimeoutMinutes} onChange={(e) => setGeneralSettings((p) => ({ ...p, sessionTimeoutMinutes: parseInt(e.target.value) || 30 }))} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-52" />
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{generalSettings.sessionTimeoutMinutes} min</span>
              )}
            </SettingRow>

            <SettingRow label="Max Login Attempts" description="Lock account after failed attempts">
              {editMode.general ? (
                <input type="number" min="1" value={generalSettings.maxLoginAttempts} onChange={(e) => setGeneralSettings((p) => ({ ...p, maxLoginAttempts: parseInt(e.target.value) || 5 }))} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-52" />
              ) : (
                <span className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg">{generalSettings.maxLoginAttempts}</span>
              )}
            </SettingRow>

            <SettingRow label="Two-Factor Authentication" description="Require 2FA for all users">
              {editMode.general ? (
                <button
                  onClick={() => setGeneralSettings((p) => ({ ...p, twoFactorAuth: !p.twoFactorAuth }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${generalSettings.twoFactorAuth ? "bg-blue-600" : "bg-slate-300"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${generalSettings.twoFactorAuth ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              ) : (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${generalSettings.twoFactorAuth ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                  {generalSettings.twoFactorAuth ? "Enabled" : "Disabled"}
                </span>
              )}
            </SettingRow>

            {editMode.general && (
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => toggleEdit("general")} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 text-sm font-medium">
                  <X className="h-4 w-4 inline mr-1" /> Cancel
                </button>
                <button onClick={() => handleSave("general")} className="px-4 py-2 text-white bg-blue-600 rounded-xl hover:bg-blue-700 text-sm font-medium">
                  <Save className="h-4 w-4 inline mr-1" /> Save Changes
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="text-center py-4">
        <p className="text-xs text-slate-400">
          This is a static UI preview. Settings are not persisted to the backend.
        </p>
      </div>
    </div>
  );
}

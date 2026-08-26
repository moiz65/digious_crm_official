// App.js - COMPLETE FIXED VERSION

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Login & Signup
import LoginPage from "./components/LoginPage";
import SignUpPage from "./components/SignUpPage";
import ChangePasswordPage from "./components/ChangePasswordPage";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import VerifyOTPPage from "./components/VerifyOTPPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

// Admin Pages
import Dashboard from "./pages/SuperAdmin/Dashboard";
import Attendance from "./pages/SuperAdmin/Attendance";
import ActivityTracker from "./pages/SuperAdmin/ActivityTracker";
import Employees from "./pages/SuperAdmin/Employee";
import AdminSalesManagement from "./pages/SuperAdmin/AdminSalesManagement";
import PayrollManagement from "./pages/SuperAdmin/PayrollManagement";
import AdminExpense from "./pages/Admin/AdminExpense";
import AdminAdvances from "./pages/Admin/AdminAdvances";
import AdminMemos from "./pages/Admin/AdminMemos";
import Customer from "./pages/SuperAdmin/Customer";
import Invoice from "./pages/SuperAdmin/Invoice";
import RolesManagement from "./pages/Admin/RolesManagement";

// HR Pages
import HRDashboard from "./pages/HR/HRDashboard";
import HrAttendance from "./pages/HR/HrAttendance";
import HRMyAttendance from "./pages/HR/HRMyAttendance";
import EmployeeManagement from "./pages/HR/EmployeeManagement";
import EmployeeOnboarding from "./pages/HR/EmployeeOnboarding";
import UserRoles_and_Permissions from "./pages/HR/UserRoles_and_Permissions";
import RoleTemplates from "./pages/HR/RoleTemplates";
import Applications_and_Memos from "./pages/HR/Applications_and_Memos";
import HrMemos from "./pages/HR/HrMemos";
import HrReportsManagement from "./pages/HR/HrReportsManagement";
import HrSettings from "./pages/HR/HrSettings";
import AttendanceAdjustment from "./pages/HR/AttendanceAdjustment";

// Employee Pages
import ProductionDashboard from "./pages/Employees/ProductionDashboard";
import EmployeeAttendance from "./pages/Employees/EmployeeAtt";
import EmployeeDetails from "./pages/Employees/EmployeeDetails";
import ApplicationandMemoEmployees from "./pages/Employees/ApplicationandMemoEmployees";
import EmployeeMemos from "./pages/Employees/EmployeeMemos";
import EmployeesSettings from "./pages/Employees/EmployeeSettings";
import EmployeePayroll from "./pages/Employees/EmployeePayroll";
import Sales from "./pages/Employees/Sales";
import AttendanceCorrectionPage from "./components/AttendanceCorrectionPage";

import { PasscodeProvider } from "../src/context/PasscodeContext";
import { ChatProvider } from "../src/context/ChatContext";
import ChatDashboard from "./components/ChatDashboard";

// ✅ Wrapper component for ChatDashboard
const ChatDashboardWrapper = () => {
  const location = useLocation();
  const publicRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/verify-otp",
    "/change-password",
    "/unauthorized",
  ];

  // ✅ ONLY show ChatDashboard on non-public routes
  if (publicRoutes.includes(location.pathname)) {
    return null;
  }

  return (
    <ProtectedRoute>
      <ChatDashboard />
    </ProtectedRoute>
  );
};

function AppContent() {
  return (
    <ChatProvider>
      <div className="App">
        <Routes>
          {/* ✅ Public routes - FIRST */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-otp" element={<VerifyOTPPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sales"
            element={
              <ProtectedRoute requiredRole="admin">
                <PasscodeProvider>
                  <AdminSalesManagement />
                </PasscodeProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute requiredRole="admin">
                <PasscodeProvider>
                  <AdminExpense />
                </PasscodeProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payroll"
            element={
              <ProtectedRoute requiredRole="admin">
                <PasscodeProvider>
                  <PayrollManagement />
                </PasscodeProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/advances"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminAdvances />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/customers"
            element={
              <ProtectedRoute requiredRole="admin">
                <PasscodeProvider>
                  <Customer />
                </PasscodeProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/attendance"
            element={
              <ProtectedRoute requiredRole="admin">
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/employees"
            element={
              <ProtectedRoute requiredRole="admin">
                <Employees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/applications"
            element={
              <ProtectedRoute requiredRole="admin">
                <Applications_and_Memos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/activity"
            element={
              <ProtectedRoute requiredRole="admin">
                <ActivityTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/memos"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminMemos />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/invoice" element={<Invoice />} />

          {/* HR Routes */}
          <Route
            path="/hr/dashboard"
            element={
              <ProtectedRoute requiredRole="hr">
                <HRDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/employee-management"
            element={
              <ProtectedRoute requiredRole="hr">
                <EmployeeManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/onboarding"
            element={
              <ProtectedRoute requiredRole="hr">
                <EmployeeOnboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/attendance"
            element={
              <ProtectedRoute requiredRole="hr">
                <HrAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/my-attendance"
            element={
              <ProtectedRoute requiredRole="hr">
                <HRMyAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/attendance-adjustment"
            element={
              <ProtectedRoute requiredRole="hr">
                <AttendanceAdjustment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/applications"
            element={<Navigate to="/hr/applications-memos" replace />}
          />
          <Route
            path="/hr/applications-memos"
            element={
              <ProtectedRoute requiredRole="hr">
                <Applications_and_Memos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/memos"
            element={
              <ProtectedRoute requiredRole="hr">
                <HrMemos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/reports-management"
            element={
              <ProtectedRoute requiredRole="hr">
                <HrReportsManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/employees"
            element={
              <ProtectedRoute requiredRole="hr">
                <EmployeeManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/user-roles"
            element={
              <ProtectedRoute requiredRole="hr">
                <UserRoles_and_Permissions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/role-management"
            element={
              <ProtectedRoute requiredRole="hr">
                <RoleTemplates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/settings"
            element={
              <ProtectedRoute requiredRole="hr">
                <HrSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/attendance-corrections"
            element={
              <ProtectedRoute requiredRole="hr">
                <AttendanceCorrectionPage />
              </ProtectedRoute>
            }
          />

          {/* Employee Routes */}
          <Route
            path="/employee/dashboard"
            element={
              <ProtectedRoute requiredRole="employee">
                <ProductionDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/attendance"
            element={
              <ProtectedRoute requiredRole="employee">
                <EmployeeAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/sales"
            element={
              <ProtectedRoute requiredRole="employee">
                <PasscodeProvider>
                  <Sales />
                </PasscodeProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/profile"
            element={
              <ProtectedRoute requiredRole="employee">
                <PasscodeProvider>
                  <EmployeeDetails />
                </PasscodeProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/applications"
            element={
              <ProtectedRoute requiredRole="employee">
                <ApplicationandMemoEmployees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/memos"
            element={
              <ProtectedRoute requiredRole="employee">
                <EmployeeMemos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/payroll"
            element={
              <ProtectedRoute requiredRole="employee">
                <PasscodeProvider>
                  <EmployeePayroll />
                </PasscodeProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/settings"
            element={
              <ProtectedRoute requiredRole="employee">
                <EmployeesSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/attendance-corrections"
            element={
              <ProtectedRoute requiredRole="employee">
                <AttendanceCorrectionPage />
              </ProtectedRoute>
            }
          />

          {/* Legacy routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/hrattendance" element={<HrAttendance />} />
          <Route path="/activity-tracker" element={<ActivityTracker />} />
          <Route path="/testdashboard" element={<ActivityTracker />} />
          <Route path="/employeeattendance" element={<EmployeeAttendance />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/add-employees" element={<EmployeeOnboarding />} />
          <Route path="/employeedetails" element={<EmployeeDetails />} />
          <Route
            path="/application-memos"
            element={<Navigate to="/employee/applications" replace />}
          />
          <Route
            path="/applications-memos"
            element={<Navigate to="/employee/applications" replace />}
          />
          <Route
            path="/sales"
            element={
              <PasscodeProvider>
                <AdminSalesManagement />
              </PasscodeProvider>
            }
          />

          <Route
            path="/admin/roles"
            element={
              <ProtectedRoute requiredRole="admin">
                <RolesManagement />
              </ProtectedRoute>
            }
          />

          {/* Default redirect - LAST */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        {/* ✅ ChatDashboard ONLY on protected routes */}
        <ChatDashboardWrapper />
      </div>
    </ChatProvider>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#333",
              color: "#fff",
              borderRadius: "8px",
              fontSize: "14px",
            },
            success: {
              style: { background: "#16a34a" },
              iconTheme: { primary: "#fff", secondary: "#16a34a" },
            },
            error: {
              style: { background: "#dc2626" },
              iconTheme: { primary: "#fff", secondary: "#dc2626" },
            },
          }}
        />
      </AuthProvider>
    </Router>
  );
}

export default App;
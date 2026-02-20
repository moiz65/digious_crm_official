// App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Login & Signup
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import ChangePasswordPage from './components/ChangePasswordPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Admin Pages
import Dashboard from './pages/SuperAdmin/Dashboard';
import Attendance from './pages/SuperAdmin/Attendance';
import ActivityTracker from './pages/SuperAdmin/ActivityTracker';
import Employees from './pages/SuperAdmin/Employee';
import ApplicationandMemos from './pages/SuperAdmin/ApplicationandMemos';
import AdminApplicationsMemos from './pages/SuperAdmin/ApplicationsMemos';
import AdminSalesManagement from './pages/SuperAdmin/AdminSalesManagement';

// HR Pages
import HRDashboard from './pages/HR/HRDashboard';
import HrAttendance from './pages/HR/HrAttendance';
import HRMyAttendance from './pages/HR/HRMyAttendance';
import EmployeeManagement from './pages/HR/EmployeeManagement';
import EmployeeOnboarding from './pages/HR/EmployeeOnboarding';
import ApplicationsMemos from './pages/HR/ApplicationsMemos';
// import LeaveManagement from './pages/HR/Applications_and_Memos';
import UserRoles_and_Permissions from './pages/HR/UserRoles_and_Permissions';
import RoleTemplates from './pages/HR/RoleTemplates';
import Applications_and_Memos from './pages/HR/Applications_and_Memos';
import HrReportsManagement from './pages/HR/HrReportsManagement';
import HrSettings from './pages/HR/HrSettings';
import AttendanceAdjustment from './pages/HR/AttendanceAdjustment';

// Employee Pages
import EmployeeDashboard from './pages/Employee/EmployeeDashboard';
import EmployeeAttendance from './pages/Employees/EmployeeAtt';
import EmployeeDetails from './pages/Employees/EmployeeDetails';
import ApplicationandMemoEmployees from './pages/Employees/ApplicationandMemoEmployees';

function AppContent() {
  return (
    <div className="App">
      <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
            
            {/* Unauthorized page */}
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
                  <AdminSalesManagement />
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
                  <AdminApplicationsMemos />
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
              element={
                <ProtectedRoute requiredRole="hr">
                  <ApplicationsMemos />
                </ProtectedRoute>
              }
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
            
            {/* Employee Routes */}
            <Route
              path="/employee/dashboard"
              element={
                <ProtectedRoute requiredRole="employee">
                  <EmployeeDashboard />
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
              path="/employee/profile"
              element={
                <ProtectedRoute requiredRole="employee">
                  <EmployeeDetails />
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
            
            {/* Legacy routes (for backward compatibility) */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/hrattendance" element={<HrAttendance />} />
            <Route path="/activity-tracker" element={<ActivityTracker />} />
            <Route path="/testdashboard" element={<ActivityTracker />} /> 
            <Route path="/employeeattendance" element={<EmployeeAttendance />} /> 
            {/* superAdmin */}
            <Route path="/employees" element={<Employees />} /> 
            <Route path="/add-employees" element={<EmployeeOnboarding />} />
            {/* superAdmin */}
            <Route path="/employeedetails" element={<EmployeeDetails />} />
            <Route path="/application-memos" element={<ApplicationandMemos />} />
            <Route path="/applications-memos" element={<ApplicationandMemoEmployees />} />
            <Route path="/sales" element={<AdminSalesManagement />} />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" />} />
            
            {/* 404 page */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;

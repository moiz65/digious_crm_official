import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home } from 'lucide-react';

export const DashboardHeader = ({ title, subtitle }) => {
  const { user, role, logoutNoCheckout } = useAuth();
  const navigate = useNavigate();

  const roleInfo = {
    admin: { color: 'from-red-500 to-pink-600', label: 'Administrator' },
    hr: { color: 'from-blue-500 to-cyan-600', label: 'HR Manager' },
    employee: { color: 'from-green-500 to-emerald-600', label: 'Employee' }
  };

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to logout?')) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      await logoutNoCheckout(!!token);
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      // Ensure navigation to login
      window.location.href = '/login';
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-8 py-5 shadow-sm">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{title}</h1>
            {subtitle && <p className="text-gray-500 mt-2 text-base font-medium">{subtitle}</p>}
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-right pr-6 border-r border-gray-200">
              <p className="text-sm font-bold text-gray-900">{user?.name || user?.email || 'User'}</p>
              <p className={`text-xs font-semibold bg-gradient-to-r ${roleInfo[role]?.color} bg-clip-text text-transparent mt-1`}>
                {roleInfo[role]?.label}
              </p>
            </div>

            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
              {String(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>

            <button
              onClick={handleLogout}
              className="p-3 hover:bg-gray-100 rounded-lg transition duration-200 group"
              title="Logout"
            >
              <LogOut className="w-6 h-6 text-gray-600 group-hover:text-red-600 transition" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RoleBasedNav = ({ role }) => {
  const navigate = useNavigate();

  const navItems = {
    admin: [
      { id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
      { id: 'sales', label: 'Sales Management', path: '/admin/sales', icon: '💼' },
      { id: 'attendance', label: 'Attendance', path: '/admin/attendance', icon: '📋' },
      { id: 'employees', label: 'Employees', path: '/admin/employees', icon: '👥' },
      { id: 'applications', label: 'Applications', path: '/admin/applications', icon: '📄' },
      { id: 'activity', label: 'Activity Tracker', path: '/admin/activity', icon: '⚡' }
    ],
    hr: [
      { id: 'dashboard', label: 'Dashboard', path: '/hr/dashboard', icon: '📊' },
      { id: 'employees', label: 'Team', path: '/hr/employee-management', icon: '👥' },
      { id: 'leaves', label: 'Leave Management', path: '/hr/leave-management', icon: '📅' },
      { id: 'attendance', label: 'Attendance', path: '/hr/attendance', icon: '📋' },
      { id: 'applications', label: 'Applications & Memos', path: '/hr/applications', icon: '📄' },
      { id: 'reports', label: 'Reports & Analytics', path: '/hr/reports', icon: '📈' }
    ],
    employee: [
      { id: 'dashboard', label: 'My Dashboard', path: '/employee/dashboard', icon: '📊' },
      { id: 'attendance', label: 'Attendance', path: '/employee/attendance', icon: '📋' },
      { id: 'profile', label: 'My Profile', path: '/employee/profile', icon: '👤' },
      { id: 'applications', label: 'My Applications', path: '/employee/applications', icon: '📄' }
    ]
  };

  const items = navItems[role] || [];

  return (
    <nav className="bg-white border-b border-gray-200 px-8 py-0">
      <div className="max-w-7xl mx-auto">
        <div className="flex space-x-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="px-6 py-4 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors duration-200 border-b-3 border-transparent hover:border-blue-600 whitespace-nowrap"
            >
              <span className="mr-2 text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Calendar, 
  User,
  FileText,
  Bell,
  LogOut
} from 'lucide-react';

const EmployeeSidebar = ({ isCollapsed, setIsCollapsed, activeItem, setActiveItem }) => {
  const navigate = useNavigate();
  const { logoutNoCheckout, user } = useAuth();

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'My Dashboard', path: '/employee/dashboard' },
    { id: 'attendance', icon: Calendar, label: 'Attendance', path: '/employee/attendance' },
    { id: 'profile', icon: User, label: 'My Profile', path: '/employee/profile' },
    { id: 'applications', icon: FileText, label: 'Applications', path: '/employee/applications' }
  ];

  const handleNavigation = (item) => {
    setActiveItem(item.id);
    navigate(item.path);
  };

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to logout?')) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      await logoutNoCheckout(!!token);
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      navigate('/login', { replace: true });
      setTimeout(() => {
        if (window.location.pathname !== '/login') window.location.href = '/login';
      }, 250);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        bg-blue-50/80 backdrop-blur-md border-r border-blue-200/40
        transition-all duration-500 ease-in-out
        flex flex-col pr-2
        ${isCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-64'}
        shadow-xl shadow-blue-500/10
      `}>
        
        {/* User Profile */}
        <div className="p-4 border-b border-blue-200/40">
          {!isCollapsed ? (
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-lg shadow-green-500/30">
                {String(user?.name || user?.username || user?.email || 'Employee').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || user?.email || 'Employee'}</p>
                <p className="text-xs text-slate-500 truncate">Employee</p>
              </div>
              <button className="p-2 rounded-lg bg-white/70 backdrop-blur-sm border border-blue-200/40 hover:bg-white/90 transition-all duration-300 shadow-sm">
                <Bell className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-lg shadow-green-500/30">
                {String(user?.name || user?.username || user?.email || 'Employee').charAt(0).toUpperCase()}
              </div>
              <button className="p-2 rounded-lg bg-white/70 backdrop-blur-sm border border-blue-200/40 hover:bg-white/90 transition-all duration-300 shadow-sm">
                <Bell className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-6">
          <div className="space-y-2 px-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item)}
                  className={`
                    w-full flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 relative
                    backdrop-blur-sm border
                    ${isActive
                      ? 'bg-[#349dff] text-white shadow-lg shadow-blue-500/30 border-[#349dff] transform -translate-y-0.5'
                      : 'bg-white/60 text-slate-700 border-blue-200/40 hover:bg-white/80 hover:border-[#349dff]/30 hover:shadow-md'
                    }
                    ${isCollapsed ? 'justify-center' : 'justify-start'}
                  `}
                  title={item.label}
                >
                  <Icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && <span className="font-semibold">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-blue-200/40">
          <button 
            onClick={handleLogout}
            className={`
              w-full flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300
              backdrop-blur-sm border border-red-200/50
              bg-white/60 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-md
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            <LogOut className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default EmployeeSidebar;

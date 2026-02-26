import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Calendar, 
  User,
  FileText,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const EmployeeSidebar = ({ isCollapsed, setIsCollapsed, activeItem, setActiveItem }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef(null);
  const { logoutNoCheckout, user } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'My Dashboard', path: '/employee/dashboard' },
    { id: 'attendance', icon: Calendar, label: 'Attendance', path: '/employee/attendance' },
    { id: 'profile', icon: User, label: 'My Profile', path: '/employee/profile' },
    { id: 'applications', icon: FileText, label: 'Applications', path: '/employee/applications' },
    { id: 'settings', icon: FileText, label: 'Settings', path: '/employee/settings' }
  ];

  // Detect mobile screen
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        // On desktop, ensure sidebar is visible
        setIsCollapsed(false);
      } else {
        // On mobile, collapse by default
        setIsCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set active item based on current path
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Check menu items
    menuItems.forEach(item => {
      if (item.path && currentPath === item.path) {
        setActiveItem(item.id);
      }
    });
  }, [location.pathname]);

  // Click outside to close sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isCollapsed && isMobile && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsCollapsed(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCollapsed, isMobile]);

  const handleNavigation = (item) => {
    setActiveItem(item.id);
    navigate(item.path);
    
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setIsCollapsed(true);
    }
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

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isItemActive = (item) => {
    return activeItem === item.id || location.pathname === item.path;
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
      >
        {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
      </button>

      {/* Mobile Overlay */}
      {!isCollapsed && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`
          fixed lg:relative inset-y-0 left-0 z-40
          bg-gradient-to-b from-blue-50/95 to-cyan-50/90 backdrop-blur-xl border-r border-blue-200/40
          transition-all duration-300 ease-in-out
          flex flex-col
          h-screen
          shadow-2xl shadow-blue-500/10
          ${isCollapsed ? 
            isMobile ? '-translate-x-full' : 'w-20' 
            : isMobile ? 'w-72 translate-x-0' : 'w-64'
          }
        `}
      >
        {/* Desktop Toggle Button */}
        {!isMobile && (
          <div className="p-4 border-b border-blue-200/40 flex justify-end">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg bg-white/70 backdrop-blur-sm border border-blue-200/40 hover:bg-white/90 transition-all duration-300 shadow-sm hover:scale-105"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <ChevronLeft className={`h-4 w-4 text-slate-600 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
            </button>
          </div>
        )}

        {/* User Profile */}
        <div className={`p-4 border-b border-blue-200/40 ${isMobile ? 'pt-16' : ''}`}>
          {!isCollapsed || isMobile ? (
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-lg shadow-blue-500/30">
                {String(user?.name || user?.username || user?.email || 'Employee').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || user?.email || 'Employee'}</p>
                <p className="text-xs text-slate-500 truncate">Employee</p>
              </div>
              <button className="p-2 rounded-lg bg-white/70 backdrop-blur-sm border border-blue-200/40 hover:bg-white/90 transition-all duration-300 shadow-sm relative">
                <Bell className="h-4 w-4 text-slate-600" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-lg shadow-blue-500/30">
                {String(user?.name || user?.username || user?.email || 'Employee').charAt(0).toUpperCase()}
              </div>
              <button className="p-2 rounded-lg bg-white/70 backdrop-blur-sm border border-blue-200/40 hover:bg-white/90 transition-all duration-300 shadow-sm relative">
                <Bell className="h-4 w-4 text-slate-600" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              {/* Desktop Expand Button (only visible when collapsed) */}
              <button
                onClick={() => setIsCollapsed(false)}
                className="hidden lg:flex p-2 rounded-lg bg-white/80 backdrop-blur-sm border border-blue-200/40 hover:bg-white hover:shadow-md transition-all duration-300 mt-2"
                title="Expand sidebar"
              >
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-6">
          <div className="space-y-2 px-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item);
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item)}
                  className={`
                    w-full flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 relative
                    backdrop-blur-sm border
                    ${active
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30 border-transparent transform -translate-y-0.5'
                      : 'bg-white/60 text-slate-700 border-blue-200/40 hover:bg-white/80 hover:border-blue-300 hover:shadow-md'
                    }
                    ${(isCollapsed && !isMobile) ? 'justify-center' : 'justify-start'}
                  `}
                  title={item.label}
                >
                  <Icon className={`h-5 w-5 ${(isCollapsed && !isMobile) ? '' : 'mr-3'} ${active ? 'text-white' : 'text-blue-500'}`} />
                  {(!isCollapsed || isMobile) && (
                    <span className="font-semibold">{item.label}</span>
                  )}
                  {/* Active indicator for collapsed view */}
                  {isCollapsed && !isMobile && active && (
                    <span className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1.5 h-8 bg-blue-500 rounded-l shadow-lg"></span>
                  )}
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
              ${(isCollapsed && !isMobile) ? 'justify-center' : ''}
            `}
          >
            <LogOut className={`h-5 w-5 ${(isCollapsed && !isMobile) ? '' : 'mr-3'}`} />
            {(!isCollapsed || isMobile) && <span>Logout</span>}
          </button>
          
          {/* Version info for expanded view */}
          {(!isCollapsed || isMobile) && (
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-400 mt-1">© 2026 Digious CRM</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EmployeeSidebar;
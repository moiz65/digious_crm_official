import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText,
  Bell,
  LogOut,
  UserCheck,
  BarChart3,
  ChevronDown,
  ChevronRight,
  User,
  Shield,
  Database,
  Settings
} from 'lucide-react';

const HrSidebar = ({ isCollapsed, setIsCollapsed, activeItem, setActiveItem }) => {
  const navigate = useNavigate();
  const { logoutNoCheckout, user } = useAuth();
  const [expandedItems, setExpandedItems] = useState({});

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/hr/dashboard' },
    { id: 'employees', icon: Users, label: 'Employee Management', path: '/hr/employee-management' },
    { id: 'leaves', icon: Calendar, label: 'Leave Management', path: '/hr/leave-management' },
    { 
      id: 'attendance', 
      icon: UserCheck, 
      label: 'Attendance', 
      hasSubmenu: true,
      submenu: [
        { id: 'manage-attendance', label: 'Manage Attendance', path: '/hr/attendance', icon: Settings },
        { id: 'my-attendance', label: 'My Attendance', path: '/hr/my-attendance', icon: User }
      ]
    },
    { id: 'applications', icon: FileText, label: 'Applications & Memos', path: '/hr/applications' },
    { id: 'reports', icon: BarChart3, label: 'Reports & Analytics', path: '/hr/reports' },
    { 
      id: 'settings', 
      icon: Settings, 
      label: 'Settings', 
      hasSubmenu: true,
      submenu: [
        { id: 'user-roles', label: 'User Roles & Permissions', icon: Shield, path: '/hr/user-roles' },
        { id: 'system-config', label: 'System Configuration', icon: Database, path: '/hr/system-config' },
      ]
    },
  ];

  const toggleSubmenu = (itemId) => {
    if (isCollapsed) {
      // If sidebar is collapsed, expand it first
      setIsCollapsed(false);
      // Wait for sidebar to expand before showing submenu
      setTimeout(() => {
        setExpandedItems(prev => ({
          ...prev,
          [itemId]: !prev[itemId]
        }));
      }, 300);
      return;
    }
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleNavigation = (item, isSubmenuItem = false) => {
    if (item.hasSubmenu && !isSubmenuItem) {
      toggleSubmenu(item.id);
      return;
    }
    
    setActiveItem(item.id);
    navigate(item.path);
    
    // Close mobile sidebar on navigation
    if (window.innerWidth < 1024) {
      setIsCollapsed(true);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to logout?')) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (logoutNoCheckout) {
        await logoutNoCheckout(!!token);
      }
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      
      // Navigate to login
      navigate('/login', { replace: true });
    }
  };

  // Check if item or any of its subitems is active
  const isItemActive = (item) => {
    if (item.id === activeItem) return true;
    if (item.submenu) {
      return item.submenu.some(sub => sub.id === activeItem);
    }
    return false;
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
        transition-all duration-300 ease-in-out
        flex flex-col
        ${isCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-64'}
        shadow-xl shadow-blue-500/10
        h-screen
      `}>
        
        {/* User Profile */}
        <div className="p-4 border-b border-blue-200/40">
          {!isCollapsed ? (
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-lg shadow-blue-500/30">
                {String(user?.name || user?.username || user?.email || 'HR').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || user?.email || 'HR Manager'}</p>
                <p className="text-xs text-slate-500 truncate">HR Manager</p>
              </div>
              <button className="p-2 rounded-lg bg-white/70 backdrop-blur-sm border border-blue-200/40 hover:bg-white/90 transition-all duration-300 shadow-sm">
                <Bell className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-lg shadow-blue-500/30">
                {String(user?.name || user?.username || user?.email || 'HR').charAt(0).toUpperCase()}
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
              const isActive = isItemActive(item);
              const isExpanded = expandedItems[item.id];
              
              return (
                <div key={item.id}>
                  {/* Main Menu Item */}
                  <button
                    onClick={() => handleNavigation(item)}
                    className={`
                      w-full flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300
                      backdrop-blur-sm border
                      ${isActive
                        ? 'bg-[#349dff] text-white shadow-lg shadow-blue-500/30 border-[#349dff]'
                        : 'bg-white/60 text-slate-700 border-blue-200/40 hover:bg-white/80 hover:border-[#349dff]/30 hover:shadow-md'
                      }
                      ${isCollapsed ? 'justify-center' : 'justify-between'}
                    `}
                    title={item.label}
                  >
                    <div className="flex items-center">
                      <Icon className="h-5 w-5" />
                      {!isCollapsed && (
                        <span className="font-semibold ml-3 text-left">{item.label}</span>
                      )}
                    </div>
                    {!isCollapsed && item.hasSubmenu && (
                      isExpanded ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  {/* Submenu Items */}
                  {item.hasSubmenu && !isCollapsed && isExpanded && (
                    <div className="ml-8 mt-2 space-y-1 border-l-2 border-blue-200/30 pl-2">
                      {item.submenu.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = activeItem === subItem.id;
                        
                        return (
                          <button
                            key={subItem.id}
                            onClick={() => handleNavigation(subItem, true)}
                            className={`
                              w-full flex items-left rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300
                              backdrop-blur-sm border
                              ${isSubActive
                                ? 'bg-[#349dff]/90 text-white shadow-md border-[#349dff]'
                                : 'bg-white/40 text-slate-600 border-blue-200/30 hover:bg-white/60 hover:border-[#349dff]/20'
                              }
                            `}
                          >
                            <SubIcon className="h-4 w-4 mr-2" />
                            <span className="text-left font-medium">{subItem.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
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
              ${isCollapsed ? 'justify-center' : 'justify-center lg:justify-start'}
            `}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default HrSidebar;
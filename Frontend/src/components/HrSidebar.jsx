import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Settings,
  Menu,
  X,
  Shield,
  UserRoundCog,
  Database
} from 'lucide-react';

const HrSidebar = ({ isCollapsed, setIsCollapsed, activeItem, setActiveItem }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logoutNoCheckout, user } = useAuth();
  const [expandedItems, setExpandedItems] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

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
    
    // Check main menu items
    menuItems.forEach(item => {
      if (item.path && currentPath === item.path) {
        setActiveItem(item.id);
      }
      
      // Check submenu items
      if (item.submenu) {
        item.submenu.forEach(subItem => {
          if (currentPath === subItem.path) {
            setActiveItem(subItem.id);
            // Expand parent menu if submenu is active
            if (!expandedItems[item.id]) {
              setExpandedItems(prev => ({ ...prev, [item.id]: true }));
            }
          }
        });
      }
    });
  }, [location.pathname]);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/hr/dashboard' },
    { id: 'employees', icon: Users, label: 'Employee Management', path: '/hr/employee-management' },
    { id: 'applicationmemos', icon: Calendar, label: 'Applications & Memos', path: '/hr/applications-memos' },
    { 
      id: 'attendance', 
      icon: UserCheck, 
      label: 'Attendance', 
      hasSubmenu: true,
      submenu: [
        { id: 'manage-attendance', label: 'Manage Attendance', path: '/hr/attendance', icon: Settings },
        { id: 'my-attendance', label: 'My Attendance', path: '/hr/my-attendance', icon: User },
        { id: 'attendance-adjustment', label: 'Adjustment', path: '/hr/attendance-adjustment', icon: BarChart3 },
        { id: 'attendance-corrections', label: 'Corrections', path: '/hr/attendance-corrections', icon: FileText }
      ]
    },
    // { id: 'applications', icon: FileText, label: 'Applications & Memos', path: '/hr/applications' },
    { id: 'reports', icon: BarChart3, label: 'Reports', path: '/hr/reports-management' },
    { 
      id: 'settings', 
      icon: Settings, 
      label: 'Settings', 
      hasSubmenu: true,
      submenu: [
        { id: 'user-roles', label: 'User Roles', icon: Shield, path: '/hr/user-roles' },
        // { id: 'system-config', label: 'System Configuration', icon: Database, path: '/hr/system-config' },
        { id: 'role-management', label: 'Role Management', icon: UserRoundCog, path: '/hr/role-management' },
        { id: 'hr-settings', label: 'HR Settings', icon: Settings, path: '/hr/settings' },
      ]
    },
  ];

  const toggleSubmenu = (itemId) => {
    if (isCollapsed && !isMobile) return; // Don't expand submenus when sidebar is collapsed on desktop
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleNavigation = (item, isSubmenuItem = false) => {
    if (item.hasSubmenu && !isSubmenuItem) {
      toggleSubmenu(item.id);
      if (isMobile) {
        // Don't navigate on mobile when clicking parent menu
        return;
      }
    }
    
    setActiveItem(item.id);
    navigate(item.path);
    
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setIsCollapsed(true);
    }
  };

  const isItemActive = (item) => {
    if (item.id === activeItem) return true;
    
    // Check if any submenu item is active
    if (item.submenu) {
      return item.submenu.some(subItem => subItem.id === activeItem);
    }
    
    return false;
  };

  const isSubItemActive = (subItem) => {
    return subItem.id === activeItem;
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

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all duration-300"
      >
        {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
      </button>

      {/* Mobile Overlay */}
      {!isCollapsed && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-40
        bg-blue-50/90 backdrop-blur-md border-r border-blue-200/40
        transition-all duration-300 ease-in-out
        flex flex-col
        h-screen
        shadow-xl shadow-blue-500/10
        ${isCollapsed ? 
          isMobile ? '-translate-x-full' : 'w-20' 
          : isMobile ? 'w-64 translate-x-0' : 'w-64'
        }
      `}>
        
        {/* Desktop Toggle Button */}
        {!isMobile && (
          <div className="p-4 border-b border-blue-200/40 flex justify-end">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg bg-white/70 backdrop-blur-sm border border-blue-200/40 hover:bg-white/90 transition-all duration-300 shadow-sm hover:scale-105"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <ChevronRight className={`h-4 w-4 text-slate-600 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
            </button>
          </div>
        )}

        {/* User Profile */}
        <div className={`p-4 border-b border-blue-200/40 ${isMobile ? 'pt-16' : ''}`}>
          {!isCollapsed || isMobile ? (
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-lg shadow-blue-500/30">
                {String(user?.name || user?.username || user?.email || 'HR').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || user?.email || 'HR Manager'}</p>
                <p className="text-xs text-slate-500 truncate">HR Manager</p>
              </div>
              <button className="p-2 rounded-lg bg-white/70 backdrop-blur-sm border border-blue-200/40 hover:bg-white/90 transition-all duration-300 shadow-sm relative">
                <Bell className="h-4 w-4 text-slate-600" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-lg shadow-blue-500/30">
                {String(user?.name || user?.username || user?.email || 'HR').charAt(0).toUpperCase()}
              </div>
              <button className="p-2 rounded-lg bg-white/70 backdrop-blur-sm border border-blue-200/40 hover:bg-white/90 transition-all duration-300 shadow-sm relative">
                <Bell className="h-4 w-4 text-slate-600" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
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
              const isExpanded = expandedItems[item.id];
              
              return (
                <div key={item.id}>
                  {/* Main Menu Item */}
                  <button
                    onClick={() => handleNavigation(item)}
                    className={`
                      w-full flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300
                      backdrop-blur-sm border
                      ${active
                        ? 'bg-[#349dff] text-white shadow-lg shadow-blue-500/30 border-[#349dff]'
                        : 'bg-white/60 text-slate-700 border-blue-200/40 hover:bg-white/80 hover:border-[#349dff]/30 hover:shadow-md'
                      }
                      ${(isCollapsed && !isMobile) ? 'justify-center px-3' : 'justify-start'}
                    `}
                    title={item.label}
                  >
                    <Icon className={`h-5 w-5 ${(isCollapsed && !isMobile) ? '' : 'mr-3'}`} />
                    {(!isCollapsed || isMobile) && (
                      <>
                        <span className="font-semibold flex-1 text-left">{item.label}</span>
                        {item.hasSubmenu && (
                          isExpanded ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                        )}
                      </>
                    )}
                  </button>

                  {/* Submenu Items */}
                  {item.hasSubmenu && (!isCollapsed || isMobile) && isExpanded && (
                    <div className="ml-4 mt-2 space-y-1">
                      {item.submenu.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const subActive = isSubItemActive(subItem);
                        
                        return (
                          <button
                            key={subItem.id}
                            onClick={() => handleNavigation(subItem, true)}
                            className={`
                              w-full flex items-left rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300
                              backdrop-blur-sm border
                              ${subActive
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
              ${(isCollapsed && !isMobile) ? 'justify-center px-3' : ''}
            `}
          >
            <LogOut className={`h-5 w-5 ${(isCollapsed && !isMobile) ? '' : 'mr-3'}`} />
            {(!isCollapsed || isMobile) && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default HrSidebar;
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { confirmDialog } from '../utils/confirm';
import { 
  FileText,
  ClipboardList,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  SheetIcon,
  BarChart3,
  Briefcase,
  DollarSign,
  TrendingUp,
  Users,
  RefreshCw,
  MessageSquare,
  CreditCard,
  Wallet,
  Banknote,
  Phone,
  Shield,
  Database,
  X,
  Menu,
  ChevronLeft,
  Receipt 
} from 'lucide-react';

const Sidebar = ({ isCollapsed, setIsCollapsed, activeItem, setActiveItem }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const { logoutNoCheckout } = useAuth();
  
  // By default koi bhi dropdown open nahi hoga
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [closingItems, setClosingItems] = useState(new Set());

  const menuItems = [
    // Dashboard
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
    
    // Operations
    { 
      id: 'operations', 
      label: 'Operations', 
      icon: Briefcase,
      children: [
        { id: 'attendance', label: 'Attendance', icon: SheetIcon, path: '/attendance' },
        { id: 'activity-tracker', label: 'Activity Tracker', icon: RefreshCw, path: '/activity-tracker' },
        { id: 'employees', label: 'Employees', icon: Users, path: '/employees' },
        { id: 'applications-memos', label: 'Applications', icon: FileText, path: '/application-memos' },
        { id: 'employee-feedback', label: 'Employee Feedback', icon: MessageSquare, path: '/employee-feedback' },
      ]
    },
    
    // Finance
    { 
      id: 'finance', 
      label: 'Finance', 
      icon: DollarSign,
      children: [
        { id: 'payroll', label: 'Payroll', icon: CreditCard, path: '/admin/payroll' },
        { id: 'expenses', label: 'Expenses', icon: Wallet, path: '/expenses' },
        { id: 'advances', label: 'Advances & Loans', icon: Banknote, path: '/admin/advances' },
      ]
    },
    
    // Business Development
    { 
      id: 'business-development', 
      label: 'Business & Insights', 
      icon: TrendingUp,
      children: [
        { id: 'sales', label: 'Sales', icon: TrendingUp, path: '/admin/sales' },
        { id: 'customers', label: 'Customers', icon: Users, path: '/admin/customers' },
        { id: 'leads', label: 'Leads', icon: Phone, path: '/admin/leads' },
      ]
    },
    
    // Projects
    { id: 'projects', label: 'Projects', icon: ClipboardList, path: '/projects' },
    
    // Invoice
    { 
      id: 'invoice', 
      label: 'Invoice', 
      icon: Receipt,
      path: '/admin/invoice'
    },
    
    // System Settings
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings,
      children: [
        { id: 'user-roles', label: 'Roles & Permissions', icon: Shield, path: '/admin/roles' },
        { id: 'system-config', label: 'System Configuration', icon: Database, path: '/system-config' },
      ]
    },
  ];

  // Helper functions
  const isChildActive = (childItem) => {
    return location.pathname === childItem.path || activeItem === childItem.id;
  };

  const isItemActive = (item) => {
    if (item.path) {
      return location.pathname === item.path || activeItem === item.id;
    }
    
    if (item.children) {
      return item.children.some(child => isChildActive(child));
    }
    
    return activeItem === item.id;
  };

  // Click outside to close sidebar on mobile only
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only collapse on mobile viewport
      if (window.innerWidth >= 1024) return;
      // Ignore clicks on interactive elements (selects, inputs, buttons) to prevent forced close
      const tag = event.target.tagName?.toLowerCase();
      if (['select', 'option', 'input', 'button', 'textarea'].includes(tag)) return;
      if (event.target.closest('select, input, button, textarea, [role="listbox"], [role="menu"]')) return;
      if (!isCollapsed && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsCollapsed(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCollapsed]);

  // Close all dropdowns when sidebar collapses
  useEffect(() => {
    if (isCollapsed) {
      setExpandedItems(new Set());
      setClosingItems(new Set());
    }
  }, [isCollapsed]);

  // Auto-expand current active item
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Find which parent item contains the current path
    const activeParent = menuItems.find(item => 
      item.children && item.children.some(child => currentPath.startsWith(child.path))
    );
    
    if (activeParent) {
      // Smooth open for active parent
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        newSet.add(activeParent.id);
        return newSet;
      });
    }
  }, [location.pathname]);

  const toggleExpanded = (itemId) => {
    if (expandedItems.has(itemId)) {
      // Close with animation
      setClosingItems(prev => {
        const newSet = new Set(prev);
        newSet.add(itemId);
        return newSet;
      });
      
      setTimeout(() => {
        setExpandedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
        setClosingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 300);
    } else {
      // Open immediately
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        newSet.add(itemId);
        return newSet;
      });
      setClosingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleItemClick = (item) => {
    if (item.path) {
      setActiveItem(item.id);
      navigate(item.path);
      // Close sidebar on mobile after navigation
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    } else if (item.children) {
      toggleExpanded(item.id);
    }
  };

  const handleChildClick = (childItem, parentId) => {
    setActiveItem(childItem.id);
    navigate(childItem.path);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      setIsCollapsed(true);
    }
  };

  const handleLogout = async () => {
    if (!await confirmDialog('Are you sure you want to logout?', { confirmText: 'Logout', type: 'warning' })) return;

    try {
      await logoutNoCheckout(true);
    } catch (err) {
      console.warn('Logout encountered error', err);
    } finally {
      navigate('/login', { replace: true });
      setTimeout(() => {
        if (window.location.pathname !== '/login') window.location.href = '/login';
      }, 300);
    }
  };

  const renderMenuItem = (item, level = 0) => {
    const Icon = item.icon;
    const isActive = isItemActive(item);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isClosing = closingItems.has(item.id);

    return (
      <div key={item.id} className="space-y-1">
        <button
          onClick={() => handleItemClick(item)}
          className={`
            w-full flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300
            backdrop-blur-sm border relative group
            ${isActive
              ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 border-transparent'
              : 'bg-white/70 text-slate-700 border-blue-200/40 hover:bg-white hover:border-blue-300 hover:shadow-lg'
            }
            ${isCollapsed ? 'justify-center' : 'justify-between'}
            ${level > 0 ? 'ml-4' : ''}
          `}
          title={isCollapsed ? item.label : ""}
        >
          <div className="flex items-center">
            <Icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'} ${
              isActive ? 'text-white' : 'text-blue-500 group-hover:text-blue-600'
            }`} />
            {!isCollapsed && (
              <span className={`font-semibold ${isActive ? 'text-white' : 'text-slate-800 group-hover:text-blue-800'}`}>
                {item.label}
              </span>
            )}
          </div>
          
          {!isCollapsed && hasChildren && (
            <ChevronRight 
              className={`h-4 w-4 transition-transform duration-300 ${
                isExpanded ? 'rotate-90' : ''
              } ${isActive ? 'text-white/80' : 'text-slate-500'}`} 
            />
          )}

          {/* Active indicator for collapsed view */}
          {isCollapsed && isActive && (
            <span className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1.5 h-8 bg-blue-500 rounded-l shadow-lg"></span>
          )}
        </button>

        {/* Render children if expanded and not collapsed */}
        {!isCollapsed && hasChildren && (
          <div 
            className={`
              overflow-hidden transition-all duration-300 ease-in-out
              ${isExpanded 
                ? 'max-h-96 opacity-100 translate-y-0' 
                : isClosing
                ? 'max-h-0 opacity-0 -translate-y-4'
                : 'max-h-0 opacity-0'
              }
            `}
          >
            <div className="pl-4 pr-2 py-2 space-y-1">
              {item.children.map((child) => {
                const ChildIcon = child.icon;
                const isChildActiveValue = isChildActive(child);
                
                return (
                  <button
                    key={child.id}
                    onClick={() => handleChildClick(child, item.id)}
                    className={`
                      w-full flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200
                      ${isChildActiveValue
                        ? 'bg-blue-100/80 text-blue-700 border border-blue-300/50'
                        : 'text-slate-600 hover:bg-blue-100/50 hover:text-slate-800'
                      }
                    `}
                  >
                    <div className="flex items-center w-full">
                      <ChildIcon className="h-4 w-4 mr-3 opacity-70" />
                      <span>{child.label}</span>
                      {isChildActiveValue && (
                        <ChevronRight className="h-3 w-3 ml-auto" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg shadow-lg"
      >
        {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
      </button>

      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-gradient-to-b from-blue-50/95 to-cyan-50/90 backdrop-blur-xl border-r border-blue-200/40
          transition-all duration-300 ease-in-out
          flex flex-col
          ${isCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-72 lg:w-64'}
          shadow-2xl shadow-blue-500/10
          overflow-y-auto
        `}
      >
        {/* User Profile */}
        <div className="p-4 border-b border-blue-200/40">
          {!isCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#349dff] to-[#1e87e6] rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-lg shadow-blue-500/30">
                  SA
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">Super Admin</p>
                  <p className="text-xs text-gray-600 truncate">Administrator</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Desktop Toggle Button */}
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="hidden lg:flex p-2 rounded-lg bg-white/80 backdrop-blur-sm border border-blue-200/40 hover:bg-white hover:shadow-md transition-all duration-300"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4 text-slate-600" />
                </button>
                
                {/* Mobile Close Button */}
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="lg:hidden p-2 rounded-lg bg-white/70 backdrop-blur-sm border border-blue-200/40 hover:bg-white/90 transition-all duration-300 shadow-sm"
                >
                  <X className="h-4 w-4 text-slate-600" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div 
                className="w-12 h-12 bg-gradient-to-br from-[#349dff] to-[#1e87e6] rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-lg shadow-blue-500/30 cursor-pointer"
                onClick={() => setIsCollapsed(false)}
                title="Expand sidebar"
              >
                SA
              </div>
              
              <div className="flex flex-col items-center space-y-2">
                <button className="relative p-2.5 rounded-xl bg-white/80 backdrop-blur-sm border border-blue-200/40 hover:bg-white transition-all duration-300 shadow-md hover:shadow-lg group">
                  <Bell className="h-5 w-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
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
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 lg:px-4">
          <div className="space-y-2">
            {menuItems.map((item) => renderMenuItem(item))}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-blue-200/40">
          <button 
            onClick={handleLogout}
            className={`
              w-full flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 group
              backdrop-blur-sm border
              bg-white/80 text-red-600 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 hover:text-white hover:border-red-500
              hover:shadow-lg
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            <div className="flex items-center">
              <LogOut className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'} group-hover:animate-pulse`} />
              {!isCollapsed && <span>Logout</span>}
            </div>
          </button>
          
          {/* Version info for expanded view */}
          {!isCollapsed && (
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-400 mt-1">© 2026 Digious CRM</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
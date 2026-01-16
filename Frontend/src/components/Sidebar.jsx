import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  Phone,
  Shield,
  Database
} from 'lucide-react';

const Sidebar = ({ isCollapsed, setIsCollapsed, activeItem, setActiveItem }) => {
  const location = useLocation();
  const navigate = useNavigate();

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
        { id: 'applications-memos', label: 'Applications & Memos', icon: FileText, path: '/application-memos' },
        { id: 'employee-feedback', label: 'Employee Feedback', icon: MessageSquare, path: '/employee-feedback' },
      ]
    },
    
    // Finance
    { 
      id: 'finance', 
      label: 'Finance', 
      icon: DollarSign,
      children: [
        { id: 'payroll', label: 'Payroll', icon: CreditCard, path: '/payroll' },
        { id: 'expenses', label: 'Expenses', icon: Wallet, path: '/expenses' },
      ]
    },
    
    // Business Development
    { 
      id: 'business-development', 
      label: 'Business Development', 
      icon: TrendingUp,
      children: [
        { id: 'sales', label: 'Sales', icon: TrendingUp, path: '/sales' },
        { id: 'customers', label: 'Customers', icon: Users, path: '/customers' },
        { id: 'leads', label: 'Leads', icon: Phone, path: '/leads' },
      ]
    },
    
    // Projects
    { id: 'projects', label: 'Projects', icon: ClipboardList, path: '/projects' },
    
    // System Settings
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings,
      children: [
        { id: 'user-roles', label: 'User Roles & Permissions', icon: Shield, path: '/user-roles' },
        { id: 'system-config', label: 'System Configuration', icon: Database, path: '/system-config' },
      ]
    },
  ];

  // State for expanded/collapsed menu items
  const [expandedItems, setExpandedItems] = React.useState(new Set(['operations']));

  const toggleExpanded = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Helper function to check if item is active based on current route
  const isItemActive = (item) => {
    if (item.path) {
      return location.pathname === item.path;
    }
    
    // Check if any child item is active for parent items
    if (item.children) {
      return item.children.some(child => isItemActive(child));
    }
    
    return activeItem === item.id;
  };

  // Helper function to check if child item is active
  const isChildActive = (childItem) => {
    return location.pathname === childItem.path;
  };

  // Logout function - use logoutNoCheckout to ensure session cleared and backend notified
  const { logoutNoCheckout } = useAuth();

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to logout?')) return;

    try {
      console.log('🔴 Sidebar: logout clicked');
      // Centralized logout call will clear server session (if requested) and all local keys
      await logoutNoCheckout(true);
      console.log('🔴 Sidebar: logout completed locally');
    } catch (err) {
      console.warn('🔴 Sidebar: logout encountered error', err);
    } finally {
      console.log('🔴 Sidebar: navigating to /login');
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
    
    const NavigationElement = item.path ? Link : 'button';
    const navigationProps = item.path ? { to: item.path } : {};

    return (
      <div key={item.id} className="space-y-1">
        <NavigationElement
          {...navigationProps}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault();
              toggleExpanded(item.id);
            } else {
              setActiveItem(item.id);
            }
          }}
          className={`
            w-full flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 relative
            backdrop-blur-sm border
            ${isActive
              ? 'bg-[#349dff] text-white shadow-lg shadow-blue-500/30 border-[#349dff] transform -translate-y-0.5'
              : 'bg-white/60 text-gray-700 border-blue-200/40 hover:bg-white/80 hover:border-[#349dff]/30 hover:shadow-md'
            }
            ${isCollapsed ? 'justify-center' : 'justify-between'}
            ${level > 0 ? 'ml-4' : ''}
          `}
        >
          <div className="flex items-center">
            <Icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && <span className="font-semibold text-left">{item.label}</span>}
          </div>
          
          {!isCollapsed && hasChildren && (
            <ChevronRight 
              className={`h-4 w-4 transition-transform duration-300 ${
                isExpanded ? 'rotate-90' : ''
              } ${isActive ? 'text-white' : 'text-gray-500'}`} 
            />
          )}
        </NavigationElement>

        {/* Render children if expanded and not collapsed */}
        {!isCollapsed && hasChildren && isExpanded && (
          <div className="space-y-1 mt-1">
            {item.children.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // For collapsed sidebar, show simple icons without children
  const renderCollapsedMenuItem = (item) => {
    const Icon = item.icon;
    const isActive = isItemActive(item);
    
    const NavigationElement = item.path ? Link : 'button';
    const navigationProps = item.path ? { to: item.path } : {};

    return (
      <NavigationElement
        key={item.id}
        {...navigationProps}
        onClick={() => {
          if (!item.path && item.children) {
            // If it's a parent item without direct path, navigate to first child
            const firstChild = item.children[0];
            if (firstChild && firstChild.path) {
              navigate(firstChild.path);
            }
          } else {
            setActiveItem(item.id);
          }
        }}
        className={`
          w-full flex items-center justify-center rounded-xl p-3 text-sm font-medium transition-all duration-300 relative
          backdrop-blur-sm border
          ${isActive
            ? 'bg-[#349dff] text-white shadow-lg shadow-blue-500/30 border-[#349dff] transform -translate-y-0.5'
            : 'bg-white/60 text-gray-700 border-blue-200/40 hover:bg-white/80 hover:border-[#349dff]/30 hover:shadow-md'
          }
        `}
        title={item.label}
      >
        <Icon className="h-5 w-5" />
        
        {/* Show dot indicator if any child is active */}
        {item.children && item.children.some(child => isChildActive(child)) && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#349dff] rounded-full"></span>
        )}
      </NavigationElement>
    );
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
        
        {/* Header */}
        

        {/* User Profile */}
        <div className="p-4 border-b border-blue-200/40">
          {!isCollapsed ? (
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#349dff] to-[#1e87e6] rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-lg shadow-blue-500/30">
                SA
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">Super Admin</p>
                {/* <p className="text-xs text-gray-600 truncate">System Administrator</p> */}
              </div>
              <button className="p-2 rounded-lg bg-white/70 backdrop-blur-sm border border-blue-200/40 hover:bg-white/90 transition-all duration-300 shadow-sm">
                <Bell className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#349dff] to-[#1e87e6] rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-lg shadow-blue-500/30">
                SA
              </div>
              <button className="p-2 rounded-lg bg-white/70 backdrop-blur-sm border border-blue-200/40 hover:bg-white/90 transition-all duration-300 shadow-sm">
                <Bell className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-6">
          <div className="space-y-2 px-4">
            {isCollapsed ? (
              // Collapsed view - only icons
              menuItems.map(item => renderCollapsedMenuItem(item))
            ) : (
              // Expanded view - full menu with children
              menuItems.map(item => renderMenuItem(item))
            )}
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

export default Sidebar;
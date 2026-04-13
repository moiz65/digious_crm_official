import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Briefcase, Users, FileText, Activity, Calendar, User, ChartBar, ClipboardList, LogOut as LogOutIcon } from 'lucide-react';

// Placeholder image URL
const PLACEHOLDER_IMAGE = 'https://res.cloudinary.com/dmxf2mega/image/upload/q_auto/f_auto/v1775678503/Portrait_Placeholder_wg1pzs.png';

export const DashboardHeader = ({ title, subtitle }) => {
  const { user, role, logoutNoCheckout } = useAuth();
  const [profileImage, setProfileImage] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const roleInfo = {
    admin: { color: 'from-red-500 to-pink-600', label: 'Administrator', badgeColor: 'bg-red-100 text-red-700' },
    hr: { color: 'from-blue-500 to-cyan-600', label: 'HR Manager', badgeColor: 'bg-blue-100 text-blue-700' },
    employee: { color: 'from-green-500 to-emerald-600', label: 'Employee', badgeColor: 'bg-green-100 text-green-700' }
  };

  // Fetch employee data including profile photo
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!user?.employeeId && !user?.id) {
        setLoading(false);
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const employeeId = user?.employeeId || user?.id;
        
        // Fetch employee details from your employees API
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://100.126.74.55:5000'}/api/v1/employees/${employeeId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Employee data fetched:', data);
          
          if (data.success && data.data) {
            setEmployeeData(data.data);
            // Set profile photo from the response (if exists)
            if (data.data.profile_photo) {
              setProfileImage(data.data.profile_photo);
            } else {
              // No profile photo, use placeholder
              setProfileImage(PLACEHOLDER_IMAGE);
            }
          }
        } else {
          console.error('Failed to fetch employee data:', response.status);
          // Use placeholder if API fails
          setProfileImage(PLACEHOLDER_IMAGE);
        }
      } catch (error) {
        console.error('Error fetching employee data:', error);
        // Use placeholder on error
        setProfileImage(PLACEHOLDER_IMAGE);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployeeData();
  }, [user]);

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to logout?')) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      await logoutNoCheckout(!!token);
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      window.location.href = '/login';
    }
  };

  // Get user initials for ultimate fallback
  const getUserInitials = () => {
    const name = user?.name || employeeData?.name || user?.email || 'User';
    if (name.includes(' ')) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return name.charAt(0).toUpperCase();
  };

  // Get user name
  const getUserName = () => {
    return user?.name || employeeData?.name || user?.email || 'User';
  };

  // Get user email
  const getUserEmail = () => {
    return user?.email || employeeData?.email || '';
  };

  // Handle image load error
  const handleImageError = () => {
    console.error('Image failed to load:', profileImage);
    if (!imageError) {
      setImageError(true);
      // If the current image is not the placeholder, try placeholder
      if (profileImage !== PLACEHOLDER_IMAGE) {
        setProfileImage(PLACEHOLDER_IMAGE);
      } else {
        // If even placeholder fails, we'll show initials
        setProfileImage(null);
      }
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
      <div className="max-w-8xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Profile Image as Logo/Brand */}
            <div className="relative">
              {!loading && profileImage && !imageError ? (
                <img
                  src={profileImage}
                  alt={getUserName()}
                  className="w-14 h-14 rounded-xl object-cover shadow-lg ring-2 ring-blue-500/20"
                  onError={handleImageError}
                />
              ) : (
                /* Fallback: Show initials if no image, loading failed, or placeholder failed */
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg ring-2 ring-blue-500/20">
                  {loading ? '...' : getUserInitials()}
                </div>
              )}
              
              {/* Status indicator */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full ring-2 ring-white"></div>
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h1>
              {subtitle && <p className="text-gray-500 mt-1 text-sm font-medium">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* User Info Card */}
            <div className="flex items-center space-x-4 bg-gray-50 rounded-2xl px-5 py-2">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{getUserName()}</p>
                <p className="text-xs text-gray-500 mt-0.5">{getUserEmail()}</p>
                <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full mt-1 ${roleInfo[role]?.badgeColor}`}>
                  {roleInfo[role]?.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ProfileImage Component for reuse anywhere in the app
export const ProfileImage = ({ 
  employeeId, 
  name, 
  size = 'md', 
  className = '', 
  showStatus = false,
  usePlaceholder = true 
}) => {
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-24 h-24 text-3xl'
  };

  const getUserInitials = () => {
    if (!name) return '?';
    if (name.includes(' ')) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return name.charAt(0).toUpperCase();
  };

  useEffect(() => {
    const fetchEmployeePhoto = async () => {
      if (!employeeId) {
        if (usePlaceholder) {
          setProfileImage(PLACEHOLDER_IMAGE);
        }
        setLoading(false);
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://100.126.74.55:5000'}/api/v1/employees/${employeeId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            if (data.data.profile_photo) {
              setProfileImage(data.data.profile_photo);
            } else if (usePlaceholder) {
              setProfileImage(PLACEHOLDER_IMAGE);
            }
          } else if (usePlaceholder) {
            setProfileImage(PLACEHOLDER_IMAGE);
          }
        } else if (usePlaceholder) {
          setProfileImage(PLACEHOLDER_IMAGE);
        }
      } catch (error) {
        console.error('Error fetching employee photo:', error);
        if (usePlaceholder) {
          setProfileImage(PLACEHOLDER_IMAGE);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployeePhoto();
  }, [employeeId, usePlaceholder]);

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      if (usePlaceholder && profileImage !== PLACEHOLDER_IMAGE) {
        setProfileImage(PLACEHOLDER_IMAGE);
      } else {
        setProfileImage(null);
      }
    }
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      {!loading && profileImage && !imageError ? (
        <img
          src={profileImage}
          alt={name || 'Profile'}
          className="w-full h-full rounded-full object-cover ring-2 ring-blue-500/20 shadow-lg"
          onError={handleImageError}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
          {loading ? '...' : getUserInitials()}
        </div>
      )}
      
      {showStatus && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white"></div>
      )}
    </div>
  );
};

// Simplified Logo component with placeholder support
export const LogoWithProfile = ({ title, subtitle }) => {
  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState(null);
  const [employeeName, setEmployeeName] = useState('');
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      const employeeId = user?.employeeId || user?.id;
      if (!employeeId) {
        setProfileImage(PLACEHOLDER_IMAGE);
        setLoading(false);
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://100.126.74.55:5000'}/api/v1/employees/${employeeId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            if (data.data.profile_photo) {
              setProfileImage(data.data.profile_photo);
            } else {
              setProfileImage(PLACEHOLDER_IMAGE);
            }
            setEmployeeName(data.data.name || '');
          } else {
            setProfileImage(PLACEHOLDER_IMAGE);
          }
        } else {
          setProfileImage(PLACEHOLDER_IMAGE);
        }
      } catch (error) {
        console.error('Error:', error);
        setProfileImage(PLACEHOLDER_IMAGE);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployeeData();
  }, [user]);

  const getInitials = () => {
    const name = employeeName || user?.name || 'User';
    if (name.includes(' ')) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return name.charAt(0).toUpperCase();
  };

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      setProfileImage(PLACEHOLDER_IMAGE);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        {!loading && profileImage && !imageError ? (
          <img
            src={profileImage}
            alt={employeeName || 'Profile'}
            className="w-14 h-14 rounded-xl object-cover shadow-lg ring-2 ring-blue-500/20"
            onError={handleImageError}
          />
        ) : (
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg ring-2 ring-blue-500/20">
            {loading ? '...' : getInitials()}
          </div>
        )}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full ring-2 ring-white"></div>
      </div>
      
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-gray-500 mt-1 text-sm font-medium">{subtitle}</p>}
      </div>
    </div>
  );
};

// Rest of your components (RoleBasedNav, MobileNav) remain the same...
export const RoleBasedNav = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = {
    admin: [
      { id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, color: 'blue' },
      { id: 'sales', label: 'Sales Management', path: '/admin/sales', icon: Briefcase, color: 'green' },
      { id: 'attendance', label: 'Attendance', path: '/admin/attendance', icon: Calendar, color: 'orange' },
      { id: 'employees', label: 'Employees', path: '/admin/employees', icon: Users, color: 'purple' },
      { id: 'applications', label: 'Applications', path: '/admin/applications', icon: FileText, color: 'pink' },
      { id: 'activity', label: 'Activity Tracker', path: '/admin/activity', icon: Activity, color: 'teal' }
    ],
    hr: [
      { id: 'dashboard', label: 'Dashboard', path: '/hr/dashboard', icon: LayoutDashboard, color: 'blue' },
      { id: 'my_attendance', label: 'My Attendance', path: '/hr/my-attendance', icon: Calendar, color: 'orange' },
      { id: 'employees', label: 'Team', path: '/hr/employee-management', icon: Users, color: 'purple' },
      { id: 'leaves', label: 'Leave Management', path: '/hr/attendance-corrections', icon: Calendar, color: 'green' },
      { id: 'attendance', label: 'Attendance', path: '/hr/attendance', icon: ClipboardList, color: 'orange' },
      { id: 'applications', label: 'Applications', path: '/hr/applications', icon: FileText, color: 'pink' },
      { id: 'reports', label: 'Reports', path: '/hr/reports', icon: ChartBar, color: 'teal' }
    ],
    employee: [
      { id: 'dashboard', label: 'My Dashboard', path: '/employee/dashboard', icon: LayoutDashboard, color: 'blue' },
      { id: 'attendance', label: 'My Attendance', path: '/employee/attendance', icon: Calendar, color: 'orange' },
      { id: 'profile', label: 'My Profile', path: '/employee/profile', icon: User, color: 'green' },
      { id: 'applications', label: 'My Applications', path: '/employee/applications', icon: FileText, color: 'pink' }
    ]
  };

  const items = navItems[role] || [];

  const getIconColor = (color) => {
    const colors = {
      blue: 'text-blue-500',
      green: 'text-green-500',
      orange: 'text-orange-500',
      purple: 'text-purple-500',
      pink: 'text-pink-500',
      teal: 'text-teal-500'
    };
    return colors[color] || 'text-gray-500';
  };

  const getActiveColor = (color) => {
    const colors = {
      blue: 'from-blue-500 to-cyan-600',
      green: 'from-green-500 to-emerald-600',
      orange: 'from-orange-500 to-red-600',
      purple: 'from-purple-500 to-indigo-600',
      pink: 'from-pink-500 to-rose-600',
      teal: 'from-teal-500 to-cyan-600'
    };
    return colors[color] || 'from-blue-500 to-cyan-600';
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-md sticky top-0 z-40">
      <div className="px-6">
        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const activeColor = getActiveColor(item.color);
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`
                  group relative px-5 py-4 transition-all duration-300
                  ${isActive 
                    ? 'text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {isActive && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${activeColor} rounded-t-xl shadow-lg`} />
                )}
                
                <div className="relative z-10 flex items-center space-x-3">
                  <Icon className={`
                    w-5 h-5 transition-all duration-300
                    ${isActive 
                      ? 'text-white' 
                      : `text-gray-400 group-hover:${getIconColor(item.color)}`
                    }
                  `} />
                  <span className={`
                    text-sm font-semibold tracking-wide whitespace-nowrap
                    ${isActive ? 'text-white' : 'text-gray-700 group-hover:text-gray-900'}
                  `}>
                    {item.label}
                  </span>
                </div>
                
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full mx-4" />
                )}
                
                {!isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 group-hover:w-12 h-1 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full transition-all duration-300" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </nav>
  );
};

// Mobile Navigation Component
export const MobileNav = ({ role, isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = {
    admin: [
      { id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { id: 'sales', label: 'Sales', path: '/admin/sales', icon: Briefcase },
      { id: 'attendance', label: 'Attendance', path: '/admin/attendance', icon: Calendar },
      { id: 'employees', label: 'Employees', path: '/admin/employees', icon: Users },
      { id: 'applications', label: 'Applications', path: '/admin/applications', icon: FileText },
    ],
    hr: [
      { id: 'dashboard', label: 'Dashboard', path: '/hr/dashboard', icon: LayoutDashboard },
      { id: 'my_attendance', label: 'My Attendance', path: '/hr/my-attendance', icon: Calendar, color: 'orange' },
      { id: 'employees', label: 'Team', path: '/hr/employee-management', icon: Users },
      { id: 'leaves', label: 'Leaves', path: '/hr/attendance-corrections', icon: Calendar },
      { id: 'attendance', label: 'Attendance', path: '/hr/attendance', icon: ClipboardList },
      { id: 'applications', label: 'Applications', path: '/hr/applications', icon: FileText },
    ],
    employee: [
      { id: 'dashboard', label: 'Dashboard', path: '/employee/dashboard', icon: LayoutDashboard },
      { id: 'attendance', label: 'Attendance', path: '/employee/attendance', icon: Calendar },
      { id: 'profile', label: 'Profile', path: '/employee/profile', icon: User },
      { id: 'applications', label: 'Applications', path: '/employee/applications', icon: FileText },
    ]
  };

  const items = navItems[role] || [];

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
        onClick={onClose}
      />
      
      <div className="fixed left-0 top-0 bottom-0 w-72 bg-white shadow-2xl z-50 lg:hidden transform transition-transform duration-300">
        <div className="flex flex-col h-full">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-cyan-600">
            <h2 className="text-xl font-bold text-white">Menu</h2>
            <p className="text-blue-100 text-sm mt-1">Navigate through the portal</p>
          </div>
          
          <div className="flex-1 py-4">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-6 py-3 transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              © 2024 HR Management System
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
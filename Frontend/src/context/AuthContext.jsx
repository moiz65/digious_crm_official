// context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('userRole');
    const storedToken = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    console.log('🔐 AuthContext: Checking stored auth...', { storedUser: !!storedUser, storedRole, storedToken: !!storedToken });
    
    if (storedUser && storedRole && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setRole(storedRole);
        setToken(storedToken);
        console.log('✅ AuthContext: User restored from localStorage');
      } catch (error) {
        console.error('❌ AuthContext: Error parsing stored user:', error);
        localStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData, userRole, authToken = null) => {
    const completeUserData = {
      ...userData,
      loginTime: new Date().toISOString()
    };
    
    const normalizedRole = userRole?.toLowerCase() || 'employee';
    
    console.log('🔐 AuthContext: Logging in user...', { email: userData.email, role: normalizedRole });
    
    setUser(completeUserData);
    setRole(normalizedRole);
    if (authToken) {
      setToken(authToken);
    }
    
    // Store in localStorage with both key names for compatibility
    localStorage.setItem('user', JSON.stringify(completeUserData));
    localStorage.setItem('userRole', normalizedRole);
    if (authToken) {
      localStorage.setItem('token', authToken);
      localStorage.setItem('authToken', authToken);
      console.log('✅ AuthContext: Token stored in localStorage');
    }
  };

  const logout = () => {
    // Use centralized no-checkout logout behavior for consistent cleanup
    logoutNoCheckout(false);
  };

  // Logout without forcing a check-out on the server. Optionally call server endpoint
  const logoutNoCheckout = async (callServer = true) => {
    console.log('🔐 logoutNoCheckout: starting logout (no-checkout)', { callServer });
    try {
      const storedToken = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (callServer && storedToken) {
        try {
          const resp = await fetch(`/api/${process.env.REACT_APP_API_VERSION || 'v1'}/auth/logout-no-checkout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${storedToken}`
            },
            body: JSON.stringify({ token: storedToken })
          });
          if (resp.ok) console.log('🔐 logoutNoCheckout: server logout recorded');
          else console.warn('⚠️ logoutNoCheckout: server responded with', resp.status);
        } catch (err) {
          console.warn('⚠️ logoutNoCheckout: server call failed', err);
        }
      }
    } finally {
      // Clear local session regardless of server response
      console.log('🔐 logoutNoCheckout: clearing local session');
      setUser(null);
      setRole(null);
      setToken(null);
      // Remove all known session-related keys to avoid residual state across app
      const keysToRemove = [
        'user', 'userRole', 'token', 'authToken', 'userId', 'attendanceData', 'checkedIn', 'checkInTime', 'userSession',
        'attendanceSummary', 'todayBreaksFromDB', 'attendanceFilter', 'persist:root'
      ];

      keysToRemove.forEach(k => {
        try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
      });

      // As a safety, also remove any tokens left behind
      try { localStorage.removeItem('authToken'); } catch (e) {}
      try { localStorage.removeItem('token'); } catch (e) {}

      console.log('🔐 logoutNoCheckout: local session cleared');

      // Notify other tabs/components about logout
      try {
        window.dispatchEvent(new Event('auth:loggedOut'));
      } catch (e) { /* ignore */ }
    }
  };

  // Ensure context resets auth state when localStorage is cleared from another tab
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token && (user || token)) {
        setUser(null);
        setRole(null);
        setToken(null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  const value = {
    user,
    role,
    token,
    isLoading,
    login,
    logout,
    logoutNoCheckout,
    isAuthenticated: !!user && !!role && !!token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

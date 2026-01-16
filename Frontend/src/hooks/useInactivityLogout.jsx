import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPakistanNow } from '../utils/timezone';

/**
 * Hook to handle auto-logout after user inactivity
 * Tracks: mouse movement, keyboard input, scroll events
 * Logs out user after 15 minutes (900000 ms) of no activity
 */
export function useInactivityLogout(timeoutMinutes = 15) {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const lastActivityRef = useRef(getPakistanNow());
  const isLoggedInRef = useRef(!!localStorage.getItem('token'));

  // Reset inactivity timer
  const resetTimer = useCallback(() => {
    if (!isLoggedInRef.current) return;

    lastActivityRef.current = getPakistanNow();

    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

    const timeoutMs = timeoutMinutes * 60 * 1000; // Convert minutes to milliseconds
    const warningTimeMs = (timeoutMinutes - 1) * 60 * 1000; // Show warning 1 minute before logout

    // Warning timer - show notification 1 minute before logout
    warningTimeoutRef.current = setTimeout(() => {
      const warningMessage = `You will be logged out in 1 minute due to inactivity. Please move your mouse or type to stay logged in.`;
      console.warn('⚠️ Inactivity Warning:', warningMessage);
      
      // You can dispatch an action here to show a toast/notification
      window.dispatchEvent(new CustomEvent('inactivityWarning', { 
        detail: { message: warningMessage } 
      }));
    }, warningTimeMs);

    // Logout timer
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, timeoutMs);
  }, [timeoutMinutes]);

  // Handle logout
  const { logoutNoCheckout } = useAuth();

  const handleLogout = useCallback(() => {
    (async () => {
      console.log('🚪 Auto-logout triggered due to inactivity');

      try {
        // Use centralized logout to mark session inactive without forcing checkout
        await logoutNoCheckout(true);
        console.log('🚪 Auto-logout: logoutNoCheckout completed');
      } catch (err) {
        console.warn('🚪 Auto-logout: logoutNoCheckout failed', err);
      }

      // Ensure local state flag is cleared
      isLoggedInRef.current = false;

      // Clear timers
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

      // Redirect to login
      navigate('/login', { 
        state: { message: 'Your session has expired due to inactivity. Please login again.' } 
      });
    })();
  }, [navigate, logoutNoCheckout]);

  // Activity event handlers
  const handleActivity = useCallback(() => {
    if (isLoggedInRef.current) {
      resetTimer();
    }
  }, [resetTimer]);

  // Setup event listeners
  useEffect(() => {
    if (!isLoggedInRef.current) return;

    // Track various user activities
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial timer setup
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, [handleActivity, resetTimer]);

  // Update isLoggedIn status when token changes
  useEffect(() => {
    const checkLoginStatus = () => {
      isLoggedInRef.current = !!localStorage.getItem('token');
    };

    window.addEventListener('storage', checkLoginStatus);
    return () => window.removeEventListener('storage', checkLoginStatus);
  }, []);

  return {
    resetTimer,
    handleLogout,
    getTimeUntilLogout: () => {
      if (!isLoggedInRef.current) return null;
      const elapsed = getPakistanNow() - lastActivityRef.current;
      const remaining = Math.max(0, timeoutMinutes * 60 * 1000 - elapsed);
      return Math.ceil(remaining / 1000); // Return seconds
    }
  };
}

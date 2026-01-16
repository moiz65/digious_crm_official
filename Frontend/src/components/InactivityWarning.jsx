import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, LogOut } from 'lucide-react';

/**
 * Component to display inactivity warning before logout
 * Shows countdown timer and options to stay logged in or logout
 */
export function InactivityWarning() {
  const [isVisible, setIsVisible] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  useEffect(() => {
    // Listen for inactivity warning event
    const handleInactivityWarning = (event) => {
      setIsVisible(true);
      setSecondsRemaining(60);
    };

    window.addEventListener('inactivityWarning', handleInactivityWarning);

    // Countdown timer
    let countdownInterval;
    if (isVisible) {
      countdownInterval = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            setIsVisible(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      window.removeEventListener('inactivityWarning', handleInactivityWarning);
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [isVisible]);

  const handleStayLoggedIn = () => {
    setIsVisible(false);
    // Dispatch activity event to reset the inactivity timer
    document.dispatchEvent(new MouseEvent('mousemove'));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    window.location.href = '/login';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-amber-100 rounded-lg">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Session Expiring Soon</h2>
        </div>

        {/* Message */}
        <p className="text-slate-600 mb-6">
          You have been inactive for a while. Your session will expire in:
        </p>

        {/* Timer */}
        <div className="bg-gradient-to-r from-amber-50 to-red-50 rounded-xl p-6 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-red-500" />
            <span className="text-sm font-semibold text-slate-700">Time Remaining</span>
          </div>
          <span className="text-2xl font-bold text-red-600 tabular-nums">
            {secondsRemaining}s
          </span>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleStayLoggedIn}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <span>Stay Logged In</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout Now</span>
          </button>
        </div>

        {/* Footer message */}
        <p className="text-xs text-slate-500 text-center mt-4">
          Move your mouse, type, or click anywhere to reset the timer
        </p>
      </div>
    </div>
  );
}

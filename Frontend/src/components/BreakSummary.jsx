// components/BreakSummary.jsx

import { useState, useEffect } from 'react';
import { endpoints } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { 
  Coffee, Clock, Cigarette, Utensils, Sparkle, Wifi, 
  AlertCircle, Loader, Zap, TrendingUp
} from 'lucide-react';

// Break Type Icons and Colors Mapping
const BREAK_TYPE_STYLES = {
  smoke: {
    label: 'Smoke Break',
    icon: Cigarette,
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800'
  },
  dinner: {
    label: 'Dinner Break',
    icon: Utensils,
    color: 'bg-red-50 border-red-200 text-red-700',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800'
  },
  washroom: {
    label: 'Washroom Break',
    icon: Wifi,
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800'
  },
  prayer: {
    label: 'Prayer Break',
    icon: Sparkle,
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800'
  }
};

const BreakSummary = ({ employeeId, date, autoRefresh = true, refreshInterval = 30000 }) => {
  const [breakData, setBreakData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Use provided date or default to today
  const displayDate = date || getTodayDate();

  // Auth & local visibility state (HR users can hide the widget)
  const { role } = useAuth();
  const isHR = role && String(role).toLowerCase().includes('hr');
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(`hideBreakSummary_${employeeId}_${displayDate}`) === 'true';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    if (employeeId && !hidden) {
      fetchBreakSummary();
    }
  }, [employeeId, displayDate, hidden]);

  // Auto-hide/Show handlers (persisted to localStorage)
  const handleHide = () => {
    try {
      localStorage.setItem(`hideBreakSummary_${employeeId}_${displayDate}`, 'true');
    } catch (e) {}
    setHidden(true);
  };

  const handleShow = () => {
    try {
      localStorage.removeItem(`hideBreakSummary_${employeeId}_${displayDate}`);
    } catch (e) {}
    setHidden(false);
  };

  // Auto-refresh interval for real-time updates
  useEffect(() => {
    if (!autoRefresh || !employeeId || hidden) return;

    const interval = setInterval(() => {
      fetchBreakSummary();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, employeeId, displayDate, hidden]);

  const fetchBreakSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${endpoints.attendance.breakSummary}?employee_id=${employeeId}&date=${displayDate}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch break summary');
      }

      const result = await response.json();
      if (result.success) {
        setBreakData(result.data);
        setLastUpdated(new Date());
      } else {
        setError(result.message || 'Failed to load break summary');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching break summary');
      console.error('Break Summary Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // If user (HR) hid the summary, show a compact placeholder with a Show button
  if (hidden) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
        <p className="text-sm text-gray-600">Break summary is hidden.</p>
        <div className="mt-3">
          <button onClick={handleShow} className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm">Show Break Summary</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center" style={{ minHeight: '300px' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-gray-600 text-sm">Loading break summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!breakData) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">No attendance record found for the selected date</p>
        </div>
      </div>
    );
  }

  const { breakStats } = breakData;
  const { totalBreaks, totalDurationMinutes, totalDurationFormatted, averageDurationMinutes, breakdownByType } = breakStats;

  // Determine status color based on attendance
  const statusColor = {
    'Present': 'bg-green-100 text-green-800 border-green-200',
    'Late': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Absent': 'bg-red-100 text-red-800 border-red-200',
    'On Leave': 'bg-blue-100 text-blue-800 border-blue-200'
  }[breakData.attendanceStatus] || 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <div className="space-y-6">
      
    </div>
  );
};

export default BreakSummary;

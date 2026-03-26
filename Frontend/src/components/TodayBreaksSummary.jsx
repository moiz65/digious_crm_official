// components/TodayBreaksSummary.jsx

import { useState, useEffect } from 'react';
import { endpoints } from '../config/api';
import { Coffee, Cigarette, Utensils, Sparkle, Wifi, Loader, RefreshCw } from 'lucide-react';

// Break Type Colors
const BREAK_TYPE_STYLES = {
  smoke: { label: 'Smoke', icon: Cigarette, color: 'text-orange-600', bg: 'bg-orange-50' },
  dinner: { label: 'Dinner', icon: Utensils, color: 'text-red-600', bg: 'bg-red-50' },
  washroom: { label: 'Washroom', icon: Wifi, color: 'text-blue-600', bg: 'bg-blue-50' },
  prayer: { label: 'Prayer', icon: Sparkle, color: 'text-purple-600', bg: 'bg-purple-50' }
};

const TodayBreaksSummary = ({ employeeId, refreshInterval = 30000 }) => {
  const [breakData, setBreakData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const fetchBreakSummary = async (showLoader = true) => {
    if (!employeeId) return;
    if (showLoader) setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch(
        `${endpoints.attendance.breakSummary}?employee_id=${employeeId}&date=${getTodayDate()}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch break summary');

      const result = await response.json();
      if (result.success) {
        setBreakData(result.data);
        setLastUpdated(new Date());
      } else {
        setError(result.message || 'Failed to load break summary');
      }
    } catch (err) {
      console.error('TodayBreaksSummary fetch error:', err);
      setError(err.message || 'Error fetching data');
    } finally {
      if (showLoader) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (employeeId) fetchBreakSummary();
  }, [employeeId]);

  useEffect(() => {
    if (!employeeId) return;
    const id = setInterval(() => fetchBreakSummary(false), refreshInterval);
    return () => clearInterval(id);
  }, [employeeId, refreshInterval]);

  if (error) {
    // Silently hide on error — break summary is supplementary, not critical
    return null;
  }

  if (!breakData) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center" style={{ minHeight: '160px' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader className="h-6 w-6 text-blue-600 animate-spin" />
          <p className="text-gray-600 text-sm">Loading today's breaks...</p>
        </div>
      </div>
    );
  }

  const { breakStats } = breakData;
  const { totalBreaks = 0, totalDurationMinutes = 0, totalDurationFormatted = '0h 0m', breakdownByType = {} } = breakStats || {};

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header with Title and Refresh */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Coffee className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Today's Breaks</h3>
            <p className="text-xs text-gray-500">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchBreakSummary(true)}
          disabled={isRefreshing}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw className={`h-4 w-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Stats - Condensed */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {/* Total Breaks */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <p className="text-xs text-blue-600 font-medium">Total Breaks</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">{totalBreaks}</p>
          <p className="text-xs text-blue-600 mt-1">breaks</p>
        </div>

        {/* Total Duration */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <p className="text-xs text-green-600 font-medium">Total Time</p>
          <p className="text-2xl font-bold text-green-900 mt-1">{totalDurationFormatted}</p>
          <p className="text-xs text-green-600 mt-1">({totalDurationMinutes}m)</p>
        </div>

        {/* Status */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <p className="text-xs text-purple-600 font-medium">Status</p>
          <p className="text-lg font-bold text-purple-900 mt-1">{breakData.attendanceStatus || 'Unknown'}</p>
          <p className="text-xs text-purple-600 mt-1">{breakData.checkInTime ? '✓ Checked in' : '○ Not checked in'}</p>
        </div>
      </div>

      {/* Break Type Pills */}
      {totalBreaks > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {Object.entries(breakdownByType).map(([typeKey, typeData]) => {
            if (!typeData || typeData.count === 0) return null;
            const style = BREAK_TYPE_STYLES[typeKey] || { label: typeKey, icon: Cigarette, color: 'text-gray-600', bg: 'bg-gray-50' };
            const Icon = style.icon;

            return (
              <div key={typeKey} className={`${style.bg} rounded-lg p-3 border border-gray-200`}>
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${style.color}`} />
                  <span className="text-sm font-medium text-gray-900">{style.label}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-600">{typeData.count}x</span>
                  <span className={`text-sm font-bold ${style.color}`}>{typeData.durationMinutes}m</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      )}
    </div>
  );
};

export default TodayBreaksSummary;

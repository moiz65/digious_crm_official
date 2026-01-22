// components/BreakSummary.jsx

import { useState, useEffect } from 'react';
import { endpoints } from '../config/api';
import { 
  Coffee, Clock, Cigarette, Utensils, Sparkle, Wifi, 
  AlertCircle, Loader, TrendingUp, Zap
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

  useEffect(() => {
    if (employeeId) {
      fetchBreakSummary();
    }
  }, [employeeId, displayDate]);

  // Auto-refresh interval for real-time updates
  useEffect(() => {
    if (!autoRefresh || !employeeId) return;

    const interval = setInterval(() => {
      fetchBreakSummary();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, employeeId, displayDate]);

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
      {/* Header Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Coffee className="h-6 w-6 text-blue-600" />
              {displayDate === getTodayDate() ? "Today's Break Summary" : "Break Summary"}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {new Date(breakData.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })} • {breakData.employee.name}
              {lastUpdated && <span className="ml-3 text-xs text-gray-500">
                Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full border text-sm font-medium ${statusColor}`}>
            {breakData.attendanceStatus}
          </div>
        </div>

        {/* Main Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Breaks Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-700 text-sm font-medium">Total Breaks</p>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-900">{totalBreaks}</p>
            <p className="text-blue-600 text-xs mt-2">breaks taken</p>
          </div>

          {/* Total Duration Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-green-700 text-sm font-medium">Total Duration</p>
              <Clock className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-900">{totalDurationFormatted}</p>
            <p className="text-green-600 text-xs mt-2">{totalDurationMinutes} minutes</p>
          </div>

          {/* Average Duration Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-purple-700 text-sm font-medium">Avg Duration</p>
              <Zap className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-900">{averageDurationMinutes}</p>
            <p className="text-purple-600 text-xs mt-2">minutes per break</p>
          </div>

          {/* Check Times Card */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-orange-700 text-sm font-medium">Work Time</p>
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
            <p className="text-sm font-mono text-orange-900 mt-3">
              {breakData.checkInTime && (
                <>
                  <span className="block">In: {breakData.checkInTime}</span>
                  {breakData.checkOutTime && <span className="block mt-1">Out: {breakData.checkOutTime}</span>}
                </>
              )}
              {!breakData.checkInTime && <span className="text-orange-600">No check-in</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Break Type Breakdown */}
      {totalBreaks > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Utensils className="h-5 w-5 text-blue-600" />
            Break Type Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(breakdownByType).map(([typeKey, typeData]) => {
              const style = BREAK_TYPE_STYLES[typeKey];
              const Icon = style.icon;
              const hasData = typeData.count > 0;

              return (
                <div
                  key={typeKey}
                  className={`rounded-lg border p-4 transition-all ${
                    hasData
                      ? `${style.color} shadow-sm hover:shadow-md`
                      : 'bg-gray-50 border-gray-200 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-5 w-5" />
                    <p className="font-medium text-sm">{style.label}</p>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-600">Count</p>
                      <p className="text-2xl font-bold">{typeData.count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Duration</p>
                      <p className="text-lg font-semibold">{typeData.durationMinutes}m</p>
                    </div>
                    {typeData.percentage !== undefined && (
                      <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                        <div className="w-full bg-gray-300 bg-opacity-30 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-current"
                            style={{ width: `${typeData.percentage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs mt-1 font-medium">{typeData.percentage}%</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed Break List */}
      {breakStats.allBreaks.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Break Details ({breakStats.allBreaks.length} breaks)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Start Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">End Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Duration</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Reason</th>
                </tr>
              </thead>
              <tbody>
                {breakStats.allBreaks.map((brk, idx) => {
                  const style = BREAK_TYPE_STYLES[brk.type.toLowerCase()] || BREAK_TYPE_STYLES.smoke;
                  const Icon = style.icon;

                  return (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${style.bgColor} ${style.textColor}`}>
                          <Icon className="h-3 w-3" />
                          <span className="text-xs font-medium">{brk.type}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-700">{brk.startTime}</td>
                      <td className="py-3 px-4 font-mono text-gray-700">{brk.endTime || '-'}</td>
                      <td className="py-3 px-4 font-semibold text-gray-800">
                        {brk.durationMinutes} min
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs">{brk.reason || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalBreaks === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Coffee className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No breaks recorded</p>
          <p className="text-gray-500 text-sm mt-1">This employee didn't take any breaks on this date</p>
        </div>
      )}
    </div>
  );
};

export default BreakSummary;

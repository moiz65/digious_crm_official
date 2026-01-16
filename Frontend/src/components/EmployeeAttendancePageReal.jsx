import { useState, useEffect } from 'react';
import { endpoints } from '../config/api';
import { getPakistanTimeString } from '../utils/timezone';
import {
  Clock, LogIn, LogOut, Coffee, Calendar, AlertCircle, CheckCircle,
  TrendingUp, Users, Download, Filter, RefreshCw, Cigarette, Utensils,
  ToiletIcon, Calendar1
} from 'lucide-react';

export function EmployeeAttendancePage() {
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);
  const [activeTab, setActiveTab] = useState('today'); // today, monthly, overtime
  const [overtimeData, setOvertimeData] = useState(null);

  // Get user info from context or localStorage
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (userInfo.employeeId) {
      fetchTodayAttendance();
      fetchMonthlyAttendance();
    }
  }, []);

  // Fetch Today's Attendance
  const fetchTodayAttendance = async () => {
    try {
      const response = await fetch(
        endpoints.attendance.today(userInfo.employeeId),
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      
      if (data.success && data.data) {
        setTodayAttendance(data.data);
        setCheckedIn(!!data.data.check_in_time);
        setCheckedOut(!!data.data.check_out_time);
      } else {
        setTodayAttendance(null);
      }
    } catch (err) {
      setError('Failed to fetch today attendance');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Monthly Attendance
  const fetchMonthlyAttendance = async () => {
    try {
      const response = await fetch(
        endpoints.attendance.monthly(userInfo.employeeId, new Date().getFullYear(), new Date().getMonth() + 1),
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      
      if (data.success) {
        setMonthlyAttendance(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch monthly attendance', err);
    }
  };

  // Check In
  const handleCheckIn = async () => {
    try {
      const response = await fetch(endpoints.attendance.checkIn, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_id: userInfo.employeeId,
          email: userInfo.email,
          name: userInfo.name
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Check In Successful');
        setCheckedIn(true);
        fetchTodayAttendance();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (err) {
      alert('❌ Check in failed');
      console.error(err);
    }
  };

  // Check Out
  const handleCheckOut = async () => {
    try {
      // Get current time in Pakistan timezone (HH:MM:SS format)
      const checkOutTime = getPakistanTimeString();

      const response = await fetch(endpoints.attendance.checkOut, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_id: userInfo.employeeId,
          check_out_time: checkOutTime
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Check Out Successful');
        setCheckedOut(true);
        fetchTodayAttendance();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (err) {
      alert('❌ Check out failed');
      console.error(err);
    }
  };

  // Record Break
  const handleRecordBreak = async (breakType) => {
    try {
      // Define break durations based on type
      const breakDurations = {
        'Smoke': 5,
        'Dinner': 60,
        'Washroom': 10,
        'Prayer': 10
      };

      const breakDurationMinutes = breakDurations[breakType] || 5;
      const now = new Date();
      const breakStartTime = now.toTimeString().split(' ')[0];
      
      // Calculate break end time
      const breakEndDate = new Date(now.getTime() + breakDurationMinutes * 60000);
      const breakEndTime = breakEndDate.toTimeString().split(' ')[0];

      const response = await fetch(endpoints.attendance.base + '/break', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_id: userInfo.employeeId,
          break_type: breakType,
          break_start_time: breakStartTime,
          break_end_time: breakEndTime,
          break_duration_minutes: breakDurationMinutes
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ ${breakType} break recorded (${breakDurationMinutes} min)`);
        fetchTodayAttendance();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (err) {
      alert('❌ Failed to record break');
      console.error(err);
    }
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            <Clock className="h-8 w-8 text-blue-600" />
            Attendance Management
          </h1>
          <p className="text-gray-600">Manage your daily attendance, breaks, and working hours</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {['today', 'monthly', 'overtime'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* TODAY'S ATTENDANCE */}
        {activeTab === 'today' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Check In/Out */}
            <div className="lg:col-span-2 space-y-6">
              {/* Check In/Out Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <LogIn className="h-6 w-6 text-blue-600" />
                  Attendance
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">Check In Time</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="text"
                        value={todayAttendance?.check_in_time || 'Not checked in'}
                        disabled
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                      />
                      <button
                        onClick={handleCheckIn}
                        disabled={checkedIn}
                        className={`px-6 py-3 rounded-lg font-semibold text-white transition-all ${
                          checkedIn
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg'
                        }`}
                      >
                        <LogIn className="h-5 w-5 inline mr-2" />
                        Check In
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">Check Out Time</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="text"
                        value={todayAttendance?.check_out_time || 'Not checked out'}
                        disabled
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                      />
                      <button
                        onClick={handleCheckOut}
                        disabled={!checkedIn || checkedOut}
                        className={`px-6 py-3 rounded-lg font-semibold text-white transition-all ${
                          !checkedIn || checkedOut
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:shadow-lg'
                        }`}
                      >
                        <LogOut className="h-5 w-5 inline mr-2" />
                        Check Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Breaks Management */}
              {checkedIn && !checkedOut && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Coffee className="h-6 w-6 text-amber-600" />
                    Record Break
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleRecordBreak('Smoke')}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-all text-center"
                    >
                      <Cigarette className="h-6 w-6 mx-auto mb-2 text-amber-600" />
                      <div className="font-semibold text-gray-900">Smoke Break</div>
                      <div className="text-sm text-gray-600">5 min</div>
                    </button>

                    <button
                      onClick={() => handleRecordBreak('Dinner')}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-all text-center"
                    >
                      <Utensils className="h-6 w-6 mx-auto mb-2 text-amber-600" />
                      <div className="font-semibold text-gray-900">Dinner Break</div>
                      <div className="text-sm text-gray-600">60 min</div>
                    </button>

                    <button
                      onClick={() => handleRecordBreak('Washroom')}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
                    >
                      <ToiletIcon className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                      <div className="font-semibold text-gray-900">Washroom</div>
                      <div className="text-sm text-gray-600">10 min</div>
                    </button>

                    <button
                      onClick={() => handleRecordBreak('Prayer')}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-center"
                    >
                      <Calendar1 className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                      <div className="font-semibold text-gray-900">Prayer Break</div>
                      <div className="text-sm text-gray-600">10 min</div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Summary Stats */}
            <div className="space-y-4">
              {todayAttendance && (
                <>
                  <div className="bg-white rounded-xl shadow-md p-4 border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Status</p>
                        <p className="text-2xl font-bold text-gray-900">{todayAttendance.status}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-md p-4 border border-purple-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Breaks Taken</p>
                        <p className="text-2xl font-bold text-gray-900">{todayAttendance.total_breaks_taken}</p>
                      </div>
                      <Coffee className="h-8 w-8 text-amber-600" />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-md p-4 border border-green-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Break Time</p>
                        <p className="text-2xl font-bold text-gray-900">{todayAttendance.total_break_duration_minutes}m</p>
                      </div>
                      <Clock className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-md p-4 border border-red-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Working Hours</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {Math.floor(todayAttendance.net_working_time_minutes / 60)}h {todayAttendance.net_working_time_minutes % 60}m
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-md p-4 border border-orange-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Overtime</p>
                        <p className="text-2xl font-bold text-gray-900">{todayAttendance.overtime_hours}h</p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-orange-600" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* MONTHLY ATTENDANCE */}
        {activeTab === 'monthly' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Check In</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Check Out</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Working Hrs</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Breaks</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Overtime</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyAttendance.length > 0 ? (
                    monthlyAttendance.map((record, index) => (
                      <tr key={record.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-6 py-4 font-semibold text-gray-900">{record.attendance_date}</td>
                        <td className="px-6 py-4 text-gray-700">{record.check_in_time || '-'}</td>
                        <td className="px-6 py-4 text-gray-700">{record.check_out_time || '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                            record.status === 'Present' ? 'bg-green-100 text-green-800' :
                            record.status === 'Absent' ? 'bg-red-100 text-red-800' :
                            record.status === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {Math.floor(record.net_working_time_minutes / 60)}h {record.net_working_time_minutes % 60}m
                        </td>
                        <td className="px-6 py-4 text-gray-700">{record.total_breaks_taken}</td>
                        <td className="px-6 py-4 font-semibold text-orange-600">{record.overtime_hours}h</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        No attendance records for this month
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* OVERTIME */}
        {activeTab === 'overtime' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Overtime Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                <p className="text-sm text-orange-600 font-medium mb-2">Total Overtime Hours</p>
                <p className="text-3xl font-bold text-orange-900">
                  {monthlyAttendance.reduce((sum, r) => sum + parseFloat(r.overtime_hours || 0), 0).toFixed(1)}h
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                <p className="text-sm text-blue-600 font-medium mb-2">Overtime Days</p>
                <p className="text-3xl font-bold text-blue-900">
                  {monthlyAttendance.filter(r => parseFloat(r.overtime_hours) > 0).length}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <p className="text-sm text-green-600 font-medium mb-2">Avg Daily Overtime</p>
                <p className="text-3xl font-bold text-green-900">
                  {(monthlyAttendance.reduce((sum, r) => sum + parseFloat(r.overtime_hours || 0), 0) / 
                    Math.max(monthlyAttendance.filter(r => parseFloat(r.overtime_hours) > 0).length, 1)).toFixed(1)}h
                </p>
              </div>
            </div>

            {/* Overtime Details */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Check In</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Check Out</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Working Hours</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Overtime</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Rate (1.5x)</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyAttendance.filter(r => parseFloat(r.overtime_hours) > 0).map((record, index) => (
                    <tr key={record.id} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4 font-semibold text-gray-900">{record.attendance_date}</td>
                      <td className="px-6 py-4 text-gray-700">{record.check_in_time}</td>
                      <td className="px-6 py-4 text-gray-700">{record.check_out_time}</td>
                      <td className="px-6 py-4 text-gray-700">
                        {Math.floor(record.net_working_time_minutes / 60)}h {record.net_working_time_minutes % 60}m
                      </td>
                      <td className="px-6 py-4 font-bold text-orange-600">{record.overtime_hours}h</td>
                      <td className="px-6 py-4 font-semibold text-green-600">
                        {(parseFloat(record.overtime_hours) * 1.5).toFixed(2)}x
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeAttendancePage;

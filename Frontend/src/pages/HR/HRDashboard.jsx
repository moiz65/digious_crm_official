import React, { useState, useEffect } from 'react';
import HrSidebar from '../../components/HrSidebar';
import { DashboardHeader, RoleBasedNav } from '../../components/DashboardComponents';
import { useAuth } from '../../context/AuthContext';
import { endpoints } from '../../config/api';
import { Users, Calendar, Clock, AlertCircle, TrendingUp, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { getPakistanDateString } from '../../utils/timezone';

const HRDashboard = () => {
  const { role } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [stats, setStats] = useState([
    { label: 'Total Present Ontime', value: '0', icon: CheckCircle, color: 'from-blue-500 to-cyan-600' },
    { label: 'Total Absent', value: '0', icon: XCircle, color: 'from-red-500 to-pink-600' },
    { label: 'Total Late', value: '0', icon: Clock, color: 'from-orange-500 to-red-600' },
    { label: 'Avg Attendance', value: '0%', icon: TrendingUp, color: 'from-purple-500 to-pink-600' }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔐 Token:', token ? 'Present' : 'Missing');
      
      // Get Pakistan date (UTC+5)
      // The backend stores attendance_date in Pakistan timezone (YYYY-MM-DD)
      const today = getPakistanDateString();
      console.log('📅 Today date (Pakistan TZ):', today);
      
      // Fetch today's attendance records
      console.log('📥 Fetching attendance...');
      const attendanceResponse = await fetch(endpoints.attendance.all, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (!attendanceResponse.ok) {
        throw new Error(`HTTP Error: ${attendanceResponse.status}`);
      }
      
      const attendanceDataRaw = await attendanceResponse.json();
      console.log('📊 Raw Attendance response:', attendanceDataRaw);
      
      if (!attendanceDataRaw.success) {
        throw new Error('API returned success: false');
      }
      
      console.log('🕐 Full attendance data count:', attendanceDataRaw.data ? attendanceDataRaw.data.length : 0);
      
      // Log all records for debugging
      if (attendanceDataRaw.data && attendanceDataRaw.data.length > 0) {
        console.log('📋 FIRST 5 RECORDS:', attendanceDataRaw.data.slice(0, 5).map(r => ({
          id: r.id,
          employee_id: r.employee_id,
          name: r.name,
          attendance_date: r.attendance_date,
          status: r.status,
          check_in_time: r.check_in_time
        })));
        
        // Show all dates present in database
        const uniqueDates = [...new Set(attendanceDataRaw.data.map(r => r.attendance_date ? r.attendance_date.split('T')[0] : 'null'))];
        console.log('📅 Unique attendance dates in DB:', uniqueDates);
      }
      
      const todayAttendance = (attendanceDataRaw.data || []).filter(r => {
        // Compare dates as strings (YYYY-MM-DD)
        const recordDate = r.attendance_date ? r.attendance_date.split('T')[0] : null;
        const matches = recordDate === today;
        
        console.log(`  Comparing: recordDate="${recordDate}" vs today="${today}" → ${matches ? '✓ MATCH' : '✗ no match'} | ${r.name} | ${r.status}`);
        
        return matches;
      });
      
      console.log('✅ Today attendance records (filtered):', todayAttendance.length);
      console.log('📋 Today attendance details:', todayAttendance);
      
      // Calculate metrics for today
      const presentOntime = todayAttendance.filter(r => r.status === 'Present').length;
      const totalAbsent = todayAttendance.filter(r => r.status === 'Absent').length;
      const totalLate = todayAttendance.filter(r => r.status === 'Late').length;
      
      console.log('✓ Present (Ontime):', presentOntime);
      console.log('✗ Absent:', totalAbsent);
      console.log('⏰ Late:', totalLate);

      // Calculate average attendance (approximation - count present + late as present)
      const allAttendance = attendanceDataRaw.data || [];
      const presentCount = allAttendance.filter(r => r.status === 'Present' || r.status === 'Late').length;
      const totalRecords = allAttendance.length || 1;
      const avgAttendance = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 94;
      
      console.log('📊 Average Attendance Calculation:', {
        presentCount,
        totalRecords,
        avgAttendance,
        allAttendanceCount: allAttendance.length
      });

      setStats([
        { label: 'Total Present Ontime', value: presentOntime.toString(), icon: CheckCircle, color: 'from-blue-500 to-cyan-600' },
        { label: 'Total Absent', value: totalAbsent.toString(), icon: XCircle, color: 'from-red-500 to-pink-600' },
        { label: 'Total Late', value: totalLate.toString(), icon: Clock, color: 'from-orange-500 to-red-600' },
        { label: 'Avg Attendance', value: `${avgAttendance}%`, icon: TrendingUp, color: 'from-purple-500 to-pink-600' }
      ]);

      console.log('🎯 Stats Updated:', {
        presentOntime,
        totalAbsent,
        totalLate,
        avgAttendance
      });

      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      // Keep default values on error
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <HrSidebar 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          title="HR Dashboard" 
          subtitle="Manage your team and monitor attendance"
        />
        <RoleBasedNav role={role} />

        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-10">
          <div className="w-full">
            {/* Stats Grid */}
            <div className="mb-12 w-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Today Metrics</h2>
                <button
                  onClick={() => fetchDashboardData()}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 w-full">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">{stat.label}</p>
                          <p className="text-4xl font-bold text-gray-900 mt-3 group-hover:text-blue-600 transition">
                            {loading ? '...' : stat.value}
                          </p>
                        </div>
                        <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg shadow-opacity-30 group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 w-full">
              {/* Welcome Message */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-10 hover:shadow-lg transition-shadow duration-300">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">Welcome to HR Portal</h2>
                  <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full"></div>
                </div>
                <p className="text-gray-600 text-base leading-relaxed mb-8">
                  Manage your team efficiently with comprehensive tools for attendance tracking, employee management, and application processing.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:border-blue-300 transition">
                    <div className="text-3xl mb-3">👥</div>
                    <h3 className="font-bold text-blue-900 mb-2 text-lg">Team Management</h3>
                    <p className="text-sm text-blue-700 leading-relaxed">View and manage team members</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 hover:border-green-300 transition">
                    <div className="text-3xl mb-3">📋</div>
                    <h3 className="font-bold text-green-900 mb-2 text-lg">Attendance</h3>
                    <p className="text-sm text-green-700 leading-relaxed">Monitor attendance records</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 hover:shadow-lg transition-shadow duration-300 h-fit sticky top-24">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900">Quick Actions</h3>
                  <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full mt-2"></div>
                </div>
                <div className="space-y-4">
                  <button className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 text-sm font-semibold tracking-wide uppercase">
                    Mark Attendance
                  </button>
                  <button className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 text-sm font-semibold tracking-wide uppercase">
                    View Team
                  </button>
                  <button className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-300 text-sm font-semibold tracking-wide uppercase">
                    Process Applications
                  </button>
                  <button className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:shadow-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-300 text-sm font-semibold tracking-wide uppercase">
                    Generate Reports
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;

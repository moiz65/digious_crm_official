import { useState, useEffect } from 'react';
import { TrendingUp, Users, CheckCircle, XCircle, RefreshCw, Calendar, DollarSign, FileText, Target, Clock, LogIn, LogOut } from 'lucide-react';
import { useAttendance } from '../hooks/UseAttendance';
import TopNavMenu from './TopNavMenu';

export function SalesDashboard() {
  // State management
  const [currentTime, setCurrentTime] = useState(new Date());
  const [salesData, setSalesData] = useState({
    monthlyTarget: 75000,
    currentSales: 61000,
    totalSales: 328500,
    ongoingProjects: 15,
    completedProjects: 42,
    canceledProjects: 3,
    refunds: 2400,
    leaves: 2,
    offDays: 8
  });

  // Use shared attendance hook
  const {
    systemAttendance,
    handleSystemCheckIn,
    handleSystemCheckOut,
    getTodayStatus,
    getAttendanceStats
  } = useAttendance();

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check in functionality
  const handleCheckIn = async () => {
    const todayStatus = getTodayStatus();
    
    // Check if already checked in today
    if (todayStatus.checkIn !== '-') {
      alert('You have already checked in today!');
      return;
    }

    try {
      const result = await handleSystemCheckIn();
      
      // Update sales data on check-in
      setSalesData(prev => ({
        ...prev,
        currentSales: Math.min(prev.currentSales + 1500, prev.monthlyTarget),
        totalSales: prev.totalSales + 1500,
        ongoingProjects: prev.ongoingProjects + 1
      }));

      alert(`Checked in successfully at ${result.timeString}! ${result.isLate ? 'You are late.' : 'You are on time.'}`);
    } catch (error) {
      alert('Failed to check in. Please try again.');
    }
  };

  // Check out functionality
  const handleCheckOut = async () => {
    const todayStatus = getTodayStatus();
    
    if (todayStatus.checkIn === '-') {
      alert('You are not checked in!');
      return;
    }

    try {
      const result = await handleSystemCheckOut();
      
      // Update sales data on check-out
      setSalesData(prev => ({
        ...prev,
        completedProjects: prev.completedProjects + 1,
        ongoingProjects: Math.max(0, prev.ongoingProjects - 1)
      }));

      alert(`Checked out successfully at ${result.timeString}! You worked for ${result.hours} hours today.`);
    } catch (error) {
      alert('Failed to check out. Please try again.');
    }
  };

  // Calculate current session duration
  const [currentSessionDuration, setCurrentSessionDuration] = useState('0h 0m');

  useEffect(() => {
    let interval;
    if (systemAttendance.checkedIn && systemAttendance.checkInTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diffMs = now - systemAttendance.checkInTime;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setCurrentSessionDuration(`${hours}h ${minutes}m`);
      }, 1000);
    } else {
      setCurrentSessionDuration('0h 0m');
    }
    return () => clearInterval(interval);
  }, [systemAttendance.checkedIn, systemAttendance.checkInTime]);

  // Quick action handlers
  const handleQuickAction = (action) => {
    switch (action) {
      case 'New Proposal':
        setSalesData(prev => ({ ...prev, ongoingProjects: prev.ongoingProjects + 1 }));
        alert('Creating new proposal...');
        break;
      case 'Add Client':
        alert('Opening client form...');
        break;
      case 'New Sale':
        const newSaleAmount = Math.floor(Math.random() * 5000) + 1000;
        setSalesData(prev => ({
          ...prev,
          currentSales: Math.min(prev.currentSales + newSaleAmount, prev.monthlyTarget),
          totalSales: prev.totalSales + newSaleAmount
        }));
        alert(`New sale recorded: $${newSaleAmount}`);
        break;
      case 'Schedule':
        alert('Opening calendar...');
        break;
      default:
        break;
    }
  };

  // Sample projects data with interactive functionality
  const [projects, setProjects] = useState([
    { id: 1, name: 'E-commerce Website', client: 'TechCorp', value: 12000, status: 'In Progress' },
    { id: 2, name: 'Mobile App Design', client: 'StartupXYZ', value: 8500, status: 'Completed' },
    { id: 3, name: 'Brand Identity', client: 'Local Business', value: 4200, status: 'In Progress' },
    { id: 4, name: 'Website Redesign', client: 'Corporate Inc', value: 15000, status: 'Proposal' }
  ]);

  const updateProjectStatus = (projectId, newStatus) => {
    setProjects(prev => prev.map(project =>
      project.id === projectId 
        ? { ...project, status: newStatus }
        : project
    ));
    
    if (newStatus === 'Completed') {
      setSalesData(prev => ({
        ...prev,
        completedProjects: prev.completedProjects + 1,
        ongoingProjects: Math.max(0, prev.ongoingProjects - 1)
      }));
    }
  };

  // Calculate progress percentage
  const progressPercentage = (salesData.currentSales / salesData.monthlyTarget) * 100;
  const stats = getAttendanceStats();
  const todayStatus = getTodayStatus();

  // Get this week's attendance (only completed sessions)
  const getThisWeekAttendance = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // This would need access to full attendance data, but for now we'll use sample data
    return [
      { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), status: 'present', time: '09:00 AM' },
      { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), status: 'present', time: '09:05 AM' },
      { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), status: 'late', time: '09:25 AM' },
      { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), status: 'present', time: '09:00 AM' },
      { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), status: 'present', time: '08:55 AM' }
    ];
  };

  const weekAttendance = getThisWeekAttendance();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 relative overflow-hidden">
      {/* Top Navigation Menu */}
      <TopNavMenu activeItem="Sales" setActiveItem={() => {}} isSidebarCollapsed={false} />

      {/* Subtle Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-sky-100 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse animation-delay-2000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
              <p className="text-gray-600">Welcome back, Sarah! Here's your overview</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-xs text-gray-500">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Monthly Sales Target */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Monthly Target</h3>
              <Target className="h-5 w-5 text-[#349dff]" />
            </div>
            <div className="text-2xl font-bold text-gray-900">${salesData.monthlyTarget.toLocaleString()}</div>
            <div className="mt-2">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Achieved: ${salesData.currentSales.toLocaleString()}</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-[#349dff] to-[#34dfff] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Total Sales */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Total Sales</h3>
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">${salesData.totalSales.toLocaleString()}</div>
            <p className="text-sm text-green-600 mt-1 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              +12% from last month
            </p>
          </div>

          {/* Ongoing Projects */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Ongoing Projects</h3>
              <RefreshCw className="h-5 w-5 text-[#349dff]" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{salesData.ongoingProjects}</div>
            <p className="text-sm text-gray-600 mt-1">Active projects</p>
          </div>

          {/* Completed Projects */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Completed</h3>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{salesData.completedProjects}</div>
            <p className="text-sm text-gray-600 mt-1">This quarter</p>
          </div>
        </div>

        {/* Secondary Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Canceled Projects */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Canceled</h3>
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{salesData.canceledProjects}</div>
            <p className="text-sm text-gray-600 mt-1">This month</p>
          </div>

          {/* Refunds */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Refunds</h3>
              <RefreshCw className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">${salesData.refunds.toLocaleString()}</div>
            <p className="text-sm text-gray-600 mt-1">Total amount</p>
          </div>

          {/* Leaves */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Leaves</h3>
              <Calendar className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{salesData.leaves}</div>
            <p className="text-sm text-gray-600 mt-1">Remaining this month</p>
          </div>

          {/* Offs */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Off Days</h3>
              <Users className="h-5 w-5 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{salesData.offDays}</div>
            <p className="text-sm text-gray-600 mt-1">This month</p>
          </div>
        </div>

        {/* Attendance Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-8 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Attendance</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{currentTime.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              {systemAttendance.checkedIn && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Checked In • {currentSessionDuration}
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Attendance Stats */}
            <div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                  <div className="text-sm text-green-700">Present</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
                  <div className="text-sm text-yellow-700">Late</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                  <div className="text-sm text-red-700">Absent</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{salesData.offDays}</div>
                  <div className="text-sm text-blue-700">Off Days</div>
                </div>
              </div>
              
              {/* Check In/Check Out Buttons */}
              <div className={`grid gap-3 ${systemAttendance.checkedIn ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {!systemAttendance.checkedIn ? (
                  <button 
                    onClick={handleCheckIn}
                    className="w-full bg-[#349dff] text-white py-3 rounded-xl hover:bg-[#2980db] transition duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    Check In Today
                  </button>
                ) : (
                  <>
                    <button 
                      className="w-full bg-blue-100 text-blue-700 py-3 rounded-xl font-medium shadow-sm flex items-center justify-center gap-2 border border-blue-200 cursor-default"
                      disabled
                    >
                      <LogIn className="h-4 w-4" />
                      Checked In
                    </button>
                    <button 
                      onClick={handleCheckOut}
                      className="w-full bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 transition duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Check Out
                    </button>
                  </>
                )}
              </div>

              {/* Check-in information */}
              {systemAttendance.checkedIn && systemAttendance.checkInTime && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm text-green-800 text-center">
                    <div className="font-medium">Checked in at: {systemAttendance.checkInTime.toLocaleTimeString()}</div>
                    <div className="text-xs mt-1">Session duration: {currentSessionDuration}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Weekly Attendance */}
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-4">Recent Attendance</h3>
              <div className="space-y-3">
                {weekAttendance.length > 0 ? (
                  weekAttendance.map((record, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-sm text-gray-700">
                        {record.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex items-center space-x-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          record.status === 'present' ? 'bg-green-100 text-green-800 border border-green-200' :
                          record.status === 'late' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                          'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {record.status}
                        </span>
                        <span className="text-sm text-gray-500">{record.time}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No attendance records yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'New Proposal', icon: FileText },
                { label: 'Add Client', icon: Users },
                { label: 'New Sale', icon: DollarSign },
                { label: 'Schedule', icon: Calendar }
              ].map((action, index) => (
                <button 
                  key={index}
                  onClick={() => handleQuickAction(action.label)}
                  className="flex items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#349dff] hover:bg-blue-50 transition duration-300 group"
                >
                  <action.icon className="h-6 w-6 text-gray-500 group-hover:text-[#349dff] mr-2 transition duration-300" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Projects */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Projects</h2>
            <div className="space-y-4">
              {projects.map((project) => (
                <div 
                  key={project.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#349dff] hover:bg-blue-50 transition duration-300 cursor-pointer"
                  onClick={() => {
                    if (project.status === 'In Progress') {
                      updateProjectStatus(project.id, 'Completed');
                    } else if (project.status === 'Proposal') {
                      updateProjectStatus(project.id, 'In Progress');
                    }
                  }}
                >
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">{project.name}</h4>
                    <p className="text-xs text-gray-600">{project.client}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">${project.value.toLocaleString()}</div>
                    <span className={`text-xs px-2 py-1 rounded-full cursor-pointer ${
                      project.status === 'Completed' ? 'bg-green-100 text-green-800 border border-green-200' :
                      project.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalesDashboard;
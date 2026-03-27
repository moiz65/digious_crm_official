import React, { useState, useEffect } from 'react';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import { DashboardHeader, RoleBasedNav } from '../../components/DashboardComponents';
import { useAuth } from '../../context/AuthContext';
import { 
  Clock, 
  Calendar, 
  FileText, 
  User, 
  BarChart3, 
  Zap,
  FolderKanban,
  XCircle,
  Layers,
  CheckCircle,
  LogOut,
  LogIn,
  PauseCircle,
  Timer
} from 'lucide-react';

const ProductionDashboard = () => {
  const { role, user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');
  
  // Stats state
  const [completedProjects, setCompletedProjects] = useState(8);
  const [totalProjects, setTotalProjects] = useState(12);
  const [absentsCount, setAbsentsCount] = useState(3);
  const [latesCount, setLatesCount] = useState(5);
  
  // Attendance state
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  
  // Break state
  const [activeBreaks, setActiveBreaks] = useState([]);
  const [breakTimers, setBreakTimers] = useState({});
  
  // Leave summary state
  const [leaveSummary, setLeaveSummary] = useState({
    casual: { used: 5, total: 12 },
    sick: { used: 3, total: 10 },
    annual: { used: 8, total: 20 }
  });
  
  // Break types configuration
  const breakTypes = [
    { type: 'Smoke', label: 'Smoke Break', duration: 5, icon: PauseCircle },
    { type: 'Lunch', label: 'Lunch Break', duration: 30, icon: Timer },
    { type: 'Dinner', label: 'Dinner Break', duration: 60, icon: Timer },
    { type: 'Washroom', label: 'Washroom Break', duration: 10, icon: Timer },
    { type: 'Prayer', label: 'Prayer Break', duration: 15, icon: Timer }
  ];
  
  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Handle Check In
  const handleCheckIn = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const now = new Date();
      const checkInTime = now.toLocaleTimeString('en-US', { 
        hour12: false,
        timeZone: 'Asia/Karachi'
      });
      
      setAttendanceData({
        check_in_time: checkInTime,
        check_out_time: null,
        total_breaks_taken: 0,
        total_break_duration_minutes: 0
      });
      setIsCheckedIn(true);
    } catch (error) {
      console.error('Error checking in:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle Check Out
  const handleCheckOut = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const now = new Date();
      const checkOutTime = now.toLocaleTimeString('en-US', { 
        hour12: false,
        timeZone: 'Asia/Karachi'
      });
      
      setAttendanceData({
        ...attendanceData,
        check_out_time: checkOutTime
      });
      setIsCheckedIn(false);
    } catch (error) {
      console.error('Error checking out:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle Break Start
  const handleBreakStart = async (breakType) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const newBreak = {
        id: Date.now(),
        break_type: breakType,
        start_time: new Date(),
        duration: breakTypes.find(b => b.type === breakType)?.duration || 15
      };
      
      setActiveBreaks([...activeBreaks, newBreak]);
      setBreakTimers({
        ...breakTimers,
        [newBreak.id]: 0
      });
    } catch (error) {
      console.error('Error starting break:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle Break End
  const handleBreakEnd = async (breakId) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const endedBreak = activeBreaks.find(b => b.id === breakId);
      
      if (endedBreak) {
        const durationMinutes = breakTimers[breakId] || 0;
        
        setActiveBreaks(activeBreaks.filter(b => b.id !== breakId));
        
        // Update attendance data with break statistics
        setAttendanceData(prev => ({
          ...prev,
          total_breaks_taken: (prev?.total_breaks_taken || 0) + 1,
          total_break_duration_minutes: (prev?.total_break_duration_minutes || 0) + durationMinutes
        }));
        
        // Remove timer
        const newTimers = { ...breakTimers };
        delete newTimers[breakId];
        setBreakTimers(newTimers);
      }
    } catch (error) {
      console.error('Error ending break:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Format elapsed time
  const formatElapsedTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };
  
  // Format time display
  const formatTimeDisplay = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };
  
  // Timer effect for breaks
  useEffect(() => {
    const timer = setInterval(() => {
      if (Object.keys(breakTimers).length > 0) {
        setBreakTimers(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(id => {
            updated[id] = (updated[id] || 0) + 1/60; // Add 1 minute
          });
          return updated;
        });
      }
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, [breakTimers]);

  const stats = [
    {
      label: "Project Progress",
      value: `${completedProjects}/${totalProjects}`,
      color: "from-green-600 to-green-600",
      bgColor: "bg-gradient-to-br from-green-50 to-green-200 border border-green-300 rounded-2xl",
      iconBg: "from-green-500 to-green-600",
      icon: FolderKanban
    },
    {
      label: "Absents",
      value: absentsCount,
      color: "from-red-600 to-red-600",
      bgColor: "bg-gradient-to-br from-red-50 to-red-200 border border-red-300 rounded-2xl",
      iconBg: "from-red-500 to-red-600",
      icon: XCircle
    },
    {
      label: "Lates",
      value: latesCount,
      color: "from-orange-600 to-orange-600",
      bgColor: "bg-gradient-to-br from-orange-50 to-orange-200 border border-orange-300 rounded-2xl",
      iconBg: "from-orange-500 to-orange-600",
      icon: Clock
    },
    {
      label: "Total Projects",
      value: totalProjects,
      color: "from-purple-600 to-pink-600",
      bgColor: "bg-gradient-to-br from-purple-50 to-pink-200 border border-purple-300 rounded-2xl",
      iconBg: "from-purple-500 to-pink-600",
      icon: Layers
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <EmployeeSidebar 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          title="My Dashboard" 
          
        />
        {/* <RoleBasedNav role={role} /> */}

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`bg-gradient-to-br ${stat.bgColor} rounded-2xl  p-6 hover:shadow-xl transition-all duration-300 group hover:scale-105`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-xs font-semibold  uppercase bg-gradient-to-r ${stat.color} bg-clip-text text-black/10 tracking-wider mb-3`}>{stat.label}</p>
                    <p className={`text-3xl font-semibold bg-gradient-to-r ${stat.color} bg-clip-text text-black/10`}>{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.iconBg} shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Check In/Out Section */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="text-center">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Attendance</h2>
                  <div className="text-3xl font-mono font-bold text-blue-600">
                    {currentTime.toLocaleTimeString('en-US', { 
                      hour12: false,
                      timeZone: 'Asia/Karachi'
                    })}
                  </div>
                  <p className="text-gray-500 mt-1">
                    {currentTime.toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      timeZone: 'Asia/Karachi'
                    })}
                  </p>
                </div>

                {!loading && (
                  <div className="space-y-4">
                    {isCheckedIn || (attendanceData?.check_in_time && !attendanceData?.check_out_time) ? (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-green-700 font-semibold">You are checked in</p>
                        {attendanceData?.check_in_time && (
                          <p className="text-sm text-green-600">
                            Checked in at {attendanceData.check_in_time}
                          </p>
                        )}
                      </div>
                    ) : attendanceData?.check_out_time ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                        <LogOut className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <p className="text-blue-700 font-semibold">You have checked out</p>
                        <p className="text-sm text-blue-600">
                          Checked out at {attendanceData.check_out_time}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4 mb-4">
                        <LogIn className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-600">Ready to check in</p>
                      </div>
                    )}

                    <div className="flex gap-4 mb-4">
                      <button
                        onClick={handleCheckIn}
                        disabled={attendanceData?.check_in_time || attendanceData?.check_out_time}
                        className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                          attendanceData?.check_in_time || attendanceData?.check_out_time
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-br from-green-500 to-green-600 hover:bg-green-600 text-white shadow-lg hover:shadow-green-500/25'
                        }`}
                      >
                        <LogIn className="w-5 h-5 inline mr-2" />
                        Check In
                      </button>
                      {/* p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md group-hover:scale-110 transition-transform */}
                      <button
                        onClick={handleCheckOut}
                        disabled={!attendanceData?.check_in_time || !!attendanceData?.check_out_time}
                        className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                          attendanceData?.check_in_time && !attendanceData?.check_out_time
                            ? 'bg-gradient-to-br from-red-400 to-red-600 hover:bg-red-600 text-white shadow-lg hover:shadow-red-500/25'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <LogOut className="w-5 h-5 inline mr-2" />
                        Check Out
                      </button>
                    </div>

                    {/* Leave Summary - titled, full-width responsive cards */}
                    <div className="mt-10 w-full">
                      <h1 className="text-sm font-semibold text-gray-700 mb-3">Leave Summary</h1>
                      <div className="flex flex-col sm:flex-row gap-4 w-full items-stretch justify-between">
                        <div className="flex-1 min-w-0 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center min-h-[86px]">
                          <p className="text-sm text-gray-600">Casual Leaves</p>
                          <p className="text-xs text-gray-500 mt-1">Used/ Total</p>
                          <p className="text-2xl font-bold text-gray-900 mt-3">{leaveSummary.casual.used}/{leaveSummary.casual.total}</p>
                        </div>

                        <div className="flex-1 min-w-0 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center min-h-[86px]">
                          <p className="text-sm text-gray-600">Sick Leaves</p>
                          <p className="text-xs text-gray-500 mt-1">Used/ Total</p>
                          <p className="text-2xl font-bold text-gray-900 mt-3">{leaveSummary.sick.used}/{leaveSummary.sick.total}</p>
                        </div>

                        <div className="flex-1 min-w-0 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center min-h-[86px]">
                          <p className="text-sm text-gray-600">Annual Leaves</p>
                          <p className="text-xs text-gray-500 mt-1">Used/ Total</p>
                          <p className="text-2xl font-bold text-gray-900 mt-3">{leaveSummary.annual.used}/{leaveSummary.annual.total}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
{/* bg-gradient-to-br from-white-50 to-white-100 border border-gray-200 rounded-xl  */}
                {loading && (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
                    <div className="h-12 bg-gray-200 rounded mb-4"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Break Management */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <PauseCircle className="w-6 h-6 text-purple-600" />
                Break Management
              </h2>
              
              {/* Break Type Cards Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {breakTypes.map((breakType) => {
                  const Icon = breakType.icon;
                  const isActive = activeBreaks.some(b => b.break_type === breakType.type);
                  
                  return (
                    <button
                      key={breakType.type}
                      onClick={() => handleBreakStart(breakType.type)}
                      disabled={!isCheckedIn || isActive || attendanceData?.check_out_time}
                      className={`p-5 rounded-xl text-center transition-all duration-300 border ${
                        !isCheckedIn || isActive || attendanceData?.check_out_time
                          ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-md text-gray-900'
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2 opacity-70" />
                      <div className="text-sm font-semibold">{breakType.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{breakType.duration}m</div>
                    </button>
                  );
                })}
              </div>

              {/* Active Breaks Alert */}
              {activeBreaks.length > 0 && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    Active Breaks
                  </h3>
                  <div className="space-y-2">
                    {activeBreaks.map((breakItem) => (
                      <div key={breakItem.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-100">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-700">
                            {breakItem.break_type.charAt(0).toUpperCase() + breakItem.break_type.slice(1)} Break
                          </span>
                          <div className="mt-1 flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all"
                                style={{
                                  width: `${Math.min(100, (breakTimers[breakItem.id] || 0) / (breakItem.break_type === 'Dinner' ? 60 : breakItem.break_type === 'Smoke' ? 5 : 10) * 100)}%`
                                }}
                              />
                            </div>
                            <span className="text-xs font-mono font-bold text-amber-700 min-w-[50px]">
                              {formatElapsedTime(breakTimers[breakItem.id] || 0)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleBreakEnd(breakItem.id)}
                          className="ml-3 text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition-colors whitespace-nowrap"
                        >
                          End Break
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Today's Break Summary */}
              {attendanceData && (
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Today's Breaks</h3>
                  
                  {/* Main Stats */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <p className="text-gray-700 font-medium">Total Breaks:</p>
                      <p className="text-2xl font-bold text-purple-600">{attendanceData.total_breaks_taken || 0}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-gray-700 font-medium">Total Time:</p>
                      <p className="text-2xl font-bold text-purple-600">{formatTimeDisplay(attendanceData.total_break_duration_minutes || 0)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-gray-700 font-medium">Active:</p>
                      <p className="text-2xl font-bold text-purple-600">{activeBreaks.length}</p>
                    </div>
                  </div>
                  
                  {/* Break Details by Type - Always Show */}
                  <div className="pt-4 border-t border-purple-200">
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Break Details</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between items-center bg-black-50 p-2 rounded">
                        <span className="text-gray-700">Smoke Break:</span>
                        <span className="font-semibold text-purple-600">0x</span>
                      </div>
                      <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span className="text-gray-700">Dinner Break:</span>
                        <span className="font-semibold text-purple-600">0x</span>
                      </div>
                      <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span className="text-gray-700">Washroom Break:</span>
                        <span className="font-semibold text-purple-600">0x</span>
                      </div>
                      <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span className="text-gray-700">Prayer Break:</span>
                        <span className="font-semibold text-purple-600">0x</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionDashboard;
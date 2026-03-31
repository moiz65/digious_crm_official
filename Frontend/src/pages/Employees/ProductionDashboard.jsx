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
        
        </div>
      </div>
    </div>
  );
};

export default ProductionDashboard;
import React, { useState } from 'react';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import { DashboardHeader, RoleBasedNav } from '../../components/DashboardComponents';
import { useAuth } from '../../context/AuthContext';
import { Clock, Calendar, FileText, User, BarChart3, Zap } from 'lucide-react';

const EmployeeDashboard = () => {
  const { role, user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');

  const stats = [
    { label: 'Hours This Week', value: '40h', icon: Clock, color: 'from-blue-500 to-cyan-600', bgColor: 'from-blue-50 to-cyan-50', iconBg: 'from-blue-500 to-blue-600' },
    { label: 'Attendance Rate', value: '96%', icon: Calendar, color: 'from-green-500 to-emerald-600', bgColor: 'from-green-50 to-emerald-50', iconBg: 'from-green-500 to-green-600' },
    { label: 'Pending Requests', value: '2', icon: FileText, color: 'from-orange-500 to-red-600', bgColor: 'from-orange-50 to-red-50', iconBg: 'from-orange-500 to-red-600' },
    { label: 'Profile Status', value: 'Active', icon: User, color: 'from-purple-500 to-pink-600', bgColor: 'from-purple-50 to-pink-50', iconBg: 'from-purple-500 to-purple-600' }
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
          subtitle="View your profile and attendance information"
        />
        <RoleBasedNav role={role} />

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`bg-gradient-to-br ${stat.bgColor} rounded-2xl shadow-lg border-2 border-white p-6 hover:shadow-xl transition-all duration-300 group hover:scale-105`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">{stat.label}</p>
                    <p className="text-4xl font-extrabold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent">{stat.value}</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Welcome Message */}
          <div className="lg:col-span-2 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg border border-blue-100 p-8 hover:shadow-xl transition-all">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-4 shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                  Welcome, {user?.name || user?.email || 'Employee'}!
                </h2>
                <p className="text-gray-600 text-sm">
                  Have a productive day ahead! 🚀
                </p>
              </div>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              This is your personal dashboard where you can view your attendance records, manage your profile, and track your applications.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl border-2 border-blue-200 hover:shadow-md transition-all group">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-blue-500 rounded-lg p-2">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-blue-900">My Profile</h3>
                </div>
                <p className="text-sm text-blue-700">View and update your information</p>
              </div>
              <div className="p-5 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl border-2 border-green-200 hover:shadow-md transition-all group">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-green-500 rounded-lg p-2">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-green-900">Attendance</h3>
                </div>
                <p className="text-sm text-green-700">Check your attendance history</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-3 shadow-md">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
            </div>
            <div className="space-y-3">
              <button className="w-full px-5 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg text-sm font-semibold flex items-center justify-center gap-2 group hover:scale-105">
                <Clock className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                Check In
              </button>
              <button className="w-full px-5 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg text-sm font-semibold flex items-center justify-center gap-2 group hover:scale-105">
                <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
                View Profile
              </button>
              <button className="w-full px-5 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg text-sm font-semibold flex items-center justify-center gap-2 group hover:scale-105">
                <FileText className="w-4 h-4 group-hover:-rotate-12 transition-transform" />
                My Applications
              </button>
              <button className="w-full px-5 py-3.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all shadow-md hover:shadow-lg text-sm font-semibold flex items-center justify-center gap-2 group hover:scale-105">
                <BarChart3 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                View Details
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

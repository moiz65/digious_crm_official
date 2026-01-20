import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import {
  CalendarDays,
  TrendingUp,
  PieChart as PieChartIcon,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  Download
} from "lucide-react";

const leaveTrendData = [
  { month: "Jan", used: 2, allocated: 4 },
  { month: "Feb", used: 3, allocated: 4 },
  { month: "Mar", used: 1, allocated: 4 },
  { month: "Apr", used: 4, allocated: 4 },
  { month: "May", used: 2, allocated: 4 },
  { month: "Jun", used: 3, allocated: 4 },
  { month: "Jul", used: 2, allocated: 4 },
];

const leaveBalanceData = [
  { name: "Annual", value: 12, total: 20, color: "#10b981" },
  { name: "Sick", value: 6, total: 10, color: "#f59e0b" },
  { name: "Casual", value: 5, total: 8, color: "#8b5cf6" },
  { name: "Parental", value: 0, total: 12, color: "#ec4899" },
];

const teamLeaveData = [
  { name: "John D.", used: 8, allocated: 20 },
  { name: "Sarah M.", used: 12, allocated: 20 },
  { name: "Alex T.", used: 6, allocated: 20 },
  { name: "Maria L.", used: 15, allocated: 20 },
];

const recentRequests = [
  { type: "Annual", dates: "12 Mar – 14 Mar", status: "Approved", days: 3 },
  { type: "Sick", dates: "05 Apr", status: "Pending", days: 1 },
  { type: "Casual", dates: "22 Apr", status: "Rejected", days: 0.5 },
  { type: "Annual", dates: "28 Apr – 30 Apr", status: "Approved", days: 3 },
  { type: "Parental", dates: "15 May – 30 Jun", status: "Pending", days: 45 },
];

const upcomingLeaves = [
  { name: "John Doe", type: "Annual", from: "May 15", to: "May 20" },
  { name: "Sarah Smith", type: "Sick", from: "May 10", to: "May 10" },
  { name: "Michael Chen", type: "Casual", from: "May 12", to: "May 12" },
];

const COLORS = ["#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function LeaveManagement() {
  const totalUsed = leaveBalanceData.reduce((sum, item) => sum + item.value, 0);
  const totalAllocated = leaveBalanceData.reduce((sum, item) => sum + item.total, 0);
  const utilizationRate = (totalUsed / totalAllocated * 100).toFixed(1);

  const getStatusIcon = (status) => {
  switch (status) {
    case "Approved":
      return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    case "Pending":
      return <Clock className="w-4 h-4 text-amber-500" />;
    case "Rejected":
      return <XCircle className="w-4 h-4 text-rose-500" />;
    default:
      return null;
  }
};

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-lg">
              <CalendarDays className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Leave Management</h1>
              <p className="text-slate-600">Track your leaves, balances, and team availability</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-md">
            <FileText className="w-4 h-4" />
            Request Leave
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border-slate-200 bg-white">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Balance</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalAllocated} days</h3>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <CalendarDays className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Used: {totalUsed} days</span>
                <span>{utilizationRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${utilizationRate}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {leaveBalanceData.slice(0, 3).map((leave, index) => (
          <div key={leave.name} className="rounded-xl border-slate-200 bg-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{leave.name} Leave</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">
                    {leave.value} <span className="text-sm text-slate-400">/ {leave.total}</span>
                  </h3>
                </div>
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${leave.color}15` }}
                >
                  <div 
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: leave.color }}
                  />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Remaining: {leave.total - leave.value} days</span>
                  <span>{((leave.value / leave.total) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ width: `${(leave.value / leave.total) * 100}%`, backgroundColor: leave.color }}></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Team Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border-slate-200 bg-white lg:col-span-2">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-slate-700" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Leave Usage Trend</h3>
              </div>
              <span className="px-2 py-1 border border-slate-300 rounded text-slate-600 text-sm">Last 7 Months</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leaveTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="used"
                    name="Days Used"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#10b981" }}
                    activeDot={{ r: 6, fill: "#10b981" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="allocated"
                    name="Monthly Allocation"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4, fill: "#8b5cf6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-slate-200 bg-white">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <PieChartIcon className="w-4 h-4 text-slate-700" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Leave Distribution</h3>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leaveBalanceData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {leaveBalanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value} days`, name]}
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    wrapperStyle={{ paddingLeft: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Team & Recent Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border-slate-200 bg-white">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-slate-700" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Upcoming Team Leaves</h3>
              </div>
              <span className="px-2 py-1 border border-slate-300 rounded text-slate-600 text-sm">This Month</span>
            </div>
            <div className="space-y-4">
              {upcomingLeaves.map((leave, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-slate-200 to-slate-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-slate-700">
                        {leave.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{leave.name}</p>
                      <p className="text-sm text-slate-500">{leave.type} Leave</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">{leave.from} – {leave.to}</p>
                    <p className="text-sm text-slate-500">Planning</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border-slate-200 bg-white">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Recent Requests</h3>
            <div className="space-y-4">
              {recentRequests.map((req, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(req.status)}
                    <div>
                      <p className="font-medium text-slate-900">{req.type}</p>
                      <p className="text-sm text-slate-500">{req.dates}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-900">
                      {req.days} {req.days === 1 ? 'day' : 'days'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      req.status === "Approved" ? "border border-emerald-200 text-emerald-700 bg-emerald-50" :
                      req.status === "Pending" ? "border border-amber-200 text-amber-700 bg-amber-50" :
                      "border border-rose-200 text-rose-700 bg-rose-50"
                    }`}>
                      {req.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-gray-50 rounded">
              View All Requests
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats & Policies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border-slate-200 bg-white lg:col-span-2">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Team Leave Overview</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamLeaveData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="used" 
                    name="Days Used" 
                    fill="#8b5cf6" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="allocated" 
                    name="Total Allocated" 
                    fill="#cbd5e1" 
                    radius={[4, 4, 0, 0]}
                    opacity={0.3}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-slate-200 bg-white">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-start gap-3 h-12 px-4 py-2 border border-slate-300 rounded hover:bg-slate-50">
                <FileText className="w-4 h-4" />
                Apply for Leave
              </button>
              <button className="w-full flex items-center justify-start gap-3 h-12 px-4 py-2 border border-slate-300 rounded hover:bg-slate-50">
                <CalendarDays className="w-4 h-4" />
                View Calendar
              </button>
              <button className="w-full flex items-center justify-start gap-3 h-12 px-4 py-2 border border-slate-300 rounded hover:bg-slate-50">
                <Download className="w-4 h-4" />
                Download Reports
              </button>
              <button className="w-full flex items-center justify-start gap-3 h-12 px-4 py-2 border border-slate-300 rounded hover:bg-slate-50">
                <AlertCircle className="w-4 h-4" />
                View Policies
              </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h4 className="font-medium text-slate-900 mb-3">Leave Policies</h4>
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium text-slate-900">Annual Leave</span>
                  </div>
                  <p className="text-xs text-slate-600">20 days/year with carry forward option</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-sm font-medium text-slate-900">Sick Leave</span>
                  </div>
                  <p className="text-xs text-slate-600">10 days/year, medical certificate required</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="text-sm font-medium text-slate-900">Casual Leave</span>
                  </div>
                  <p className="text-xs text-slate-600">8 days/year with 2 days notice</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
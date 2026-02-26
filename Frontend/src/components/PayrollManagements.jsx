// PayrollManagement.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  Download,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Award,
  Percent,
  Briefcase,
  FileText,
  X,
  Eye,
  Printer,
  Mail,
  CheckCircle,
  AlertCircle,
  PieChart,
  BarChart3,
  Plus,
  Trash2,
  Edit,
  Save,
  RefreshCw,
  Banknote,
  Landmark,
  PiggyBank,
  Receipt,
  UserMinus,
  Clock4,
  MinusCircle,
} from "lucide-react";
import Chart from "chart.js/auto";

// Helper: format currency in PKR
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0).replace("PKR", "Rs.");
};

// Helper: format date
const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Helper: calculate days in month
const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

// Demo Data Generator
const generateDemoData = () => {
  const departments = ["Sales", "Production", "HR", "Operations", "Finance", "IT", "Marketing"];
  const employeeNames = [
    "Ahmed Khan", "Fatima Ali", "Muhammad Usman", "Ayesha Malik", "Bilal Ahmed",
    "Sara Zafar", "Omar Farooq", "Zainab Abbas", "Hassan Raza", "Nadia Akhtar",
    "Ali Raza", "Sana Mirza", "Usman Chaudhry", "Rabia Tariq", "Hamza Sheikh",
    "Iqra Naeem", "Saad Ahmed", "Mahnoor Ali", "Danish Iqbal", "Hira Tariq"
  ];
  
  const data = [];
  
  for (let i = 1; i <= 20; i++) {
    const basicSalary = Math.floor(Math.random() * 70000) + 30000; // 30,000 to 100,000 PKR
    const presentDays = Math.floor(Math.random() * 5) + 22; // 22-26 days
    const absentDays = Math.floor(Math.random() * 4); // 0-3 days
    const lateMarks = Math.floor(Math.random() * 5); // 0-4 late marks
    const leaves = Math.floor(Math.random() * 3); // 0-2 leaves
    const workingDays = 26;
    
    // Per day rate calculation
    const perDayRate = basicSalary / workingDays;
    
    // Calculate deductions
    const absentDeduction = absentDays * perDayRate;
    const lateDeduction = lateMarks * (perDayRate / 8); // Assuming 1 hour pay per late mark
    const leaveDeduction = leaves * perDayRate; // Unpaid leaves
    const loanDeduction = Math.random() > 0.8 ? Math.floor(Math.random() * 5000) : 0;
    
    const totalDeductions = absentDeduction + lateDeduction + leaveDeduction + loanDeduction;
    
    // Calculate earnings
    const hra = basicSalary * 0.4; // 40% house rent
    const da = basicSalary * 0.2; // 20% dearness allowance
    const conveyance = 3000; // Fixed conveyance PKR
    const medical = 2500; // Fixed medical PKR
    const special = Math.random() > 0.7 ? Math.floor(Math.random() * 10000) : 0;
    const bonus = Math.random() > 0.8 ? Math.floor(Math.random() * 15000) : 0;
    
    const totalEarnings = basicSalary + hra + da + conveyance + medical + special + bonus;
    const netSalary = totalEarnings - totalDeductions;
    
    // Random payment status
    const statuses = ["Processed", "Pending", "Processed", "Processed", "Pending", "Failed"];
    const paymentStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    data.push({
      id: i,
      employee_id: `EMP${String(i).padStart(3, '0')}`,
      employee_name: employeeNames[i - 1],
      department: departments[Math.floor(Math.random() * departments.length)],
      basic_salary: basicSalary,
      hra: hra,
      da: da,
      conveyance: conveyance,
      medical: medical,
      special: special,
      bonus: bonus,
      total_earnings: totalEarnings,
      absent_days: absentDays,
      late_marks: lateMarks,
      leaves: leaves,
      absent_deduction: absentDeduction,
      late_deduction: lateDeduction,
      leave_deduction: leaveDeduction,
      loan_deduction: loanDeduction,
      total_deductions: totalDeductions,
      net_salary: netSalary,
      present_days: presentDays,
      working_days: workingDays,
      payment_status: paymentStatus,
      payment_date: paymentStatus === "Processed" ? new Date().toISOString() : null,
      account_number: `PK36${Math.random().toString().slice(2, 16)}`,
      bank_name: ["HBL", "UBL", "Allied Bank", "MCB", "Bank Alfalah"][Math.floor(Math.random() * 5)],
      notes: Math.random() > 0.7 ? "Performance bonus included" : "",
    });
  }
  
  return data;
};

const PayrollManagements = () => {
  // State Management
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showPaySlipModal, setShowPaySlipModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [processingPayroll, setProcessingPayroll] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [useDemoData, setUseDemoData] = useState(true);
  
  // Payroll calculation settings (PKR rates)
  const [payrollSettings, setPayrollSettings] = useState({
    basicSalary: 0,
    hra: 40, // percentage
    da: 20, // percentage
    conveyance: 3000, // PKR
    medical: 2500, // PKR
    special: 0,
    bonus: 0,
    workingDays: 26,
    lateDeductionRate: 0.125, // 1/8 of daily wage per late mark
  });

  // Form state for new payroll entry
  const [newPayroll, setNewPayroll] = useState({
    employee_id: "",
    employee_name: "",
    department: "",
    month: selectedMonth,
    year: selectedYear,
    basic_salary: 0,
    hra: 0,
    da: 0,
    conveyance: 3000,
    medical: 2500,
    special: 0,
    bonus: 0,
    total_earnings: 0,
    absent_days: 0,
    late_marks: 0,
    leaves: 0,
    absent_deduction: 0,
    late_deduction: 0,
    leave_deduction: 0,
    loan_deduction: 0,
    total_deductions: 0,
    net_salary: 0,
    payment_status: "Pending",
    payment_date: null,
    present_days: 0,
    working_days: 26,
    account_number: "",
    bank_name: "",
    notes: "",
  });

  // Load demo data on initial render
  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const demoData = generateDemoData();
      setPayrollData(demoData);
      setLoading(false);
    }, 1000);
  }, []);

  // Calculate statistics
  const stats = {
    totalEmployees: payrollData.length,
    payrollProcessed: payrollData.filter(p => p.payment_status === "Processed").length,
    pendingPayments: payrollData.filter(p => p.payment_status === "Pending").length,
    totalSalary: payrollData.reduce((sum, p) => sum + (p.net_salary || 0), 0),
    totalEarnings: payrollData.reduce((sum, p) => sum + (p.total_earnings || 0), 0),
    totalDeductions: payrollData.reduce((sum, p) => sum + (p.total_deductions || 0), 0),
    averageSalary: payrollData.length > 0 
      ? payrollData.reduce((sum, p) => sum + (p.net_salary || 0), 0) / payrollData.length 
      : 0,
    totalAbsentDeductions: payrollData.reduce((sum, p) => sum + (p.absent_deduction || 0), 0),
    totalLateDeductions: payrollData.reduce((sum, p) => sum + (p.late_deduction || 0), 0),
    totalLeaveDeductions: payrollData.reduce((sum, p) => sum + (p.leave_deduction || 0), 0),
    totalLoanDeductions: payrollData.reduce((sum, p) => sum + (p.loan_deduction || 0), 0),
  };

  // Filter payroll data
  const filteredPayroll = payrollData.filter((record) => {
    const matchesSearch = !searchQuery ||
      record.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.employee_id?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.bank_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = selectedDepartment === "All Departments" ||
      record.department === selectedDepartment;
    
    const matchesStatus = selectedStatus === "All" ||
      record.payment_status === selectedStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  // Handle select all
  useEffect(() => {
    if (selectAll) {
      setSelectedEmployees(filteredPayroll.map(p => p.id));
    } else {
      setSelectedEmployees([]);
    }
  }, [selectAll, filteredPayroll]);

  // Calculate payroll for an employee
  const calculatePayroll = useCallback((employee, attendance, settings) => {
    const basicSalary = employee.salary || 0;
    const workingDays = settings.workingDays || 26;
    
    // Per day rate calculation
    const perDayRate = basicSalary / workingDays;
    
    // Get attendance data
    const absentDays = attendance?.absent_days || 0;
    const lateMarks = attendance?.late_marks || 0;
    const leaves = attendance?.leaves || 0;
    const presentDays = workingDays - absentDays - leaves;
    
    // Calculate allowances (percentage or fixed)
    const hra = basicSalary * (settings.hra / 100);
    const da = basicSalary * (settings.da / 100);
    const conveyance = settings.conveyance || 3000;
    const medical = settings.medical || 2500;
    const special = settings.special || 0;
    
    // Calculate bonus
    const bonus = settings.bonus || 0;
    
    // Total earnings (based on full basic salary)
    const totalEarnings = basicSalary + hra + da + conveyance + medical + special + bonus;
    
    // Calculate deductions
    const absentDeduction = absentDays * perDayRate;
    const lateDeduction = lateMarks * (perDayRate * settings.lateDeductionRate);
    const leaveDeduction = leaves * perDayRate; // Unpaid leaves
    const loanDeduction = attendance?.loan_deduction || 0;
    
    const totalDeductions = absentDeduction + lateDeduction + leaveDeduction + loanDeduction;
    
    // Net salary
    const netSalary = totalEarnings - totalDeductions;
    
    return {
      employee_id: employee.id,
      employee_name: employee.name,
      department: employee.department,
      month: selectedMonth,
      year: selectedYear,
      basic_salary: basicSalary,
      hra,
      da,
      conveyance,
      medical,
      special,
      bonus,
      total_earnings: totalEarnings,
      absent_days: absentDays,
      late_marks: lateMarks,
      leaves: leaves,
      absent_deduction: absentDeduction,
      late_deduction: lateDeduction,
      leave_deduction: leaveDeduction,
      loan_deduction: loanDeduction,
      total_deductions: totalDeductions,
      net_salary: netSalary,
      present_days: presentDays,
      working_days: workingDays,
    };
  }, [selectedMonth, selectedYear]);

  // Generate payroll for selected employees
  const generatePayroll = async () => {
    setProcessingPayroll(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In demo mode, just show success
      setShowBulkActionModal(false);
      
      // Show success message
      alert("Payroll generated successfully!");
    } catch (error) {
      console.error("Error generating payroll:", error);
    } finally {
      setProcessingPayroll(false);
    }
  };

  // Update payment status
  const updatePaymentStatus = async (id, status) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPayrollData(prev =>
        prev.map(p => p.id === id ? { 
          ...p, 
          payment_status: status,
          payment_date: status === "Processed" ? new Date().toISOString() : null 
        } : p)
      );
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  };

  // Bulk update status
  const bulkUpdateStatus = async (status) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPayrollData(prev =>
        prev.map(p => 
          selectedEmployees.includes(p.id) 
            ? { 
                ...p, 
                payment_status: status,
                payment_date: status === "Processed" ? new Date().toISOString() : null 
              } 
            : p
        )
      );
      
      setSelectedEmployees([]);
      setSelectAll(false);
      setShowBulkActionModal(false);
      
      alert(`Successfully updated ${selectedEmployees.length} records!`);
    } catch (error) {
      console.error("Error in bulk update:", error);
    }
  };

  // Add new payroll entry
  const addPayrollEntry = () => {
    // Calculate per day rate
    const perDayRate = newPayroll.basic_salary / newPayroll.working_days;
    
    // Calculate deductions
    const absentDeduction = (newPayroll.absent_days || 0) * perDayRate;
    const lateDeduction = (newPayroll.late_marks || 0) * (perDayRate * 0.125);
    const leaveDeduction = (newPayroll.leaves || 0) * perDayRate;
    
    // Calculate total earnings
    const totalEarnings = newPayroll.basic_salary + 
                         (newPayroll.hra || 0) + 
                         (newPayroll.da || 0) + 
                         newPayroll.conveyance + 
                         newPayroll.medical + 
                         (newPayroll.special || 0) + 
                         (newPayroll.bonus || 0);
    
    const totalDeductions = absentDeduction + lateDeduction + leaveDeduction + 
                           (newPayroll.loan_deduction || 0);
    
    const netSalary = totalEarnings - totalDeductions;
    
    const newEntry = {
      ...newPayroll,
      id: payrollData.length + 1,
      employee_id: `EMP${String(payrollData.length + 1).padStart(3, '0')}`,
      absent_deduction: absentDeduction,
      late_deduction: lateDeduction,
      leave_deduction: leaveDeduction,
      total_earnings: totalEarnings,
      total_deductions: totalDeductions,
      net_salary: netSalary,
      present_days: newPayroll.working_days - (newPayroll.absent_days || 0) - (newPayroll.leaves || 0),
    };
    
    setPayrollData([...payrollData, newEntry]);
    setShowAddModal(false);
    resetNewPayroll();
  };

  // Reset new payroll form
  const resetNewPayroll = () => {
    setNewPayroll({
      employee_id: "",
      employee_name: "",
      department: "",
      month: selectedMonth,
      year: selectedYear,
      basic_salary: 0,
      hra: 0,
      da: 0,
      conveyance: 3000,
      medical: 2500,
      special: 0,
      bonus: 0,
      total_earnings: 0,
      absent_days: 0,
      late_marks: 0,
      leaves: 0,
      absent_deduction: 0,
      late_deduction: 0,
      leave_deduction: 0,
      loan_deduction: 0,
      total_deductions: 0,
      net_salary: 0,
      payment_status: "Pending",
      payment_date: null,
      present_days: 0,
      working_days: 26,
      account_number: "",
      bank_name: "",
      notes: "",
    });
  };

  // Get department-wise salary summary
  const departmentSummary = departments.map(dept => {
    const deptData = payrollData.filter(p => p.department === dept);
    const totalSalary = deptData.reduce((sum, p) => sum + (p.net_salary || 0), 0);
    const avgSalary = deptData.length > 0 ? totalSalary / deptData.length : 0;
    return {
      department: dept,
      count: deptData.length,
      totalSalary,
      avgSalary,
    };
  }).filter(d => d.count > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="p-8 max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent mb-2">
                Payroll Management
              </h1>
              <p className="text-slate-600 font-medium flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                {new Date(selectedYear, selectedMonth).toLocaleDateString("en-PK", { 
                  month: "long", 
                  year: "numeric" 
                })} • {filteredPayroll.length} records • Total: {formatCurrency(stats.totalSalary)}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm">
                <span className="text-sm text-slate-600">Demo Mode:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useDemoData}
                    onChange={(e) => setUseDemoData(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div> */}
              
              {/* <button
                onClick={() => setShowBulkActionModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-blue-200 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300"
              >
                <RefreshCw className="h-4 w-4" />
                Generate Payroll
              </button> */}
              
              {/* <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-blue-200 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300"
              >
                <Plus className="h-4 w-4" />
                Add Entry
              </button> */}
              
              <button className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Month & Year Selector */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl shadow-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-slate-700">Payroll Period:</span>
            </div>
            
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(2000, i).toLocaleDateString("en-PK", { month: "long" })}
                </option>
              ))}
            </select>
            
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2">
                <UserMinus className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-slate-600">
                  Deductions: <span className="font-bold text-amber-600">{formatCurrency(stats.totalDeductions)}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview - Updated */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Salary Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <DollarSign className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{formatCurrency(stats.totalSalary)}</div>
                <div className="text-blue-100 text-xs font-medium">Total Payroll</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-blue-100 text-xs">
              <TrendingUp className="h-3 w-3" />
              <span>Avg: {formatCurrency(stats.averageSalary)}/employee</span>
            </div>
          </div>

          {/* Processed Payments Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.payrollProcessed}</div>
                <div className="text-blue-100 text-xs font-medium">Processed</div>
              </div>
            </div>
            <div className="text-blue-100 text-xs">
              {((stats.payrollProcessed / (payrollData.length || 1)) * 100).toFixed(1)}% completion
            </div>
          </div>

          {/* Pending Payments Card */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.pendingPayments}</div>
                <div className="text-amber-100 text-xs font-medium">Pending</div>
              </div>
            </div>
            <div className="text-amber-100 text-xs">
              {formatCurrency(payrollData.filter(p => p.payment_status === "Pending").reduce((s, p) => s + (p.net_salary || 0), 0))}
            </div>
          </div>

          {/* Deductions Card - Updated */}
          <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <MinusCircle className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{formatCurrency(stats.totalDeductions)}</div>
                <div className="text-rose-100 text-xs font-medium">Total Deductions</div>
              </div>
            </div>
            <div className="text-rose-100 text-xs flex flex-wrap items-center gap-2">
              <span>Absent: {formatCurrency(stats.totalAbsentDeductions)}</span>
              <span>|</span>
              <span>Late: {formatCurrency(stats.totalLateDeductions)}</span>
              <span>|</span>
              <span>Loan: {formatCurrency(stats.totalLoanDeductions)}</span>
            </div>
          </div>
        </div>

        {/* Department Summary */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              Department Wise Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {departmentSummary.map((dept) => (
                <div key={dept.department} className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700">{dept.department}</span>
                    <span className="text-sm text-slate-500">{dept.count} employees</span>
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(dept.totalSalary)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Avg: {formatCurrency(dept.avgSalary)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Filters Section */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-800">Filters</h3>
                {selectedEmployees.length > 0 && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    {selectedEmployees.length} selected
                  </span>
                )}
              </div>

              {selectedEmployees.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBulkActionModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Bulk Actions
                  </button>
                  <button
                    onClick={() => {
                      setSelectedEmployees([]);
                      setSelectAll(false);
                    }}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              )}
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by employee name, ID, bank, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Department
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                >
                  <option>All Departments</option>
                  <option>Sales</option>
                  <option>Production</option>
                  <option>HR</option>
                  <option>Operations</option>
                  <option>Finance</option>
                  <option>IT</option>
                  <option>Marketing</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Payment Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                >
                  <option>All</option>
                  <option>Processed</option>
                  <option>Pending</option>
                  <option>Failed</option>
                  <option>Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payroll Table */}
          <PayrollTable
            data={filteredPayroll}
            loading={loading}
            onViewDetails={(record) => {
              setSelectedEmployee(record);
              setShowPaySlipModal(true);
            }}
            onUpdateStatus={updatePaymentStatus}
            selectedEmployees={selectedEmployees}
            setSelectedEmployees={setSelectedEmployees}
            selectAll={selectAll}
            setSelectAll={setSelectAll}
            formatCurrency={formatCurrency}
          />
        </div>

        {/* Pay Slip Modal */}
        {showPaySlipModal && selectedEmployee && (
          <PaySlipModal
            payroll={selectedEmployee}
            onClose={() => {
              setShowPaySlipModal(false);
              setSelectedEmployee(null);
            }}
            onUpdateStatus={updatePaymentStatus}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        )}

        {/* Add Payroll Modal */}
        {showAddModal && (
          <AddPayrollModal
            newPayroll={newPayroll}
            setNewPayroll={setNewPayroll}
            onClose={() => {
              setShowAddModal(false);
              resetNewPayroll();
            }}
            onSave={addPayrollEntry}
            formatCurrency={formatCurrency}
          />
        )}

        {/* Bulk Action Modal */}
        {showBulkActionModal && (
          <BulkActionModal
            onClose={() => setShowBulkActionModal(false)}
            onGenerate={generatePayroll}
            onUpdateStatus={(status) => bulkUpdateStatus(status)}
            selectedCount={selectedEmployees.length}
            processing={processingPayroll}
            month={selectedMonth}
            year={selectedYear}
          />
        )}
      </div>
    </div>
  );
};

// Payroll Table Component - Updated with new columns
// PayrollTable Component - Fixed Layout
const PayrollTable = ({
  data,
  loading,
  onViewDetails,
  onUpdateStatus,
  selectedEmployees,
  setSelectedEmployees,
  selectAll,
  setSelectAll,
  formatCurrency,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-lg border border-slate-200">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  const handleSelectAll = (e) => {
    setSelectAll(e.target.checked);
  };

  const handleSelectEmployee = (id) => {
    setSelectedEmployees(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1400px] table-auto">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 z-10">
            <tr>
              <th className="w-12 px-2 py-4 text-left">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="w-[180px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Employee
              </th>
              <th className="w-[100px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Department
              </th>
              <th className="w-[100px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Basic Salary
              </th>
              <th className="w-[100px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Earnings
              </th>
              <th className="w-[120px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Attendance
              </th>
              <th className="w-[150px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Deductions
              </th>
              <th className="w-[100px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Net Salary
              </th>
              <th className="w-[100px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Status
              </th>
              <th className="w-[100px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-6 py-12 text-center text-slate-500">
                  No payroll records found for this period
                </td>
              </tr>
            ) : (
              data.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-slate-50 transition-colors duration-150"
                >
                  <td className="w-12 px-2 py-3">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(record.id)}
                      onChange={() => handleSelectEmployee(record.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="w-[180px] px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {record.employee_name?.charAt(0) || "U"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-800 text-sm truncate" title={record.employee_name}>
                          {record.employee_name}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {record.employee_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="w-[100px] px-3 py-3">
                    <span className="text-sm text-slate-700 block truncate" title={record.department}>
                      {record.department || "-"}
                    </span>
                  </td>
                  <td className="w-[100px] px-3 py-3">
                    <span className="text-sm font-medium text-slate-800 block">
                      {formatCurrency(record.basic_salary)}
                    </span>
                  </td>
                  <td className="w-[100px] px-3 py-3">
                    <span className="text-sm font-medium text-blue-600 block">
                      {formatCurrency(record.total_earnings)}
                    </span>
                  </td>
                  <td className="w-[120px] px-3 py-3">
                    <div className="flex flex-wrap items-center gap-1 text-xs">
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded" title="Present">
                        P:{record.present_days || 0}
                      </span>
                      {record.absent_days > 0 && (
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded" title="Absent">
                          A:{record.absent_days}
                        </span>
                      )}
                      {record.late_marks > 0 && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded" title="Late Marks">
                          L:{record.late_marks}
                        </span>
                      )}
                      {record.leaves > 0 && (
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded" title="Leaves">
                          LV:{record.leaves}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="w-[150px] px-3 py-3">
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-slate-700 block">
                        {formatCurrency(record.total_deductions)}
                      </span>
                      <div className="flex flex-wrap gap-1 text-xs text-slate-500">
                        {record.absent_deduction > 0 && (
                          <span className="px-1 py-0.5 bg-rose-50 rounded" title="Absent Deduction">
                            A:{formatCurrency(record.absent_deduction)}
                          </span>
                        )}
                        {record.late_deduction > 0 && (
                          <span className="px-1 py-0.5 bg-amber-50 rounded" title="Late Deduction">
                            L:{formatCurrency(record.late_deduction)}
                          </span>
                        )}
                        {record.loan_deduction > 0 && (
                          <span className="px-1 py-0.5 bg-purple-50 rounded" title="Loan Deduction">
                            LN:{formatCurrency(record.loan_deduction)}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="w-[100px] px-3 py-3">
                    <span className="text-base font-bold text-blue-600 block">
                      {formatCurrency(record.net_salary)}
                    </span>
                  </td>
                  <td className="w-[100px] px-3 py-3">
                    <select
                      value={record.payment_status}
                      onChange={(e) => onUpdateStatus(record.id, e.target.value)}
                      className={`w-full px-2 py-1.5 rounded-lg text-xs font-semibold border-0 cursor-pointer ${
                        record.payment_status === "Processed"
                          ? "bg-blue-100 text-blue-700"
                          : record.payment_status === "Pending"
                          ? "bg-amber-100 text-amber-700"
                          : record.payment_status === "Failed"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processed">Processed</option>
                      <option value="Failed">Failed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="w-[100px] px-3 py-3">
                    <button
                      onClick={() => onViewDetails(record)}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors duration-150 text-sm whitespace-nowrap"
                      title="View Pay Slip"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Pay Slip</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Table Footer with Summary */}
      {data.length > 0 && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">
              Showing <span className="font-semibold">{data.length}</span> records
            </span>
            <span className="text-slate-600">
              Total Net Salary: <span className="font-semibold text-blue-600">
                {formatCurrency(data.reduce((sum, p) => sum + (p.net_salary || 0), 0))}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Pay Slip Modal Component - Updated with new deduction types
const PaySlipModal = ({ payroll, onClose, onUpdateStatus, formatCurrency, formatDate }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Pay Slip</h2>
                <p className="text-blue-100 text-sm">
                  {payroll.employee_name} • {new Date(payroll.year, payroll.month).toLocaleDateString("en-PK", { month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Employee Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="text-xs text-slate-500">Employee ID</p>
              <p className="font-semibold text-slate-800">{payroll.employee_id}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Department</p>
              <p className="font-semibold text-slate-800">{payroll.department || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Bank Account</p>
              <p className="font-semibold text-slate-800">{payroll.bank_name} - {payroll.account_number}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Payment Date</p>
              <p className="font-semibold text-slate-800">
                {payroll.payment_date ? formatDate(payroll.payment_date) : "Not paid"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                payroll.payment_status === "Processed"
                  ? "bg-blue-100 text-blue-700"
                  : payroll.payment_status === "Pending"
                  ? "bg-amber-100 text-amber-700"
                  : payroll.payment_status === "Failed"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-slate-100 text-slate-700"
              }`}>
                {payroll.payment_status}
              </span>
            </div>
          </div>

          {/* Attendance Summary - Updated */}
          <div className="grid grid-cols-5 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <p className="text-xs text-blue-600">Working Days</p>
              <p className="text-lg font-bold text-blue-700">{payroll.working_days || 26}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <p className="text-xs text-green-600">Present</p>
              <p className="text-lg font-bold text-green-700">{payroll.present_days || 0}</p>
            </div>
            <div className="p-3 bg-rose-50 rounded-lg text-center">
              <p className="text-xs text-rose-600">Absent</p>
              <p className="text-lg font-bold text-rose-700">{payroll.absent_days || 0}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg text-center">
              <p className="text-xs text-amber-600">Late Marks</p>
              <p className="text-lg font-bold text-amber-700">{payroll.late_marks || 0}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-center">
              <p className="text-xs text-purple-600">Leaves</p>
              <p className="text-lg font-bold text-purple-700">{payroll.leaves || 0}</p>
            </div>
          </div>

          {/* Salary Breakdown */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Earnings */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Earnings (PKR)
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Basic Salary</span>
                  <span className="font-medium text-slate-800">{formatCurrency(payroll.basic_salary)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">House Rent (40%)</span>
                  <span className="font-medium text-slate-800">{formatCurrency(payroll.hra)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Dearness Allowance (20%)</span>
                  <span className="font-medium text-slate-800">{formatCurrency(payroll.da)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Conveyance</span>
                  <span className="font-medium text-slate-800">{formatCurrency(payroll.conveyance)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Medical</span>
                  <span className="font-medium text-slate-800">{formatCurrency(payroll.medical)}</span>
                </div>
                {payroll.special > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Special Allowance</span>
                    <span className="font-medium text-slate-800">{formatCurrency(payroll.special)}</span>
                  </div>
                )}
                {payroll.bonus > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Bonus</span>
                    <span className="font-medium text-blue-600">{formatCurrency(payroll.bonus)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 bg-blue-50 rounded-lg px-3 mt-2">
                  <span className="font-bold text-slate-700">Total Earnings</span>
                  <span className="font-bold text-blue-700">{formatCurrency(payroll.total_earnings)}</span>
                </div>
              </div>
            </div>

            {/* Deductions - Updated */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-rose-600" />
                Deductions (PKR)
              </h3>
              <div className="space-y-2">
                {payroll.absent_deduction > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Absent Days ({payroll.absent_days} days)</span>
                    <span className="font-medium text-rose-600">{formatCurrency(payroll.absent_deduction)}</span>
                  </div>
                )}
                {payroll.late_deduction > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Late Marks ({payroll.late_marks} marks)</span>
                    <span className="font-medium text-amber-600">{formatCurrency(payroll.late_deduction)}</span>
                  </div>
                )}
                {payroll.leave_deduction > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Unpaid Leaves ({payroll.leaves} days)</span>
                    <span className="font-medium text-purple-600">{formatCurrency(payroll.leave_deduction)}</span>
                  </div>
                )}
                {payroll.loan_deduction > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Loan Recovery</span>
                    <span className="font-medium text-rose-600">{formatCurrency(payroll.loan_deduction)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 bg-rose-50 rounded-lg px-3 mt-2">
                  <span className="font-bold text-slate-700">Total Deductions</span>
                  <span className="font-bold text-rose-700">{formatCurrency(payroll.total_deductions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Salary */}
          <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-blue-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Net Salary (PKR)</p>
                <p className="text-3xl font-bold text-blue-700">{formatCurrency(payroll.net_salary)}</p>
                <p className="text-xs text-slate-500 mt-1">Rupees {payroll.net_salary?.toLocaleString('en-PK')} only</p>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                  <Printer className="h-4 w-4" />
                  Print
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Mail className="h-4 w-4" />
                  Email
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          {payroll.notes && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-700">{payroll.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            {payroll.payment_status === "Pending" && (
              <button
                onClick={() => {
                  onUpdateStatus(payroll.id, "Processed");
                  onClose();
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Mark as Processed
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Add Payroll Modal Component - Updated with new fields
const AddPayrollModal = ({ newPayroll, setNewPayroll, onClose, onSave, formatCurrency }) => {
  const departments = ["Sales", "Production", "HR", "Operations", "Finance", "IT", "Marketing"];
  const banks = ["HBL", "UBL", "Allied Bank", "MCB", "Bank Alfalah", "Meezan Bank", "Faysal Bank"];

  // Calculate preview values
  const calculatePreview = () => {
    const basicSalary = newPayroll.basic_salary || 0;
    const workingDays = newPayroll.working_days || 26;
    const perDayRate = basicSalary / workingDays;
    
    const absentDeduction = (newPayroll.absent_days || 0) * perDayRate;
    const lateDeduction = (newPayroll.late_marks || 0) * (perDayRate * 0.125);
    const leaveDeduction = (newPayroll.leaves || 0) * perDayRate;
    
    const totalEarnings = basicSalary + 
                         (newPayroll.hra || 0) + 
                         (newPayroll.da || 0) + 
                         newPayroll.conveyance + 
                         newPayroll.medical + 
                         (newPayroll.special || 0) + 
                         (newPayroll.bonus || 0);
    
    const totalDeductions = absentDeduction + lateDeduction + leaveDeduction + 
                           (newPayroll.loan_deduction || 0);
    
    return {
      totalEarnings,
      totalDeductions,
      netSalary: totalEarnings - totalDeductions,
    };
  };

  const preview = calculatePreview();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800">Add Payroll Entry</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Employee Name
              </label>
              <input
                type="text"
                value={newPayroll.employee_name}
                onChange={(e) => setNewPayroll({ ...newPayroll, employee_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Department
              </label>
              <select
                value={newPayroll.department}
                onChange={(e) => setNewPayroll({ ...newPayroll, department: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Salary Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Basic Salary (PKR)
              </label>
              <input
                type="number"
                value={newPayroll.basic_salary}
                onChange={(e) => setNewPayroll({ ...newPayroll, basic_salary: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Working Days
              </label>
              <input
                type="number"
                value={newPayroll.working_days}
                onChange={(e) => setNewPayroll({ ...newPayroll, working_days: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="26"
              />
            </div>
          </div>

          {/* Attendance & Deductions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Absent Days
              </label>
              <input
                type="number"
                value={newPayroll.absent_days}
                onChange={(e) => setNewPayroll({ ...newPayroll, absent_days: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Late Marks
              </label>
              <input
                type="number"
                value={newPayroll.late_marks}
                onChange={(e) => setNewPayroll({ ...newPayroll, late_marks: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Unpaid Leaves
              </label>
              <input
                type="number"
                value={newPayroll.leaves}
                onChange={(e) => setNewPayroll({ ...newPayroll, leaves: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Loan Deduction (PKR)
              </label>
              <input
                type="number"
                value={newPayroll.loan_deduction}
                onChange={(e) => setNewPayroll({ ...newPayroll, loan_deduction: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Allowances */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                HRA (PKR)
              </label>
              <input
                type="number"
                value={newPayroll.hra}
                onChange={(e) => setNewPayroll({ ...newPayroll, hra: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                DA (PKR)
              </label>
              <input
                type="number"
                value={newPayroll.da}
                onChange={(e) => setNewPayroll({ ...newPayroll, da: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Special Allowance
              </label>
              <input
                type="number"
                value={newPayroll.special}
                onChange={(e) => setNewPayroll({ ...newPayroll, special: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Bonus
              </label>
              <input
                type="number"
                value={newPayroll.bonus}
                onChange={(e) => setNewPayroll({ ...newPayroll, bonus: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          {/* Bank Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Bank Name
              </label>
              <select
                value={newPayroll.bank_name}
                onChange={(e) => setNewPayroll({ ...newPayroll, bank_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Bank</option>
                {banks.map(bank => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Account Number
              </label>
              <input
                type="text"
                value={newPayroll.account_number}
                onChange={(e) => setNewPayroll({ ...newPayroll, account_number: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter account number"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Notes
            </label>
            <textarea
              value={newPayroll.notes}
              onChange={(e) => setNewPayroll({ ...newPayroll, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes"
              rows="2"
            />
          </div>

          {/* Calculated Summary */}
          <div className="bg-slate-50 p-4 rounded-xl">
            <h4 className="font-semibold text-slate-700 mb-3">Calculated Summary</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-slate-500">Total Earnings</p>
                <p className="font-bold text-blue-600">{formatCurrency(preview.totalEarnings)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Deductions</p>
                <p className="font-bold text-rose-600">{formatCurrency(preview.totalDeductions)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Net Salary</p>
                <p className="font-bold text-blue-600">{formatCurrency(preview.netSalary)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
};

// Bulk Action Modal Component - Updated with new deduction types
const BulkActionModal = ({ 
  onClose, 
  onGenerate, 
  onUpdateStatus, 
  selectedCount, 
  processing,
  month,
  year 
}) => {
  const [action, setAction] = useState("generate");
  
  const monthName = new Date(2000, month).toLocaleDateString("en-PK", { month: "long" });
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-800">Bulk Actions</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex gap-3">
            <button
              onClick={() => setAction("generate")}
              className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                action === "generate"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Generate
            </button>
            <button
              onClick={() => setAction("update")}
              className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                action === "update"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Update Status
            </button>
          </div>
          
          {action === "generate" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Generate payroll for all employees for {monthName} {year}.
                This will calculate salaries based on attendance records including:
              </p>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>• Absent Days: Full day deduction</li>
                  <li>• Late Marks: 1/8 day deduction per mark</li>
                  <li>• Unpaid Leaves: Full day deduction</li>
                  <li>• Loan Deductions: As per employee records</li>
                </ul>
              </div>
              
              <button
                onClick={onGenerate}
                disabled={processing}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Generate Payroll
                  </>
                )}
              </button>
            </div>
          )}
          
          {action === "update" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Update payment status for {selectedCount} selected employee{selectedCount !== 1 ? 's' : ''}.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onUpdateStatus("Processed")}
                  className="py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Processed
                </button>
                <button
                  onClick={() => onUpdateStatus("Pending")}
                  className="py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-colors"
                >
                  Pending
                </button>
                <button
                  onClick={() => onUpdateStatus("Failed")}
                  className="py-3 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors"
                >
                  Failed
                </button>
                <button
                  onClick={() => onUpdateStatus("Cancelled")}
                  className="py-3 bg-slate-600 text-white rounded-xl font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancelled
                </button>
              </div>
            </div>
          )}
          
          <button
            onClick={onClose}
            className="w-full py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Departments array for summary
const departments = ["Sales", "Production", "HR", "Operations", "Finance", "IT", "Marketing"];

export default PayrollManagements;
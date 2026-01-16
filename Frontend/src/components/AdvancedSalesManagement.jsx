import React, { useState } from 'react';
import {
  DollarSign, TrendingUp, Clock, CheckCircle,
  AlertCircle, Calendar, CreditCard, Building,
  Store, FileText, Plus, Filter, Download,
  Eye, Trash2, BarChart3, Target, Upload, Search,
  RefreshCw, X, PlusCircle, Percent, Wallet, Users,
  MoreVertical, Printer, Share2, UploadCloud, File,
  Check, DownloadCloud, PieChart, Activity, Award,
  Target as TargetIcon, Zap, Sparkles, TrendingDown,
  ArrowUpRight, ArrowDownRight, Banknote, Receipt,
  Layers, Package, ShoppingBag, Tag, Shield,
  Briefcase, UserCheck, ChartBar, ChartLine,
  Mail, Phone, Trophy, Star, Gift, Crown
} from 'lucide-react';

const AdvancedSalesManagement = () => {
  const [sales, setSales] = useState([
    {
      id: 'SALE-001',
      employeeId: 'EMP-0001',
      employeeName: 'John Smith',
      postingDate: '2024-01-15',
      totalSales: 8500,
      upfrontPayment: 4250,
      remainingBalance: 4250,
      designDetails: 'E-commerce website with mobile app integration, responsive design',
      deadline: '2024-02-28',
      accountName: 'TechNova Solutions',
      clientEmail: 'contact@technova.com',
      clientPhone: '+1 (555) 123-4567',
      merchantUsed: 'Stripe',
      paymentMethod: 'Credit Card',
      status: 'in-progress',
      notes: 'Client requested additional features, phase 1 completed',
      createdAt: '2024-01-15T10:30:00Z',
      attachments: ['design.pdf', 'contract.docx'],
      category: 'Web Development'
    },
    {
      id: 'SALE-002',
      employeeId: 'EMP-0001',
      employeeName: 'John Smith',
      postingDate: '2024-01-12',
      totalSales: 15000,
      upfrontPayment: 7500,
      remainingBalance: 7500,
      designDetails: 'Complete branding package including logo, stationery, social media templates',
      deadline: '2024-03-15',
      accountName: 'Global Marketing Inc.',
      clientEmail: 'info@globalmarketing.com',
      clientPhone: '+1 (555) 987-6543',
      merchantUsed: 'PayPal',
      paymentMethod: 'Bank Transfer',
      status: 'completed',
      notes: 'Project delivered ahead of schedule',
      createdAt: '2024-01-12T09:15:00Z',
      attachments: ['brand_guide.pdf', 'invoice.pdf'],
      category: 'Branding'
    }
  ]);

  const [showSalesForm, setShowSalesForm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('date');

  // Constants
  const MONTHLY_TARGET = 700; // $700 target for commission
  
  // Format currency function
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Calculate totals
  const totalSalesAmount = sales.reduce((sum, sale) => sum + sale.totalSales, 0);
  const totalUpfront = sales.reduce((sum, sale) => sum + sale.upfrontPayment, 0);
  const totalRemaining = sales.reduce((sum, sale) => sum + sale.remainingBalance, 0);
  
  // ✅ CORRECT COMMISSION CALCULATION:
  // 5% commission on TOTAL sales when employee reaches $700
  const targetAchieved = totalSalesAmount >= MONTHLY_TARGET;
  const commissionRate = targetAchieved ? 0.05 : 0; // 5% if target reached, 0% if not
  const totalCommission = Math.round(totalSalesAmount * commissionRate);
  
  // Sales summary
  const salesSummary = {
    totalSales: totalSalesAmount,
    totalUpfront: totalUpfront,
    totalRemaining: totalRemaining,
    totalCommission: totalCommission,
    totalSalesCount: sales.length,
    completedSales: sales.filter(s => s.status === 'completed').length,
    pendingSales: sales.filter(s => s.status === 'pending').length,
    inProgressSales: sales.filter(s => s.status === 'in-progress').length,
    overdueSales: sales.filter(s => s.status === 'overdue').length,
    completionRate: Math.round((sales.filter(s => s.status === 'completed').length / sales.length) * 100) || 0,
    averageSaleValue: Math.round(totalSalesAmount / sales.length) || 0,
    upfrontPercentage: Math.round((totalUpfront / totalSalesAmount) * 100) || 0,
    targetProgress: Math.min((totalSalesAmount / MONTHLY_TARGET) * 100, 100),
    targetAchieved: targetAchieved,
    commissionRate: commissionRate
  };

  // Handle add sale - NO EDIT OPTION
  const handleAddSale = (formData) => {
    const newSale = {
      id: `SALE-${Date.now().toString().slice(-6)}`,
      employeeId: 'EMP-0001',
      employeeName: 'John Smith',
      ...formData,
      remainingBalance: formData.totalSales - formData.upfrontPayment,
      status: 'pending',
      createdAt: new Date().toISOString(),
      attachments: [],
      category: formData.category || 'General'
    };
    
    // Add new sale
    const updatedSales = [newSale, ...sales];
    setSales(updatedSales);
    
    // Calculate new total
    const newTotal = updatedSales.reduce((sum, sale) => sum + sale.totalSales, 0);
    
    // Show celebration if target just achieved
    if (newTotal >= MONTHLY_TARGET && totalSalesAmount < MONTHLY_TARGET) {
      setTimeout(() => {
        alert(`🎉 Congratulations! You've reached your $${MONTHLY_TARGET} target!\nYou are now earning 5% commission on ALL your sales!`);
      }, 100);
    }
    
    setShowSalesForm(false);
  };

  // Handle delete sale
  const handleDeleteSale = (id) => {
    if (window.confirm('Are you sure you want to delete this sale? This action cannot be undone.')) {
      setSales(sales.filter(sale => sale.id !== id));
    }
  };

  // Handle upload
  const handleUploadSales = (fileData) => {
    console.log('Uploaded sales data:', fileData);
    alert('Sales data uploaded successfully!');
    setShowUploadModal(false);
  };

  // Filter and sort
  const filteredSales = sales
    .filter(sale => {
      const matchesStatus = filterStatus === 'all' || sale.status === filterStatus;
      const matchesSearch = searchQuery === '' ||
        sale.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.designDetails.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.merchantUsed.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'amount': return b.totalSales - a.totalSales;
        case 'deadline': return new Date(a.deadline) - new Date(b.deadline);
        default: return new Date(b.postingDate) - new Date(a.postingDate);
      }
    });

  // Get status config
  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return {
          color: 'green',
          icon: CheckCircle,
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          badgeColor: 'bg-green-100 text-green-800'
        };
      case 'in-progress':
        return {
          color: 'blue',
          icon: TrendingUp,
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          badgeColor: 'bg-blue-100 text-blue-800'
        };
      case 'pending':
        return {
          color: 'yellow',
          icon: Clock,
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          badgeColor: 'bg-yellow-100 text-yellow-800'
        };
      case 'overdue':
        return {
          color: 'red',
          icon: AlertCircle,
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          badgeColor: 'bg-red-100 text-red-800'
        };
      default:
        return {
          color: 'gray',
          icon: Clock,
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          badgeColor: 'bg-gray-100 text-gray-800'
        };
    }
  };

  // Performance cards
  const performanceCards = [
    {
      title: 'Total Sales Value',
      value: formatCurrency(salesSummary.totalSales),
      icon: DollarSign,
      gradient: 'from-blue-500 to-blue-600',
      description: 'All time sales amount'
    },
    {
      title: 'Upfront Collected',
      value: formatCurrency(salesSummary.totalUpfront),
      icon: Wallet,
      gradient: 'from-green-500 to-emerald-600',
      description: `Total upfront payments (${salesSummary.upfrontPercentage}%)`
    },
    {
      title: 'Pending Balance',
      value: formatCurrency(salesSummary.totalRemaining),
      icon: Clock,
      gradient: 'from-orange-500 to-amber-600',
      description: 'Amount yet to be collected'
    },
    {
      title: 'Earned Commission',
      value: formatCurrency(salesSummary.totalCommission),
      icon: Banknote,
      gradient: targetAchieved ? 'from-purple-500 to-violet-600' : 'from-gray-500 to-gray-600',
      description: targetAchieved ? '5% on all sales' : `0% (Need ${formatCurrency(MONTHLY_TARGET - totalSalesAmount)} more)`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Sales</h1>
                
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600">John Smith • EMP-0001</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-slate-700">Sales Executive</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Import Sales</span>
            </button> */}
            <button
              onClick={() => setShowSalesForm(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <PlusCircle className="h-5 w-5" />
              <span>Add New Sale</span>
            </button>
          </div>
        </div>

        {/* Target Progress */}
        {/* <div className="mb-6">
          <div className={`rounded-2xl p-6 ${targetAchieved ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-300' : 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200'}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${targetAchieved ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}>
                  {targetAchieved ? (
                    <Trophy className="h-6 w-6 text-white" />
                  ) : (
                    <TargetIcon className="h-6 w-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {targetAchieved ? '🎉 Monthly Target Achieved! 🎉' : 'Monthly Sales Target'}
                  </h3>
                  <p className="text-gray-600">
                    {targetAchieved 
                      ? `You're earning 5% commission on ALL ${formatCurrency(totalSalesAmount)} sales!`
                      : `Reach $${MONTHLY_TARGET} in total sales to unlock 5% commission`
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex-1 max-w-md">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-700">Total Sales</span>
                  <span className="font-bold text-slate-800">{formatCurrency(totalSalesAmount)} / {formatCurrency(MONTHLY_TARGET)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${targetAchieved ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}
                    style={{ width: `${salesSummary.targetProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span className="text-slate-500">Target: {formatCurrency(MONTHLY_TARGET)}</span>
                  <span className={`font-bold ${targetAchieved ? 'text-yellow-600' : 'text-blue-600'}`}>
                    {salesSummary.targetProgress.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              {targetAchieved && (
                <div className="bg-white border border-yellow-300 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Star className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-yellow-800">5% Commission Active!</p>
                      <p className="text-xs text-yellow-700">Earned: {formatCurrency(totalCommission)}</p>
                      <p className="text-xs text-slate-600">Applied to all ${formatCurrency(totalSalesAmount)} sales</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div> */}

        {/* Performance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {performanceCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-slate-800 mb-1">
                  {card.value}
                </h3>
                <p className="text-sm font-medium text-slate-700 mb-2">{card.title}</p>
                <p className="text-xs text-slate-500">{card.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sales Section */}
        <div className="lg:w-2/3">
          {/* Controls */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search sales..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sales Grid View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSales.map((sale) => {
              const statusConfig = getStatusConfig(sale.status);
              const StatusIcon = statusConfig.icon;
              // Calculate commission for this sale based on overall target
              const saleCommission = targetAchieved ? Math.round(sale.totalSales * 0.05) : 0;

              return (
                <div key={sale.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                          <Building className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800">{sale.accountName}</h3>
                          <p className="text-sm text-slate-500">ID: {sale.id}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSale(sale.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Sale"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Client Contact */}
                    <div className="flex items-center gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600 truncate">{sale.clientEmail}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">{sale.clientPhone}</span>
                      </div>
                    </div>

                    {/* Design Details */}
                    <div className="mb-4">
                      <p className="text-sm text-slate-600 line-clamp-2">{sale.designDetails}</p>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {sale.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-4 w-4 ${statusConfig.textColor}`} />
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusConfig.badgeColor}`}>
                          {sale.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Financial Info */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs text-slate-500 mb-1">Total Sales</p>
                        <p className="text-lg font-bold text-slate-800">{formatCurrency(sale.totalSales)}</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-xl">
                        <p className="text-xs text-blue-600 mb-1">Upfront Paid</p>
                        <p className="text-lg font-bold text-blue-700">{formatCurrency(sale.upfrontPayment)}</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-xl">
                        <p className="text-xs text-orange-600 mb-1">Remaining</p>
                        <p className="text-lg font-bold text-orange-700">{formatCurrency(sale.remainingBalance)}</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-xl">
                        <p className="text-xs text-purple-600 mb-1">Commission</p>
                        <p className="text-lg font-bold text-purple-700">{formatCurrency(saleCommission)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {targetAchieved ? '5% of sale' : 'Target not met'}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-slate-600">{sale.merchantUsed}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {sale.deadline}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredSales.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-slate-800 mb-2">No sales found</h3>
              <p className="text-slate-600 mb-6">Try adjusting your search or filter</p>
              <button
                onClick={() => setShowSalesForm(true)}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <PlusCircle className="h-5 w-5" />
                Add Your First Sale
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:w-1/3">
          {/* Commission Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Banknote className="h-5 w-5 text-green-600" />
              Commission Summary
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-600">Total Sales</p>
                  <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalSalesAmount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Commission Rate</p>
                  <p className="text-2xl font-bold text-green-600">{salesSummary.commissionRate * 100}%</p>
                </div>
              </div>

              <div className={`p-4 rounded-xl ${targetAchieved ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${targetAchieved ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {targetAchieved ? (
                      <Trophy className="h-5 w-5 text-green-600" />
                    ) : (
                      <TargetIcon className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {targetAchieved ? '5% Commission Active!' : 'Commission Target'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {targetAchieved 
                        ? `Applied to all ${formatCurrency(totalSalesAmount)} in sales`
                        : `Reach ${formatCurrency(MONTHLY_TARGET)} total sales to activate`
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Total Commission</span>
                  <span className="text-xl font-bold text-green-700">{formatCurrency(totalCommission)}</span>
                </div>
                <p className="text-xs text-gray-500">
                  {targetAchieved 
                    ? `5% of ${formatCurrency(totalSalesAmount)} total sales`
                    : 'Commission activates after reaching target'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {/* <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowSalesForm(true)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <PlusCircle className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Add New Sale</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <UploadCloud className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">Import Sales CSV</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-green-600" />
              </button>
            </div>
          </div> */}
        </div>
      </div>

      {/* Add Sale Modal */}
      {showSalesForm && (
        <AddSaleModal
          onSubmit={handleAddSale}
          onClose={() => setShowSalesForm(false)}
          currentTotalSales={totalSalesAmount}
          targetAchieved={targetAchieved}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUploadSales}
        />
      )}
    </div>
  );
};

// Add Sale Modal
const AddSaleModal = ({ onSubmit, onClose, currentTotalSales, targetAchieved }) => {
  const MONTHLY_TARGET = 700;
  
  const [formData, setFormData] = useState({
    postingDate: new Date().toISOString().split('T')[0],
    totalSales: 0,
    upfrontPayment: 0,
    designDetails: '',
    deadline: '',
    accountName: '',
    clientEmail: '',
    clientPhone: '',
    merchantUsed: 'Stripe',
    paymentMethod: 'Credit Card',
    notes: '',
    category: 'Web Development'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseFloat(value) || 0 : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.accountName.trim()) newErrors.accountName = 'Account name is required';
    if (!formData.clientEmail.trim()) newErrors.clientEmail = 'Client email is required';
    if (!formData.clientPhone.trim()) newErrors.clientPhone = 'Client phone is required';
    if (formData.totalSales <= 0) newErrors.totalSales = 'Total sales must be greater than 0';
    if (formData.upfrontPayment < 0) newErrors.upfrontPayment = 'Upfront payment cannot be negative';
    if (formData.upfrontPayment > formData.totalSales) newErrors.upfrontPayment = 'Upfront payment cannot exceed total sales';
    if (!formData.deadline) newErrors.deadline = 'Deadline is required';
    if (!formData.designDetails.trim()) newErrors.designDetails = 'Design details are required';
    if (!formData.category) newErrors.category = 'Category is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.clientEmail && !emailRegex.test(formData.clientEmail)) {
      newErrors.clientEmail = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    setTimeout(() => {
      onSubmit(formData);
      setIsSubmitting(false);
    }, 1000);
  };

  const remainingBalance = formData.totalSales - formData.upfrontPayment;
  const newTotalSales = currentTotalSales + formData.totalSales;
  const willAchieveTarget = !targetAchieved && newTotalSales >= MONTHLY_TARGET;
  const commissionRate = targetAchieved || willAchieveTarget ? 0.05 : 0;
  const saleCommission = Math.round(formData.totalSales * commissionRate);

  const categories = [
    'Web Development',
    'UI/UX Design',
    'Branding',
    'Marketing',
    'Consulting',
    'Maintenance',
    'Other'
  ];

  const merchants = [
    'Stripe',
    'PayPal',
    'Crypto',
    'CashApp',
    'Venmo',
    'Zelle',
    'Apple Pay'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Add New Sale</h3>
              <p className="text-sm text-gray-600">Enter details for your new sales transaction</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Account Details */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  Account Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Name *
                    </label>
                    <input
                      type="text"
                      name="accountName"
                      value={formData.accountName}
                      onChange={handleChange}
                      placeholder="Enter client/company name"
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.accountName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.accountName && (
                      <p className="text-red-500 text-xs mt-1">{errors.accountName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.category ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-red-500 text-xs mt-1">{errors.category}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Email *
                    </label>
                    <input
                      type="email"
                      name="clientEmail"
                      value={formData.clientEmail}
                      onChange={handleChange}
                      placeholder="client@company.com"
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.clientEmail ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.clientEmail && (
                      <p className="text-red-500 text-xs mt-1">{errors.clientEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Phone *
                    </label>
                    <input
                      type="tel"
                      name="clientPhone"
                      value={formData.clientPhone}
                      onChange={handleChange}
                      placeholder="+1 (555) 123-4567"
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.clientPhone ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.clientPhone && (
                      <p className="text-red-500 text-xs mt-1">{errors.clientPhone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Project Details */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Project Details
                </h4>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Design Details *
                  </label>
                  <textarea
                    name="designDetails"
                    value={formData.designDetails}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe the project, design requirements, or service provided..."
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.designDetails ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.designDetails && (
                    <p className="text-red-500 text-xs mt-1">{errors.designDetails}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Posting Date *
                    </label>
                    <input
                      type="date"
                      name="postingDate"
                      value={formData.postingDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deadline *
                    </label>
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.deadline ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.deadline && (
                      <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  Payment Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Sales Amount *
                    </label>
                    <input
                      type="number"
                      name="totalSales"
                      value={formData.totalSales}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.totalSales ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.totalSales && (
                      <p className="text-red-500 text-xs mt-1">{errors.totalSales}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upfront Payment *
                    </label>
                    <input
                      type="number"
                      name="upfrontPayment"
                      value={formData.upfrontPayment}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.upfrontPayment ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.upfrontPayment && (
                      <p className="text-red-500 text-xs mt-1">{errors.upfrontPayment}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method *
                    </label>
                    <select
                      name="merchantUsed"
                      value={formData.merchantUsed}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {merchants.map(merchant => (
                        <option key={merchant} value={merchant}>{merchant}</option>
                      ))}
                    </select>
                  </div>

                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {paymentMethods.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div> */}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h4 className="font-semibold text-gray-900 mb-4">Additional Notes</h4>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Any special instructions, requirements, or additional information..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              {/* Commission Alert */}
              {willAchieveTarget && (
                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-300 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Trophy className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-yellow-800">🎉 Target Will Be Achieved!</h4>
                      <p className="text-sm text-yellow-700">
                        After this sale, you'll earn 5% commission on ALL sales!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
                <h4 className="font-bold text-gray-900 mb-4">Transaction Summary</h4>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Sales</span>
                    <span className="font-bold text-gray-900">{formatCurrency(formData.totalSales)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Upfront Payment</span>
                    <span className="font-bold text-blue-600">{formatCurrency(formData.upfrontPayment)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Remaining Balance</span>
                    <span className={`font-bold ${remainingBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {formatCurrency(remainingBalance)}
                    </span>
                  </div>
                  <div className="h-px bg-gray-300 my-2"></div>
                  <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-blue-700">Commission</span>
                      <p className="text-xs text-blue-600">{commissionRate * 100}% rate</p>
                    </div>
                    <span className="font-bold text-blue-800">{formatCurrency(saleCommission)}</span>
                  </div>
                </div>
              </div>

              {/* Target Info */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TargetIcon className="h-5 w-5 text-blue-600" />
                  Commission Status
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Total</span>
                    <span className="font-bold text-gray-900">{formatCurrency(currentTotalSales)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">This Sale</span>
                    <span className="font-bold text-gray-900">{formatCurrency(formData.totalSales)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">New Total</span>
                    <span className="font-bold text-green-600">{formatCurrency(newTotalSales)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full ${newTotalSales >= MONTHLY_TARGET ? 'bg-green-500' : 'bg-blue-500'}`} 
                      style={{ width: `${Math.min((newTotalSales / MONTHLY_TARGET) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mt-2">
                      {targetAchieved ? (
                        <span className="text-green-600 font-bold">✓ 5% commission active</span>
                      ) : newTotalSales >= MONTHLY_TARGET ? (
                        <span className="text-yellow-600 font-bold">🎉 Will activate 5% commission!</span>
                      ) : (
                        `Need ${formatCurrency(MONTHLY_TARGET - newTotalSales)} more`
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white pt-4">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Upload Modal
const UploadModal = ({ onClose, onUpload }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        alert('Please upload a CSV file');
        return;
      }
      setFile(selectedFile);
      setUploaded(false);
    }
  };

  const handleUpload = () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setUploaded(true);
      setTimeout(() => {
        onUpload({ file });
      }, 1000);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Upload Sales Data</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Download Template */}
          <div className="mb-6 p-4 bg-blue-50 rounded-xl">
            <div className="flex items-start gap-3">
              <File className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">Download Template</h4>
                <p className="text-sm text-blue-700 mb-2">
                  Use our CSV template for proper formatting.
                </p>
                <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200">
                  <DownloadCloud className="h-3 w-3" />
                  Download Template.csv
                </button>
              </div>
            </div>
          </div>

          {/* File Upload Area */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File
            </label>
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition duration-200 ${
              file ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}>
              <UploadCloud className={`h-10 w-10 mx-auto mb-4 ${file ? 'text-blue-500' : 'text-gray-400'}`} />

              {file ? (
                <div>
                  <p className="font-medium text-gray-900 mb-1">{file.name}</p>
                  <p className="text-sm text-gray-600">{(file.size / 1024).toFixed(2)} KB</p>
                  <button
                    onClick={() => setFile(null)}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Drag & drop your CSV file here, or click to browse
                  </p>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".csv"
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition duration-200"
                  >
                    Browse Files
                  </label>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Supported format: CSV only. Maximum file size: 10MB
            </p>
          </div>

          {/* Success Message */}
          {uploaded && (
            <div className="mb-6 p-4 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-900">Upload Successful!</h4>
                  <p className="text-sm text-green-700">
                    Your sales data has been uploaded successfully.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload & Process
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSalesManagement;
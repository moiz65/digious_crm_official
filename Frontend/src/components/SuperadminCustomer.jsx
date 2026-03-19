import React, { useState } from "react";
import { 
  DollarSign, TrendingUp, CheckCircle, Calendar, 
  Trash2, X, PlusCircle, Search, Eye, Edit,Users,
  Mail, Phone, Filter
} from "lucide-react";

const SuperadminCustomer = () => {
  const [sales, setSales] = useState([
    {
      id: 'SALES-001',
      customerName: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1 (555) 123-4567',
      projectCategory: 'Website Development',
      onboardingDate: '2026-06-01',
      merchant: 'Stripe',
      agentName: 'Sarah Johnson',
      status: 'Completed'
    },
    {
      id: 'SALES-002',
      customerName: 'Emma Wilson',
      email: 'emma.w@company.com',
      phone: '+1 (555) 234-5678',
      projectCategory: 'E-commerce',
      onboardingDate: '2026-06-05',
      merchant: 'DigiousPayPal',
      agentName: 'Michael Chen',
      status: 'Completed'
    },
    {
      id: 'SALES-003',
      customerName: 'Robert Brown',
      email: 'rbrown@creative.com',
      phone: '+1 (555) 345-6789',
      projectCategory: 'Graphic Design',
      onboardingDate: '2026-06-10',
      merchant: 'Ziffs PayPal',
      agentName: 'Lisa Anderson',
      status: 'Pending'
    },
    {
      id: 'SALES-004',
      customerName: 'Maria Garcia',
      email: 'maria@techstart.com',
      phone: '+1 (555) 456-7890',
      projectCategory: 'Digital Marketing',
      onboardingDate: '2026-06-12',
      merchant: 'Innovative PayPal',
      agentName: 'David Wilson',
      status: 'In Progress'
    },
    {
      id: 'SALES-005',
      customerName: 'James Taylor',
      email: 'jtaylor@consulting.com',
      phone: '+1 (555) 567-8901',
      projectCategory: 'Consulting',
      onboardingDate: '2026-06-15',
      merchant: 'Crypto',
      agentName: 'Emily Davis',
      status: 'Completed'
    }
  ]);

  // States for filters
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState('All');
  const [selectedAgent, setSelectedAgent] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSales, setSelectedSales] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Form state for new sale
  const [newSale, setNewSale] = useState({
    customerName: '',
    email: '',
    phone: '',
    projectCategory: '',
    onboardingDate: '',
    merchant: '',
    agentName: ''
  });

  // Constants
  const CATEGORIES = ['Website Development', 'Graphic Design', 'Digital Marketing', 'E-commerce', 'Consulting', 'Other'];
  const MERCHANTS = ['All', 'Ziffs PayPal', 'DigiousPayPal', 'Innovative PayPal', 'Stripe', 'Crypto'];
  const AGENTS = ['All', 'Sarah Johnson', 'Michael Chen', 'Lisa Anderson', 'David Wilson', 'Emily Davis'];

  // Helper Functions
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getMerchantColor = (merchant) => {
    const colors = {
      'DigiousPayPal': 'bg-blue-50 text-blue-700',
      'Stripe': 'bg-purple-50 text-purple-700',
      'Innovative PayPal': 'bg-green-50 text-green-700',
      'Ziffs PayPal': 'bg-teal-50 text-teal-700',
      'Crypto': 'bg-orange-50 text-orange-700'
    };
    return colors[merchant] || 'bg-gray-50 text-gray-700';
  };

  // Filter sales based on criteria
  const filteredSales = sales.filter(sale => {
    // Customer search
    if (customerSearch) {
      const query = customerSearch.toUpperCase();
      if (!sale.customerName.toUpperCase().includes(query) && 
          !sale.email.toUpperCase().includes(query)) {
        return false;
      }
    }
    
    // Merchant filter
    if (selectedMerchant !== 'All' && sale.merchant !== selectedMerchant) return false;
    
    // Agent filter (keeping for filter functionality)
    if (selectedAgent !== 'All' && sale.agentName !== selectedAgent) return false;
    
    return true;
  });

  // Handle add sale
  const handleAddSale = (e) => {
    e.preventDefault();
    const sale = {
      id: `SALES-${Date.now().toString().slice(-6)}`,
      ...newSale,
      status: 'Pending'
    };
    setSales([...sales, sale]);
    setNewSale({
      customerName: '',
      email: '',
      phone: '',
      projectCategory: '',
      onboardingDate: '',
      merchant: '',
      agentName: ''
    });
    setShowAddForm(false);
  };

  // Handle delete sale
  const handleDeleteSale = (id) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      setSales(sales.filter(sale => sale.id !== id));
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedSales.length} sales?`)) {
      setSales(sales.filter(sale => !selectedSales.includes(sale.id)));
      setSelectedSales([]);
      setShowBulkActions(false);
    }
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedSales.length === filteredSales.length) {
      setSelectedSales([]);
    } else {
      setSelectedSales(filteredSales.map(s => s.id));
    }
  };

  // Toggle select single
  const toggleSelectSale = (saleId) => {
    setSelectedSales(prev => 
      prev.includes(saleId) 
        ? prev.filter(id => id !== saleId)
        : [...prev, saleId]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setCustomerSearch('');
    setSelectedMerchant('All');
    setSelectedAgent('All');
  };

  // Calculate totals
  const totalSales = sales.length;

  // Check if any filter is active
  const hasActiveFilters = customerSearch || selectedMerchant !== 'All' || selectedAgent !== 'All';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header with Summary Card */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Sales Onboarding Management</h1>
        {/* <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Onboarded Customers</p>
                <p className="text-2xl font-bold text-gray-900">{totalSales}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div> */}
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Customer Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name or email..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Merchant Filter */}
          <select
            value={selectedMerchant}
            onChange={(e) => setSelectedMerchant(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 min-w-[150px]"
          >
            {MERCHANTS.map(merchant => (
              <option key={merchant} value={merchant}>{merchant === 'All' ? 'All Merchants' : merchant}</option>
            ))}
          </select>

        

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center"
              >
                <X className="w-4 h-4 mr-1" />
                Clear Filters
              </button>
            )}
            
            {selectedSales.length > 0 && (
              <button
                onClick={() => setShowBulkActions(true)}
                className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete ({selectedSales.length})
              </button>
            )}
            
            
          </div>
        </div>

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs border-t pt-3">
            <span className="text-gray-500">Active filters:</span>
            {customerSearch && (
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full flex items-center">
                Customer: {customerSearch}
                <button onClick={() => setCustomerSearch('')} className="ml-1 hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedMerchant !== 'All' && (
              <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full flex items-center">
                Merchant: {selectedMerchant}
                <button onClick={() => setSelectedMerchant('All')} className="ml-1 hover:text-purple-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedAgent !== 'All' && (
              <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full flex items-center">
                Agent: {selectedAgent}
                <button onClick={() => setSelectedAgent('All')} className="ml-1 hover:text-green-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="mb-3 text-sm text-gray-500">
        Showing {filteredSales.length} of {sales.length} onboardings
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedSales.length === filteredSales.length && filteredSales.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Onboarding Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchant</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSales.map((sale) => (
              <tr key={sale.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedSales.includes(sale.id)}
                    onChange={() => toggleSelectSale(sale.id)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                    {formatDate(sale.onboardingDate)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">{sale.customerName}</div>
                  <div className="text-xs text-gray-500">{sale.id}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-3 h-3 mr-1 text-gray-400" />
                    {sale.email}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-3 h-3 mr-1 text-gray-400" />
                    {sale.phone}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">{sale.projectCategory}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getMerchantColor(sale.merchant)}`}>
                    {sale.merchant}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => alert(`View details: ${sale.id}`)}
                      className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => alert(`Edit: ${sale.id}`)}
                      className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSale(sale.id)}
                      className="p-1 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSales.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No onboardings found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or add a new onboarding</p>
            <button
              onClick={() => {
                clearFilters();
                setShowAddForm(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 inline-flex items-center"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add New Onboarding
            </button>
          </div>
        )}
      </div>

      {/* Add Onboarding Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Add New Onboarding</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleAddSale}>
                <div className="grid grid-cols-2 gap-4">
                  {/* Onboarding Date */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Onboarding Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={newSale.onboardingDate}
                      onChange={(e) => setNewSale({...newSale, onboardingDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Customer Name */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newSale.customerName}
                      onChange={(e) => setNewSale({...newSale, customerName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={newSale.email}
                      onChange={(e) => setNewSale({...newSale, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="john@example.com"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={newSale.phone}
                      onChange={(e) => setNewSale({...newSale, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  {/* Project Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Category *
                    </label>
                    <select
                      required
                      value={newSale.projectCategory}
                      onChange={(e) => setNewSale({...newSale, projectCategory: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Category</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Merchant */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Merchant *
                    </label>
                    <select
                      required
                      value={newSale.merchant}
                      onChange={(e) => setNewSale({...newSale, merchant: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Merchant</option>
                      {MERCHANTS.filter(m => m !== 'All').map(merchant => (
                        <option key={merchant} value={merchant}>{merchant}</option>
                      ))}
                    </select>
                  </div>

                  {/* Agent Name (hidden but required for filtering) */}
                  <input
                    type="hidden"
                    value={newSale.agentName}
                    onChange={(e) => setNewSale({...newSale, agentName: e.target.value})}
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Add Onboarding
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      {showBulkActions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Bulk Delete</h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete {selectedSales.length} selected onboardings? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowBulkActions(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                >
                  Delete {selectedSales.length}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperadminCustomer;
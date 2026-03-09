import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { Plus, Edit, Trash2 } from 'lucide-react';

const AdminExpense = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('expenses');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expenses, setExpenses] = useState([
    {
      id: '#1',
      date: '13 Mar 2026',
      time: '11:05 PM',
      category: 'Salaries',
      amount: 'PKR 30.00',
      note: 'Grocery'
    }
  ]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    note: ''
  });

  const categories = ['Salaries', 'Office Supplies', 'Travel', 'Utilities', 'Marketing', 'Other'];

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (formData.category && formData.amount) {
      const newExpense = {
        id: `#${expenses.length + 1}`,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        category: formData.category,
        amount: `PKR ${parseFloat(formData.amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`,
        note: formData.note
      };
      setExpenses([...expenses, newExpense]);
      setFormData({ category: '', amount: '', note: '' });
      setShowModal(false);
    }
  };

  const handleDeleteExpense = (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      setExpenses(expenses.filter(expense => expense.id !== id));
    }
  };

  const calculateTotal = () => {
    return expenses.reduce((sum, expense) => {
      const amount = parseFloat(expense.amount.replace('PKR ', '').replace(/,/g, ''));
      return sum + amount;
    }, 0);
  };

  const total = calculateTotal();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />

      {/* Main Content */}
      <div className={`
        flex-1 flex flex-col overflow-hidden
        transition-all duration-300 ease-in-out
        ${isSidebarCollapsed ? 'lg:ml-0' : 'lg:ml-0'}
      `}>
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-gray-100"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center">
              <div className="w-8 h-8 bg-[#349dff] rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-[#349dff] to-[#1e87e6] bg-clip-text text-transparent">
                Digious CRM
              </h1>
            </div>

            <div className="w-8 h-8 bg-gradient-to-r from-[#349dff] to-[#1e87e6] rounded-full flex items-center justify-center text-white font-semibold text-sm">
              A
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
              <p className="text-gray-600 text-sm mt-1">Track and manage your expenses</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Plus size={20} />
              Add Expense
            </button>
          </div>

          {/* Quick Date Range */}
          <div className="mb-6">
            <h3 className="text-gray-700 font-semibold mb-3">Quick Date Range</h3>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                Today
              </button>
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                This Week
              </button>
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                This Month
              </button>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Search expenses...</label>
                <input
                  type="text"
                  placeholder="Search expenses..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">From Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">To Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Category</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                  <option>All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>


          {/* Expenses Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">DATE</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">CATEGORY</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">AMOUNT</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">NOTE</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{expense.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{expense.date}</div>
                        <div className="text-xs text-gray-500">{expense.time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">{expense.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{expense.note}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>


          {/* Total Amount Card */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-l-4 border-blue-600 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 text-sm font-medium">Total Filtered Amount</h3>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-blue-600">
                  PKR {total.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Rows per page:
              <select className="ml-2 px-2 py-1 border border-gray-300 rounded">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              1–{expenses.length} of {expenses.length}
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="bg-blue-600 text-white px-6 py-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Plus size={24} />
                  Add New Expense
                </h2>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddExpense} className="p-6">
              <div className="space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Category <span className="text-blue-600">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Amount <span className="text-blue-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-600 text-lg">$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                      required
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Note</label>
                  <textarea
                    placeholder="Add a note..."
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 resize-none"
                    rows="3"
                  ></textarea>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-lg"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExpense;

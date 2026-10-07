// Frontend/src/pages/Sales/SalesPerformance.jsx

import React, { useState, useEffect } from 'react';
import { Trophy, Loader, TrendingUp, Award, Users } from 'lucide-react';
import { quarterService, performanceService } from '../../services/salesTierService';
import toast from 'react-hot-toast';

const AdminSalesPerformance = () => {
  const [quarters, setQuarters] = useState([]);
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuarters();
  }, []);

  useEffect(() => {
    if (selectedQuarter) {
      fetchPerformance(selectedQuarter);
    }
  }, [selectedQuarter]);

  const fetchQuarters = async () => {
    try {
      const res = await quarterService.getAll();
      setQuarters(res.data || []);
      if (res.data?.length > 0) {
        setSelectedQuarter(res.data[0].id);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const fetchPerformance = async (quarterId) => {
    setLoading(true);
    try {
      const res = await performanceService.getByQuarter(quarterId);
      setPerformance(res.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
              <Trophy className="w-8 h-8 text-blue-600" />
              Sales Performance
            </h1>
            <p className="text-slate-600 mt-1">
              Track quarterly performance and tier changes
            </p>
          </div>

          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Quarter</option>
            {quarters.map(q => (
              <option key={q.id} value={q.id}>
                {q.quarter_name} {q.year}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : performance.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-lg">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Performance Data</h3>
            <p className="text-gray-500">
              No evaluation results yet. Evaluate a quarter to see performance.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase">Employee</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase">Start Tier</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase">End Tier</th>
                    <th className="text-right py-4 px-6 text-xs font-bold text-gray-600 uppercase">Sales</th>
                    <th className="text-right py-4 px-6 text-xs font-bold text-gray-600 uppercase">Target</th>
                    <th className="text-right py-4 px-6 text-xs font-bold text-gray-600 uppercase">Achievement</th>
                    <th className="text-center py-4 px-6 text-xs font-bold text-gray-600 uppercase">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {performance.map((p, idx) => {
                    const changeColor = {
                      UPGRADE: 'bg-green-100 text-green-700',
                      DOWNGRADE: 'bg-red-100 text-red-700',
                      SAME: 'bg-gray-100 text-gray-700',
                    }[p.tier_change];

                    return (
                      <tr key={idx} className="hover:bg-blue-50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                              {(p.employee_name || 'U').charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{p.employee_name}</p>
                              <p className="text-xs text-gray-500">{p.employee_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            {p.tier_at_start_name}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            p.tier_change === 'UPGRADE' ? 'bg-green-100 text-green-700' :
                            p.tier_change === 'DOWNGRADE' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {p.tier_at_end_name}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-medium">
                          ${parseFloat(p.total_sales_usd).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-right text-gray-600">
                          ${parseFloat(p.quarterly_target_at_start).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className={`font-bold ${
                            parseFloat(p.achievement_percentage) >= 100 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {parseFloat(p.achievement_percentage).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${changeColor}`}>
                            {p.tier_change === 'UPGRADE' && '⬆️ '}
                            {p.tier_change === 'DOWNGRADE' && '⬇️ '}
                            {p.tier_change}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSalesPerformance;
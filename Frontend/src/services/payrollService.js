/**
 * Payroll Service
 * 
 * Frontend service for payroll API endpoints.
 * Uses the centralized api.js config for URL construction and auth headers.
 */

import { endpoints, apiRequest } from '../config/api';

/**
 * Get monthly payroll data
 * @param {number} year 
 * @param {number} month (1-12)
 * @returns {Promise<{records: Array, summary: Object}>}
 */
export const getMonthlyPayroll = async (year, month) => {
  const url = endpoints.payroll.getMonthly(year, month);
  const response = await apiRequest(url);
  return response.data;
};

/**
 * Generate payroll for all active employees
 * @param {number} month (1-12)
 * @param {number} year 
 * @returns {Promise<Object>} Generation result with counts
 */
export const generatePayroll = async (month, year) => {
  const url = endpoints.payroll.generate;
  const response = await apiRequest(url, {
    method: 'POST',
    body: JSON.stringify({ month, year }),
  });
  return response.data;
};

/**
 * Update a single payroll record's status
 * @param {number} id - Payroll record ID
 * @param {string} status - pending | processing | success | failed
 * @returns {Promise<Object>}
 */
export const updatePayrollStatus = async (id, status) => {
  const url = endpoints.payroll.updateStatus(id);
  const response = await apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
  return response.data;
};

/**
 * Bulk update payroll status
 * @param {Array<number>} ids - Array of payroll record IDs
 * @param {string} status - pending | processing | success | failed
 * @returns {Promise<Object>}
 */
export const bulkUpdatePayrollStatus = async (ids, status) => {
  const url = endpoints.payroll.bulkStatus;
  const response = await apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify({ ids, status }),
  });
  return response.data;
};

/**
 * Get detailed payslip for a single payroll record
 * @param {number} id - Payroll record ID
 * @returns {Promise<Object>} Full payslip data with allowances
 */
export const getPayslip = async (id) => {
  const url = endpoints.payroll.getPayslip(id);
  const response = await apiRequest(url);
  return response.data;
};

/**
 * Edit a payroll record (bonus, adjustment, adjustment_reason)
 * @param {number} id - Payroll record ID
 * @param {Object} data - { bonus, adjustment, adjustment_reason }
 * @returns {Promise<Object>}
 */
// services/payrollService.js - Already correct, but ensure this:

export const editPayrollRecord = async (id, data) => {
  const url = endpoints.payroll.editPayroll(id);
  console.log('📤 [editPayrollRecord] Sending to:', url);
  console.log('📤 [editPayrollRecord] Data:', data);

  const response = await apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  console.log('📥 [editPayrollRecord] Response:', response);
  return response.data;
};

export default {
  getMonthlyPayroll,
  generatePayroll,
  updatePayrollStatus,
  bulkUpdatePayrollStatus,
  getPayslip,
  editPayrollRecord,
};

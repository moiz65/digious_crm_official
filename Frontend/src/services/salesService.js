/**
 * Sales Service
 *
 * Frontend service for sales API endpoints.
 * Uses the centralized api.js config for URL construction and auth headers.
 */

import { endpoints, apiRequest, buildUrl } from '../config/api';

// ── Categories ─────────────────────────────────────────────

export const getSalesCategories = async () => {
  const response = await apiRequest(endpoints.sales.categories);
  return response.data;
};

export const createSalesCategory = async (categoryData) => {
  const response = await apiRequest(endpoints.sales.createCategory, {
    method: 'POST',
    body: JSON.stringify(categoryData),
  });
  return response.data;
};

export const updateSalesCategory = async (id, categoryData) => {
  const response = await apiRequest(endpoints.sales.updateCategory(id), {
    method: 'PUT',
    body: JSON.stringify(categoryData),
  });
  return response.data;
};

export const deleteSalesCategory = async (id) => {
  const response = await apiRequest(endpoints.sales.deleteCategory(id), {
    method: 'DELETE',
  });
  return response;
};

// ── Sales CRUD ─────────────────────────────────────────────

/**
 * Get all sales (admin view) with optional filters
 * @param {Object} filters - { from, to, category_id, status, employee_id, search }
 */
export const getAllSales = async (filters = {}) => {
  const url = buildUrl(endpoints.sales.getAll, filters);
  const response = await apiRequest(url);
  return response;
};

/**
 * Get logged-in employee's own sales
 * @param {Object} filters - { from, to, status, category_id }
 */
export const getMySales = async (filters = {}) => {
  const url = buildUrl(endpoints.sales.mySales, filters);
  const response = await apiRequest(url);
  return response;
};

/**
 * Get sales summary / analytics
 * @param {Object} filters - { from, to, employee_id }
 */
export const getSalesSummary = async (filters = {}) => {
  const url = buildUrl(endpoints.sales.summary, filters);
  const response = await apiRequest(url);
  return response.data;
};

/**
 * Get a single sale by ID
 */
export const getSaleById = async (id) => {
  const response = await apiRequest(endpoints.sales.getById(id));
  return response.data;
};

/**
 * Create a new sale
 * @param {Object} saleData
 */
export const createSale = async (saleData) => {
  const response = await apiRequest(endpoints.sales.create, {
    method: 'POST',
    body: JSON.stringify(saleData),
  });
  return response;
};

/**
 * Update an existing sale
 * @param {number} id
 * @param {Object} saleData
 */
export const updateSale = async (id, saleData) => {
  const response = await apiRequest(endpoints.sales.update(id), {
    method: 'PUT',
    body: JSON.stringify(saleData),
  });
  return response;
};

/**
 * Delete a sale
 * @param {number} id
 */
export const deleteSale = async (id) => {
  const response = await apiRequest(endpoints.sales.delete(id), {
    method: 'DELETE',
  });
  return response;
};

export default {
  getSalesCategories,
  createSalesCategory,
  updateSalesCategory,
  deleteSalesCategory,
  getAllSales,
  getMySales,
  getSalesSummary,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
};

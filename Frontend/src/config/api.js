// API Configuration Utility
// Centralized API endpoint configuration

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_VERSION = process.env.REACT_APP_API_VERSION || 'v1';
const API_PREFIX = `/api/${API_VERSION}`;

export const config = {
  API_BASE_URL,
  API_VERSION,
  API_PREFIX,
  FULL_API_URL: `${API_BASE_URL}${API_PREFIX}`,
  ENVIRONMENT: process.env.REACT_APP_ENV || 'development',
  APP_NAME: process.env.REACT_APP_NAME || 'Digious CRM',
  APP_VERSION: process.env.REACT_APP_VERSION || '1.0.0',
  SESSION_TIMEOUT: parseInt(process.env.REACT_APP_SESSION_TIMEOUT) || 30,
  INACTIVITY_WARNING: parseInt(process.env.REACT_APP_INACTIVITY_WARNING) || 5,
  ENABLE_ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  ENABLE_DEBUG: process.env.REACT_APP_ENABLE_DEBUG === 'true',
};

// API Endpoints
export const endpoints = {
  // Auth endpoints
  auth: {
    login: `${config.FULL_API_URL}/auth/login`,
    logout: `${config.FULL_API_URL}/auth/logout`,
    register: `${config.FULL_API_URL}/auth/register`,
    changePassword: `${config.FULL_API_URL}/auth/password`,
    verifyToken: `${config.FULL_API_URL}/auth/verify`,
    ipInfo: `${config.FULL_API_URL}/auth/ip-info`,
  },

  // Employee endpoints
  employees: {
    base: `${config.FULL_API_URL}/employees`,
    getById: (id) => `${config.FULL_API_URL}/employees/${id}`,
    create: `${config.FULL_API_URL}/employees`,
    update: (id) => `${config.FULL_API_URL}/employees/${id}`,
    delete: (id) => `${config.FULL_API_URL}/employees/${id}`,
    checkIdAvailability: (numericId) => `${config.FULL_API_URL}/check-employee-id/${numericId}`,
  },

  // Attendance endpoints
  attendance: {
    checkIn: `${config.FULL_API_URL}/attendance/check-in`,
    checkOut: `${config.FULL_API_URL}/attendance/check-out`,
    today: (employeeId) => `${config.FULL_API_URL}/attendance/today/${employeeId}`,
    monthly: (employeeId, year, month) => 
      `${config.FULL_API_URL}/attendance/monthly/${employeeId}?year=${year}&month=${month}`,
    all: `${config.FULL_API_URL}/attendance/all`,
    status: (employeeId) => `${config.FULL_API_URL}/attendance/status/${employeeId}`,
    generateAbsent: `${config.FULL_API_URL}/attendance/generate-absent`,
    
    // Break endpoints
    breakStart: `${config.FULL_API_URL}/attendance/break-start`,
    breakEnd: `${config.FULL_API_URL}/attendance/break-end`,
    breakProgress: `${config.FULL_API_URL}/attendance/break-progress`,
    ongoingBreaks: (employeeId) => `${config.FULL_API_URL}/attendance/ongoing-breaks/${employeeId}`,
    todayBreaks: (employeeId) => `${config.FULL_API_URL}/attendance/today-breaks/${employeeId}`,
  },

  // Rules endpoints
  rules: {
    breakRules: `${config.FULL_API_URL}/rules/break-rules`,
    workingHours: `${config.FULL_API_URL}/rules/working-hours`,
  },

  // System Info endpoints
  systemInfo: {
    record: `${config.FULL_API_URL}/system-info/record`,
    getByUser: (userId) => `${config.FULL_API_URL}/system-info/user/${userId}`,
  },

  // Activities endpoints
  activities: {
    base: `${config.FULL_API_URL}/activities`,
    getByUser: (userId) => `${config.FULL_API_URL}/activities/user/${userId}`,
  },

  // Health check
  health: `${API_BASE_URL}/api/health`,
};

// Helper function to build URL with query parameters
export const buildUrl = (baseUrl, params = {}) => {
  const url = new URL(baseUrl);
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined) {
      url.searchParams.append(key, params[key]);
    }
  });
  return url.toString();
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// API request helper with error handling
export const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Debug logger (only logs in development)
export const debugLog = (...args) => {
  if (config.ENABLE_DEBUG) {
    console.log('[DEBUG]', ...args);
  }
};

export default config;

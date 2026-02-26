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
    base: `${config.FULL_API_URL}/attendance`,
    
    // Absence Management endpoints
    absentToday: `${config.FULL_API_URL}/attendance/absent-today`,
    absentByDate: (date) => `${config.FULL_API_URL}/attendance/absent-by-date?date=${date}`,
    absentByRange: (startDate, endDate) => `${config.FULL_API_URL}/attendance/absent-by-range?start_date=${startDate}&end_date=${endDate}`,
    absentSummary: (startDate, endDate) => `${config.FULL_API_URL}/attendance/absent-summary${startDate && endDate ? `?start_date=${startDate}&end_date=${endDate}` : ''}`,
    allWithAbsent: `${config.FULL_API_URL}/attendance/all-with-absent`,
    
    // Break endpoints
    breakStart: `${config.FULL_API_URL}/attendance/break-start`,
    breakEnd: `${config.FULL_API_URL}/attendance/break-end`,
    breakProgress: `${config.FULL_API_URL}/attendance/break-progress`,
    ongoingBreaks: (employeeId) => `${config.FULL_API_URL}/attendance/ongoing-breaks/${employeeId}`,
    todayBreaks: (employeeId) => `${config.FULL_API_URL}/attendance/today-breaks/${employeeId}`,
    breakSummary: `${config.FULL_API_URL}/attendance/break-summary`,
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

  // Leave Management endpoints
  leaves: {
    requests: `${config.FULL_API_URL}/leaves/requests`,
    create: `${config.FULL_API_URL}/leaves/create`,
    approve: (id) => `${config.FULL_API_URL}/leaves/${id}/approve`,
    reject: (id) => `${config.FULL_API_URL}/leaves/${id}/reject`,
    balances: `${config.FULL_API_URL}/leaves/balances`,
    types: `${config.FULL_API_URL}/leaves/types`,
    calendar: `${config.FULL_API_URL}/leaves/calendar`,
    employeeBalance: (employeeId) => `${config.FULL_API_URL}/leaves/employee/${employeeId}/leaveBalance`,
    all: `${config.FULL_API_URL}/leaves/all`,
    statistics: `${config.FULL_API_URL}/leaves/statistics`,
  },

  // Health check
  health: `${API_BASE_URL}/api/health`,

  // Applications endpoints
  applications: {
    base: `${config.FULL_API_URL}/applications`,
    getById: (id) => `${config.FULL_API_URL}/applications/${id}`,
    getByEmployee: (employeeId) => `${config.FULL_API_URL}/applications/employee/${employeeId}`,
    create: `${config.FULL_API_URL}/applications`,
    update: (id) => `${config.FULL_API_URL}/applications/${id}`,
    updateStatus: (id) => `${config.FULL_API_URL}/applications/${id}/status`,
    delete: (id) => `${config.FULL_API_URL}/applications/${id}`,
    addDocument: (id) => `${config.FULL_API_URL}/applications/${id}/documents`,
    getStats: (employeeId) => `${config.FULL_API_URL}/applications/stats/${employeeId}`,
    getAll: `${config.FULL_API_URL}/applications/all`,
    searchEmployees: `${config.FULL_API_URL}/applications/employees/search`,
    assignedToMe: `${config.FULL_API_URL}/applications/assigned-to-me`,
    approve: (id) => `${config.FULL_API_URL}/applications/${id}/approve`,
    reject: (id) => `${config.FULL_API_URL}/applications/${id}/reject`,
    withdraw: (id) => `${config.FULL_API_URL}/applications/${id}/withdraw`,
    withdrawAssignment: (id) => `${config.FULL_API_URL}/applications/${id}/withdraw-assignment`,
    updatePriority: (id) => `${config.FULL_API_URL}/applications/${id}/priority`,
    approvalLog: (id) => `${config.FULL_API_URL}/applications/${id}/approval-log`,
    assignees: (id) => `${config.FULL_API_URL}/applications/${id}/assignees`
  },

  // Checkout Missing Management endpoints
  checkoutMissing: `${config.FULL_API_URL}/checkout-missing`,

  // Adjustment endpoints
  adjustments: {
    approvedTickets: `${config.FULL_API_URL}/adjustments/approved-tickets`,
    tickets: `${config.FULL_API_URL}/adjustments/tickets`,
    employeeData: (employeeId) => `${config.FULL_API_URL}/adjustments/employee-data/${employeeId}`,
    updateAttendance: (id) => `${config.FULL_API_URL}/adjustments/attendance/${id}`,
    addAttendance: `${config.FULL_API_URL}/adjustments/attendance`,
    updateLeaves: (employeeId) => `${config.FULL_API_URL}/adjustments/leaves/${employeeId}`,
    updateAbsent: (id) => `${config.FULL_API_URL}/adjustments/absent/${id}`,
    addAbsent: `${config.FULL_API_URL}/adjustments/absent`,
    deleteAbsent: (id) => `${config.FULL_API_URL}/adjustments/absent/${id}`,
    convertAbsentToPaidLeave: (id) => `${config.FULL_API_URL}/adjustments/absent/${id}/convert-to-paid-leave`,
    resolveCheckoutMissing: (id) => `${config.FULL_API_URL}/adjustments/checkout-missing/${id}`,
    closeTicket: (applicationId) => `${config.FULL_API_URL}/adjustments/close-ticket/${applicationId}`,
    ignoreTicket: (applicationId) => `${config.FULL_API_URL}/adjustments/ignore-ticket/${applicationId}`,
    log: (applicationId) => `${config.FULL_API_URL}/adjustments/log/${applicationId}`,
  }
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

// Helper function to decode JWT and extract user info
export const getDecodedToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    // JWT format: header.payload.signature
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Helper function to get current employee ID from token
export const getCurrentEmployeeId = () => {
  const decoded = getDecodedToken();
  return decoded?.employeeId || null;
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

// ============================================================
// TIMEZONE UTILITY - Pakistan Standard Time (PKT)
// ============================================================
// This file ensures all date/time operations use Pakistan timezone
// Timezone: Asia/Karachi (PKT - UTC+5)
// ============================================================

/**
 * Get current date and time in Pakistan timezone
 * @returns {Date} Date object representing current time in Pakistan
 */
export const getPakistanDate = () => {
  // Pakistan is UTC+5
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const pakistanTime = new Date(utc + (3600000 * 5)); // UTC+5
  return pakistanTime;
};

/**
 * Get current date string in YYYY-MM-DD format (Pakistan timezone)
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const getPakistanDateString = () => {
  const date = getPakistanDate();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get current time string in HH:MM:SS format (Pakistan timezone)
 * @returns {string} Time string in HH:MM:SS format
 */
export const getPakistanTimeString = () => {
  const date = getPakistanDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

/**
 * Get current datetime in ISO format for Pakistan timezone
 * @returns {string} ISO datetime string (Pakistan timezone)
 */
export const getPakistanISO = () => {
  return getPakistanDate().toISOString();
};

/**
 * Convert any date to Pakistan timezone
 * @param {Date|string} date - Date to convert
 * @returns {Date} Date in Pakistan timezone
 */
export const convertToPakistanTime = (date) => {
  const inputDate = new Date(date);
  const utc = inputDate.getTime() + (inputDate.getTimezoneOffset() * 60000);
  const pakistanTime = new Date(utc + (3600000 * 5)); // UTC+5
  return pakistanTime;
};

/**
 * Format date to local date string in Pakistan timezone
 * @param {Date|string} date - Date to format
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const formatPakistanDate = (date) => {
  const pkDate = convertToPakistanTime(date);
  const year = pkDate.getFullYear();
  const month = String(pkDate.getMonth() + 1).padStart(2, '0');
  const day = String(pkDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get yesterday's date in Pakistan timezone
 * @returns {Date} Yesterday's date in Pakistan timezone
 */
export const getPakistanYesterday = () => {
  const today = getPakistanDate();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
};

/**
 * Get yesterday's date string in YYYY-MM-DD format (Pakistan timezone)
 * @returns {string} Yesterday's date string
 */
export const getPakistanYesterdayString = () => {
  const yesterday = getPakistanYesterday();
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get Date.now() equivalent in Pakistan timezone
 * @returns {number} Timestamp in milliseconds
 */
export const getPakistanNow = () => {
  return getPakistanDate().getTime();
};

/**
 * Format time from Date object to HH:MM format (Pakistan timezone)
 * @param {Date} date - Date object
 * @returns {string} Time string in HH:MM format
 */
export const formatPakistanTime = (date) => {
  const pkDate = convertToPakistanTime(date);
  const hours = String(pkDate.getHours()).padStart(2, '0');
  const minutes = String(pkDate.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

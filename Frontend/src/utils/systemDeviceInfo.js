/**
 * Device and System Information Collector
 * Runs on the frontend to collect device/system info for login tracking
 */

import { endpoints } from '../config/api';

export const getSystemDeviceInfo = async () => {
  try {
    const info = {
      // Device Information
      deviceType: getDeviceType(),
      deviceName: getDeviceName(),
      browser: getBrowserInfo(),
      os: getOSInfo(),
      
      // Network Information
      ipAddress: null, // Will be set by backend using req.ip
      hostname: getHostname(),
      macAddress: 'N/A', // Cannot be retrieved from browser for security reasons
      
      // Geolocation (optional - requires user permission)
      country: null,
      city: null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      
      // User Agent
      userAgent: navigator.userAgent
    };
    
    return info;
  } catch (error) {
    console.error('❌ Error getting system info:', error);
    return {
      deviceType: 'Unknown',
      browser: 'Unknown',
      os: 'Unknown',
      userAgent: navigator.userAgent
    };
  }
};

/**
 * Determine device type based on user agent
 */
function getDeviceType() {
  const ua = navigator.userAgent.toLowerCase();
  
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return 'Mobile';
  } else if (/ipad|android|tablet|playbook|silk|kindle/i.test(ua)) {
    return 'Tablet';
  } else {
    return 'PC';
  }
}

/**
 * Get device name from user agent
 */
function getDeviceName() {
  const ua = navigator.userAgent;
  
  // iPhone
  if (ua.match(/iPhone/i)) return 'iPhone';
  // iPad
  if (ua.match(/iPad/i)) return 'iPad';
  // Android
  if (ua.match(/Android/i)) return 'Android Device';
  // Windows
  if (ua.match(/Windows/i)) return 'Windows PC';
  // Mac
  if (ua.match(/Macintosh/i)) return 'Mac';
  // Linux
  if (ua.match(/Linux/i)) return 'Linux PC';
  
  return 'Unknown Device';
}

/**
 * Get browser information
 */
function getBrowserInfo() {
  const ua = navigator.userAgent;
  
  // Chrome
  if (ua.match(/chrome|chromium|crios/i)) {
    return 'Chrome ' + ua.match(/(?:chrome|crios)\/(\d+)/i)[1];
  }
  // Firefox
  if (ua.match(/firefox|fxios/i)) {
    return 'Firefox ' + ua.match(/(?:firefox|fxios)\/(\d+)/i)[1];
  }
  // Safari
  if (ua.match(/safari/i)) {
    return 'Safari';
  }
  // Edge
  if (ua.match(/edg/i)) {
    return 'Edge ' + ua.match(/edg\/(\d+)/i)[1];
  }
  // Opera
  if (ua.match(/opr/i)) {
    return 'Opera ' + ua.match(/opr\/(\d+)/i)[1];
  }
  
  return 'Unknown Browser';
}

/**
 * Get operating system information
 */
function getOSInfo() {
  const ua = navigator.userAgent;
  
  // Windows
  if (ua.match(/windows|win32|win64/i)) {
    if (ua.match(/windows nt 10\.0/i)) return 'Windows 10';
    if (ua.match(/windows nt 6\.3/i)) return 'Windows 8.1';
    if (ua.match(/windows nt 6\.2/i)) return 'Windows 8';
    return 'Windows';
  }
  
  // macOS
  if (ua.match(/mac|macintosh|macintel/i)) {
    if (ua.match(/mac os x 13/i)) return 'macOS Ventura';
    if (ua.match(/mac os x 12/i)) return 'macOS Monterey';
    if (ua.match(/mac os x 11/i)) return 'macOS Big Sur';
    return 'macOS';
  }
  
  // iOS
  if (ua.match(/iphone|ipad|ipod/i)) {
    return 'iOS';
  }
  
  // Android
  if (ua.match(/android/i)) {
    return 'Android';
  }
  
  // Linux
  if (ua.match(/linux/i)) {
    return 'Linux';
  }
  
  return 'Unknown OS';
}

/**
 * Get hostname (computer name) - limited in browser
 */
function getHostname() {
  try {
    return window.location.hostname || 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
}

/**
 * Get IP address from backend call
 * (Browsers cannot access local network information for security)
 */
export const getIPAddress = async () => {
  try {
    const response = await fetch(endpoints.auth.ipInfo);
    if (response.ok) {
      const data = await response.json();
      return data.ipAddress;
    }
  } catch (error) {
    console.warn('Could not fetch IP address:', error);
  }
  return null;
};

/**
 * Get geolocation information (requires user permission)
 */
export const getGeolocation = async () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ country: null, city: null });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get country and city
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          
          if (response.ok) {
            const data = await response.json();
            resolve({
              country: data.address?.country || null,
              city: data.address?.city || data.address?.town || null,
              latitude,
              longitude
            });
          } else {
            resolve({ country: null, city: null });
          }
        } catch (error) {
          console.warn('Geolocation error:', error);
          resolve({ country: null, city: null });
        }
      },
      (error) => {
        console.warn('Geolocation permission denied:', error);
        resolve({ country: null, city: null });
      }
    );
  });
};

/**
 * Prepare device info for login request
 * Should be called before sending login request
 * 
 * OPTIMIZATION: Collects only essential info synchronously for fast login.
 * IP address and geolocation are collected asynchronously in background
 * after login succeeds to avoid blocking the login flow.
 */
export const prepareLoginDeviceInfo = async () => {
  // Only get base info synchronously for fast login
  // This avoids blocking the login for geolocation permissions or external API calls
  const baseInfo = getSystemDeviceInfo();
  
  return baseInfo;
};

/**
 * Collect device info asynchronously after login
 * This is called after successful login to avoid blocking the login process
 */
export const collectAdditionalDeviceInfoBackground = async () => {
  try {
    const ipAddress = await getIPAddress();
    const geolocation = await getGeolocation();
    
    return {
      ipAddress,
      ...geolocation
    };
  } catch (error) {
    console.warn('Background device info collection failed:', error);
    return {};
  }
};

/**
 * Format device info for display
 */
export const formatDeviceInfo = (deviceInfo) => {
  return {
    Device: `${deviceInfo.deviceType} - ${deviceInfo.deviceName}`,
    Browser: deviceInfo.browser,
    OS: deviceInfo.os,
    'IP Address': deviceInfo.ipAddress || 'N/A',
    'Hostname': deviceInfo.hostname,
    'Location': deviceInfo.city && deviceInfo.country 
      ? `${deviceInfo.city}, ${deviceInfo.country}` 
      : 'Unknown',
    'Timezone': deviceInfo.timezone
  };
};

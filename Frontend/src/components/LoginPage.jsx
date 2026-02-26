// components/LoginPage.jsx
//
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { prepareLoginDeviceInfo, collectAdditionalDeviceInfoBackground } from '../utils/systemDeviceInfo';
import { endpoints } from '../config/api';

const LoginPage = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        // Get device information
        const deviceInfo = await prepareLoginDeviceInfo();

        // Send login request to backend
        const response = await fetch(endpoints.auth.login, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            ...deviceInfo
          })
        });

        const data = await response.json();

        if (!response.ok) {
          setErrors({ submit: data.message || 'Invalid email or password' });
          setIsLoading(false);
          return;
        }

        // Extract user role from response
        // For employees: role is the department name from backend
        // Map department to proper role: admin, hr, or employee
        const backendRole = data.data.role || '';
        const department = data.data.department || '';
        
        let userRole = 'employee'; // Default
        
        if (backendRole.toLowerCase() === 'admin') {
          userRole = 'admin';
        } else if (department.toLowerCase() === 'hr' || backendRole.toLowerCase() === 'hr') {
          userRole = 'hr';
        } else {
          userRole = 'employee'; // All other departments are treated as employees
        }

        console.log('✅ Login successful:', data.data);
        console.log('Backend Role:', backendRole, 'Department:', department);
        console.log('Mapped User Role:', userRole);

        // Login with real user data from backend
        login({
          id: data.data.id,
          email: data.data.email,
          name: data.data.name,
          employeeId: data.data.employeeId,
          department: data.data.department
        }, userRole, data.data.token);

        // Collect additional device info in background (non-blocking)
        // This avoids delays from geolocation permissions or external API calls
        collectAdditionalDeviceInfoBackground().catch(error => {
          console.warn('⚠️ Background device info collection failed:', error);
        });

        // Check if password change is required
        if (data.data.requestPasswordChange) {
          console.log('🔐 Password change required on first login');
          navigate('/change-password');
          return;
        }

        // Navigate based on role (check-in is now manual only)
        if (userRole === 'admin') {
          navigate('/admin/dashboard');
        } else if (userRole === 'hr') {
          navigate('/hr/dashboard');
        } else {
          navigate('/employee/dashboard');
        }
        
      } catch (error) {
        console.error('❌ Login error:', error);
        setErrors({ submit: error.message || 'Login failed. Please try again.' });
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    alert('Password reset instructions will be sent to your email.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#349dff] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-[#5ab1ff] rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse animation-delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-[#8ac8ff] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-gray-100 relative z-10 overflow-hidden">
        {/* Header Section */}
        <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-white to-blue-50">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-[#349dff] rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#349dff] to-[#1e87e6] bg-clip-text text-transparent mb-2">
              Digious CRM
            </h1>
            <p className="text-gray-600 text-sm mb-4">Internal Employee Portal</p>
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>
        </div>

        <div className="p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Digious Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-white border rounded-xl shadow-sm focus:outline-none focus:ring-2 text-gray-900 placeholder-gray-500 transition duration-200 ${
                  errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#349dff]'
                }`}
                placeholder="Enter your Digious email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-[#349dff] hover:text-[#1e87e6] transition duration-200 font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white border rounded-xl shadow-sm focus:outline-none focus:ring-2 text-gray-900 placeholder-gray-500 transition duration-200 pr-12 ${
                    errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#349dff]'
                  }`}
                  placeholder="Enter your Digious password"   
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition duration-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Submit */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-[#349dff] focus:ring-[#349dff] border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                  Remember me for 30 days
                </label>
              </div>

              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600 text-center">{errors.submit}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-base font-medium text-white bg-gradient-to-r from-[#349dff] to-[#1e87e6] hover:from-[#1e87e6] hover:to-[#1674c4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#349dff] transition duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign in to Dashboard'
                )}
              </button>
            </div>

            {/* Demo Credentials */}
            {/* <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Demo Credentials:</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p><span className="font-medium">Admin:</span> admin@digious.com / admin123</p>
                <p><span className="font-medium">HR:</span> hr@digious.com / hr123</p>
                <p><span className="font-medium">Employee:</span> employee@digious.com / emp123</p>
              </div>
            </div> */}
          </form>

          {/* Sign Up Link */}
          {/* <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                className="font-medium text-[#349dff] hover:text-[#1e87e6] transition duration-200 inline-flex items-center"
              >
                Create account
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </p>
          </div> */}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-[2rem] left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-gray-500 text-sm">
          © 2025 Digious Solutions. All rights reserved.
        </p>
        <p className="text-gray-400 text-xs mt-1">
          Secure employee portal v2.1.0
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SignUpPage = () => {
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    userRole: '',
    employeeId: '',
    department: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      } else if (formData.firstName.trim().length < 2) {
        newErrors.firstName = 'First name must be at least 2 characters';
      }

      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      } else if (formData.lastName.trim().length < 2) {
        newErrors.lastName = 'Last name must be at least 2 characters';
      }

      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      } else if (!formData.email.endsWith('@digious.com')) {
        newErrors.email = 'Please use your Digious Solutions email';
      }
    }

    if (step === 2) {
      if (!formData.employeeId.trim()) {
        newErrors.employeeId = 'Employee ID is required';
      } else if (!/^DIG\d{3,}$/.test(formData.employeeId.toUpperCase())) {
        newErrors.employeeId = 'Employee ID should be in format DIG001';
      }

      if (!formData.department) {
        newErrors.department = 'Please select your department';
      }
    }

    if (step === 3) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Include uppercase, lowercase, and numbers';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (step === 4) {
      if (!formData.userRole) {
        newErrors.userRole = 'Please select your role';
      }
      if (!formData.agreeToTerms) {
        newErrors.agreeToTerms = 'You must agree to continue';
      }
    }

    return newErrors;
  };

  const handleNext = () => {
    const newErrors = validateStep(currentStep);
    if (Object.keys(newErrors).length === 0) {
      setCurrentStep(prev => prev + 1);
      setErrors({});
      // Scroll to top when moving to next step
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setErrors(newErrors);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateStep(4);
    
    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      
      // Simulate API call
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create user object
        const newUser = {
          ...formData,
          id: Date.now(),
          createdAt: new Date().toISOString(),
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.firstName + ' ' + formData.lastName)}&background=349dff&color=fff`
        };
        
        // Login through AuthContext with the selected role
        login({
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`,
          role: formData.userRole,
          ...newUser
        }, formData.userRole);
        
        // Success animation delay and navigate based on role
        setTimeout(() => {
          switch(formData.userRole) {
            case 'admin':
              navigate('/admin/dashboard');
              break;
            case 'hr':
              navigate('/hr/dashboard');
              break;
            case 'employee':
              navigate('/employee/dashboard');
              break;
            default:
              navigate('/login');
          }
        }, 500);
        
      } catch (error) {
        setErrors({ submit: 'Registration failed. Please try again.' });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  const roles = [
    { value: 'admin', label: 'Administrator', description: 'Full system access and management', icon: '⚙️', color: 'from-purple-500 to-pink-500' },
    { value: 'hr', label: 'HR Manager', description: 'Employee management and reporting', icon: '👥', color: 'from-green-500 to-teal-500' },
    { value: 'manager', label: 'Team Manager', description: 'Team and project management', icon: '📊', color: 'from-blue-500 to-cyan-500' },
    { value: 'salesagent', label: 'Sales Agent', description: 'Client management and sales', icon: '💼', color: 'from-orange-500 to-red-500' },
    { value: 'developer', label: 'Developer', description: 'Technical development team', icon: '💻', color: 'from-gray-600 to-gray-800' },
    { value: 'designer', label: 'Designer', description: 'Creative and UI/UX design', icon: '🎨', color: 'from-pink-500 to-rose-500' }
  ];

  const departments = [
    'Production & Development',
    'Product Design',
    'Digital Marketing',
    'Sales & Business Development',
    'Human Resources',
    'Project Management',
    'Quality Assurance',
    'Content Strategy',
    'SEO & SEM',
    'Social Media Management',
    'Client Services',
    'Operations'
  ];

  const steps = [
    { number: 1, title: 'Personal', description: 'Your Info', icon: '👤' },
    { number: 2, title: 'Work', description: 'Employment details', icon: '🏢' },
    { number: 3, title: 'Security', description: 'Account protection', icon: '🔒' },
    { number: 4, title: 'Role', description: 'Your position', icon: '🎯' }
  ];

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    const strengths = [
      { label: 'Very Weak', color: 'bg-red-500' },
      { label: 'Weak', color: 'bg-orange-500' },
      { label: 'Fair', color: 'bg-yellow-500' },
      { label: 'Good', color: 'bg-blue-500' },
      { label: 'Strong', color: 'bg-green-500' }
    ];
    
    return strengths[strength - 1] || { label: '', color: '' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-[#349dff] to-[#1e87e6] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl text-white">👤</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h3>
              <p className="text-gray-600">Let's start with your basic details</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white border-2 rounded-xl shadow-sm focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-500 ${
                    errors.firstName 
                      ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-[#349dff] focus:ring-2 focus:ring-blue-100'
                  }`}
                  placeholder="Enter your first name"
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600 animate-shake">{errors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white border-2 rounded-xl shadow-sm focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-500 ${
                    errors.lastName 
                      ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-[#349dff] focus:ring-2 focus:ring-blue-100'
                  }`}
                  placeholder="Enter your last name"
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600 animate-shake">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Work Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-white border-2 rounded-xl shadow-sm focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-500 ${
                  errors.email 
                    ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-[#349dff] focus:ring-2 focus:ring-blue-100'
                }`}
                placeholder="your.name@digious.com"
              />
              {errors.email ? (
                <p className="text-sm text-red-600 animate-shake">{errors.email}</p>
              ) : (
                <p className="text-xs text-gray-500 flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Use your official Digious Solutions email address
                </p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-[#349dff] to-[#1e87e6] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl text-white">🏢</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Employment Details</h3>
              <p className="text-gray-600">Your Digious Solutions information</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                Employee ID *
              </label>
              <input
                id="employeeId"
                name="employeeId"
                type="text"
                value={formData.employeeId}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-white border-2 rounded-xl shadow-sm focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-500 uppercase ${
                  errors.employeeId 
                    ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-[#349dff] focus:ring-2 focus:ring-blue-100'
                }`}
                placeholder="DIG001"
              />
              {errors.employeeId && (
                <p className="text-sm text-red-600 animate-shake">{errors.employeeId}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                Department *
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-white border-2 rounded-xl shadow-sm focus:outline-none transition-all duration-300 text-gray-900 ${
                  errors.department 
                    ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-[#349dff] focus:ring-2 focus:ring-blue-100'
                }`}
              >
                <option value="">Select your department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept} className="py-2">{dept}</option>
                ))}
              </select>
              {errors.department && (
                <p className="text-sm text-red-600 animate-shake">{errors.department}</p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-[#349dff] to-[#1e87e6] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl text-white">🔒</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Account Security</h3>
              <p className="text-gray-600">Create a strong password to protect your account</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white border-2 rounded-xl shadow-sm focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-500 ${
                    errors.password 
                      ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-[#349dff] focus:ring-2 focus:ring-blue-100'
                  }`}
                  placeholder="Create a strong password"
                />
                {formData.password && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">Password strength:</span>
                      <span className={`font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${passwordStrength.color}`}
                        style={{ width: `${(formData.password.length > 0 ? passwordStrength.strength : 0) * 20}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {errors.password && (
                  <p className="text-sm text-red-600 animate-shake">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white border-2 rounded-xl shadow-sm focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-500 ${
                    errors.confirmPassword 
                      ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-[#349dff] focus:ring-2 focus:ring-blue-100'
                  }`}
                  placeholder="Re-enter your password"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 animate-shake">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                  <span className="text-blue-500 mr-2">💡</span>
                  Password Requirements
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li className="flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${formData.password.length >= 8 ? 'bg-green-400' : 'bg-blue-300'}`}></span>
                    At least 8 characters long
                  </li>
                  <li className="flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${/(?=.*[a-z])/.test(formData.password) ? 'bg-green-400' : 'bg-blue-300'}`}></span>
                    One lowercase letter
                  </li>
                  <li className="flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${/(?=.*[A-Z])/.test(formData.password) ? 'bg-green-400' : 'bg-blue-300'}`}></span>
                    One uppercase letter
                  </li>
                  <li className="flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${/(?=.*\d)/.test(formData.password) ? 'bg-green-400' : 'bg-blue-300'}`}></span>
                    One number
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-[#349dff] to-[#1e87e6] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl text-white">🎯</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Select Your Role</h3>
              <p className="text-gray-600">Choose how you'll contribute to Digious Solutions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map(role => (
                <label
                  key={role.value}
                  className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 group ${
                    formData.userRole === role.value
                      ? 'border-[#349dff] bg-blue-50 shadow-lg shadow-blue-100 scale-105'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="userRole"
                    value={role.value}
                    checked={formData.userRole === role.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex items-start space-x-3">
                    <div className={`w-12 h-12 bg-gradient-to-r ${role.color} rounded-lg flex items-center justify-center text-white text-lg flex-shrink-0`}>
                      {role.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-gray-900 group-hover:text-gray-800">
                          {role.label}
                        </span>
                        {formData.userRole === role.value && (
                          <div className="w-3 h-3 bg-[#349dff] rounded-full animate-ping"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 leading-tight">
                        {role.description}
                      </p>
                    </div>
                  </div>
                  {formData.userRole === role.value && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#349dff] rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </label>
              ))}
            </div>
            {errors.userRole && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl animate-shake">
                <p className="text-sm text-red-600 text-center">{errors.userRole}</p>
              </div>
            )}

            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-200 mt-6">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="mt-1 h-5 w-5 text-[#349dff] focus:ring-[#349dff] border-gray-300 rounded transition duration-200"
              />
              <label htmlFor="agreeToTerms" className="block text-sm text-gray-700 leading-relaxed">
                I agree to the{' '}
                <a href="#" className="font-medium text-[#349dff] hover:text-[#1e87e6] transition duration-200 underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="font-medium text-[#349dff] hover:text-[#1e87e6] transition duration-200 underline">
                  Privacy Policy
                </a>{' '}
                of Digious Solutions. I understand that my account will be subject to company policies and procedures.
              </label>
            </div>
            {errors.agreeToTerms && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl animate-shake">
                <p className="text-sm text-red-600 text-center">{errors.agreeToTerms}</p>
              </div>
            )}

            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl animate-shake">
                <p className="text-sm text-red-600 text-center">{errors.submit}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-[#349dff] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-[#5ab1ff] rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-float animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-[#8ac8ff] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float animation-delay-4000"></div>
      </div>

      {/* Main Card */}
      <div className="max-w-4xl w-full bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 relative z-10 overflow-hidden">
        {/* Header Section */}
        <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-white to-blue-50/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-[#349dff] to-[#1e87e6] rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#349dff] to-[#1e87e6] bg-clip-text text-transparent">
                  Digious CRM
                </h1>
                <p className="text-gray-600 text-sm">Join our team workspace</p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 border border-blue-200">
                <div className="w-2 h-2 bg-[#349dff] rounded-full mr-2 animate-pulse"></div>
                <span className="text-blue-700 text-sm font-medium">Step {currentStep} of 4</span>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 transform ${
                      currentStep >= step.number
                        ? 'bg-gradient-to-r from-[#349dff] to-[#1e87e6] border-transparent text-white shadow-lg shadow-blue-200 scale-110'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                      {currentStep > step.number ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-sm font-semibold">{step.icon}</span>
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <div className={`text-sm font-medium transition-all duration-300 ${
                        currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </div>
                      <div className={`text-xs transition-all duration-300 ${
                        currentStep >= step.number ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {step.description}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 transition-all duration-500 ${
                      currentStep > step.number 
                        ? 'bg-gradient-to-r from-[#349dff] to-[#1e87e6]' 
                        : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit}>
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={handleBack}
                className={`flex items-center px-6 py-3 border rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  currentStep === 1 
                    ? 'opacity-50 cursor-not-allowed border-gray-300 text-gray-400 bg-gray-100' 
                    : 'border-gray-300 text-gray-700 bg-white hover:border-gray-400 hover:bg-gray-50 hover:shadow-lg'
                }`}
                disabled={currentStep === 1}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center px-8 py-3 bg-gradient-to-r from-[#349dff] to-[#1e87e6] hover:from-[#1e87e6] hover:to-[#1674c4] text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Continue
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Complete Registration
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              Already part of our team?{' '}
              <Link 
                to="/login" 
                className="font-semibold text-[#349dff] hover:text-[#1e87e6] transition duration-200 hover:underline"
              >
                Sign in to your workspace
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default SignUpPage;
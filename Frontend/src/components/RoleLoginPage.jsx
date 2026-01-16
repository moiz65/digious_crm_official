import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, User, Shield, Briefcase } from 'lucide-react';

const RoleLoginPage = () => {
  const [username, setUsername] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: username, 2: role selection
  const navigate = useNavigate();
  const { login } = useAuth();

  const roles = [
    {
      id: 'admin',
      name: 'Admin',
      icon: Shield,
      description: 'Full system access and management',
      color: 'from-red-500 to-pink-600'
    },
    {
      id: 'hr',
      name: 'HR Manager',
      icon: Briefcase,
      description: 'Manage employees and attendance',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      id: 'employee',
      name: 'Employee',
      icon: User,
      description: 'View own profile and attendance',
      color: 'from-green-500 to-emerald-600'
    }
  ];

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      setStep(2);
      setError('');
    } else {
      setError('Please enter a username');
    }
  };

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    login(username, roleId);
    
    // Redirect based on role
    const roleRoutes = {
      admin: '/admin/dashboard',
      hr: '/hr/dashboard',
      employee: '/employee/dashboard'
    };
    
    navigate(roleRoutes[roleId]);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedRole('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Digious CRM</h1>
          <p className="text-gray-400">Professional Team Management System</p>
        </div>

        {/* Step 1: Username Input */}
        {step === 1 && (
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Welcome Back</h2>
            
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-opacity-20 transition"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500 bg-opacity-20 border border-red-500 border-opacity-50 rounded-lg text-red-200 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-700 transition duration-300 flex items-center justify-center space-x-2"
              >
                <LogIn className="w-5 h-5" />
                <span>Continue</span>
              </button>
            </form>

            <p className="text-center text-gray-400 text-sm mt-6">
              Demo: Use any username (e.g., admin, john, sarah)
            </p>
          </div>
        )}

        {/* Step 2: Role Selection */}
        {step === 2 && (
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20 shadow-2xl">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Select Your Role</h2>
              <p className="text-gray-300">Welcome, <span className="font-semibold text-blue-400">{username}</span></p>
            </div>

            <div className="space-y-3">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleRoleSelect(role.id)}
                    className={`w-full p-4 rounded-xl border-2 transition duration-300 flex items-start space-x-4 ${
                      selectedRole === role.id
                        ? 'border-blue-400 bg-blue-500 bg-opacity-20'
                        : 'border-white border-opacity-20 bg-white bg-opacity-5 hover:bg-opacity-10'
                    }`}
                  >
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${role.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-semibold text-white">{role.name}</h3>
                      <p className="text-sm text-gray-300">{role.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleBack}
              className="w-full mt-6 py-2 text-gray-300 hover:text-white transition"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          © 2024 Digious CRM. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default RoleLoginPage;

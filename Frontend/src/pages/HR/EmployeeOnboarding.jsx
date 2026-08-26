// Frontend/src/pages/HR/EmployeeOnboarding.jsx
import React, { useState, useEffect } from 'react';
import Employee_onboarding_compo from '../../components/Employee_onboarding_compo';
import HrSidebar from '../../components/HrSidebar';
import { useNavigate } from 'react-router-dom';

const EmployeeOnboarding = () => {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('employees');
  const [showPassword, setShowPassword] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [employees, setEmployees] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-10 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">Processing Employee Data</p>
              <p className="text-sm text-gray-600 mt-2">Please wait while we save the information...</p>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <HrSidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />

      <main className="flex-1 overflow-y-auto">
        <Employee_onboarding_compo />
      </main>

    </div>
  );
};

export default EmployeeOnboarding;
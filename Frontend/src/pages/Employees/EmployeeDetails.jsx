import React, { useState, useEffect, useCallback } from 'react';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import EmployeePersonalProfile from '../../components/EmployeePersonalProfile';
import {DashboardHeader} from '../../components/DashboardComponents';

const Attendance = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);

  // Get logged-in user's employee ID
  useEffect(() => {
    const loadEmployeeId = () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          const id = user.employeeId || user.employee_id || user.id;
          setEmployeeId(id);
          console.log('✅ Employee ID loaded from localStorage:', id);
        }
      } catch (e) {
        console.error('Error reading user from localStorage:', e);
      }
    };
    
    loadEmployeeId();
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <EmployeeSidebar 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />

      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader title="My Profile" />
          
          {/* Mobile Header */}
          <header className="lg:hidden bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div className="flex items-center">
                <div className="w-8 h-8 bg-[#349dff] rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-[#349dff] to-[#1e87e6] bg-clip-text text-transparent">
                  Digious CRM
                </h1>
              </div>

              <div className="w-8 h-8 bg-gradient-to-r from-[#349dff] to-[#1e87e6] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                SA
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <EmployeePersonalProfile employeeId={employeeId} />
          </main>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={closeMobileMenu}
            aria-label="Close menu"
          />
          <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">
            <EmployeeSidebar 
              isCollapsed={false}
              setIsCollapsed={setIsMobileMenuOpen}
              activeItem={activeItem}
              setActiveItem={setActiveItem}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
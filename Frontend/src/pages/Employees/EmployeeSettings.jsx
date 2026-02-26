import React, { useState } from 'react';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import { DashboardHeader} from '../../components/DashboardComponents';
import { useAuth } from '../../context/AuthContext';
import EmployeeManagementDashboard from '../../components/EmployeeManagementDashboard';

const EmployeeSettings = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('user-roles');

  return (
    <div className="flex  bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <EmployeeSidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          title="Settings"
          
        />
        

        <EmployeeManagementDashboard />

        
      </div>
    </div>
  );
};

export default EmployeeSettings;

import React, { useState } from 'react';
import HrSidebar from '../../components/HrSidebar';
import { DashboardHeader} from '../../components/DashboardComponents';
import { useAuth } from '../../context/AuthContext';
import HrLeaveManagement from '../../components/HrLeaveManagement';

const LeaveManagement = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('leaves');

  return (
    <div className="flex bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <HrSidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          title="Leave Management"
          subtitle="Manage employee leave requests and balances"
        />
        

        <HrLeaveManagement/>

        
      </div>
    </div>
  );
};

export default LeaveManagement;

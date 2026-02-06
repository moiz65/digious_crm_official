import React, { useState } from 'react';
import HrSidebar from '../../components/HrSidebar';
import { DashboardHeader} from '../../components/DashboardComponents';
import { useAuth } from '../../context/AuthContext';
import HrManageReport from '../../components/HrManageReport';

const HrReportsManagementPage = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('reports-management');
  return (
    <div className="flex  bg-gradient-to-br from-gray-50 to-gray-100">
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
          title="Reports and Analytics"
          subtitle="View and Manage Employee Reports and Analytics"
        />
        

        <HrManageReport />

        
      </div>
    </div>
  );
};

export default HrReportsManagementPage;

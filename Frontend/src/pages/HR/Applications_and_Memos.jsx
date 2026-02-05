import React, { useState } from 'react';
import HrSidebar from '../../components/HrSidebar';
import { DashboardHeader} from '../../components/DashboardComponents';
import HrApplicationMemos from '../../components/HrApplicationMemos';

const Applications_and_Memos = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('applications-memos');
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
          title="Applications and Memos"
          subtitle="Manage employee applications and internal memos"
        />
        

        <HrApplicationMemos />

        
      </div>
    </div>
  );
};

export default Applications_and_Memos;

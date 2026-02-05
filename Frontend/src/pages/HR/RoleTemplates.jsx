import React, { useState } from 'react';
import HrSidebar from '../../components/HrSidebar';
import { DashboardHeader} from '../../components/DashboardComponents';
import { useAuth } from '../../context/AuthContext';
import RoleTemplatesManagement from '../../components/RoleTemplatesManagement';

const RoleTemplates = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('user-roles');

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
          title="Manage Role"
          subtitle="Manage employee User Roles"
        />
        

        <RoleTemplatesManagement />

        
      </div>
    </div>
  );
};

export default RoleTemplates;

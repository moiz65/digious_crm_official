import React, { useState } from 'react';
import HrSidebar from '../../components/HrSidebar';
import { DashboardHeader} from '../../components/DashboardComponents';
import { useAuth } from '../../context/AuthContext';
import UserRole_Permissions from '../../components/UserRole_Permissions';

const UserRoles_and_Permissions = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('user-roles');

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
          title="User Roles and Permissions"
          subtitle="Manage employee User Roles and Permissions"
        />
        

        <UserRole_Permissions />

        
      </div>
    </div>
  );
};

export default UserRoles_and_Permissions;

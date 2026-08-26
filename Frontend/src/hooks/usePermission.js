// hooks/usePermission.js
import { useAuth } from '../context/AuthContext';

export const usePermission = () => {
  const { user } = useAuth();

  const hasPermission = (permissionName) => {
    // Super Admin has all permissions
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      return true;
    }
    
    // Check if user has the permission
    return user?.permissions?.includes(permissionName) || false;
  };

  const hasAnyPermission = (permissionNames) => {
    return permissionNames.some(p => hasPermission(p));
  };

  const hasAllPermissions = (permissionNames) => {
    return permissionNames.every(p => hasPermission(p));
  };

  return { hasPermission, hasAnyPermission, hasAllPermissions };
};
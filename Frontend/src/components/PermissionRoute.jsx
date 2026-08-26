// components/PermissionRoute.jsx
import { Navigate } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';

const PermissionRoute = ({ children, permission, fallbackPath = '/unauthorized' }) => {
  const { hasPermission } = usePermission();

  if (!hasPermission(permission)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default PermissionRoute;
import { Navigate } from 'react-router-dom';
import useUserStore  from '../store/userStore.js';

const ProtectRoute = ({ children }) => {
  const { isAuthenticated, user, userRole } = useUserStore();

  if (!isAuthenticated && !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AuthenticatedUserRoute = ({ children }) => {
  const { isAuthenticated, user, userRole } = useUserStore();

  if (isAuthenticated && user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export { ProtectRoute, AuthenticatedUserRoute };

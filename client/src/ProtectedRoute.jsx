import { Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import PropTypes from "prop-types";
import { UserContext } from "./UserContext";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, ready } = useContext(UserContext);
  const location = useLocation();

  // Show loading state while checking authentication
  if (!ready) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role and redirect if not authorized
  if (user.role !== requiredRole) {
    // Redirect to appropriate dashboard or home based on role
    if (user.role === "host") {
      return <Navigate to="/host" replace />;
    } else if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRole: PropTypes.string.isRequired,
};

export default ProtectedRoute;

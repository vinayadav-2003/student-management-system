import { Navigate, useLocation } from "react-router-dom";

const isTokenValid = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

const getUserRole = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.role) return payload.role.toUpperCase();
    return "HEADMASTER";
  } catch {
    return null;
  }
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();

  if (!isTokenValid()) {
    sessionStorage.setItem(
      "redirectAfterLogin",
      location.pathname + location.search
    );
    return <Navigate to="/" replace />;
  }
  if (allowedRoles) {
    const role = getUserRole();
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/read" replace />;
    }
  }
  return children;
};

export default ProtectedRoute;
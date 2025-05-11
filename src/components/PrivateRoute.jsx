
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
    const isAuthenticated = sessionStorage.getItem("auth") === "true";
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;

import { Navigate, Outlet } from "react-router-dom";
import { authStorage } from "./authStorage";

export default function PrivateRoute({ allowedRoles }) {
    if (!authStorage.isLoggedIn()) {
        return <Navigate to="/login" replace />;
    }

    const { role } = authStorage.getProfile();

    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
import { Navigate, Outlet } from "react-router-dom";
import { authStorage } from "./authStorage";
import { useAuth } from "../context/useAuth";

export default function PrivateRoute({ allowedRoles }) {
    const { profile, loadingProfile } = useAuth();

    const token = authStorage.getToken();
    const role = profile?.role || authStorage.getProfile()?.role;

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (loadingProfile && !role) {
        return null;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
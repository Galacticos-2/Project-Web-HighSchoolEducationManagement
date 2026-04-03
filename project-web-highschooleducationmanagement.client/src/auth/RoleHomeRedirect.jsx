import { Navigate } from "react-router-dom";
import { authStorage } from "./authStorage";
import { useAuth } from "../context/useAuth";

export default function RoleHomeRedirect() {
    const { profile, loadingProfile } = useAuth();
    const role = profile?.role || authStorage.getProfile()?.role;

    if (loadingProfile && !role) return null;

    if (role === "Teacher") return <Navigate to="/teacher" replace />;
    if (role === "Student") return <Navigate to="/student" replace />;
    if (role === "Admin") return <Navigate to="/admin" replace />;

    return <Navigate to="/login" replace />;
}
import { Navigate } from "react-router-dom";
import { authStorage } from "./authStorage";

export default function RoleHomeRedirect() {
    const { role } = authStorage.getProfile();

    if (role === "Teacher") return <Navigate to="/teacher" replace />;
    if (role === "Student") return <Navigate to="/student" replace />;
    if (role === "Admin") return <Navigate to="/admin" replace />;
    // Nếu có token nhưng thiếu role -> quay về login (hoặc trang lỗi)
    return <Navigate to="/login" replace />;
}
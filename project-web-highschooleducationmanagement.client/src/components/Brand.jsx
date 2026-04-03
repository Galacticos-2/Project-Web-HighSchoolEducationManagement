// src/components/Brand.jsx
import { useNavigate } from "react-router-dom";
import { authStorage } from "../auth/authStorage";
import { BRANDING } from "../config/branding";
import "../styles/Brand.css";
const getHomePathByRole = (role) => {
    switch (role) {
        case "Teacher":
            return "/teacher";
        case "Student":
            return "/student";
        case "Admin":
            return "/admin";
        default:
            return "/";
    }
};

export default function Brand() {
    const nav = useNavigate();
    const profile = authStorage.getProfile();
    const role = profile?.role;

    const goHome = () => nav(getHomePathByRole(role), { replace: true });

    return (
        <button type="button" className="teacher-brand" onClick={goHome} title="Về trang chủ">
            <div className="teacher-brand__logo" aria-hidden="true">
                <img
                    src={BRANDING.logoUrl}
                    alt="Logo trường"
                    onError={(e) => {
                        // fallback nếu logo bị thiếu
                        e.currentTarget.style.display = "none";
                    }}
                />
            </div>
            <div className="teacher-brand__name">{BRANDING.schoolName}</div>
        </button>
    );
}
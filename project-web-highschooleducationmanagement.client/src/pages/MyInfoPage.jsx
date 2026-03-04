// src/pages/MyInfoPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import { authStorage } from "../auth/authStorage";
import "../styles/teacherHome.css";

export default function MyInfoPage() {
    const nav = useNavigate();

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [profile, setProfile] = useState(null);

    const role = profile?.role || authStorage.getProfile().role || "";

    const back = useMemo(() => {
        if (role === "Admin") return { to: "/admin", label: "← Về dashboard" };
        if (role === "Teacher") return { to: "/teacher", label: "← Về trang chủ" };
        if (role === "Student") return { to: "/student", label: "← Về trang chủ" };
        return { to: "/", label: "← Về trang chủ" };
    }, [role]);

    useEffect(() => {
        let alive = true;

        async function load() {
            setLoading(true);
            setErr("");
            try {
                const { data } = await authApi.getMe();
                if (!alive) return;
                setProfile(data);

                // sync localStorage theo DB (optional nhưng tốt)
                authStorage.saveProfile(data);
            } catch (e) {
                if (!alive) return;
                const msg =
                    e?.response?.data?.message ||
                    e?.response?.data ||
                    e?.message ||
                    "Không gọi được API /api/auth/me";
                setErr(typeof msg === "string" ? msg : JSON.stringify(msg));

                if (e?.response?.status === 401) {
                    authStorage.clear();
                    nav("/login", { replace: true });
                }
            } finally {
                if (alive) setLoading(false);
            }
        }

        load();
        return () => {
            alive = false;
        };
    }, [nav]);

    const onLogout = () => {
        authStorage.clear();
        nav("/login", { replace: true });
    };

    const fullName = profile?.fullName || "";
    const email = profile?.email || "";
    const phoneNumber =
        profile?.phoneNumber !== undefined && profile?.phoneNumber !== null
            ? profile.phoneNumber
            : "";
    const birthDate = profile?.birthDate
        ? new Date(profile.birthDate).toLocaleDateString("vi-VN")
        : "";

    return (
        <div className="teacher-home">
            <div className="teacher-content">
                <div className="teacher-content__inner">
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            flexWrap: "wrap",
                        }}
                    >
                        <h2 style={{ margin: "6px 0 14px" }}>Tài khoản của tôi</h2>

                        <div style={{ display: "flex", gap: 10 }}>
                            <Link className="teacher-link-btn" to={back.to}>
                                {back.label}
                            </Link>
                            <button
                                className="teacher-link-btn danger"
                                type="button"
                                onClick={onLogout}
                            >
                                Đăng xuất
                            </button>
                        </div>
                    </div>

                    {err && (
                        <div style={{ marginBottom: 10, color: "#b42318", fontWeight: 700 }}>
                            Lỗi: {err}
                        </div>
                    )}

                    <div className="teacher-card">
                        {loading ? (
                            <div style={{ padding: 12 }}>Đang tải...</div>
                        ) : !profile ? (
                            <div style={{ padding: 12 }}>Không có dữ liệu từ server.</div>
                        ) : (
                            <>
                                <div className="teacher-row">
                                    <div className="teacher-label">Họ và tên</div>
                                    <div className="teacher-value">{fullName}</div>
                                </div>

                                <div className="teacher-row">
                                    <div className="teacher-label">Vai trò</div>
                                    <div className="teacher-value">{role}</div>
                                </div>

                                <div className="teacher-row">
                                    <div className="teacher-label">Email</div>
                                    <div className="teacher-value">{email}</div>
                                </div>

                                <div className="teacher-row">
                                    <div className="teacher-label">Số điện thoại</div>
                                    <div className="teacher-value">{phoneNumber}</div>
                                </div>

                                <div className="teacher-row">
                                    <div className="teacher-label">Ngày sinh</div>
                                    <div className="teacher-value">{birthDate}</div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
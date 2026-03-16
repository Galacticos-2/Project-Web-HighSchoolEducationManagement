import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import { authStorage } from "../auth/authStorage";

import Brand from "../components/Brand";
import UserActions from "../components/UserActions";

import "../styles/myinfor.css";

export default function MyInfoPage() {
    const nav = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [openEdit, setOpenEdit] = useState(false);

    const [form, setForm] = useState({
        fullName: "",
        email: "",
        phoneNumber: "",
        birthDate: ""
    });

    const role = profile?.role || authStorage.getProfile()?.role || "";

    useEffect(() => {
        let alive = true;

        async function load() {
            try {
                const { data } = await authApi.getMe();
                if (!alive) return;

                setProfile(data);

                setForm({
                    fullName: data.fullName || "",
                    email: data.email || "",
                    phoneNumber: data.phoneNumber || "",
                    birthDate: data.birthDate
                        ? data.birthDate.substring(0, 10)
                        : ""
                });

                authStorage.saveProfile(data);
            } catch (e) {
                const msg =
                    e?.response?.data?.message ||
                    e?.response?.data ||
                    e?.message ||
                    "Không gọi được API";

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
        return () => (alive = false);
    }, [nav]);

    const logout = () => {
        authStorage.clear();
        nav("/login", { replace: true });
    };

    const goMyAccount = () => nav("/my-info");
    const changePassword = () => nav("/change-password");

    const fullName = profile?.fullName || "";
    const email = profile?.email || "";
    const phone = profile?.phoneNumber || "";
    const birthDate = profile?.birthDate
        ? new Date(profile.birthDate).toLocaleDateString("vi-VN")
        : "";

    const avatarLetter = (fullName?.trim()?.[0] || "U").toUpperCase();
    async function handleSave() {
        try {
            const payload = {
                fullName: form.fullName,
                email: form.email,
                phoneNumber: form.phoneNumber
                    ? parseInt(form.phoneNumber)
                    : null,
                birthDate: form.birthDate || null
            };

            const { data } = await authApi.updateProfile(payload);

            setProfile(data);
            authStorage.saveProfile(data);

            setOpenEdit(false);
        } catch (e) {
            alert(
                e?.response?.data?.message ||
                "Cập nhật thất bại"
            );
        }
    }
    return (
        <div className="myinfo-page">

            {/* HEADER */}
            <div className="myinfo-header">
                <Brand />

                <UserActions
                    variant={role?.toLowerCase()}
                    fullName={fullName}
                    avatarLetter={avatarLetter}
                    onMyAccount={goMyAccount}
                    onChangePassword={changePassword}
                    onLogout={logout}
                />
            </div>

            <div className="myinfo-container">

                {loading ? (
                    <div>Đang tải...</div>
                ) : err ? (
                    <div className="error">{err}</div>
                ) : (
                    <>
                        <div className="myinfo-card">

                            <button
                                className="edit-btn"
                                onClick={() => setOpenEdit(true)}
                            >
                                Chỉnh sửa
                            </button>

                            {/* avatar */}
                            <div className="myinfo-avatar">
                                {avatarLetter}
                            </div>

                            {/* info */}
                            <div className="myinfo-info">

                                <h2>{fullName}</h2>

                                <div className="myinfo-grid">

                                    <Row label="Phòng ban" value="Quản trị hệ thống" />
                                    <Row label="Trạng thái" value="Hoạt động" />

                                    <Row label="Vị trí" value={role} />
                                    <Row label="Ngày sinh" value={birthDate} />

                                    <Row label="Email" value={email} />
                                    <Row label="Số điện thoại" value={phone} />

                                </div>

                            </div>
                        </div>

                        {/* MODAL EDIT */}
                        {openEdit && (
                            <div
                                className="modal-overlay"
                                onClick={() => setOpenEdit(false)}
                            >
                                <div
                                    className="modal-box"
                                    onClick={(e) => e.stopPropagation()}
                                >

                                    <h3>Chỉnh sửa thông tin</h3>

                                    <div className="modal-form">

                                        <label>Họ và tên</label>
                                        <input
                                            value={form.fullName}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    fullName: e.target.value
                                                })
                                            }
                                        />

                                        <label>Email</label>
                                        <input
                                            value={form.email}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    email: e.target.value
                                                })
                                            }
                                        />

                                        <label>Số điện thoại</label>
                                        <input
                                            value={form.phoneNumber}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    phoneNumber: e.target.value
                                                })
                                            }
                                        />

                                        <label>Ngày sinh</label>
                                        <input
                                            type="date"
                                            value={form.birthDate}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    birthDate: e.target.value
                                                })
                                            }
                                        />

                                    </div>

                                    <div className="modal-actions">

                                        <button
                                            className="cancel-btn"
                                            onClick={() => setOpenEdit(false)}
                                        >
                                            Hủy
                                        </button>

                                                <button
                                                    className="save-btn"
                                                    onClick={handleSave}
                                                >
                                                    Lưu
                                                </button>

                                    </div>

                                </div>
                            </div>
                        )}

                    </>
                )}
            </div>
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div className="myinfo-row">
            <div className="label">{label}</div>
            <div className="value">{value}</div>
        </div>
    );
}
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "../api/authApi";
import { authStorage } from "../auth/authStorage";

import Brand from "../components/Brand";
import UserActions from "../components/UserActions";

import "../styles/myinfor.css";

const profileSchema = z.object({
    fullName: z.string().min(1, "Vui lòng nhập họ tên"),
    email: z.string().optional(),
    phoneNumber: z
        .string()
        .optional()
        .refine((val) => !val || /^[0-9]+$/.test(val), {
            message: "SĐT chỉ được chứa số"
        })
        .refine((val) => !val || (val.length >= 9 && val.length <= 11), {
            message: "SĐT phải có từ 9 đến 11 số"
        }),
    birthDate: z.string().optional()
});

export default function MyInfoPage() {
    const nav = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [openEdit, setOpenEdit] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: "",
            email: "",
            phoneNumber: "",
            birthDate: ""
        }
    });

    const role = profile?.role || authStorage.getProfile()?.role || "";

    useEffect(() => {
        let alive = true;

        async function load() {
            try {
                const { data } = await authApi.getMe();
                if (!alive) return;

                setProfile(data);

                reset({
                    fullName: data.fullName || "",
                    email: data.email || "",
                    phoneNumber: data.phoneNumber ? String(data.phoneNumber) : "",
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
    }, [nav, reset]);

    const logout = () => {
        authStorage.clear();
        nav("/login", { replace: true });
    };

    const goMyAccount = () => nav("/my-info");
    const changePassword = () => nav("/change-password");

    const fullName = profile?.fullName || "";
    const email = profile?.email || authStorage.getProfile()?.email || "";
    const phone = profile?.phoneNumber || "";
    const birthDate = profile?.birthDate
        ? new Date(profile.birthDate).toLocaleDateString("vi-VN")
        : "";

    const avatarLetter = (fullName?.trim()?.[0] || "U").toUpperCase();
    const closeEditModal = () => {
        reset({
            fullName: profile?.fullName || "",
            email: profile?.email || "",
            phoneNumber: profile?.phoneNumber ? String(profile.phoneNumber) : "",
            birthDate: profile?.birthDate
                ? profile.birthDate.substring(0, 10)
                : ""
        });

        setOpenEdit(false);
    };
    const onSubmit = async (formData) => {
        try {
            const payload = {
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber
                    ? parseInt(formData.phoneNumber, 10)
                    : null,
                birthDate: formData.birthDate || null
            };

            const { data } = await authApi.updateProfile(payload);

            setProfile(data);
            authStorage.saveProfile(data);

            reset({
                fullName: data.fullName || "",
                email: data.email || "",
                phoneNumber: data.phoneNumber ? String(data.phoneNumber) : "",
                birthDate: data.birthDate
                    ? data.birthDate.substring(0, 10)
                    : ""
            });

            setOpenEdit(false);
        } catch (e) {
            alert(
                e?.response?.data?.message ||
                "Cập nhật thất bại"
            );
        }
    };

    return (
        <div className="myinfo-page">
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

                            <div className="myinfo-avatar">
                                {avatarLetter}
                            </div>

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

                        {openEdit && (
                            <div
                                className="modal-overlay"
                                        onClick={closeEditModal}
                            >
                                <div
                                    className="modal-box"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <h3>Chỉnh sửa thông tin</h3>

                                    <div className="modal-form">
                                        <label>Họ và tên</label>
                                        <input
                                            {...register("fullName")}
                                            className={errors.fullName ? "input-error" : ""}
                                        />
                                        {errors.fullName && (
                                            <div className="field-error">
                                                {errors.fullName.message}
                                            </div>
                                        )}

                                                <label>Email (không thể chỉnh sửa)</label>
                                                <input
                                                    value={profile?.email || authStorage.getProfile()?.email || ""}
                                                    readOnly
                                                    className="readonly-input"
                                                />

                                        <label>Số điện thoại</label>
                                        <input
                                            {...register("phoneNumber")}
                                            className={errors.phoneNumber ? "input-error" : ""}
                                        />
                                        {errors.phoneNumber && (
                                            <div className="field-error">
                                                {errors.phoneNumber.message}
                                            </div>
                                        )}

                                        <label>Ngày sinh</label>
                                        <input
                                            type="date"
                                            {...register("birthDate")}
                                        />
                                    </div>

                                    <div className="modal-actions">
                                                <button
                                                    className="cancel-btn"
                                                    onClick={closeEditModal}
                                                >
                                                    Hủy
                                                </button>

                                        <button
                                            className="save-btn"
                                            onClick={handleSubmit(onSubmit)}
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
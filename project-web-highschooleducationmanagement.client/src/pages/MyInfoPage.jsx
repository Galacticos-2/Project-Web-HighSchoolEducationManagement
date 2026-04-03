import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "../api/authApi";
import { useDropzone } from "react-dropzone";

import Brand from "../components/Brand";
import UserActions from "../components/UserActions";
import AvatarCropModal from "../components/AvatarCropModal";

import { useAuth } from "../context/useAuth";

import "../styles/myinfor.css";

const vnPhoneRegex = /^(?:0|84|\+84)(?:3|5|7|8|9)\d{8}$/;

const normalizePhoneInput = (value) =>
    (value || "").replace(/[\s.\-()]/g, "");

const splitPhoneNumber = (phone) => {
    const value = normalizePhoneInput(phone);

    if (!value) {
        return {
            countryCode: "+84",
            localNumber: "",
        };
    }

    if (value.startsWith("84")) {
        return {
            countryCode: "+84",
            localNumber: value.slice(2),
        };
    }

    if (value.startsWith("0")) {
        return {
            countryCode: "0",
            localNumber: value.slice(1),
        };
    }

    return {
        countryCode: "+84",
        localNumber: value,
    };
};

const buildFullPhone = (countryCode, phoneNumber) => {
    const raw = normalizePhoneInput(phoneNumber);
    if (!raw) return "";
    return `${countryCode}${raw}`;
};

const calculateAge = (birthDateString) => {
    if (!birthDateString) return null;

    const today = new Date();
    const dob = new Date(birthDateString);

    if (Number.isNaN(dob.getTime())) return null;

    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }

    return age;
};

const profileSchema = z.object({
    fullName: z.string().min(1, "Vui lòng nhập họ tên"),
    email: z.string().optional(),
    phoneNumber: z
        .string()
        .optional()
        .transform((val) => normalizePhoneInput(val))
        .refine((val) => !val || /^\d+$/.test(val), {
            message: "Phần số điện thoại chỉ được chứa số",
        }),
    birthDate: z
        .string()
        .min(1, "Vui lòng chọn ngày sinh.")
        .refine((val) => {
            const dob = new Date(val);
            const today = new Date();

            if (Number.isNaN(dob.getTime())) return false;

            dob.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);

            return dob <= today;
        }, {
            message: "Ngày sinh không được lớn hơn ngày hiện tại.",
        })
        .refine((val) => {
            const age = calculateAge(val);
            return age !== null && age >= 14;
        }, {
            message: "Người dùng phải từ 14 tuổi trở lên.",
        })
        .refine((val) => {
            const age = calculateAge(val);
            return age !== null && age <= 65;
        }, {
            message: "Tuổi không được lớn hơn 65.",
        }),
});

export default function MyInfoPage() {
    const nav = useNavigate();
    const {
        profile,
        setProfile: setAuthProfile,
        refreshProfile,
        clearAuthState,
    } = useAuth();

    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [previewAvatar, setPreviewAvatar] = useState("");
    const [avatarError, setAvatarError] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [openEdit, setOpenEdit] = useState(false);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropSource, setCropSource] = useState("");
    const [countryCode, setCountryCode] = useState("+84");
    const previewUrlRef = useRef("");

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: "",
            email: "",
            phoneNumber: "",
            birthDate: "",
        },
    });

    const withCacheBust = (url) => {
        if (!url) return "";
        const separator = url.includes("?") ? "&" : "?";
        return `${url}${separator}t=${Date.now()}`;
    };

    useEffect(() => {
        let alive = true;

        async function load() {
            try {
                const data = await refreshProfile();
                if (!alive) return;

                if (!data) {
                    setLoading(false);
                    return;
                }

                const phoneParts = splitPhoneNumber(data.phoneNumber || "");

                setCountryCode(phoneParts.countryCode);

                reset({
                    fullName: data.fullName || "",
                    email: data.email || "",
                    phoneNumber: phoneParts.localNumber,
                    birthDate: data.birthDate ? data.birthDate.substring(0, 10) : "",
                });

                setErr("");
            } catch (e) {
                const msg =
                    e?.response?.data?.message ||
                    e?.response?.data ||
                    e?.message ||
                    "Không gọi được API";

                if (!alive) return;

                setErr(typeof msg === "string" ? msg : JSON.stringify(msg));

                if (e?.response?.status === 401) {
                    clearAuthState();
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
    }, [nav, reset, refreshProfile, clearAuthState]);

    const logout = () => {
        clearAuthState();
        nav("/login", { replace: true });
    };

    const goMyAccount = () => nav("/my-info");
    const changePassword = () => nav("/change-password");

    const fullName = profile?.fullName || "";
    const phone = profile?.phoneNumber || "";
    const birthDate = profile?.birthDate
        ? new Date(profile.birthDate).toLocaleDateString("vi-VN")
        : "";
    const avatarLetter = (fullName?.trim()?.[0] || "U").toUpperCase();
    const role = profile?.role || "";
    const email = profile?.email || "";
    const avatarURL = previewAvatar || profile?.avatarURL || "";

    const closeEditModal = () => {
        const phoneParts = splitPhoneNumber(profile?.phoneNumber || "");

        setCountryCode(phoneParts.countryCode);

        reset({
            fullName: profile?.fullName || "",
            email: profile?.email || "",
            phoneNumber: phoneParts.localNumber,
            birthDate: profile?.birthDate
                ? profile.birthDate.substring(0, 10)
                : "",
        });

        setOpenEdit(false);
    };

    const onSubmit = async (formData) => {
        try {
            const fullPhone = formData.phoneNumber
                ? buildFullPhone(countryCode, formData.phoneNumber)
                : null;

            if (fullPhone && !vnPhoneRegex.test(fullPhone)) {
                alert("SĐT không hợp lệ. Chỉ chấp nhận số di động Việt Nam");
                return;
            }

            const payload = {
                fullName: formData.fullName,
                phoneNumber: fullPhone,
                birthDate: formData.birthDate || null,
            };

            const { data } = await authApi.updateProfile(payload);

            const phoneParts = splitPhoneNumber(data.phoneNumber || "");

            setAuthProfile({
                ...data,
                avatarURL: data.avatarURL ? withCacheBust(data.avatarURL) : "",
            });
            setCountryCode(phoneParts.countryCode);

            reset({
                fullName: data.fullName || "",
                email: data.email || "",
                phoneNumber: phoneParts.localNumber,
                birthDate: data.birthDate
                    ? data.birthDate.substring(0, 10)
                    : "",
            });

            setOpenEdit(false);
        } catch (e) {
            alert(
                e?.response?.data?.message ||
                e?.message ||
                "Cập nhật thất bại"
            );
        }
    };

    const today = new Date();

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const maxBirthDate = formatDate(today);
    const minBirthDate = formatDate(
        new Date(today.getFullYear() - 65, today.getMonth(), today.getDate())
    );

    const uploadAvatarFile = async (file) => {
        if (!file) return;

        try {
            setAvatarError("");
            setUploadingAvatar(true);
            setUploadProgress(0);

            const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
            if (!allowedTypes.includes(file.type)) {
                setAvatarError("Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.");
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                setAvatarError("Ảnh không được vượt quá 10MB.");
                return;
            }

            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
            }

            const localPreview = URL.createObjectURL(file);
            previewUrlRef.current = localPreview;
            setPreviewAvatar(localPreview);

            const { data } = await authApi.uploadAvatar(file, (progressEvent) => {
                const total = progressEvent.total || 0;
                if (!total) return;

                const percent = Math.round((progressEvent.loaded * 100) / total);
                setUploadProgress(percent);
            });

            const normalizedData = {
                ...data,
                avatarURL: data.avatarURL ? withCacheBust(data.avatarURL) : "",
            };

            setAuthProfile(normalizedData);

            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
                previewUrlRef.current = "";
            }

            setPreviewAvatar(normalizedData.avatarURL);
        } catch (e) {
            setAvatarError(
                e?.response?.data?.message ||
                e?.message ||
                "Upload ảnh thất bại"
            );
        } finally {
            setUploadingAvatar(false);
            setUploadProgress(0);
        }
    };

    const onDrop = async (acceptedFiles, fileRejections) => {
        setAvatarError("");

        if (fileRejections?.length) {
            setAvatarError(
                "File không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP và tối đa 2MB."
            );
            return;
        }

        const file = acceptedFiles?.[0];
        if (!file) return;

        const source = URL.createObjectURL(file);
        setCropSource(source);
        setCropModalOpen(true);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: {
            "image/jpeg": [],
            "image/png": [],
            "image/webp": [],
        },
        maxSize: 10 * 1024 * 1024,
        disabled: uploadingAvatar,
    });
    useEffect(() => {
        return () => {
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
            }

            if (cropSource) {
                URL.revokeObjectURL(cropSource);
            }
        };
    }, [cropSource]);
    return (
        <div className="myinfo-page">
            <div className="myinfo-header">
                <Brand />

                <UserActions
                    variant={role?.toLowerCase()}
                    fullName={fullName}
                    avatarLetter={avatarLetter}
                    avatarURL={avatarURL}
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

                            <div className="myinfo-top">
                                <div className="myinfo-avatar">
                                    {avatarURL ? (
                                        <img
                                            src={avatarURL}
                                            alt="Avatar"
                                            className="myinfo-avatar-img"
                                        />
                                    ) : (
                                        avatarLetter
                                    )}
                                </div>

                                <div className="myinfo-intro">
                                    <div className="myinfo-intro-text">
                                        Cá nhân hóa tài khoản của bạn với ảnh hồ sơ. Ảnh hồ sơ sẽ hiển thị
                                        trên các khu vực sử dụng tài khoản của bạn trong hệ thống.
                                    </div>

                                    <div
                                        {...getRootProps()}
                                        className={`avatar-uploader ${isDragActive ? "drag-active" : ""} ${uploadingAvatar ? "is-uploading" : ""}`}
                                    >
                                        <input {...getInputProps()} />

                                        <div className="avatar-uploader-icon">⬆</div>

                                        <div className="avatar-uploader-text">
                                            {uploadingAvatar
                                                ? "Đang tải ảnh lên..."
                                                : isDragActive
                                                    ? "Thả ảnh vào đây"
                                                    : "Kéo & thả ảnh vào đây hoặc bấm để chọn"}
                                        </div>

                                        <div className="avatar-uploader-subtext">
                                            JPG, PNG, WEBP • tối đa 2MB
                                        </div>
                                    </div>

                                    {avatarError && (
                                        <div className="avatar-upload-error">
                                            {avatarError}
                                        </div>
                                    )}

                                    {uploadingAvatar && (
                                        <div className="avatar-progress">
                                            <div
                                                className="avatar-progress-bar"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="info-section">
                                <div className="info-table">
                                    <div className="info-line">
                                        <div className="info-label">Họ và tên</div>
                                        <div className="info-value">{fullName}</div>
                                        <div className="info-note"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="info-section">
                                <div className="info-section-title">Thông tin hồ sơ</div>
                                <div className="info-table">
                                    <div className="info-line">
                                        <div className="info-label">Ngày sinh</div>
                                        <div className="info-value">{birthDate || "--"}</div>
                                        <div className="info-note">
                                            Ngày sinh được dùng cho thiết lập an toàn tài khoản
                                        </div>
                                    </div>

                                    <div className="info-line">
                                        <div className="info-label">Phòng ban</div>
                                        <div className="info-value">Quản trị hệ thống</div>
                                        <div className="info-note"></div>
                                    </div>

                                    <div className="info-line">
                                        <div className="info-label">Vị trí</div>
                                        <div className="info-value">{role || "--"}</div>
                                        <div className="info-note"></div>
                                    </div>

                                    <div className="info-line">
                                        <div className="info-label">Trạng thái</div>
                                        <div className="info-value">Hoạt động</div>
                                        <div className="info-note"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="info-section">
                                <div className="info-section-title">Thông tin tài khoản</div>
                                <div className="info-table">
                                    <div className="info-line">
                                        <div className="info-label">Email</div>
                                        <div className="info-value">{email || "--"}</div>
                                        <div className="info-note">
                                            Địa chỉ email dùng để đăng nhập vào tài khoản
                                        </div>
                                    </div>

                                    <div className="info-line">
                                        <div className="info-label">Số điện thoại</div>
                                        <div className="info-value">{phone || "--"}</div>
                                        <div className="info-note">
                                            Số điện thoại được dùng cho xác thực và khôi phục tài khoản
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {openEdit && (
                            <div className="modal-overlay" onClick={closeEditModal}>
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
                                            value={profile?.email || ""}
                                            readOnly
                                            className="readonly-input"
                                        />

                                        <label>Số điện thoại</label>
                                        <div className={`phone-group ${errors.phoneNumber ? "phone-group-error" : ""}`}>
                                            <div className="phone-code-wrap">
                                                <select
                                                    className="phone-code"
                                                    value={countryCode}
                                                    onChange={(e) => setCountryCode(e.target.value)}
                                                >
                                                    <option value="+84">+84</option>
                                                    <option value="84">84</option>
                                                    <option value="0">0</option>
                                                </select>
                                            </div>

                                            <input
                                                {...register("phoneNumber")}
                                                className={errors.phoneNumber ? "input-error" : ""}
                                                placeholder="94344xxxx"
                                            />
                                        </div>
                                        {errors.phoneNumber && (
                                            <div className="field-error">
                                                {errors.phoneNumber.message}
                                            </div>
                                        )}

                                        <label>Ngày sinh</label>
                                        <input
                                            type="date"
                                            min={minBirthDate}
                                            max={maxBirthDate}
                                            {...register("birthDate")}
                                            className={errors.birthDate ? "input-error" : ""}
                                        />
                                        {errors.birthDate && (
                                            <div className="field-error">
                                                {errors.birthDate.message}
                                            </div>
                                        )}
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

                <AvatarCropModal
                    open={cropModalOpen}
                    imageSrc={cropSource}
                    onClose={() => {
                        setCropModalOpen(false);
                        setCropSource("");
                    }}
                    onConfirm={async (croppedFile) => {
                        setCropModalOpen(false);
                        await uploadAvatarFile(croppedFile);
                        setCropSource("");
                    }}
                />
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
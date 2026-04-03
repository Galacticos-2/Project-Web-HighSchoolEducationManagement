import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import "../styles/auth.css";
import { authApi } from "../api/authApi";
import { classesApi } from "../api/classesApi";

import {
    FiEye,
    FiEyeOff,
    FiUser,
    FiCalendar,
    FiPhone,
    FiMail,
    FiLock
} from "react-icons/fi";

/* =========================
   PHONE HELPERS
========================= */

const vnPhoneRegex = /^(?:0|84|\+84)(?:3|5|7|8|9)\d{8}$/;

const normalizePhoneInput = (value) =>
    (value || "").replace(/[\s.\-()]/g, "");

const buildFullPhone = (countryCode, phoneNumber) => {
    const raw = normalizePhoneInput(phoneNumber);

    if (!raw) return "";

    return `${countryCode}${raw}`;
};

/* =========================
   VALIDATION SCHEMA
========================= */
const calculateAge = (birthDateString) => {
    if (!birthDateString) return null;

    const today = new Date();
    const dob = new Date(birthDateString);

    if (Number.isNaN(dob.getTime())) return null;

    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < dob.getDate())
    ) {
        age--;
    }

    return age;
};
const schema = z
    .object({
        fullName: z.string().min(1, "Vui lòng nhập họ tên"),

        birthDate: z
            .string()
            .min(1, "Vui lòng chọn ngày sinh")
            .refine((value) => {
                const dob = new Date(value);
                return !Number.isNaN(dob.getTime());
            }, {
                message: "Ngày sinh không hợp lệ"
            })
            .refine((value) => {
                const dob = new Date(value);
                const today = new Date();
                dob.setHours(0, 0, 0, 0);
                today.setHours(0, 0, 0, 0);
                return dob <= today;
            }, {
                message: "Ngày sinh không được lớn hơn ngày hiện tại"
            })
            .refine((value) => {
                const age = calculateAge(value);
                return age !== null && age >= 14 && age <= 65;
            }, {
                message: "Tuổi phải từ 14 đến 65"
            }),

        phoneNumber: z
            .string()
            .min(1, "Vui lòng nhập SĐT")
            .transform((value) => normalizePhoneInput(value))
            .refine((value) => /^\d+$/.test(value), {
                message: "Phần số điện thoại chỉ được chứa số"
            }),

        email: z
            .string()
            .min(1, "Vui lòng nhập email")
            .email("Email không hợp lệ"),

        role: z.enum(["Student", "Teacher"]),
        classId: z.string().optional(),
        password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
        confirmPassword: z.string()
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Xác nhận mật khẩu không khớp",
        path: ["confirmPassword"]
    })
    .refine(
        (data) => {
            if (data.role === "Student") return !!data.classId;
            return true;
        },
        {
            message: "Vui lòng chọn lớp học",
            path: ["classId"]
        }
    );

export default function RegisterPage() {
    const nav = useNavigate();

    const [classes, setClasses] = useState([]);
    const [loadingClasses, setLoadingClasses] = useState(false);

    const [showPw, setShowPw] = useState(false);
    const [showPw2, setShowPw2] = useState(false);

    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);
    const [countryCode, setCountryCode] = useState("+84");
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            role: "Student"
        }
    });

    const role = watch("role");

    /* =========================
       LOAD CLASSES
    ========================= */

    useEffect(() => {
        const load = async () => {
            if (role !== "Student") return;

            setLoadingClasses(true);

            try {
                const { data } = await classesApi.getAll();
                setClasses(Array.isArray(data) ? data : []);
            } catch {
                setClasses([]);
            } finally {
                setLoadingClasses(false);
            }
        };

        load();
    }, [role]);

    /* =========================
       SUBMIT
    ========================= */
    

    const todayStr = new Date().toISOString().split("T")[0];
    const onSubmit = async (data) => {
        setErr("");
        setLoading(true);

        try {
            const fullPhone = buildFullPhone(countryCode, data.phoneNumber);

            if (!vnPhoneRegex.test(fullPhone)) {
                setErr("SĐT không hợp lệ. Chỉ chấp nhận số di động Việt Nam");
                return;
            }

            const payload = {
                ...data,
                phoneNumber: fullPhone,
                birthDate: data.birthDate
                    ? `${data.birthDate}T00:00:00`
                    : null,
                classId:
                    data.role === "Student"
                        ? Number(data.classId)
                        : null
            };

            await authApi.register(payload);

            nav("/login", { replace: true });
        } catch (ex) {
            const msg =
                ex?.response?.data?.message ||
                ex?.response?.data ||
                "Đăng ký thất bại.";

            setErr(typeof msg === "string" ? msg : JSON.stringify(msg));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2 className="title">Đăng ký</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                    <div className="grid-2">
                        <div className="field">
                            <label>Họ tên *</label>

                            <div className="input-wrap">
                                <FiUser className="input-icon" />
                                <input
                                    {...register("fullName")}
                                    placeholder="Nhập họ tên..."
                                    className={errors.fullName ? "input-error" : ""}
                                />
                            </div>

                            {errors.fullName && (
                                <div className="field-error">
                                    {errors.fullName.message}
                                </div>
                            )}
                        </div>

                        <div className="field">
                            <label>Ngày sinh *</label>

                            <div className="input-wrap">
                                <FiCalendar className="input-icon" />
                                <input
                                    type="date"
                                    max={todayStr}
                                    {...register("birthDate")}
                                    className={errors.birthDate ? "input-error" : ""}
                                />
                            </div>

                            {errors.birthDate && (
                                <div className="field-error">
                                    {errors.birthDate.message}
                                </div>
                            )}
                        </div>

                        <div className="field">
                            <label>SĐT *</label>

                            <div className={`phone-group ${errors.phoneNumber ? "phone-group-error" : ""}`}>
                                <div className="phone-code-wrap">
                                    <FiPhone className="phone-code-icon" />
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
                                    placeholder="94344xxxx"
                                    className={errors.phoneNumber ? "input-error" : ""}
                                />
                            </div>

                            {errors.phoneNumber && (
                                <div className="field-error">
                                    {errors.phoneNumber.message}
                                </div>
                            )}
                        </div>

                        <div className="field">
                            <label>Email *</label>

                            <div className="input-wrap">
                                <FiMail className="input-icon" />
                                <input
                                    {...register("email")}
                                    placeholder="Nhập email..."
                                    className={errors.email ? "input-error" : ""}
                                />
                            </div>

                            {errors.email && (
                                <div className="field-error">
                                    {errors.email.message}
                                </div>
                            )}
                        </div>

                        <div className="field">
                            <label>Vai trò *</label>
                            <select {...register("role")}>
                                <option value="Student">Student</option>
                                <option value="Teacher">Teacher</option>
                            </select>
                        </div>

                        {role === "Student" && (
                            <div className="field">
                                <label>Lớp học *</label>
                                <select
                                    {...register("classId")}
                                    disabled={loadingClasses}
                                    className={errors.classId ? "input-error" : ""}
                                >
                                    <option value="">
                                        {loadingClasses ? "Đang tải..." : "Chọn lớp"}
                                    </option>

                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>

                                {errors.classId && (
                                    <div className="field-error">
                                        {errors.classId.message}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="field">
                            <label>Mật khẩu *</label>

                            <div className="password-wrap">
                                <FiLock className="input-icon" />

                                <input
                                    type={showPw ? "text" : "password"}
                                    {...register("password")}
                                    placeholder="Nhập mật khẩu..."
                                    className={errors.password ? "input-error" : ""}
                                />

                                <button
                                    type="button"
                                    className="eye-btn"
                                    onClick={() => setShowPw((v) => !v)}
                                >
                                    {showPw ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>

                            {errors.password && (
                                <div className="field-error">
                                    {errors.password.message}
                                </div>
                            )}
                        </div>

                        <div className="field">
                            <label>Xác nhận mật khẩu *</label>

                            <div className="password-wrap">
                                <FiLock className="input-icon" />

                                <input
                                    type={showPw2 ? "text" : "password"}
                                    {...register("confirmPassword")}
                                    placeholder="Nhập lại mật khẩu..."
                                    className={errors.confirmPassword ? "input-error" : ""}
                                />

                                <button
                                    type="button"
                                    className="eye-btn"
                                    onClick={() => setShowPw2((v) => !v)}
                                >
                                    {showPw2 ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>

                            {errors.confirmPassword && (
                                <div className="field-error">
                                    {errors.confirmPassword.message}
                                </div>
                            )}
                        </div>
                    </div>

                    {err && <div className="error">{err}</div>}

                    <button className="primary-btn" disabled={loading}>
                        {loading ? "Đang đăng ký..." : "Đăng ký tài khoản"}
                    </button>

                    <div className="footer">
                        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
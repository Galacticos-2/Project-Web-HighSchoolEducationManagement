import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api/authApi";

import { classesApi } from "../api/classesApi";
export default function RegisterPage() {
    const nav = useNavigate();

    const [fullName, setFullName] = useState("");
    const [birthDate, setBirthDate] = useState(""); // yyyy-mm-dd
    const [phoneNumber, setPhoneNumber] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("Student"); // Student / Teacher
    const [classId, setClassId] = useState(""); // string để bind select
    const [classes, setClasses] = useState([]);
    const [loadingClasses, setLoadingClasses] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPw, setShowPw] = useState(false);
    const [showPw2, setShowPw2] = useState(false);

    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    const validate = () => {
        if (!fullName.trim()) return "Vui lòng nhập Họ tên.";
        if (!birthDate) return "Vui lòng chọn Ngày sinh.";
        if (!phoneNumber.trim()) return "Vui lòng nhập SĐT.";
        if (!email.trim()) return "Vui lòng nhập Email.";
        if (!role) return "Vui lòng chọn Vai trò.";

        // ✅ thêm đúng chỗ này
        if (role === "Student" && !classId) return "Vui lòng chọn Lớp học.";

        if (!password) return "Vui lòng nhập Mật khẩu.";
        if (password.length < 6) return "Mật khẩu tối thiểu 6 ký tự.";
        if (password !== confirmPassword) return "Xác nhận mật khẩu không khớp.";
        return "";
    };
    useEffect(() => {
        const load = async () => {
            if (role !== "Student") {
                setClassId("");
                return;
            }
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
    const onSubmit = async (e) => {
        e.preventDefault();
        setErr("");

        const msg = validate();
        if (msg) {
            setErr(msg);
            return;
        }

        setLoading(true);
        try {
            const payload = {
                fullName,
                birthDate: birthDate ? `${birthDate}T00:00:00` : null,
                phoneNumber,
                email,
                role,
                password,
                confirmPassword,
                classId: role === "Student" ? Number(classId) : null,
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

                <form onSubmit={onSubmit}>
                    <div className="field">
                        <div className="label-row">
                            <label>Họ tên</label>
                            <span className="req">*</span>
                        </div>
                        <div className="input-wrap">
                            <span className="icon" aria-hidden="true">
                                {/* user icon */}
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z" />
                                </svg>
                            </span>
                            <input
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Nhập họ tên..."
                                autoComplete="name"
                            />
                        </div>
                    </div>

                    <div className="field">
                        <div className="label-row">
                            <label>Ngày sinh</label>
                            <span className="req">*</span>
                        </div>
                        <div className="input-wrap">
                            <span className="icon" aria-hidden="true">
                                {/* calendar icon */}
                                <svg viewBox="0 0 24 24">
                                    <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1.5A2.5 2.5 0 0 1 22 6.5v14A2.5 2.5 0 0 1 19.5 23h-15A2.5 2.5 0 0 1 2 20.5v-14A2.5 2.5 0 0 1 4.5 4H6V3a1 1 0 0 1 1-1Zm12.5 7h-15v11.5c0 .3.2.5.5.5h14c.3 0 .5-.2.5-.5V9Z" />
                                </svg>
                            </span>
                            <input
                                type="date"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="field">
                        <div className="label-row">
                            <label>SĐT</label>
                            <span className="req">*</span>
                        </div>
                        <div className="input-wrap">
                            <span className="icon" aria-hidden="true">
                                {/* phone icon */}
                                <svg viewBox="0 0 24 24">
                                    <path d="M6.6 2.9 5 4.5c-1.3 1.3-1.3 3.4 0 5l.6.6c2.2 2.2 4.7 4.1 7.4 5.7l.8.5c1.6 1 3.7.7 5-.6l1.6-1.6c.8-.8.8-2.2 0-3l-2-2c-.8-.8-2.2-.8-3 0l-.8.8c-.3.3-.7.4-1.1.2-1.2-.6-2.3-1.4-3.4-2.3-.9-.8-1.7-1.6-2.3-2.4-.2-.4-.1-.8.2-1.1l.8-.8c.8-.8.8-2.2 0-3l-2-2c-.8-.8-2.2-.8-3 0Z" />
                                </svg>
                            </span>
                            <input
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="Nhập số điện thoại..."
                                autoComplete="tel"
                                inputMode="tel"
                            />
                        </div>
                    </div>

                    <div className="field">
                        <div className="label-row">
                            <label>Email</label>
                            <span className="req">*</span>
                        </div>
                        <div className="input-wrap">
                            <span className="icon" aria-hidden="true">
                                {/* mail icon */}
                                <svg viewBox="0 0 24 24">
                                    <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 2v.2l8 5.2 8-5.2V7H4Zm16 10V9.6l-7.5 4.9a1 1 0 0 1-1.1 0L4 9.6V17h16Z" />
                                </svg>
                            </span>
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Nhập email..."
                                autoComplete="email"
                                inputMode="email"
                            />
                        </div>
                    </div>

                    <div className="field">
                        <div className="label-row">
                            <label>Vai trò</label>
                            <span className="req">*</span>
                        </div>
                        <div className="input-wrap">
                            <span className="icon" aria-hidden="true">
                                {/* badge icon */}
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm0 6a3 3 0 1 1-3 3 3 3 0 0 1 3-3Zm0 12c-2.2 0-4.2-1-5.6-2.6 0-2.2 4-3.4 5.6-3.4s5.6 1.2 5.6 3.4C16.2 19 14.2 20 12 20Z" />
                                </svg>
                            </span>
                            <select value={role} onChange={(e) => setRole(e.target.value)}>
                                <option value="Student">Student</option>
                                <option value="Teacher">Teacher</option>
                            </select>
                        </div>
                    </div>
                    {role === "Student" && (
                        <div className="field">
                            <div className="label-row">
                                <label>Lớp học</label>
                                <span className="req">*</span>
                            </div>
                            <div className="input-wrap">
                                <span className="icon" aria-hidden="true">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M12 2 1 7l11 5 9-4.1V17h2V7L12 2Zm-7 9.2V17c0 2.8 3.1 5 7 5s7-2.2 7-5v-5.8l-7 3.2-7-3.2Z" />
                                    </svg>
                                </span>

                                <select
                                    value={classId}
                                    onChange={(e) => setClassId(e.target.value)}
                                    disabled={loadingClasses}
                                >
                                    <option value="">
                                        {loadingClasses ? "Đang tải lớp..." : "Chọn lớp..."}
                                    </option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                    <div className="field">
                        <div className="label-row">
                            <label>Mật khẩu</label>
                            <span className="req">*</span>
                        </div>
                        <div className="input-wrap has-action">
                            <span className="icon" aria-hidden="true">
                                {/* lock icon */}
                                <svg viewBox="0 0 24 24">
                                    <path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2ZM10 7a2 2 0 0 1 4 0v2h-4V7Z" />
                                </svg>
                            </span>
                            <input
                                type={showPw ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Nhập mật khẩu..."
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className="action"
                                onClick={() => setShowPw((v) => !v)}
                                aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                            >
                                {/* eye icon */}
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 5c5.5 0 9.7 4.5 10.9 6.1.2.3.2.5 0 .8C21.7 13.5 17.5 18 12 18S2.3 13.5 1.1 11.9c-.2-.3-.2-.5 0-.8C2.3 9.5 6.5 5 12 5Zm0 2C8.2 7 4.9 10 3.3 11.5 4.9 13 8.2 16 12 16s7.1-3 8.7-4.5C19.1 10 15.8 7 12 7Zm0 2.5A2.5 2.5 0 1 1 9.5 12 2.5 2.5 0 0 1 12 9.5Z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="field">
                        <div className="label-row">
                            <label>Xác nhận mật khẩu</label>
                            <span className="req">*</span>
                        </div>
                        <div className="input-wrap has-action">
                            <span className="icon" aria-hidden="true">
                                {/* lock icon */}
                                <svg viewBox="0 0 24 24">
                                    <path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2ZM10 7a2 2 0 0 1 4 0v2h-4V7Z" />
                                </svg>
                            </span>
                            <input
                                type={showPw2 ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Nhập lại mật khẩu..."
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className="action"
                                onClick={() => setShowPw2((v) => !v)}
                                aria-label={showPw2 ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                            >
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 5c5.5 0 9.7 4.5 10.9 6.1.2.3.2.5 0 .8C21.7 13.5 17.5 18 12 18S2.3 13.5 1.1 11.9c-.2-.3-.2-.5 0-.8C2.3 9.5 6.5 5 12 5Zm0 2C8.2 7 4.9 10 3.3 11.5 4.9 13 8.2 16 12 16s7.1-3 8.7-4.5C19.1 10 15.8 7 12 7Zm0 2.5A2.5 2.5 0 1 1 9.5 12 2.5 2.5 0 0 1 12 9.5Z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {err && <div className="error">{err}</div>}

                    <div className="note">
                        <b>Chú ý:</b> Vui lòng dùng mật khẩu mạnh (tối thiểu 6 ký tự) và ghi nhớ thông tin tài khoản.
                    </div>

                    <button disabled={loading} className="primary-btn">
                        {loading ? "Đang đăng ký..." : "Đăng ký tài khoản →"}
                    </button>

                    <div className="footer">
                        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                    </div>
                </form>
            </div>

            <style>{css}</style>
        </div>
    );
}

const css = `
/* THÊM NGAY ĐẦU FILE CSS */
*,
*::before,
*::after{
  box-sizing: border-box;
}
.auth-page{
  min-height: 100vh;
  width: 100%;
  display:flex;
  justify-content:center;
  align-items:center;
  background:#0b6bb5;
  padding:24px 12px;
}

.auth-card{
  width: 680px;
  max-width: 92vw;
  background:#f3f6fb;
  border-radius:18px;
  padding:26px 26px 20px;
  box-shadow: 0 20px 55px rgba(0,0,0,0.22);
  border: 1px solid rgba(255,255,255,0.35);
}

.title{
  margin: 0 0 14px;
  text-align:left;
  font-size: 22px;
  font-weight: 800;
  color:#1f2a44;
}

/* grid 2 cột trên desktop, 1 cột trên mobile */
form{
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}

@media (max-width: 720px){
  form{ grid-template-columns: 1fr; }
}

.field{ width:100%; }

.label-row{
  display:flex;
  align-items:center;
  gap:6px;
  margin-bottom:8px;
}

label{
  font-weight:700;
  color:#2b3a5b;
}

.req{ color:#e53935; font-weight:800; }

.input-wrap{
  position:relative;
  width:100%;
}

.input-wrap input,
.input-wrap select{
  width:100%;
  height: 48px;
  padding: 0 44px 0 44px;
  border-radius: 14px;
  border: 1px solid #d9e2ef;
  background: #ffffff;
  outline:none;
  font-size: 15px;
  color:#223052;
}

.input-wrap input:focus,
.input-wrap select:focus{
  border-color:#9fbbe0;
  box-shadow: 0 0 0 4px rgba(21,101,192,0.12);
}

.icon{
  position:absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width:18px;
  height:18px;
  color:#8aa0bf;
  pointer-events:none;
}

.icon svg{ width:18px; height:18px; fill: currentColor; }

.input-wrap.has-action input{
  padding-right: 52px;
}

.action{
  position:absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width:34px;
  height:34px;
  border-radius:10px;
  border:none;
  background: transparent;
  cursor:pointer;
  color:#8aa0bf;
}

.action:hover{ background: rgba(0,0,0,0.04); }
.action svg{ width:20px; height:20px; fill: currentColor; }

.error{
  grid-column: 1 / -1;
  background: #ffebee;
  border: 1px solid #ffcdd2;
  color:#c62828;
  padding: 10px 12px;
  border-radius: 12px;
  font-weight: 700;
}

.note{
  grid-column: 1 / -1;
  background:#f7efe0;
  border: 1px solid #eed9b7;
  color:#3a2f1c;
  padding: 10px 12px;
  border-radius: 12px;
  line-height: 1.35;
}

.primary-btn{
  grid-column: 1 / -1;
  width:100%;
  height: 56px;
  border:none;
  border-radius: 14px;
  background: linear-gradient(180deg,#ffbf4a,#ff9f1c);
  color:#fff;
  font-weight: 900;
  font-size: 16px;
  cursor:pointer;
  box-shadow: 0 14px 30px rgba(255,159,28,0.35);
  margin-top: 4px;
}

.primary-btn:disabled{
  opacity: .75;
  cursor: not-allowed;
  box-shadow:none;
}

.footer{
  grid-column: 1 / -1;
  text-align:left;
  margin-top: 6px;
  color:#2b3a5b;
  font-weight: 600;
}

.footer a{
  color:#0b4fb0;
  font-weight: 800;
  text-decoration:none;
}

.footer a:hover{
  text-decoration:underline;
}
`;
import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api/authApi";
import { authStorage } from "../auth/authStorage";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../context/useAuth";
/* =========================
   VALIDATION SCHEMA
========================= */
const loginSchema = z.object({
    email: z
        .string()
        .min(1, "Vui lòng nhập email")
        .email("Email không hợp lệ"),
    password: z
        .string()
        .min(1, "Vui lòng nhập mật khẩu")
});
const diffItems = [
    {
        title: "Đầy đủ, toàn trình",
        icon: "🖥️",
        desc: "Tích hợp quản lý học tập, kiểm tra đánh giá, lớp học trực tuyến, thông báo và tương tác trên cùng một hệ thống."
    },
    {
        title: "Đơn giản, dễ sử dụng",
        icon: "📅",
        desc: "Giao diện trực quan, thao tác nhanh, phù hợp với cán bộ quản lý, giáo viên, học sinh và phụ huynh."
    },
    {
        title: "Đáp ứng quy chuẩn",
        icon: "📋",
        desc: "Thiết kế bám sát nhu cầu vận hành trường học, hỗ trợ quy trình quản lý và giảng dạy thực tế."
    },
    {
        title: "Tính hệ thống",
        icon: "⚙️",
        desc: "Các module liên kết chặt chẽ, dữ liệu đồng bộ, giúp quản lý thống nhất và hạn chế thao tác rời rạc."
    },
    {
        title: "Liên tục cập nhật",
        icon: "📄",
        desc: "Tính năng được cải tiến thường xuyên để phù hợp với nhu cầu vận hành và chuyển đổi số trong giáo dục."
    },
    {
        title: "Công nghệ tiên tiến",
        icon: "🌐",
        desc: "Ứng dụng công nghệ web hiện đại, tối ưu hiệu năng, bảo mật và khả năng mở rộng lâu dài."
    }
];

export default function LoginPage() {
    const nav = useNavigate();
    const [showPw, setShowPw] = useState(false);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);
    const { refreshProfile } = useAuth();
    const {
        register,
        handleSubmit,
        
        formState: { errors }
    } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: ""
        }
    });
    const emailField = register("email");
    const passwordField = register("password");
    const passwordRef = useRef(null);
    const onSubmit = async (formData) => {
        setErr("");
        setLoading(true);

        try {
            const { data } = await authApi.login({
                email: formData.email,
                password: formData.password
            });

            authStorage.saveLogin(data);
            authStorage.setEmail(formData.email);

            await refreshProfile();

            if (data.role === "Admin") nav("/admin", { replace: true });
            else if (data.role === "Teacher") nav("/teacher", { replace: true });
            else nav("/student", { replace: true });
        } catch (ex) {
            const msg =
                ex?.response?.data?.message ||
                ex?.response?.data?.Message ||
                ex?.response?.data ||
                "Đăng nhập thất bại.";

            setErr(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="k12-page">
            <header className="k12-header">
                <div className="k12-header-inner">
                    <Link to="/" className="k12-brand" aria-label="HocOnline Home">
                        <span className="k12-brand-k">Hoc</span>
                        <span className="k12-brand-o">Online</span>
                    </Link>

                    <nav className="k12-nav">
                       
                        <a href="#about">GIỚI THIỆU</a>
                        <a href="#diff">ĐIỂM KHÁC BIỆT</a>
                        <a href="#features">TÍNH NĂNG</a>
                        <a href="#feedback">PHẢN HỒI</a>
                    </nav>
                </div>
            </header>

            <main className="k12-hero" id="login">
                <div className="k12-hero-inner k12-hero-2col">
                    <section className="k12-left">
                        <h1 className="k12-title">
                            Nền tảng Trường học số <br />
                            HocOnline
                        </h1>

                        <p className="k12-subtitle">
                            Hệ thống hỗ trợ toàn trình công tác quản lý đào tạo, hỗ trợ dạy - học,
                            đánh giá, kiểm tra/thi trực tuyến và quản lý tương tác, truyền thông
                            dành riêng cho các cơ sở giáo dục.
                        </p>
                    </section>

                    <section className="k12-rightForm">
                        <div className="k12-card">
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="k12-field">
                                    <label className="k12-label">Email</label>
                                    <div className={`k12-inputWrap ${errors.email ? "k12-inputWrap-error" : ""}`}>
                                        <span className="k12-icon" aria-hidden="true">
                                            <svg viewBox="0 0 24 24" width="18" height="18">
                                                <path
                                                    d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z"
                                                    fill="currentColor"
                                                />
                                            </svg>
                                        </span>

                                        <input
                                            {...emailField}
                                            className="k12-input"
                                            placeholder="Nhập email..."
                                            autoComplete="email"
                                        />
                                    </div>

                                    {errors.email && (
                                        <div className="k12-fieldError">{errors.email.message}</div>
                                    )}
                                </div>

                                <div className="k12-field">
                                    <label className="k12-label">Mật khẩu</label>
                                    <div
                                        className={`k12-inputWrap ${!errors.email && errors.password ? "k12-inputWrap-error" : ""
                                            }`}
                                    >
                                        <span className="k12-icon" aria-hidden="true">
                                            <svg viewBox="0 0 24 24" width="18" height="18">
                                                <path
                                                    d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zm-7-2a2 2 0 0 1 4 0v2h-4V7zm7 13H7v-9h10v9z"
                                                    fill="currentColor"
                                                />
                                            </svg>
                                        </span>

                                        <input
                                            {...passwordField}
                                            ref={(el) => {
                                                passwordField.ref(el);
                                                passwordRef.current = el;
                                            }}
                                            className="k12-input"
                                            type={showPw ? "text" : "password"}
                                            placeholder="Nhập mật khẩu..."
                                            autoComplete="current-password"
                                        />

                                        <button
                                            type="button"
                                            className="k12-eye"
                                            onClick={() => setShowPw((s) => !s)}
                                            aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                        >
                                            {showPw ? (
                                                <svg viewBox="0 0 24 24" width="18" height="18">
                                                    <path
                                                        d="M2.1 3.51 3.51 2.1l18.38 18.38-1.41 1.41-2.17-2.17A11.8 11.8 0 0 1 12 22C6.5 22 2.1 18 0 12c.84-2.43 2.3-4.45 4.2-5.98L2.1 3.51zM12 6c5.5 0 9.9 4 12 10-.72 2.08-1.9 3.88-3.44 5.28l-2.09-2.09A5 5 0 0 0 8.82 9.54L6.73 7.45A11.8 11.8 0 0 1 12 6zm0 4a2 2 0 0 1 2 2c0 .35-.09.68-.24.97l-2.73-2.73c.29-.15.62-.24.97-.24zm-2 2c0-.35.09-.68.24-.97l2.73 2.73c-.29.15-.62.24-.97.24a2 2 0 0 1-2-2zm2 8c1.2 0 2.33-.28 3.33-.78l-1.55-1.55c-.54.21-1.14.33-1.78.33a5 5 0 0 1-5-5c0-.64.12-1.24.33-1.78L5.8 10.67A6.96 6.96 0 0 0 5 13a7 7 0 0 0 7 7z"
                                                        fill="currentColor"
                                                    />
                                                </svg>
                                            ) : (
                                                <svg viewBox="0 0 24 24" width="18" height="18">
                                                    <path
                                                        d="M12 5c5.5 0 9.9 4 12 10-2.1 6-6.5 10-12 10S2.1 21 0 15C2.1 9 6.5 5 12 5zm0 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8z"
                                                        fill="currentColor"
                                                    />
                                                </svg>
                                            )}
                                        </button>
                                    </div>

                                    {!errors.email && errors.password && (
                                        <div className="k12-fieldError">{errors.password.message}</div>
                                    )}
                                </div>

                                {err && <div className="k12-error">{err}</div>}

                                <div className="k12-note">
                                    <strong>Chú ý:</strong> Nếu bạn đang sử dụng mật khẩu mặc định, vui
                                    lòng đổi mật khẩu tài khoản của mình!
                                </div>

                                <button className="k12-btn" disabled={loading}>
                                    {loading ? "Đang đăng nhập..." : "Đăng nhập bằng tài khoản"}
                                    <span className="k12-btnArrow" aria-hidden="true">
                                        ➜
                                    </span>
                                </button>

                                <div className="k12-linksRow">
                                    <span className="k12-muted">Chưa có tài khoản?</span>
                                    <Link className="k12-link" to="/register">
                                        Đăng ký
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </section>
                </div>
            </main>
            <section className="k12-diff-section" id="diff">
                <div className="k12-diff-container">
                    <h2 className="k12-diff-title">Điểm khác biệt của hệ thống</h2>
                    <p className="k12-diff-subtitle">
                        Tích hợp tất cả tính năng của một hệ thống quản lý học tập trực tuyến và
                        kiểm tra, đánh giá trực tuyến cho mọi đối tượng
                        (từ cán bộ quản lý đến giáo viên và học sinh)
                    </p>

                    <div className="k12-diff-grid">
                        {diffItems.map((item) => (
                            <div className="k12-diff-card" key={item.title}>
                                <div className="k12-diff-card-inner">
                                    <div className="k12-diff-front">
                                        <div className="k12-diff-icon">{item.icon}</div>
                                        <h3>{item.title}</h3>
                                    </div>

                                    <div className="k12-diff-back">
                                        <h3>{item.title}</h3>
                                        <p>{item.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <style>{css}</style>
        </div>
    );
}

const css = `
  html{
    scroll-behavior: smooth;
  }
  :root{
    --k12-blue1:#0b6bb5;
    --k12-blue2:#158bd6;
    --k12-blue3:#0a5ea5;
    --k12-text:#0f172a;
    --k12-muted:#64748b;
    --k12-yellow:#f6a623;
    --k12-yellow2:#ffb648;
    --k12-border: rgba(15,23,42,.12);
  }
  input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 1000px white inset !important;
  box-shadow: 0 0 0 1000px white inset !important;
  -webkit-text-fill-color: #0f172a !important;
  transition: background-color 9999s ease-in-out 0s;
}
  .k12-page{
    min-height: 100vh;
    background: #fff;
    color: white;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  }

  .k12-header{
    position: sticky;
    top: 0;
    z-index: 9999;
    width: 100%;
    left: 0;
    background: #fff;
    border-bottom: 1px solid rgba(2,6,23,0.08);
  }
  .k12-header-inner{
    width: 100%;
    max-width: none;
    margin: 0;
    padding: 12px 24px;
    display:flex;
    align-items:center;
    gap: 18px;
  }
  .k12-brand{
    display:flex;
    align-items:baseline;
    gap: 2px;
    text-decoration:none;
    font-weight: 800;
    letter-spacing: .2px;
  }
  .k12-brand-k{ font-size: 26px; color: #0b4f86; }
  .k12-brand-o{ font-size: 26px; color: #f97316; }

  .k12-nav{
    margin-left: 10px;
    display:flex;
    gap: 18px;
    flex: 1;
    flex-wrap: wrap;
  }
  .k12-nav a{
    text-decoration:none;
    color: #0f172a;
    font-weight: 700;
    font-size: 13px;
    opacity: .85;
  }
  .k12-nav a:hover{ opacity: 1; }

  .k12-hero{
    background: radial-gradient(1200px 600px at 10% 10%, var(--k12-blue2), var(--k12-blue1));
    padding: 44px 16px 56px;
  }

  .k12-hero-inner.k12-hero-2col{
    max-width: 1200px;
    margin: 0 auto;
    display:grid;
    grid-template-columns: 1.1fr .9fr;
    gap: 28px;
    align-items: start;
  }

  .k12-title{
    margin: 0 0 12px;
    font-size: 44px;
    line-height: 1.08;
    letter-spacing: -0.6px;
  }
  .k12-subtitle{
    margin: 0 0 22px;
    max-width: 640px;
    color: rgba(255,255,255,0.86);
    line-height: 1.6;
    font-size: 15px;
  }

  .k12-rightForm{
    display:flex;
    justify-content: flex-end;
  }

  .k12-card{
    width: min(520px, 100%);
    background: rgba(255,255,255,0.94);
    color: var(--k12-text);
    border-radius: 14px;
    padding: 18px;
    border: 1px solid rgba(2,6,23,0.10);
    box-shadow: 0 20px 60px rgba(2,6,23,0.20);
  }

  .k12-field{ margin-bottom: 14px; }
  .k12-label{
    display:block;
    font-weight: 800;
    font-size: 13px;
    color: rgba(15,23,42,.85);
    margin-bottom: 8px;
  }

  .k12-inputWrap{
    position: relative;
    display:flex;
    align-items:center;
    background: white;
    border: 1px solid var(--k12-border);
    border-radius: 12px;
    padding: 10px 12px;
  }
  .k12-inputWrap:focus-within{
    border-color: rgba(11,79,134,0.45);
    box-shadow: 0 0 0 4px rgba(11,79,134,0.14);
  }

  .k12-inputWrap-error{
    border-color: #dc2626 !important;
    box-shadow: none !important;
  }
  .k12-inputWrap-error:focus-within{
    border-color: #dc2626 !important;
    box-shadow: 0 0 0 4px rgba(220,38,38,0.12) !important;
  }

  .k12-icon{
    width: 34px;
    height: 34px;
    display:grid;
    place-items:center;
    color: rgba(15,23,42,.60);
  }
  .k12-input{
    width: 100%;
    border: none;
    outline: none;
    font-size: 15px;
    padding: 6px 4px;
    background: transparent;
    color: var(--k12-text);
  }
  .k12-eye{
    border: none;
    background: transparent;
    cursor: pointer;
    color: rgba(15,23,42,.55);
    display:grid;
    place-items:center;
    padding: 6px;
    border-radius: 10px;
  }
  .k12-eye:hover{ background: rgba(2,6,23,0.04); }

  .k12-fieldError{
    margin-top: 6px;
    color: #dc2626;
    font-size: 13px;
    font-weight: 700;
  }

  .k12-error{
    margin: 12px 0 12px;
    padding: 10px 12px;
    border-radius: 12px;
    background: rgba(239,68,68,0.10);
    color: #b91c1c;
    border: 1px solid rgba(239,68,68,0.18);
    font-weight: 700;
    font-size: 13px;
  }

  .k12-note{
    margin: 10px 0 14px;
    padding: 12px 12px;
    border-radius: 12px;
    background: rgba(245,158,11,0.12);
    border: 1px solid rgba(245,158,11,0.22);
    color: rgba(15,23,42,.85);
    font-size: 13px;
    line-height: 1.45;
  }

  .k12-btn{
    width: 100%;
    border: none;
    cursor: pointer;
    padding: 14px 14px;
    border-radius: 12px;
    background: linear-gradient(180deg, var(--k12-yellow2), var(--k12-yellow));
    color: #ffffff;
    font-weight: 900;
    letter-spacing: .2px;
    display:flex;
    align-items:center;
    justify-content: center;
    gap: 10px;
    box-shadow: 0 10px 26px rgba(246,166,35,0.30);
  }
  .k12-btn:disabled{
    opacity: .7;
    cursor: not-allowed;
    filter: grayscale(0.1);
  }

  .k12-linksRow{
    display:flex;
    align-items:center;
    gap: 8px;
    margin-top: 14px;
    font-size: 14px;
  }
  .k12-muted{ color: rgba(15,23,42,.65); font-weight: 700; }
  .k12-link{
    color: #0b4f86;
    font-weight: 900;
    text-decoration: none;
  }
  .k12-link:hover{ text-decoration: underline; }

  html, body {
    margin: 0;
    padding: 0;
  }

  @media (max-width: 980px){
    .k12-hero-inner.k12-hero-2col{
      grid-template-columns: 1fr;
      gap: 20px;
    }
    .k12-rightForm{
      justify-content: flex-start;
    }
    .k12-title{ font-size: 36px; }
    .k12-nav{ display:none; }
  }

  @media (max-width: 520px){
    .k12-title{ font-size: 30px; }
    .k12-card{ padding: 14px; }
  }
    #login,
  #diff,
  #about,
  #features,
  #feedback{
    scroll-margin-top: 90px;
  }
    .k12-diff-section{
  background: #eef3f7;
  padding: 40px 16px 50px; /* giảm mạnh */
}

  .k12-diff-container{
    max-width: 1280px;
    margin: 0 auto;
  }

  .k12-diff-title{
  margin: 0 0 8px;
  text-align: center;
  color: #123b68;
  font-size: 34px; /* ↓ từ 52 */
  line-height: 1.2;
  font-weight: 700;
}

.k12-diff-subtitle{
  max-width: 780px;
  margin: 0 auto 28px; /* ↓ */
  text-align: center;
  color: #6b7280;
  font-size: 14px; /* ↓ */
  line-height: 1.5;
}

  .k12-diff-grid{
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px 22px; /* ↓ */
}

  .k12-diff-card{
  perspective: 1000px;
  min-height: 180px; /* ↓ từ 250 */
}


  .k12-diff-card-inner{
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 180px;
    transition: transform .65s ease, box-shadow .35s ease;
    transform-style: preserve-3d;
  }

  .k12-diff-card:hover .k12-diff-card-inner{
    transform: rotateY(180deg) translateY(-8px);
  }

  .k12-diff-front,
  .k12-diff-back{
    position: absolute;
    inset: 0;
    border-radius: 18px;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    background: #fff;
    border: 1px solid rgba(15,23,42,.06);
    box-shadow: 0 10px 28px rgba(15,23,42,.06);
    padding: 18px 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .k12-diff-front h3,
  .k12-diff-back h3{
    margin: 0;
    text-align: center;
    color: #123b68;
    font-size: 24px;
    font-weight: 700;
  }

  .k12-diff-front{
    gap: 22px;
  }

  .k12-diff-icon{
    width: 60px;
    height: 60px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    font-size: 28px;
    background: linear-gradient(180deg, #eef7ff, #d9ecff);
    box-shadow: inset 0 0 0 1px rgba(21,139,214,.12);
  }

  .k12-diff-back{
    transform: rotateY(180deg);
    background: linear-gradient(180deg, #158bd6, #0b6bb5);
    color: #fff;
    align-items: flex-start;
    justify-content: center;
  }

  .k12-diff-back h3{
    color: #fff;
    text-align: left;
    margin-bottom: 14px;
  }

  .k12-diff-back p{
    margin: 0;
    font-size: 16px;
    line-height: 1.5;
    color: rgba(255,255,255,.95);
  }

  .k12-diff-card:hover .k12-diff-front,
  .k12-diff-card:hover .k12-diff-back{
    box-shadow: 0 18px 38px rgba(11,79,134,.18);
  }
    @media (max-width: 1100px){
    .k12-diff-grid{
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .k12-diff-title{
      font-size: 42px;
    }
  }

  @media (max-width: 680px){
    .k12-diff-grid{
      grid-template-columns: 1fr;
    }

    .k12-diff-title{
      font-size: 32px;
    }

    .k12-diff-subtitle{
      font-size: 15px;
      margin-bottom: 32px;
    }

    .k12-diff-card,
    .k12-diff-card-inner{
      min-height: 220px;
    }
  }
`;
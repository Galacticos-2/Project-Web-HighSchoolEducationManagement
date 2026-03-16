import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/UserActions.css";
import "../styles/myinfor.css";
/**
 * Props:
 * variant: "admin" | "teacher" | "student"
 * fullName: string
 * avatarLetter?: string
 * onMyAccount?: () => void
 * onChangePassword?: () => void
 * onLogout?: () => void
 * notifCount?: number
 * messageCount?: number
 */

export default function UserActions({
    variant = "admin",
    fullName = "User",
    avatarLetter,
    onMyAccount,
    onChangePassword,
    onLogout,
    notifCount,
    messageCount,
}) {

    const letter = useMemo(() => {
        const l = avatarLetter || fullName?.trim()?.[0] || "U";
        return String(l).toUpperCase();
    }, [avatarLetter, fullName]);

    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    // close dropdown
    useEffect(() => {

        function handleClickOutside(e) {
            if (!wrapRef.current) return;
            if (!wrapRef.current.contains(e.target)) {
                setOpen(false);
            }
        }

        function handleEsc(e) {
            if (e.key === "Escape") setOpen(false);
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEsc);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEsc);
        };

    }, []);

    const handleMyAccount = () => {
        setOpen(false);
        onMyAccount?.();
    };

    const handleChangePw = () => {
        setOpen(false);
        onChangePassword?.();
    };

    const handleLogout = () => {
        setOpen(false);
        onLogout?.();
    };

    /* =========================
       STUDENT + TEACHER UI
       ========================= */

    if (variant !== "admin") {
        return (
            <div className="user-actions">

                <div className="user-menu" ref={wrapRef}>

                    <button
                        type="button"
                        className="user-avatar-btn"
                        onClick={() => setOpen(v => !v)}
                        aria-haspopup="menu"
                        aria-expanded={open}
                        title={fullName}
                    >
                        <span className="user-avatar">{letter}</span>

                        <span className="user-name">{fullName}</span>

                        <span className={`user-caret ${open ? "open" : ""}`}>
                            ▾
                        </span>
                    </button>

                    {open && (
                        <div className="user-menu-dropdown">

                            <button
                                className="user-menu-item"
                                onClick={handleMyAccount}
                            >
                                <span className="user-menu-icon">👤</span>
                                <span>Tài khoản của tôi</span>
                            </button>

                            <button
                                className="user-menu-item"
                                onClick={handleChangePw}
                            >
                                <span className="user-menu-icon">🔑</span>
                                <span>Đổi mật khẩu</span>
                            </button>

                            <div className="user-menu-divider" />

                            <button
                                className="user-menu-item danger"
                                onClick={handleLogout}
                            >
                                <span className="user-menu-icon">↩</span>
                                <span>Đăng xuất</span>
                            </button>

                        </div>
                    )}

                </div>

            </div>
        );
    }

    /* =========================
       ADMIN UI
       ========================= */

    const styles = {
        iconBtn: {
            width: 40,
            height: 40,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.12)",
            color: "#fff",
            cursor: "pointer",
            position: "relative"
        },

        badge: {
            position: "absolute",
            top: 6,
            right: 6,
            width: 16,
            height: 16,
            borderRadius: 999,
            background: "#f97316",
            color: "#fff",
            fontSize: 11,
            display: "grid",
            placeItems: "center",
            fontWeight: 900
        },

        userPill: {
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.12)",
            color: "#fff",
            cursor: "pointer"
        },

        dropdownWrap: {
            position: "absolute",
            right: 0,
            top: "calc(100% + 10px)",
            width: 220,
            background: "#0b1220",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 18px 40px rgba(0,0,0,0.35)"
        },

        dropdownItem: (danger) => ({
            width: "100%",
            textAlign: "left",
            padding: "12px 12px",
            background: "transparent",
            border: "none",
            color: danger ? "#fb7185" : "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontWeight: 700
        })
    };

    return (
        <>
            {typeof notifCount === "number" && (
                <button style={styles.iconBtn}>
                    🔔
                    <span style={styles.badge}>{notifCount}</span>
                </button>
            )}

            {typeof messageCount === "number" && (
                <button style={styles.iconBtn}>
                    ✉️
                    <span style={styles.badge}>{messageCount}</span>
                </button>
            )}

            <div ref={wrapRef} style={{ position: "relative" }}>

                <button
                    style={styles.userPill}
                    onClick={() => setOpen(v => !v)}
                >
                    <span
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: 999,
                            background: "rgba(255,255,255,0.18)",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 900
                        }}
                    >
                        {letter}
                    </span>

                    <span style={{ fontWeight: 800 }}>
                        {fullName}
                    </span>

                    <span>
                        {open ? "▴" : "▾"}
                    </span>

                </button>

                {open && (
                    <div style={styles.dropdownWrap}>

                        <button
                            style={styles.dropdownItem(false)}
                            onClick={handleMyAccount}
                        >
                            👤 Tài khoản của tôi
                        </button>

                        <button
                            style={styles.dropdownItem(false)}
                            onClick={handleChangePw}
                        >
                            🔑 Đổi mật khẩu
                        </button>

                        <div style={{ height: 1, background: "rgba(255,255,255,0.1)" }} />

                        <button
                            style={styles.dropdownItem(true)}
                            onClick={handleLogout}
                        >
                            ↩ Đăng xuất
                        </button>

                    </div>
                )}

            </div>
        </>
    );
}
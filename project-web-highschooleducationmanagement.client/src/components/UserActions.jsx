import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Props:
 * - variant: "admin" | "teacher" | "student"
 * - fullName: string
 * - avatarLetter: string (optional)
 * - onMyAccount: () => void
 * - onChangePassword: () => void
 * - onLogout: () => void
 * - notifCount?: number (optional)
 * - messageCount?: number (optional)
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
        const l = avatarLetter || (fullName?.trim()?.[0] || "U");
        return String(l).toUpperCase();
    }, [avatarLetter, fullName]);

    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    // Close dropdown when click outside + ESC
    useEffect(() => {
        function onDocMouseDown(e) {
            if (!wrapRef.current) return;
            if (!wrapRef.current.contains(e.target)) setOpen(false);
        }
        function onEsc(e) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", onDocMouseDown);
        document.addEventListener("keydown", onEsc);
        return () => {
            document.removeEventListener("mousedown", onDocMouseDown);
            document.removeEventListener("keydown", onEsc);
        };
    }, []);

    const onClickMy = () => {
        setOpen(false);
        onMyAccount?.();
    };
    const onClickChangePw = () => {
        setOpen(false);
        onChangePassword?.();
    };
    const onClickLogout = () => {
        setOpen(false);
        onLogout?.();
    };

    // ===== TEACHER + STUDENT: same pill UI (like your student screenshot) =====
    if (variant === "teacher" || variant === "student") {
        const prefix = variant; // "teacher" | "student"

        return (
            <div className={`${prefix}-actions`}>
                {/* optional icons (if you ever pass counts) */}
                {typeof notifCount === "number" && (
                    <button className={`${prefix}-icon-btn`} title="Notifications" type="button">
                        🔔
                        <span className={`${prefix}-badge`}>{notifCount}</span>
                    </button>
                )}

                {typeof messageCount === "number" && (
                    <button className={`${prefix}-icon-btn`} title="Messages" type="button">
                        ✉️
                        <span className={`${prefix}-badge`}>{messageCount}</span>
                    </button>
                )}

                {/* user dropdown */}
                <div className={`${prefix}-menu`} ref={wrapRef}>
                    <button
                        type="button"
                        className={`${prefix}-avatar-btn`}
                        onClick={() => setOpen((v) => !v)}
                        aria-haspopup="menu"
                        aria-expanded={open}
                        title={fullName}
                    >
                        <span className={`${prefix}-avatar`}>{letter}</span>
                        <span className={`${prefix}-name`}>{fullName}</span>
                        <span className={`${prefix}-caret ${open ? "open" : ""}`}>▾</span>
                    </button>

                    {open && (
                        <div className={`${prefix}-menu__dropdown`} role="menu">
                            <button className={`${prefix}-menu__item`} type="button" onClick={onClickMy}>
                                <span className={`${prefix}-menu__icon`}>👤</span>
                                <span>Tài khoản của tôi</span>
                            </button>

                            <button className={`${prefix}-menu__item`} type="button" onClick={onClickChangePw}>
                                <span className={`${prefix}-menu__icon`}>🔑</span>
                                <span>Đổi mật khẩu</span>
                            </button>

                            <div className={`${prefix}-menu__divider`} />

                            <button className={`${prefix}-menu__item danger`} type="button" onClick={onClickLogout}>
                                <span className={`${prefix}-menu__icon`}>↩</span>
                                <span>Đăng xuất</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ===== ADMIN: giữ inline look như bạn đang có =====
    const styles = {
        iconBtn: {
            width: 40,
            height: 40,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.12)",
            color: "#fff",
            cursor: "pointer",
            position: "relative",
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
            fontWeight: 900,
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
            cursor: "pointer",
            userSelect: "none",
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
            fontWeight: 700,
        }),
        dropdownWrap: {
            position: "absolute",
            right: 0,
            top: "calc(100% + 10px)",
            width: 220,
            background: "#0b1220",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
            zIndex: 60,
        },
    };

    return (
        <>
            {typeof notifCount === "number" && (
                <button style={styles.iconBtn} title="Notifications" type="button">
                    🔔
                    <span style={styles.badge}>{notifCount}</span>
                </button>
            )}

            {typeof messageCount === "number" && (
                <button style={styles.iconBtn} title="Messages" type="button">
                    ✉️
                    <span style={styles.badge}>{messageCount}</span>
                </button>
            )}

            <div ref={wrapRef} style={{ position: "relative" }}>
                <button
                    style={styles.userPill}
                    title={fullName}
                    onClick={() => setOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={open}
                    type="button"
                >
                    <span
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: 999,
                            background: "rgba(255,255,255,0.18)",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 900,
                        }}
                    >
                        {letter}
                    </span>
                    <span style={{ fontWeight: 800 }}>{fullName}</span>
                    <span style={{ opacity: 0.8 }}>{open ? "▴" : "▾"}</span>
                </button>

                {open && (
                    <div role="menu" style={styles.dropdownWrap}>
                        <button type="button" onClick={onClickMy} style={styles.dropdownItem(false)}>
                            <span style={{ width: 22 }}>👤</span>
                            <span>Tài khoản của tôi</span>
                        </button>

                        <button type="button" onClick={onClickChangePw} style={styles.dropdownItem(false)}>
                            <span style={{ width: 22 }}>🔑</span>
                            <span>Đổi mật khẩu</span>
                        </button>

                        <div style={{ height: 1, background: "rgba(255,255,255,0.10)" }} />

                        <button type="button" onClick={onClickLogout} style={styles.dropdownItem(true)}>
                            <span style={{ width: 22 }}>↩</span>
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
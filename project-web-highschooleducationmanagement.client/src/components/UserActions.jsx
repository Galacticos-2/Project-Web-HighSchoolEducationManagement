import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/UserActions.css";
import "../styles/myinfor.css";
import { useNotifications } from "../context/useNotifications";
import { useNavigate } from "react-router-dom";
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
    avatarURL,
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
    const [notifOpen, setNotifOpen] = useState(false);
    // close dropdown
    useEffect(() => {

        function handleClickOutside(e) {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setOpen(false);
            }

            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifOpen(false);
            }
        }

        function handleEsc(e) {
            if (e.key === "Escape") {
                setOpen(false);
                setNotifOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEsc);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEsc);
        };

    }, []);
    const nav = useNavigate();
    const {
        items,
        unreadCount,
        markAsRead,
        deleteNotification,
        toastItems,
        removeToast,
        handleToastClick,
        formatNotificationTime
    } = useNotifications();
    
    const notifRef = useRef(null);
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

                <div className="user-notif" ref={notifRef}>
                    <button
                        type="button"
                        className="user-notif-btn"
                        onClick={() => setNotifOpen(v => !v)}
                        title="Thông báo"
                    >
                        <span aria-hidden="true">🔔</span>
                        {unreadCount > 0 && (
                            <span className="user-notif-badge">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {notifOpen && (
                        <div className="user-notif-dropdown">
                            <div className="user-notif-header">Thông báo</div>

                            {items.length === 0 ? (
                                <div className="user-notif-empty">Chưa có thông báo.</div>
                            ) : (
                                    items.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`user-notif-item ${item.isRead ? "" : "unread"}`}
                                        >
                                            <button
                                                type="button"
                                                className="user-notif-remove"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    await deleteNotification(item.id);
                                                }}
                                                title="Xóa khỏi danh sách"
                                            >
                                                ×
                                            </button>

                                            <button
                                                type="button"
                                                className="user-notif-main"
                                                onClick={async () => {
                                                    await markAsRead(item.id);
                                                    setNotifOpen(false);
                                                    if (item.navigationUrl) nav(item.navigationUrl);
                                                }}
                                            >
                                                <div className="user-notif-top">
                                                    <div className="user-notif-title">{item.title}</div>
                                                    <div className="user-notif-time">
                                                        {formatNotificationTime(item.createdAtUtc)}
                                                    </div>
                                                </div>

                                                <div className="user-notif-message">{item.message}</div>
                                            </button>
                                        </div>
                                    ))
                            )}
                        </div>
                    )}
                    
                </div>
                <div className="floating-notification-stack">
                    {toastItems.map((item) => (
                        <div
                            key={item.toastId}
                            className={`floating-notification ${item.isRead ? "" : "unread"}`}
                        >
                            <button
                                type="button"
                                className="floating-notification-close"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeToast(item.toastId);
                                }}
                                title="Đóng"
                            >
                                ×
                            </button>

                            <button
                                type="button"
                                className="floating-notification-main"
                                onClick={() => handleToastClick(item)}
                            >
                                <div className="floating-notification-top">
                                    <div className="floating-notification-title">
                                        {item.title}
                                    </div>
                                    <div className="floating-notification-time">
                                        {formatNotificationTime(item.createdAtUtc)}
                                    </div>
                                </div>

                                <div className="floating-notification-message">
                                    {item.message}
                                </div>
                            </button>
                        </div>
                    ))}
                </div>
                <div className="user-menu" ref={wrapRef}>
                    <button
                        type="button"
                        className="user-avatar-btn"
                        onClick={() => setOpen(v => !v)}
                        aria-haspopup="menu"
                        aria-expanded={open}
                        title={fullName}
                    >
                        <span className="user-avatar">
                            {avatarURL ? (
                                <img src={avatarURL} alt="Avatar" className="user-avatar-img" />
                            ) : (
                                letter
                            )}
                        </span>

                        <span className="user-name">{fullName}</span>

                        <span className={`user-caret ${open ? "open" : ""}`}>
                            ▾
                        </span>
                    </button>

                    {open && (
                        <div className="user-menu-dropdown">
                            <button className="user-menu-item" onClick={handleMyAccount}>
                                <span className="user-menu-icon">👤</span>
                                <span>Tài khoản của tôi</span>
                            </button>

                            <button className="user-menu-item" onClick={handleChangePw}>
                                <span className="user-menu-icon">🔑</span>
                                <span>Đổi mật khẩu</span>
                            </button>

                            <div className="user-menu-divider" />

                            <button className="user-menu-item danger" onClick={handleLogout}>
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
                            fontWeight: 900,
                            overflow: "hidden"
                        }}
                    >
                        {avatarURL ? (
                            <img
                                src={avatarURL}
                                alt="Avatar"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block"
                                }}
                            />
                        ) : (
                            letter
                        )}
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
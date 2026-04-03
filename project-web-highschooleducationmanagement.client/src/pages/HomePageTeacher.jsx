// src/pages/HomePageTeacher.jsx
import Brand from "../components/Brand";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "../styles/teacherHome.css";
import UserActions from "../components/UserActions";
/* =========================
   ICONS (SVG)
   ========================= */
function IconBook() {
    return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M4.5 5.5C4.5 4.67157 5.17157 4 6 4H18C18.8284 4 19.5 4.67157 19.5 5.5V19.5C19.5 20.3284 18.8284 21 18 21H6C5.17157 21 4.5 20.3284 4.5 19.5V5.5Z"
                stroke="#1B65C8"
                strokeWidth="1.8"
            />
            <path d="M8 7.5H16" stroke="#F07B2A" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M8 11H16" stroke="#1B65C8" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M8 14.5H14" stroke="#1B65C8" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}

function IconVirtualClass() {
    return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M4 7.5C4 6.67157 4.67157 6 5.5 6H18.5C19.3284 6 20 6.67157 20 7.5V15.5C20 16.3284 19.3284 17 18.5 17H5.5C4.67157 17 4 16.3284 4 15.5V7.5Z"
                stroke="#1B65C8"
                strokeWidth="1.8"
            />
            <path d="M9 20H15" stroke="#F07B2A" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M12 17V20" stroke="#1B65C8" strokeWidth="1.8" strokeLinecap="round" />
            <path
                d="M10.2 10.2C10.2 9.206 11.006 8.4 12 8.4C12.994 8.4 13.8 9.206 13.8 10.2C13.8 11.194 12.994 12 12 12C11.006 12 10.2 11.194 10.2 10.2Z"
                stroke="#F07B2A"
                strokeWidth="1.8"
            />
            <path
                d="M8.8 14.6C9.6 13.6 10.7 13 12 13C13.3 13 14.4 13.6 15.2 14.6"
                stroke="#1B65C8"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    );
}

function IconCalendar() {
    return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M6.5 5.5H17.5C18.3284 5.5 19 6.17157 19 7V18C19 18.8284 18.3284 19.5 17.5 19.5H6.5C5.67157 19.5 5 18.8284 5 18V7C5 6.17157 5.67157 5.5 6.5 5.5Z"
                stroke="#1B65C8"
                strokeWidth="1.8"
            />
            <path d="M8 4V7" stroke="#F07B2A" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M16 4V7" stroke="#F07B2A" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M5 9.5H19" stroke="#1B65C8" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M8.2 12.6H12.2" stroke="#1B65C8" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M8.2 15.6H15.8" stroke="#1B65C8" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M10.5 18.5C14.6421 18.5 18 15.1421 18 11C18 6.85786 14.6421 3.5 10.5 3.5C6.35786 3.5 3 6.85786 3 11C3 15.1421 6.35786 18.5 10.5 18.5Z"
                stroke="#1B65C8"
                strokeWidth="1.8"
            />
            <path d="M16.5 16.5L21 21" stroke="#F07B2A" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}

/* icon nhỏ dùng trong menu */


/* =========================
   PAGE
   ========================= */
export default function HomePageTeacher() {
    const nav = useNavigate();

    const { profile, clearAuthState } = useAuth();

    const fullName = profile?.fullName || "Giáo viên";
    const avatarLetter = (fullName?.trim()?.[0] || "G").toUpperCase();
    const avatarURL = profile?.avatarURL || "";

    

   


  

    const onTile = (path) => nav(path);

    // ===== Menu actions =====
    const onMyAccount = () => nav("/my-info");

    const onChangePassword = () => nav("/teacher/change-password");
    const onLogout = () => {
        clearAuthState();
        nav("/login", { replace: true });
    };

   
    return (
        <div className="teacher-home">
            {/* Top bar */}
            <div className="teacher-topbar">
                <div className="teacher-topbar__inner">
                    <Brand />

                    <UserActions
                        variant="teacher"
                        fullName={fullName}
                        avatarLetter={avatarLetter}
                        avatarURL={avatarURL}
                        onMyAccount={onMyAccount}
                        onChangePassword={onChangePassword}
                        onLogout={onLogout}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="teacher-content">
                <div className="teacher-content__inner">
                    

                    <div className="teacher-section">
                        <div className="teacher-tiles">
                            <div className="teacher-tile" role="button" tabIndex={0} onClick={() => onTile("/teacher/lessons")}>
                                <div className="teacher-tile__icon">
                                    <IconBook />
                                </div>
                                <div>
                                    <div className="teacher-tile__title">Bài giảng</div>
                                    <p className="teacher-tile__desc">Bài giảng trực tuyến để học sinh tự học</p>
                                </div>
                            </div>

                            <div className="teacher-tile" role="button" tabIndex={0} onClick={() => onTile("/teacher/virtual-class")}>
                                <div className="teacher-tile__icon">
                                    <IconVirtualClass />
                                </div>
                                <div>
                                    <div className="teacher-tile__title">Lớp học ảo</div>
                                    <p className="teacher-tile__desc">Lớp học ảo tương tác trực tuyến đồng thời 1-nhiều</p>
                                </div>
                            </div>

                            <div className="teacher-tile" role="button" tabIndex={0} onClick={() => onTile("/teacher/schedule")}>
                                <div className="teacher-tile__icon">
                                    <IconCalendar />
                                </div>
                                <div>
                                    <div className="teacher-tile__title">Lịch trình</div>
                                    <p className="teacher-tile__desc">Xem lịch trình giảng dạy, thời khóa biểu </p>
                                </div>
                            </div>
                        </div>

                        {/* chỗ này sau có thể thêm module khác */}
                    </div>
                </div>
            </div>
        </div>
    );
}
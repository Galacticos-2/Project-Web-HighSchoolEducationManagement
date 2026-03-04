// src/pages/HomePageStudent.jsx
import Brand from "../components/Brand";
import { useNavigate } from "react-router-dom";
import { authStorage } from "../auth/authStorage";
import "../styles/studentHome.css";
import UserActions from "../components/UserActions";

/* =========================
   ICONS (SVG) - same style
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

/* =========================
   PAGE
   ========================= */
export default function HomePageStudent() {
    const nav = useNavigate();

    const profile = authStorage.getProfile();
    const fullName = profile?.fullName || "Học sinh";
    const avatarLetter = (fullName?.trim()?.[0] || "H").toUpperCase();

    const onTile = (path) => nav(path);

    // ===== Menu actions =====
    const onMyAccount = () => nav("/my-info"); // nếu bạn tách riêng student: đổi thành "/student/my-info"
    const onChangePassword = () => nav("/student/change-password");
    const onLogout = () => {
        authStorage.clear();
        nav("/login", { replace: true });
    };

    return (
        <div className="student-home">
            {/* Top bar */}
            <div className="student-topbar">
                <div className="student-topbar__inner">
                    <Brand />

                    <UserActions
                        variant="student"
                        fullName={fullName}
                        avatarLetter={avatarLetter}
                        onMyAccount={onMyAccount}
                        onChangePassword={onChangePassword}
                        onLogout={onLogout}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="student-content">
                <div className="student-content__inner">
                    <div className="student-section">
                        <div className="student-tiles">
                            <div className="student-tile" role="button" tabIndex={0} onClick={() => onTile("/student/lessons")}>
                                <div className="student-tile__icon">
                                    <IconBook />
                                </div>
                                <div>
                                    <div className="student-tile__title">Bài giảng</div>
                                    <p className="student-tile__desc">Bài giảng trực tuyến để tự học</p>
                                </div>
                            </div>

                            <div className="student-tile" role="button" tabIndex={0} onClick={() => onTile("/student/virtual-class")}>
                                <div className="student-tile__icon">
                                    <IconVirtualClass />
                                </div>
                                <div>
                                    <div className="student-tile__title">Lớp học ảo</div>
                                    <p className="student-tile__desc">Tham gia lớp học ảo tương tác trực tuyến</p>
                                </div>
                            </div>

                            <div className="student-tile" role="button" tabIndex={0} onClick={() => onTile("/student/schedule")}>
                                <div className="student-tile__icon">
                                    <IconCalendar />
                                </div>
                                <div>
                                    <div className="student-tile__title">Thời khóa biểu</div>
                                    <p className="student-tile__desc">Xem thời khóa biểu, lịch học</p>
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
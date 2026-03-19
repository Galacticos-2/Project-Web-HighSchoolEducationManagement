import { useEffect, useState } from "react";
import { virtualClassesApi } from "../api/virtualClassesApi";
import Brand from "../components/Brand";
import UserActions from "../components/UserActions";
import { authStorage } from "../auth/authStorage";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import "../styles/lessons.css";
import Pagination from "../components/Pagination";
export default function StudentVirtualClassPage() {

    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const profile = authStorage.getProfile();
    const fullName = profile?.fullName || "Học sinh";
    const avatarLetter = (fullName?.trim()?.[0] || "H").toUpperCase();

    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;

    useEffect(() => {

        const load = async () => {

            setLoading(true);

            try {

                const res = await virtualClassesApi.listStudent({
                    page: page,
                    pageSize: 10
                });

                console.log("API response:", res);

                const data = res.data;

                setList(data.items || []);
                setTotal(data.total || 0);

            } catch (err) {

                console.error("Không tải được lớp học ảo", err);

            } finally {

                setLoading(false);

            }

        };

        load();

    }, [page]);

    const getStatus = (start, end) => {

        const now = new Date();
        const s = new Date(start);
        const e = end ? new Date(end) : null;

        if (now < s) return "Sắp diễn ra";
        if (e && now > e) return "Đã kết thúc";

        return "Đang diễn ra";

    };

    return (

        <div className="teacher-home">

            {/* TOPBAR */}
            <div className="teacher-topbar">
                <div className="teacher-topbar__inner">

                    <Brand />

                    <UserActions
                        variant="student"
                        fullName={fullName}
                        avatarLetter={avatarLetter}
                        onMyAccount={() => navigate("/my-info")}
                        onChangePassword={() => console.log("change")}
                        onLogout={() => {
                            authStorage.clear();
                            window.location.href = "/login";
                        }}
                    />

                </div>
            </div>

            <div className="lesson-page">

                <div className="lesson-head">

                    <div className="lesson-title-row">
                        <h2 className="lesson-title">Lớp học ảo</h2>
                    </div>

                </div>

                <div className="lesson-body">

                    {loading ? (

                        <div className="empty">Đang tải...</div>

                    ) : list.length === 0 ? (

                        <div className="empty">
                            <div className="empty-icon">📚</div>
                            <div className="empty-text">
                                Chưa có lớp học ảo
                            </div>
                        </div>

                    ) : (

                        <>
                            <div className="lesson-list">

                                <div className="lesson-table-header">
                                    <div>STT</div>
                                    <div>Lớp</div>
                                    <div>Môn</div>
                                    <div>Thời gian</div>
                                    <div>Link</div>
                                    <div>Trạng thái</div>
                                    <div>Hành động</div>
                                </div>

                                {list.map((it, index) => {

                                    const status = getStatus(it.startTime, it.endTime);

                                    return (

                                        <div className="lesson-row" key={it.id}>

                                            <div className="lesson-cell">
                                                {(page - 1) * pageSize + index + 1}
                                            </div>

                                            <div className="lesson-cell">
                                                {it.className}
                                            </div>

                                            <div className="lesson-cell">
                                                {it.subjectName}
                                            </div>

                                            <div className="lesson-cell">
                                                {new Date(it.startTime).toLocaleString()}
                                            </div>

                                            <div className="lesson-cell">
                                                <span style={{ color: "#4f46e5" }}>
                                                    {it.meetingUrl}
                                                </span>
                                            </div>

                                            <div className="lesson-cell">

                                                <span
                                                    className={`status-badge ${status === "Sắp diễn ra"
                                                            ? "status-upcoming"
                                                            : status === "Đang diễn ra"
                                                                ? "status-live"
                                                                : "status-ended"
                                                        }`}
                                                >
                                                    {status}
                                                </span>

                                            </div>

                                            <div className="lesson-actions-cell">

                                                <Button
                                                    onClick={() => {

                                                        let url = it.meetingUrl || "";

                                                        if (!url.startsWith("http")) {
                                                            url = "https://" + url;
                                                        }

                                                        window.open(url, "_blank");

                                                    }}
                                                >
                                                    ▶ Tham gia
                                                </Button>

                                            </div>

                                        </div>

                                    );

                                })}

                            </div>

                                    <Pagination
                                        page={page}
                                        pageSize={pageSize}
                                        total={total}
                                        onPageChange={(p) => setPage(p)}
                                    />
                        </>
                    )}

                </div>

            </div>

        </div>

    );

}
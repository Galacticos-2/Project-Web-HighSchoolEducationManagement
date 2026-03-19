import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { lessonsApi } from "../api/lessonsApi";
import Brand from "../components/Brand";
import UserActions from "../components/UserActions";
import { authStorage } from "../auth/authStorage";
import "../styles/lessons.css";
import Button from "../components/Button";
import Pagination from "../components/Pagination";
function bytesToSize(bytes) {
    if (!bytes && bytes !== 0) return "";
    const sizes = ["B", "KB", "MB", "GB"];
    let i = 0;
    let v = bytes;
    while (v >= 1024 && i < sizes.length - 1) {
        v = v / 1024;
        i++;
    }
    return `${v.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

export default function StudentLessonsPage() {

    const nav = useNavigate();

    const profile = authStorage.getProfile();
    const fullName = profile?.fullName || "Học sinh";
    const avatarLetter = (fullName?.trim()?.[0] || "H").toUpperCase();

    const onMyAccount = () => nav("/my-info");
    const onChangePassword = () => nav("/student/change-password");
    const onLogout = () => {
        authStorage.clear();
        nav("/login", { replace: true });
    };
    const [sortBy, setSortBy] = useState("");
    const [order, setOrder] = useState("");
    const [q, setQ] = useState("");

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const [paged, setPaged] = useState({
        items: [],
        page: 1,
        pageSize: 10,
        total: 0
    });

    const load = async (page = 1, sBy = sortBy, ord = order) => {
        setErr("");
        setLoading(true);

        try {

            const { data } = await lessonsApi.listForStudent({
                page,
                pageSize: paged.pageSize,
                q,
                sortBy: sBy,
                order: ord
            });

            setPaged(data);

        } catch (ex) {

            const msg =
                ex?.response?.data?.message ||
                ex?.response?.data ||
                "Không tải được danh sách bài giảng.";

            setErr(typeof msg === "string" ? msg : JSON.stringify(msg));

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(1);
    }, []);

    const onReload = () => load(paged.page || 1);

    const onSearch = (e) => {
        e.preventDefault();
        load(1);
    };
    const toggleSort = (field) => {
        let newOrder = "asc";

        if (sortBy === field) {
            newOrder = order === "asc" ? "desc" : "asc";
        }

        setSortBy(field);
        setOrder(newOrder);

        load(1, field, newOrder);
    };
    const onDownload = async (item) => {

        try {

            const res = await lessonsApi.downloadForStudent(item.id);

            const blob = new Blob([res.data], {
                type: item.contentType || "application/octet-stream"
            });

            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = item.fileName || `lesson-${item.id}`;

            document.body.appendChild(a);
            a.click();
            a.remove();

            window.URL.revokeObjectURL(url);

        } catch (ex) {

            alert(ex?.response?.data?.message || "Không tải được file.");

        }
    };

    

    return (
        <div className="student-home">

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

            <div className="lesson-page">

                <div className="lesson-head">

                    <div className="lesson-title-row">

                        <h2 className="lesson-title">
                            Bài giảng
                        </h2>

                        <div className="lesson-actions">

                            <Button
                                variant="secondary"
                                onClick={onReload}
                                disabled={loading}
                            >
                                ⟳ Tải lại
                            </Button>

                        </div>

                    </div>

                    <form className="lesson-filters" onSubmit={onSearch}>

                        <div className="lesson-search">

                            <input
                                placeholder="Tên bài giảng"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />

                            <button
                                className="lesson-btn"
                                type="submit"
                                disabled={loading}
                            >
                                🔎 Tìm
                            </button>

                        </div>

                    </form>

                    {err && <div className="alert">{err}</div>}

                </div>

                <div className="lesson-body">

                    {loading ? (

                        <div className="empty">
                            Đang tải...
                        </div>

                    ) : (paged.items?.length || 0) === 0 ? (

                        <div className="empty">

                            <div className="empty-icon">
                                📄
                            </div>

                            <div className="empty-text">
                                Không có dữ liệu
                            </div>

                            <div className="muted" style={{ marginTop: 8 }}>
                                Chỉ hiển thị bài giảng đã đăng của giáo viên dạy lớp bạn.
                            </div>

                        </div>

                    ) : (

                        <>
                            <div className="lesson-list">

                                <div className="lesson-table-header">
                                    <div>STT</div>
                                            <div
                                                onClick={() => toggleSort("title")}
                                                style={{ cursor: "pointer", userSelect: "none" }}
                                            >
                                                Tên bài giảng {sortBy === "title" && (order === "asc" ? "↑" : "↓")}
                                            </div>
                                    <div>Mô tả</div>
                                    <div>Thời gian</div>
                                    <div>File</div>
                                    <div>Trạng thái</div>
                                    <div>Tải xuống</div>
                                </div>

                                {paged.items.map((it, index) => (

                                    <div className="lesson-row" key={it.id}>

                                        <div className="lesson-cell">
                                            {(paged.page - 1) * paged.pageSize + index + 1}
                                        </div>

                                        <div className="lesson-cell">
                                            {it.title}
                                        </div>

                                        <div className="lesson-cell lesson-desc">
                                            {it.description}
                                        </div>

                                        <div className="lesson-cell">
                                            {it.timeShouldLearn}
                                        </div>

                                        <div className="lesson-cell">
                                            {it.fileName} • {bytesToSize(it.fileSize)}
                                        </div>

                                        <div className="lesson-cell">
                                            <span className="status-badge">
                                                {it.status}
                                            </span>
                                        </div>

                                        <div className="lesson-actions-cell">

                                            <Button
                                                onClick={() => onDownload(it)}
                                            >
                                                ⬇ Tải xuống
                                            </Button>

                                        </div>

                                    </div>

                                ))}

                            </div>

                                    <Pagination
                                        page={paged.page}
                                        pageSize={paged.pageSize}
                                        total={paged.total}
                                        onPageChange={(p) => load(p)}
                                    />
                        </>

                    )}

                </div>

            </div>

        </div>
    );
}
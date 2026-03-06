import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/studentLessons.css";
import { lessonsApi } from "../api/lessonsApi";

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
    const [q, setQ] = useState("");

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [paged, setPaged] = useState({ items: [], page: 1, pageSize: 10, total: 0 });

    const load = async (page = 1) => {
        setErr("");
        setLoading(true);
        try {
            const { data } = await lessonsApi.listForStudent({
                page,
                pageSize: paged.pageSize,
                q,
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onReload = () => load(paged.page || 1);

    const onSearch = (e) => {
        e.preventDefault();
        load(1);
    };

    const onDownload = async (item) => {
        try {
            const res = await lessonsApi.downloadForStudent(item.id);
            const blob = new Blob([res.data], { type: item.contentType || "application/octet-stream" });
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
        <div className="sl-page">
            <div className="sl-head">
                <div className="sl-breadcrumb">
                    <span className="muted">Trang chủ</span> <span className="muted">›</span>{" "}
                    <span className="muted">Học tập</span> <span className="muted">›</span>{" "}
                    <b>Bài giảng</b>
                </div>

                <div className="sl-title-row">
                    <h2 className="sl-title">Bài giảng</h2>
                    <div className="sl-actions">
                        <button className="btn" onClick={onReload} disabled={loading}>
                            ⟳ Tải lại
                        </button>
                    </div>
                </div>

                <form className="sl-filters" onSubmit={onSearch}>
                    <div className="sl-search">
                        <input placeholder="Tên bài giảng" value={q} onChange={(e) => setQ(e.target.value)} />
                        <button className="btn" type="submit" disabled={loading}>
                            🔎 Tìm
                        </button>
                    </div>

                    <div className="sl-back">
                        <Link className="link" to="/student">
                            ← Quay lại trang chủ học sinh
                        </Link>
                    </div>
                </form>

                {err ? <div className="alert">{err}</div> : null}
            </div>

            <div className="sl-body">
                {loading ? (
                    <div className="empty">Đang tải...</div>
                ) : (paged.items?.length || 0) === 0 ? (
                    <div className="empty">
                        <div className="empty-icon">📄</div>
                        <div className="empty-text">Không có dữ liệu</div>
                        <div className="muted" style={{ marginTop: 8 }}>
                            Chỉ hiển thị bài giảng đã đăng của giáo viên dạy lớp bạn.
                        </div>
                    </div>
                ) : (
                    <div className="sl-list">
                        {paged.items.map((it) => (
                            <div className="sl-card" key={it.id}>
                                <div className="sl-card-main">
                                    <div className="sl-card-title">{it.title}</div>
                                    {it.description ? <div className="sl-card-desc">{it.description}</div> : null}
                                    <div className="sl-meta">
                                        <span className="badge">{it.status}</span>
                                        <span className="muted">{it.fileName}</span>
                                        <span className="muted">• {bytesToSize(it.fileSize)}</span>
                                    </div>
                                </div>

                                <div className="sl-card-actions">
                                    <button className="btn" onClick={() => onDownload(it)}>
                                        Tải xuống
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
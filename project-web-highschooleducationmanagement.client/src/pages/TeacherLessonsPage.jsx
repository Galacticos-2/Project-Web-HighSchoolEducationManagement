import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/teacherLessons.css";
import { lessonsApi } from "../api/lessonsApi";

const STATUSES = [
    { value: "", label: "-- Chọn trạng thái --" },
    { value: "Draft", label: "Nháp" },
    { value: "Published", label: "Đã đăng" },
    { value: "Hidden", label: "Ẩn" },
];

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

export default function TeacherLessonsPage() {
    

    // filters
    const [status, setStatus] = useState("");
    const [q, setQ] = useState("");

    // data
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [paged, setPaged] = useState({ items: [], page: 1, pageSize: 10, total: 0 });

    // modal create
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createErr, setCreateErr] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [timeShouldLearn, setTimeShouldLearn] = useState("");
    const [createStatus, setCreateStatus] = useState("Draft");
    const [file, setFile] = useState(null);

    const load = async (page = 1) => {
        setErr("");
        setLoading(true);
        try {
            const { data } = await lessonsApi.listMine({
                page,
                pageSize: paged.pageSize,
                status,
                q,
            });
            setPaged(data);
        } catch (ex) {
            const msg = ex?.response?.data?.message || ex?.response?.data || "Không tải được danh sách bài giảng.";
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

    const closeModal = () => {
        setOpen(false);
        setCreateErr("");
        setTitle("");
        setDescription("");
        setTimeShouldLearn("");
        setCreateStatus("Draft");
        setFile(null);
    };

    const onCreate = async (e) => {
        e.preventDefault();
        setCreateErr("");

        if (!title.trim()) {
            setCreateErr("Tên bài giảng không được trống.");
            return;
        }

        if (!file) {
            setCreateErr("Bạn chưa chọn file (PDF/DOC/DOCX).");
            return;
        }

        setCreating(true);

        try {
            const fd = new FormData();

            fd.append("Title", title.trim());
            fd.append("Description", description || "");
            fd.append("TimeShouldLearn", timeShouldLearn || "");
            fd.append("Status", createStatus);
            fd.append("file", file);

            await lessonsApi.createnewlesson(fd);

            closeModal();
            await load(1);
        } catch (ex) {
            const msg =
                ex?.response?.data?.message ||
                ex?.response?.data ||
                "Tạo bài giảng thất bại.";

            setCreateErr(typeof msg === "string" ? msg : JSON.stringify(msg));
        } finally {
            setCreating(false);
        }
    };
    //function to download a lesson file 
    const onDownload = async (item) => {
        try {
            const res = await lessonsApi.download(item.id);
            const blob = new Blob([res.data], { type: item.contentType || "application/octet-stream" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = item.fileName || `lesson-${item.id}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            alert("Không tải được file.");
        }
    };

    return (
        <div className="tl-page">
            <div className="tl-head">
                <div className="tl-breadcrumb">
                    <span className="muted">Trang chủ</span> <span className="muted">›</span>{" "}
                    <span className="muted">Học tập</span> <span className="muted">›</span>{" "}
                    <b>Bài giảng</b>
                </div>

                <div className="tl-title-row">
                    <h2 className="tl-title">Bài giảng</h2>
                    <div className="tl-actions">
                        <button className="btn" onClick={onReload} disabled={loading}>
                            ⟳ Tải lại
                        </button>
                        <button className="btn primary" onClick={() => setOpen(true)}>
                            ＋ Thêm mới
                        </button>
                    </div>
                </div>

                <form className="tl-filters" onSubmit={onSearch}>
                    <select className="tl-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                        {STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>

                    <div className="tl-search">
                        <input
                            placeholder="Tên bài giảng"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                        <button className="btn" type="submit" disabled={loading}>
                            🔎 Tìm
                        </button>
                    </div>

                    <div className="tl-back">
                        <Link className="link" to="/teacher">
                            ← Quay lại trang chủ giáo viên
                        </Link>
                    </div>
                </form>

                {err ? <div className="alert">{err}</div> : null}
            </div>

            <div className="tl-body">
                {loading ? (
                    <div className="empty">Đang tải...</div>
                ) : (paged.items?.length || 0) === 0 ? (
                    <div className="empty">
                        <div className="empty-icon">📄</div>
                        <div className="empty-text">Không có dữ liệu</div>
                    </div>
                ) : (
                    <div className="tl-list">
                        {paged.items.map((it) => (
                            <div className="tl-card" key={it.id}>
                                <div className="tl-card-main">
                                    <div className="tl-card-title">{it.title}</div>
                                    {it.description ? <div className="tl-card-desc">{it.description}</div> : null}
                                    <div className="tl-meta">
                                        <span className="badge">{it.status}</span>
                                        <span className="muted">{it.fileName}</span>
                                        <span className="muted">• {bytesToSize(it.fileSize)}</span>
                                    </div>
                                </div>

                                <div className="tl-card-actions">
                                    <button className="btn" onClick={() => onDownload(it)}>
                                        Tải xuống
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal create */}
            {open ? (
                <div className="modal-backdrop" onMouseDown={closeModal}>
                    <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <div className="modal-title">Thêm bài giảng</div>
                            <button className="btn" onClick={closeModal}>✕</button>
                        </div>

                        {createErr ? <div className="alert">{createErr}</div> : null}

                        <form className="modal-form" onSubmit={onCreate}>
                            <label className="field">
                                <div className="label">Tên bài giảng *</div>
                                <input value={title} onChange={(e) => setTitle(e.target.value)} />
                            </label>

                            <label className="field">
                                <div className="label">Mô tả</div>
                                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                            </label>

                            <div className="grid-2">
                                <label className="field">
                                    <div className="label">Thời lượng dự kiến</div>
                                    <input
                                        placeholder="Ví dụ: 45 phút"
                                        value={timeShouldLearn}
                                        onChange={(e) => setTimeShouldLearn(e.target.value)}
                                    />
                                </label>

                                <label className="field">
                                    <div className="label">Trạng thái</div>
                                    <select value={createStatus} onChange={(e) => setCreateStatus(e.target.value)}>
                                        <option value="Draft">Nháp</option>
                                        <option value="Published">Đã đăng</option>
                                        <option value="Hidden">Ẩn</option>
                                    </select>
                                </label>
                            </div>

                            <label className="field">
                                <div className="label">File (PDF/DOC/DOCX) *</div>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                            </label>

                            <div className="modal-actions">
                                <button className="btn" type="button" onClick={closeModal} disabled={creating}>
                                    Hủy
                                </button>
                                <button className="btn primary" type="submit" disabled={creating}>
                                    {creating ? "Đang tạo..." : "Lưu"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
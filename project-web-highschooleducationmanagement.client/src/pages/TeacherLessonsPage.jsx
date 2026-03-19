import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/lessons.css";
import { lessonsApi } from "../api/lessonsApi";
import UserActions from "../components/UserActions";
import Brand from "../components/Brand";
import { authStorage } from "../auth/authStorage";
import Button from "../components/Button";
import Pagination from "../components/Pagination";
const STATUSES = [
    { value: "", label: "-- Chọn trạng thái --" },
    { value: "Draft", label: "Nháp" },
    { value: "Published", label: "Đã đăng" },
    { value: "Hidden", label: "Ẩn" },
];

const profile = authStorage.getProfile();
const fullName = profile?.fullName || "Giáo viên";
const avatarLetter = (fullName?.trim()?.[0] || "T").toUpperCase();
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
    const navigate = useNavigate(); 
    const [editing, setEditing] = useState(null);
    const [currentFileName, setCurrentFileName] = useState("");
    // filters
    const [status] = useState("");
    const [q, setQ] = useState("");

    // data
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [paged, setPaged] = useState({ items: [], page: 1, pageSize: 10, total: 0 });
    const [sortBy, setSortBy] = useState("");
    const [order, setOrder] = useState("");
    // modal create
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createErr, setCreateErr] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [timeShouldLearn, setTimeShouldLearn] = useState("");
    const [createStatus, setCreateStatus] = useState("Draft");
    const [file, setFile] = useState(null);
    const onEdit = (item) => {
        console.log(item);

        setEditing(item);
        setCurrentFileName(item.fileName);   // thêm dòng này

        setTitle(item.title);
        setDescription(item.description || "");
        setTimeShouldLearn(item.timeShouldLearn || "");
        setCreateStatus(item.status);
        setFile(null);

        setOpen(true);
    };
    const STATUS_LABEL = {
        Draft: "Nháp",
        Published: "Đã đăng",
        Hidden: "Ẩn"
    };
    const onDelete = async (item) => {

        if (!window.confirm("Bạn có chắc muốn xóa bài giảng này?"))
            return;

        try {

            await lessonsApi.deleteLesson(item.id);

            await load(paged.page);

        } catch {
            alert("Không xóa được bài giảng.");
        }
    };
    const onPublish = async (item) => {
        if (!window.confirm("Đăng bài giảng này?")) return;

        try {
            const fd = new FormData();
            fd.append("Title", item.title);
            fd.append("Description", item.description || "");
            fd.append("TimeShouldLearn", item.timeShouldLearn || "");
            fd.append("Status", "Published");

            await lessonsApi.updateLesson(item.id, fd);

            await load(paged.page);
        } catch {
            alert("Không thể đăng bài giảng.");
        }
    };
    const load = async (page = 1, sBy = sortBy, ord = order) => {
        setErr("");
        setLoading(true);
        try {
            const { data } = await lessonsApi.listMine({
                page,
                pageSize: paged.pageSize,
                status,
                q,
                sortBy: sBy,
                order: ord
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
        // elessonint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onReload = () => load(paged.page || 1);
    const toggleSort = (field) => {
        let newOrder = "asc";

        if (sortBy === field) {
            newOrder = order === "asc" ? "desc" : "asc";
        }

        setSortBy(field);
        setOrder(newOrder);

        load(1, field, newOrder);
    };
    const onSearch = (e) => {
        e.preventDefault();
        load(1);
    };

    const closeModal = () => {
        setOpen(false);
        setEditing(null);
        setCurrentFileName(""); 
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

        if (!editing && !file) {
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
            if (file) {
                fd.append("file", file);
            }

            if (editing) {
                await lessonsApi.updateLesson(editing.id, fd);
                setEditing(null);   // thêm dòng này
            } else {
                await lessonsApi.createnewlesson(fd);
            }

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
            setCurrentFileName("");
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
        <div className="teacher-home">

            {/* TOPBAR */}
            <div className="teacher-topbar">
                <div className="teacher-topbar__inner">

                    <Brand variant="teacher" />

                    <UserActions
                        variant="teacher"
                        fullName={fullName}
                        avatarLetter={avatarLetter}
                        onMyAccount={() => navigate("/my-info")}
                        onChangePassword={() => console.log("change password")}
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
                    <h2 className="lesson-title">Bài giảng</h2>
                    <div className="lesson-actions">
                            <Button
                                variant="secondary"
                                onClick={onReload}
                                disabled={loading}
                            >
                                ⟳ Tải lại
                            </Button>
                            
                            <Button onClick={() => setOpen(true)}>
                                ＋ Thêm mới
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
                            <Button type="submit" disabled={loading}>
                                🔎 Tìm
                            </Button>
                    </div>

                    
                </form>

                {err ? <div className="alert">{err}</div> : null}
            </div>

            <div className="lesson-body">
                {loading ? (
                    <div className="empty">Đang tải...</div>
                ) : (paged.items?.length || 0) === 0 ? (
                    <div className="empty">
                        <div className="empty-icon">📄</div>
                        <div className="empty-text">Không có dữ liệu</div>
                    </div>
                ) : (
                                <div className="lesson-list">

                                    <div className="lesson-table-header">
                                        <div>STT</div>
                                        <div
                                            onClick={() => toggleSort("title")}
                                            style={{ cursor: "pointer", userSelect: "none" }}
                                        >
                                            Tên {sortBy === "title" && (order === "asc" ? "↑" : "↓")}
                                        </div>
                                        <div>Mô tả</div>
                                        <div>Thời gian</div>
                                        <div>File</div>
                                        <div>Trạng thái</div>
                                        <div>Hành động</div>
                                    </div>
                                    {paged.items.map((it, index) => (
                                        <div className="lesson-row" key={it.id}>

                                            {/* STT */}
                                            <div className="lesson-cell">
                                                {(paged.page - 1) * paged.pageSize + index + 1}
                                            </div>

                                            {/* Tên */}
                                            <div className="lesson-cell">
                                                {it.title}
                                            </div>

                                            {/* Mô tả */}
                                            <div className="lesson-cell lesson-desc">
                                                {it.description}
                                            </div>

                                            {/* Thời gian */}
                                            <div className="lesson-cell">
                                                {it.timeShouldLearn}
                                            </div>

                                            {/* File */}
                                            <div className="lesson-cell">
                                                {it.fileName} • {bytesToSize(it.fileSize)}
                                            </div>

                                            {/* Trạng thái */}
                                            <div className="status-cell">

                                                <span className="status-badge">
                                                    {STATUS_LABEL[it.status] || it.status}
                                                </span>

                                                

                                            </div>

                                            {/* Action */}
                                            <div className="lesson-actions-cell">
                                                <div className="actions-main">
                                                    <div className="actions-core">
                                                        <Button variant="secondary" onClick={() => onEdit(it)}>✏️</Button>
                                                        <Button variant="secondary" onClick={() => onDelete(it)}>🗑</Button>
                                                        <Button onClick={() => onDownload(it)}>⬇</Button>
                                                    </div>

                                                    {it.status === "Draft" ? (
                                                        <Button className="btn-publish" onClick={() => onPublish(it)}>
                                                            Đăng
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </div>

                                        </div>
                                    ))}
                    </div>
                )}
            </div>
                <Pagination
                    page={paged.page}
                    pageSize={paged.pageSize}
                    total={paged.total}
                    onPageChange={(p) => load(p)}
                />
            {/* Modal create */}
                {open ? (
                    <div className="modal-backdrop" onMouseDown={closeModal}>
                        <div className="lesson-modal" onMouseDown={(e) => e.stopPropagation()}>

                            <div className="lesson-modal-header">
                                <h3 className="lesson-modal-title">
                                    {editing ? "Chỉnh sửa bài giảng" : "Thêm bài giảng"}
                                </h3>

                                <button className="modal-close" onClick={closeModal}>
                                    ✕
                                </button>
                            </div>
                            {createErr && <div className="alert">{createErr}</div>}
                            <form className="lesson-modal-body" onSubmit={onCreate}>

                                <div className="form-row">

                                    <div className="form-group">
                                        <label>Tên bài giảng *</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Trạng thái *</label>

                                        <select
                                            value={createStatus}
                                            onChange={(e) => setCreateStatus(e.target.value)}
                                        >
                                            <option value="Draft">Nháp</option>
                                            <option value="Published">Đã đăng</option>
                                            <option value="Hidden">Ẩn</option>
                                        </select>
                                    </div>

                                </div>

                                <div className="form-group">
                                    <label>Mô tả</label>
                                    <textarea
                                        rows={3}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>

                                <div className="form-row">

                                    <div className="form-group">
                                        <label>Thời lượng dự kiến</label>
                                        <input
                                            placeholder="Ví dụ: 45 phút"
                                            value={timeShouldLearn}
                                            onChange={(e) => setTimeShouldLearn(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>File</label>

                                        <div className="file-upload">
                                            <label className="file-btn">
                                                Chọn tệp
                                                <input
                                                    type="file"
                                                    accept=".pdf,.doc,.docx"
                                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                                />
                                            </label>

                                            <span className="file-name">
                                                {file
                                                    ? file.name
                                                    : currentFileName
                                                        ? currentFileName
                                                        : "Không có tệp nào được chọn"}
                                            </span>
                                        </div>

                                        <small className="file-note">
                                            Chỉ chọn file nếu muốn thay thế file hiện tại
                                        </small>
                                    </div>

                                </div>

                                <div className="lesson-modal-footer">

                                    <Button
                                        variant="secondary"
                                        type="button"
                                        onClick={closeModal}
                                        disabled={creating}
                                    >
                                        Hủy
                                    </Button>

                                    <Button
                                        type="submit"
                                        disabled={creating}
                                    >
                                        {creating ? "Đang tạo..." : "Lưu"}
                                    </Button>

                                </div>

                            </form>

                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

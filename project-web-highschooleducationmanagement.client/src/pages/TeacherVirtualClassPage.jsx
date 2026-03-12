import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/lessons.css";

import { virtualClassesApi } from "../api/virtualClassesApi";
import { classesApi } from "../api/classesApi";
import { subjectsApi } from "../api/subjectsApi";

import UserActions from "../components/UserActions";
import Brand from "../components/Brand";
import { authStorage } from "../auth/authStorage";
import Button from "../components/Button";

const profile = authStorage.getProfile();
const fullName = profile?.fullName || "Giáo viên";
const avatarLetter = (fullName?.trim()?.[0] || "T").toUpperCase();

export default function TeacherVirtualClassPage() {

    const navigate = useNavigate();

    const [list, setList] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createErr, setCreateErr] = useState("");

    const [classId, setClassId] = useState("");
    const [subjectId, setSubjectId] = useState("");
    const [meetingUrl, setMeetingUrl] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    // load all data
    const load = async () => {

        setLoading(true);
        setErr("");

        try {

            const [cRes, sRes, vcRes] = await Promise.all([
                classesApi.getMine(),
                subjectsApi.getMine(),
                virtualClassesApi.listTeacher()
            ]);

            setClasses(Array.isArray(cRes) ? cRes : cRes.data ?? []);
            setSubjects(Array.isArray(sRes) ? sRes : sRes.data ?? []);
            setList(Array.isArray(vcRes) ? vcRes : vcRes.data ?? []);

        } catch {

            setErr("Không tải được dữ liệu.");

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {
        load();
    }, []);

    const onReload = () => load();
    const onEdit = (item) => {

        setEditingId(item.id);

        setClassId(item.classId ?? "");
        setSubjectId(item.subjectId ?? "");
        setMeetingUrl(item.meetingUrl ?? "");

        setStartTime(
            item.startTime
                ? item.startTime.substring(0, 16)
                : ""
        );

        setEndTime(
            item.endTime
                ? item.endTime.substring(0, 16)
                : ""
        );

        setOpen(true);
    };
    const closeModal = () => {

        setOpen(false);
        setEditingId(null);
        setCreateErr("");

        setClassId("");
        setSubjectId("");
        setMeetingUrl("");
        setStartTime("");
        setEndTime("");
    };
    const loadSubjects = async (cid) => {

        if (!cid) {
            setSubjects([]);
            return;
        }

        try {

            const res = await subjectsApi.getMine(cid);

            setSubjects(Array.isArray(res) ? res : res.data ?? []);

        } catch {

            setSubjects([]);

        }

    };
    const onCreate = async (e) => {

        e.preventDefault();

        if (!classId || !subjectId || !meetingUrl || !startTime) {

            setCreateErr("Vui lòng nhập đầy đủ thông tin.");
            return;

        }

        setCreating(true);

        try {

            const data = {
                classId: Number(classId),
                subjectId: Number(subjectId),
                meetingUrl,
                startTime,
                endTime
            };

            if (editingId) {

                await virtualClassesApi.update(editingId, data);

            } else {

                await virtualClassesApi.create(data);

            }

            closeModal();
            load();

        } catch {

            setCreateErr("Không lưu được lớp học.");

        } finally {

            setCreating(false);

        }

    };

    const onDelete = async (item) => {

        if (!window.confirm("Bạn chắc chắn muốn xóa lớp học này?"))
            return;

        try {

            await virtualClassesApi.delete(item.id);
            load();

        } catch {

            alert("Không xóa được lớp học.");

        }

    };

    // compute status
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

                    <Brand variant="teacher" />

                    <UserActions
                        variant="teacher"
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

                        <h2 className="lesson-title">
                            Lớp học ảo
                        </h2>

                        <div className="lesson-actions">

                            <Button
                                variant="secondary"
                                onClick={onReload}
                                disabled={loading}
                            >
                                ⟳ Tải lại
                            </Button>

                            <Button
                                onClick={() => setOpen(true)}
                            >
                                ＋ Thêm mới
                            </Button>

                        </div>

                    </div>

                    {err && <div className="alert">{err}</div>}

                </div>

                <div className="lesson-body">

                    {loading ? (

                        <div className="empty">
                            Đang tải...
                        </div>

                    ) : list.length === 0 ? (

                        <div className="empty">
                            <div className="empty-icon">📚</div>
                            <div className="empty-text">
                                Chưa có lớp học ảo
                            </div>
                        </div>

                    ) : (

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
                                const disabled = false;

                                return (

                                    <div className="lesson-row" key={it.id}>

                                        <div className="lesson-cell">
                                            {index + 1}
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
                                                disabled={disabled}
                                                onClick={() => {
                                                    console.log("Meeting URL:", it.meetingUrl);

                                                    let url = it.meetingUrl || "";

                                                    if (!url.startsWith("http")) {
                                                        url = "https://" + url;
                                                    }

                                                    console.log("Open URL:", url);

                                                    window.open(url, "_blank");
                                                }}
                                            >
                                                ▶ Tham gia
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={() => onEdit(it)}
                                            >
                                                ✏️ Sửa
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={() => onDelete(it)}
                                            >
                                                🗑 Xóa
                                            </Button>

                                        </div>

                                    </div>

                                );

                            })}

                        </div>

                    )}

                </div>

            </div>

            {/* CREATE MODAL */}

            {open && (

                <div className="modal-backdrop" onMouseDown={closeModal}>

                    <div
                        className="lesson-modal"
                        onMouseDown={(e) => e.stopPropagation()}
                    >

                        <div className="lesson-modal-header">

                            <h3 className="lesson-modal-title">
                                {editingId ? "Chỉnh sửa lớp học ảo" : "Tạo lớp học ảo"}
                            </h3>

                            <button
                                className="modal-close"
                                onClick={closeModal}
                            >
                                ✕
                            </button>

                        </div>

                        {createErr &&
                            <div className="alert">{createErr}</div>
                        }

                        <form
                            className="lesson-modal-body"
                            onSubmit={onCreate}
                        >

                            <div className="form-row">

                                <div className="form-group">

                                    <label>Lớp *</label>

                                    <select
                                        value={classId}
                                        onChange={(e) => {

                                            const cid = e.target.value;

                                            setClassId(cid);
                                            setSubjectId("");

                                            loadSubjects(cid);

                                        }}
                                    >

                                        <option value="">
                                            -- Chọn lớp --
                                        </option>

                                        {classes.map(c => (

                                            <option
                                                key={c.id}
                                                value={c.id}
                                            >
                                                {c.name} ({c.year})
                                            </option>

                                        ))}

                                    </select>

                                </div>

                                <div className="form-group">

                                    <label>Môn *</label>

                                    <select
                                        value={subjectId}
                                        onChange={(e) =>
                                            setSubjectId(e.target.value)
                                        }
                                    >

                                        <option value="">
                                            -- Chọn môn --
                                        </option>

                                        {subjects.map(s => (

                                            <option
                                                key={s.id}
                                                value={s.id}
                                            >
                                                {s.name}
                                            </option>

                                        ))}

                                    </select>

                                </div>

                            </div>

                            <div className="form-group">

                                <label>Meeting URL *</label>

                                <input
                                    value={meetingUrl}
                                    onChange={(e) =>
                                        setMeetingUrl(e.target.value)
                                    }
                                />

                            </div>

                            <div className="form-row">

                                <div className="form-group">

                                    <label>Start Time *</label>

                                    <input
                                        type="datetime-local"
                                        value={startTime}
                                        onChange={(e) =>
                                            setStartTime(e.target.value)
                                        }
                                    />

                                </div>

                                <div className="form-group">

                                    <label>End Time</label>

                                    <input
                                        type="datetime-local"
                                        value={endTime}
                                        onChange={(e) =>
                                            setEndTime(e.target.value)
                                        }
                                    />

                                </div>

                            </div>

                            <div className="lesson-modal-footer">

                                <Button
                                    variant="secondary"
                                    type="button"
                                    onClick={closeModal}
                                >
                                    Hủy
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={creating}
                                >
                                    {creating
                                        ? "Đang lưu..."
                                        : editingId
                                            ? "Cập nhật"
                                            : "Lưu"}
                                </Button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>

    );

}
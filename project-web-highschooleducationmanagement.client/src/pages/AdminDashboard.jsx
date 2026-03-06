import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../api/adminApi";
import { authStorage } from "../auth/authStorage";
import { classesApi } from "../api/classesApi";
import { subjectsApi } from "../api/subjectsApi";
import UserActions from "../components/UserActions";
const ROLES = ["Student", "Teacher", "Admin"];

export default function AdminDashboard() {
    const nav = useNavigate();

    // ===== Auth/profile (REAL) =====
    const profile = authStorage.getProfile();
    const fullName = profile?.fullName || "Admin";
    const avatarLetter = (fullName?.trim()?.[0] || "A").toUpperCase();

    // Dropdown state
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    // ===== Layout state =====
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeMenu, setActiveMenu] = useState("accounts"); // accounts | lessons | grades

    // ===== Data state =====
    const [summary, setSummary] = useState({
        adminCount: 0,
        teacherCount: 0,
        studentCount: 0,
        pendingCount: 0,
    });

    const [pending, setPending] = useState([]);

    const [tab, setTab] = useState("Student");
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const [listState, setListState] = useState({
        items: [],
        total: 0,
    });

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil((listState.total || 0) / pageSize));
    }, [listState.total]);

    const fmtDate = (d) => {
        if (!d) return "";
        const dt = new Date(d);
        if (Number.isNaN(dt.getTime())) return String(d);
        return dt.toLocaleDateString();
    };
    
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [assignTeacherId, setAssignTeacherId] = useState(null);
    
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedClasses, setSelectedClasses] = useState([]);
    // ===== Close dropdown when click outside + ESC =====
    useEffect(() => {
        function onDocMouseDown(e) {
            if (!userMenuRef.current) return;
            if (!userMenuRef.current.contains(e.target)) {
                setUserMenuOpen(false);
            }
        }

        function onEsc(e) {
            if (e.key === "Escape") setUserMenuOpen(false);
        }

        document.addEventListener("mousedown", onDocMouseDown);
        document.addEventListener("keydown", onEsc);
        return () => {
            document.removeEventListener("mousedown", onDocMouseDown);
            document.removeEventListener("keydown", onEsc);
        };
    }, []);
    
    const toggleClass = (id) => {
        setSelectedClasses(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id]
        );
    };
    

    const loadClasses = async () => {
        const { data } = await classesApi.getAll();
        setClasses(data);
    };

    const loadSubjects = async () => {
        const { data } = await subjectsApi.getAll();
        setSubjects(data);
    };
    // ===== Menu actions =====
    const onMyAccount = () => {
        // làm sau: bạn có thể tạo trang /admin/my-info
        nav("/admin/my-info");
        setUserMenuOpen(false);
    };

    const onChangePassword = () => {
        alert("Chức năng đổi mật khẩu sẽ làm sau.");
        setUserMenuOpen(false);
    };
    const onLogout = () => {
        authStorage.clear();
        setUserMenuOpen(false);
        nav("/login", { replace: true });
    };

    const dropdownItemStyle = (danger) => ({
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
    });

    const loadAll = async () => {
        setErr("");
        setLoading(true);
        try {
            const [sumRes, pendingRes] = await Promise.all([
                adminApi.getSummary(),
                adminApi.getPending(),
            ]);
            setSummary(sumRes.data || {});
            setPending(pendingRes.data || []);
        } catch (ex) {
            setErr(
                ex?.response?.data?.message ||
                ex?.response?.data ||
                "Không tải được dashboard."
            );
        } finally {
            setLoading(false);
        }
    };

    const loadList = async () => {
        setErr("");
        setLoading(true);
        try {
            const { data } = await adminApi.listAccounts({
                role: tab,
                page,
                pageSize,
                q,
            });

            // ✅ phòng trường hợp backend trả PascalCase: Items/Total
            setListState({
                items: data?.items || data?.Items || [],
                total: data?.total || data?.Total || 0,
            });
        } catch (ex) {
            setErr(
                ex?.response?.data?.message ||
                ex?.response?.data ||
                "Không tải được danh sách tài khoản."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
        
        loadClasses();
        loadSubjects();
    }, []);

    useEffect(() => {
        if (activeMenu === "accounts") loadList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, page, activeMenu]);

    const onSearch = (e) => {
        e.preventDefault();
        setPage(1);
        loadList();
    };

    const approve = async (pendingId) => {
        await adminApi.approve(pendingId);
        await loadAll();
    };

    const reject = async (pendingId) => {
        await adminApi.reject(pendingId);
        await loadAll();
    };

    const Card = ({ title, value }) => (
        <div
            style={{
                background: "#fff",
                borderRadius: 14,
                padding: 16,
                boxShadow: "0 10px 22px rgba(15,23,42,0.10)",
            }}
        >
            <div style={{ color: "#64748b", fontSize: 13, marginBottom: 8 }}>
                {title}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
                {value}
            </div>
        </div>
    );

    // ===== UI helpers =====
    const MenuItem = ({ id, label, icon }) => {
        const active = activeMenu === id;
        return (
            <button
                onClick={() => setActiveMenu(id)}
                style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    cursor: "pointer",
                    background: active ? "rgba(255,255,255,0.10)" : "transparent",
                    color: "#e5e7eb",
                    padding: "10px 12px",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontWeight: 700,
                }}
            >
                <span style={{ width: 20, textAlign: "center", opacity: 0.95 }}>
                    {icon}
                </span>
                <span style={{ flex: 1 }}>{label}</span>
            </button>
        );
    };

    const PageTitle =
        activeMenu === "accounts"
            ? "Tài khoản"
            : activeMenu === "lessons"
                ? "Bài học"
                : "Điểm";

    // ===== Layout styles =====
    const styles = {
        shell: {
            display: "flex",
            minHeight: "100vh",
            background: "#0b0f19",
        },
        sidebar: {
            width: sidebarOpen ? 260 : 78,
            transition: "width 0.18s ease",
            background: "linear-gradient(180deg, #0f2744 0%, #0b1d32 100%)",
            borderRight: "1px solid rgba(255,255,255,0.08)",
            padding: 14,
            boxSizing: "border-box",
        },
        brandRow: {
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 8px 14px 8px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            marginBottom: 12,
        },
        logo: {
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "rgba(255,255,255,0.14)",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            fontWeight: 900,
        },
        brandText: {
            color: "#fff",
            fontWeight: 900,
            letterSpacing: 0.3,
            display: sidebarOpen ? "block" : "none",
        },
        profile: {
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: 10,
            marginTop: 10,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.10)",
        },
        avatar: {
            width: 36,
            height: 36,
            borderRadius: 999,
            background: "rgba(255,255,255,0.18)",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            fontWeight: 800,
            flexShrink: 0,
        },
        profileTextWrap: { display: sidebarOpen ? "block" : "none" },
        profileName: { color: "#fff", fontWeight: 800, fontSize: 14, lineHeight: 1.1 },
        profileSub: { color: "rgba(255,255,255,0.70)", fontSize: 12 },

        sectionTitle: {
            marginTop: 12,
            marginBottom: 8,
            paddingLeft: 8,
            color: "rgba(255,255,255,0.75)",
            fontSize: 12,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            display: sidebarOpen ? "block" : "none",
        },

        main: { flex: 1, display: "flex", flexDirection: "column" },

        topbar: {
            height: 62,
            background: "rgba(255,255,255,0.06)",
            borderBottom: "1px solid rgba(255,255,255,0.10)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
        },
        topLeft: { display: "flex", alignItems: "center", gap: 12 },
        hamburger: {
            width: 40,
            height: 40,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.12)",
            color: "#fff",
            cursor: "pointer",
            fontSize: 18,
        },
        pageTitle: { color: "#fff", fontWeight: 900, margin: 0, fontSize: 18 },

        topRight: { display: "flex", alignItems: "center", gap: 10 },
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

        content: { padding: 16 },
    };

    // ===== Content blocks =====
    const AccountsPage = () => (
        <>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                    gap: 12,
                    flexWrap: "wrap",
                }}
            >
                <div style={{ color: "rgba(255,255,255,0.85)", fontWeight: 800 }}>
                    Quản lý tài khoản
                </div>
                <button
                    onClick={async () => {
                        await loadAll();
                        await adminApi.assignTeacher({
                            teacherId: assignTeacherId,
                            subjectId: selectedSubject,
                            classIds: selectedClasses
                        });

                        await loadList(); // reload teacher list

                        alert("Phân công thành công");
                    }}
                    disabled={loading}
                    style={{
                        padding: "10px 14px",
                        borderRadius: 12,
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 700,
                    }}
                >
                    {loading ? "Đang tải..." : "Refresh"}
                </button>
            </div>

            {err && (
                <div
                    style={{
                        color: "#b91c1c",
                        background: "rgba(239,68,68,0.12)",
                        border: "1px solid rgba(239,68,68,0.25)",
                        padding: 10,
                        borderRadius: 10,
                        marginBottom: 12,
                    }}
                >
                    {String(err)}
                </div>
            )}

            {/* cards */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                    gap: 14,
                    marginBottom: 16,
                }}
            >
                <Card title="Students" value={summary.studentCount ?? 0} />
                <Card title="Teachers" value={summary.teacherCount ?? 0} />
                <Card title="Admins" value={summary.adminCount ?? 0} />
                <Card title="Pending requests" value={summary.pendingCount ?? 0} />
            </div>

            {/* accounts section */}
            <div
                style={{
                    background: "#fff",
                    borderRadius: 14,
                    padding: 14,
                    boxShadow: "0 10px 22px rgba(15,23,42,0.10)",
                    marginBottom: 16,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        marginBottom: 12,
                    }}
                >
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {ROLES.map((r) => (
                            <button
                                key={r}
                                onClick={() => {
                                    setTab(r);
                                    setPage(1);
                                }}
                                style={{
                                    padding: "10px 12px",
                                    borderRadius: 999,
                                    border: "1px solid #e5e7eb",
                                    cursor: "pointer",
                                    background: tab === r ? "#0f172a" : "#fff",
                                    color: tab === r ? "#fff" : "#0f172a",
                                    fontWeight: 800,
                                }}
                            >
                                {r}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={onSearch} style={{ display: "flex", gap: 8 }}>
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search name/email..."
                            style={{
                                padding: "10px 12px",
                                borderRadius: 12,
                                border: "1px solid #e5e7eb",
                                minWidth: 260,
                            }}
                        />
                        <button
                            type="submit"
                            style={{
                                padding: "10px 14px",
                                borderRadius: 12,
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 800,
                            }}
                        >
                            Search
                        </button>
                    </form>
                </div>

                <div style={{ overflowX: "auto" }}>
                    <table
                        width="100%"
                        cellPadding="12"
                        style={{ borderCollapse: "collapse", color: "#0f172a" }}
                    >
                        <thead style={{ background: "#f8fafc" }}>
                            <tr>
                                <th align="left">Role</th>
                                <th align="left">ID</th>
                                <th align="left">Họ tên</th>
                                <th align="left">Email</th>
                                <th align="left">SĐT</th>
                                <th align="left">
                                    {tab === "Student"
                                        ? "Lớp"
                                        : tab === "Teacher"
                                            ? "Lớp được giao"
                                            : "-"}
                                </th>
                                <th align="left">Môn</th>
                                <th align="left">Approved</th>
                                
                                <th align="left">Assign</th>

                            </tr>
                        </thead>
                        <tbody>
                            {listState.items.map((x, idx) => (
                                <tr
                                    key={`${x.role}-${x.id}`}
                                    style={{
                                        background: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                                        borderTop: "1px solid #e5e7eb",
                                    }}
                                >
                                    <td>{x.role}</td>
                                    <td>{x.id}</td>
                                    <td>{x.fullName}</td>
                                    <td>{x.email}</td>
                                    <td>{x.phoneNumber ?? ""}</td>
                                    <td>
                                        {tab === "Student" && (x.className || x.classId || "-")}

                                        {tab === "Teacher" && (
                                            x.assignedClasses?.length
                                                ? x.assignedClasses.join(", ")
                                                : "-"
                                        )}

                                        {tab === "Admin" && "-"}
                                    </td>
                                    <td>
                                        {tab === "Teacher" && (
                                            x.assignedSubjects?.length
                                                ? x.assignedSubjects.join(", ")
                                                : "-"
                                        )}
                                    </td>
                                    <td>
                                        {x.isApproved === null
                                            ? "-"
                                            : x.isApproved
                                                ? "Yes"
                                                : "No"}
                                    </td>
                                    {tab === "Teacher" && (
                                        <td>
                                            <button
                                                onClick={() => setAssignTeacherId(x.id)}
                                                style={{
                                                    padding: "6px 10px",
                                                    borderRadius: 8,
                                                    border: "none",
                                                    background: "#0f172a",
                                                    color: "#fff",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                Assign
                                            </button>
                                        </td>
                                    )}

                                </tr>
                            ))}
                            {listState.items.length === 0 && (
                                <tr>
                                    <td colSpan={tab === "Teacher" ? 8 : 7} style={{ padding: 16, color: "#64748b" }}>
                                        Không có dữ liệu.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* pagination */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 10,
                    }}
                >
                    <div style={{ color: "#64748b" }}>
                        Total: <b>{listState.total}</b>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            style={{
                                padding: "8px 12px",
                                borderRadius: 10,
                                border: "1px solid #e5e7eb",
                                cursor: "pointer",
                                background: "#fff",
                            }}
                        >
                            Prev
                        </button>
                        <div style={{ color: "#0f172a", fontWeight: 800 }}>
                            {page} / {totalPages}
                        </div>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            style={{
                                padding: "8px 12px",
                                borderRadius: 10,
                                border: "1px solid #e5e7eb",
                                cursor: "pointer",
                                background: "#fff",
                            }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
            {/* ===== Assign Teacher ===== */}
            {assignTeacherId && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000
                    }}
                >
                    <div
                        style={{
                            width: 420,
                            background: "#fff",
                            borderRadius: 14,
                            padding: 20,
                            boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
                        }}
                    >
                        <h3 style={{ marginTop: 0 }}>Phân công giảng dạy</h3>
                    

                    {/* Subject */}
                    <div style={{ marginBottom: 10 }}>
                        <label>Subject</label>
                        <br />
                            <select
                                value={selectedSubject || ""}
                                onChange={(e) =>
                                    setSelectedSubject(e.target.value ? Number(e.target.value) : null)
                                }
                                style={{
                                    padding: 8,
                                    borderRadius: 8,
                                    border: "1px solid #ddd",
                                    width: "100%"
                                }}
                            >
                          
                            <option value="">-- chọn môn --</option>
                                {subjects.map(s => (
                                    <option key={s.subjectID || s.id} value={s.subjectID || s.id}>
                                        {s.subjectName || s.name}
                                    </option>
                                ))}
                        </select>
                    </div>
                   
                    {/* Classes */}
                    <div>
                        <label>Classes</label>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(5, 1fr)",
                                    gap: 10,
                                    marginTop: 6
                                }}
                            >
                                {classes.map(c => {
                                    const id = c.id || c.classID;
                                    const name = c.name || c.className || c.ClassName;

                                    return (
                                        <label
                                            key={id}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6,
                                                padding: "6px 8px",
                                                border: "1px solid #ddd",
                                                borderRadius: 8,
                                                cursor: "pointer",
                                                fontSize: 13,
                                                color: "red",          // ⭐ thêm dòng này
                                                fontWeight: 600
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedClasses.includes(id)}
                                                onChange={() => toggleClass(id)}
                                            />
                                            {name}
                                        </label>
                                    );
                                })}
                            </div>
                    </div>

                    <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                        <button
                                onClick={async () => {

                                    if (!selectedSubject) {
                                        alert("Vui lòng chọn môn");
                                        return;
                                    }

                                    if (selectedClasses.length === 0) {
                                        alert("Vui lòng chọn lớp");
                                        return;
                                    }

                                    await adminApi.assignTeacher({
                                        teacherId: assignTeacherId,
                                        subjectId: selectedSubject,
                                        classIds: selectedClasses
                                    });

                                    alert("Phân công thành công");

                                    setAssignTeacherId(null);
                                    setSelectedSubject(null);
                                    setSelectedClasses([]);
                                }}
                            style={{
                                padding: "10px 14px",
                                borderRadius: 10,
                                border: "none",
                                background: "#0f172a",
                                color: "#fff",
                                cursor: "pointer"
                            }}
                        >
                            Save
                        </button>

                            <button
                                onClick={() => setAssignTeacherId(null)}
                                style={{
                                    padding: "10px 14px",
                                    borderRadius: 10,
                                    border: "1px solid #ddd",
                                    background: "#fff",
                                    cursor: "pointer",
                                    color: "red",      // ⭐ thêm
                                    fontWeight: 700
                                }}
                            >
                                Cancel
                            </button>
                    </div>
                    </div>
                </div>
            )}
            {/* pending approvals */}
            <div
                style={{
                    background: "#fff",
                    borderRadius: 14,
                    padding: 14,
                    boxShadow: "0 10px 22px rgba(15,23,42,0.10)",
                }}
            >
                <h3 style={{ marginTop: 0, color: "#0f172a" }}>Pending approvals</h3>

                {pending.length === 0 ? (
                    <p style={{ color: "#64748b" }}>Không có tài khoản chờ duyệt.</p>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table
                            width="100%"
                            cellPadding="12"
                            style={{ borderCollapse: "collapse", color: "#0f172a" }}
                        >
                            <thead style={{ background: "#f8fafc" }}>
                                <tr>
                                    <th align="left">Role</th>
                                    <th align="left">ID</th>
                                    <th align="left">Họ tên</th>
                                    <th align="left">Email</th>
                                    <th align="left">SĐT</th>
                                    <th align="left">Ngày sinh</th>
                                    <th align="left">Lớp </th>
                                    <th align="left">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pending.map((x, idx) => (
                                    <tr
                                        key={`${x.role}-${x.id}`}
                                        style={{
                                            background: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                                            borderTop: "1px solid #e5e7eb",
                                        }}
                                    >
                                        <td>{x.role}</td>
                                        <td>{x.id}</td>
                                        <td>{x.fullName}</td>
                                        <td>{x.email}</td>
                                        <td>{x.phoneNumber ?? ""}</td>
                                        <td>{fmtDate(x.birthDate)}</td>
                                        <td>
                                            {x.role === "Student"
                                                ? (x.className ?? x.ClassName ?? x.classId ?? x.ClassId ?? "-")
                                                : "-"}
                                        </td>
                                        <td style={{ whiteSpace: "nowrap" }}>
                                            <button
                                                onClick={() => approve(x.id)}
                                                style={{ marginRight: 8 }}
                                            >
                                                Duyệt
                                            </button>
                                            <button onClick={() => reject(x.id)}>Từ chối / Xóa</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );

    const PlaceholderPage = ({ title }) => (
        <div
            style={{
                background: "#fff",
                borderRadius: 14,
                padding: 16,
                boxShadow: "0 10px 22px rgba(15,23,42,0.10)",
            }}
        >
            <h3 style={{ marginTop: 0, color: "#0f172a" }}>{title}</h3>
            <p style={{ margin: 0, color: "#64748b" }}>
                Mục này làm sau. Hiện tại bạn chỉ cần menu + layout giống Pluto.
            </p>
        </div>
    );

    return (
        <div style={styles.shell}>
            {/* ===== Sidebar ===== */}
            <aside style={styles.sidebar}>
                <div style={styles.brandRow}>
                    <div style={styles.logo}>P</div>
                    <div style={styles.brandText}>School</div>
                </div>

                {/* Profile (REAL name letter) */}
                <div style={styles.profile}>
                    <div style={styles.avatar}>{avatarLetter}</div>
                    <div style={styles.profileTextWrap}>
                        <div style={styles.profileName}>{fullName}</div>
                        <div style={styles.profileSub}>Online</div>
                    </div>
                </div>

                <div style={styles.sectionTitle}>General</div>

                <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                    <MenuItem id="accounts" label="Tài khoản" icon="👤" />
                    <MenuItem id="lessons" label="Bài học" icon="📚" />
                    <MenuItem id="grades" label="Điểm" icon="🏆" />
                </div>
            </aside>

            {/* ===== Main ===== */}
            <main style={styles.main}>
                {/* Topbar */}
                <div style={styles.topbar}>
                    <div style={styles.topLeft}>
                        <button
                            onClick={() => setSidebarOpen((v) => !v)}
                            style={styles.hamburger}
                            title="Toggle sidebar"
                        >
                            ☰
                        </button>
                        <h3 style={styles.pageTitle}>{PageTitle}</h3>
                    </div>

                    <div style={styles.topRight}>
                        {/* Notifications placeholder */}
                        <button style={styles.iconBtn} title="Notifications">
                            🔔
                            <span style={styles.badge}>2</span>
                        </button>

                        {/* Messages placeholder */}
                        <button style={styles.iconBtn} title="Messages">
                            ✉️
                            <span style={styles.badge}>3</span>
                        </button>

                        {/* ===== REAL dropdown ===== */}
                        <div ref={userMenuRef} style={{ position: "relative" }}>
                            <button
                                style={styles.userPill}
                                title={fullName}
                                onClick={() => setUserMenuOpen((v) => !v)}
                                aria-haspopup="menu"
                                aria-expanded={userMenuOpen}
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
                                    {avatarLetter}
                                </span>
                                <span style={{ fontWeight: 800 }}>{fullName}</span>
                                <span style={{ opacity: 0.8 }}>{userMenuOpen ? "▴" : "▾"}</span>
                            </button>

                            {userMenuOpen && (
                                <div
                                    role="menu"
                                    style={{
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
                                    }}
                                >
                                    <button type="button" onClick={onMyAccount} style={dropdownItemStyle(false)}>
                                        <span style={{ width: 22 }}>👤</span>
                                        <span>Tài khoản của tôi</span>
                                    </button>

                                    <button type="button" onClick={onChangePassword} style={dropdownItemStyle(false)}>
                                        <span style={{ width: 22 }}>🔑</span>
                                        <span>Đổi mật khẩu</span>
                                    </button>

                                    <div style={{ height: 1, background: "rgba(255,255,255,0.10)" }} />

                                    <button type="button" onClick={onLogout} style={dropdownItemStyle(true)}>
                                        <span style={{ width: 22 }}>↩</span>
                                        <span>Đăng xuất</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div style={styles.content}>
                    {activeMenu === "accounts" && <AccountsPage />}
                    {activeMenu === "lessons" && <PlaceholderPage title="Bài học" />}
                    {activeMenu === "grades" && <PlaceholderPage title="Điểm" />}
                </div>
            </main>
        </div>
    );
}
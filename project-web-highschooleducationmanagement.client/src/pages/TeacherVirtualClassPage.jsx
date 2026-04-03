import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Button,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Table,
    Tag,
    Typography,
    message,
    Popconfirm,
    Card,
} from "antd";
import {
    ReloadOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    PlayCircleOutlined,
} from "@ant-design/icons";

import { virtualClassesApi } from "../api/virtualClassesApi";
import { classesApi } from "../api/classesApi";
import { subjectsApi } from "../api/subjectsApi";
import UserActions from "../components/UserActions";
import Brand from "../components/Brand";
import { useAuth } from "../context/useAuth";
import "../styles/teacher-lessons-antd.css";
import "../styles/teacher-virtual-class-antd.css";

const { Title, Text } = Typography;


function formatDate(value) {
    if (!value) return "-";

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;

    return d.toLocaleDateString("vi-VN");
}

function getPeriodLabel(period) {
    const found = PERIOD_OPTIONS.find((x) => x.value === period);
    return found ? found.label : `Tiết ${period}`;
}
function formatDateTime(value) {
    if (!value) return "-";

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;

    return d.toLocaleString("vi-VN");
}

function getStatus(start, end) {
    const now = new Date();
    const s = new Date(start);
    const e = end ? new Date(end) : null;

    if (Number.isNaN(s.getTime())) return "Không xác định";
    if (now < s) return "Sắp diễn ra";
    if (e && now > e) return "Đã kết thúc";
    return "Đang diễn ra";
}
const PERIOD_OPTIONS = [
    { value: 1, label: "Tiết 1 (7h-7h45)" },
    { value: 2, label: "Tiết 2 (7h50-8h35)" },
    { value: 3, label: "Tiết 3 (8h50-9h35)" },
    { value: 4, label: "Tiết 4 (9h40-10h25)" },
    { value: 5, label: "Tiết 5 (10h30-11h15)" },
    { value: 6, label: "Tiết 6 (13h-13h45)" },
    { value: 7, label: "Tiết 7 (13h50-14h35)" },
    { value: 8, label: "Tiết 8 (14h50-15h35)" },
    { value: 9, label: "Tiết 9 (15h40-16h25)" },
    { value: 10, label: "Tiết 10 (16h30-17h15)" },
];
export default function TeacherVirtualClassPage() {
    const navigate = useNavigate();

    const [list, setList] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [editing, setEditing] = useState(null);

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const { profile, clearAuthState } = useAuth();

    const fullName = profile?.fullName || "Giáo viên";
    const avatarLetter = (fullName?.trim()?.[0] || "T").toUpperCase();
    const avatarURL = profile?.avatarURL || "";
    const [paged, setPaged] = useState({
        items: [],
        page: 1,
        pageSize: 10,
        total: 0,
    });
    const [sortBy, setSortBy] = useState("");
    const [order, setOrder] = useState("");
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const [classId, setClassId] = useState("");
    const [subjectId, setSubjectId] = useState("");
    const [meetingUrl, setMeetingUrl] = useState("");
    const [studyDate, setStudyDate] = useState("");
    const [period, setPeriod] = useState("");

    const load = async (
        page = paged.page,
        pageSize = paged.pageSize,
        sBy = sortBy,
        ord = order
    ) => {
        setLoading(true);
        setErr("");

        try {
            const [cRes, vcRes] = await Promise.all([
                classesApi.getMine(),
                virtualClassesApi.listTeacher({
                    page,
                    pageSize,
                    sortBy: sBy,
                    order: ord,
                }),
            ]);

            const classesData = Array.isArray(cRes) ? cRes : cRes.data ?? [];
            const data = vcRes.data ?? vcRes;

            setClasses(classesData);
            setList(Array.isArray(data) ? data : data.items ?? []);
            setPaged({
                items: Array.isArray(data) ? data : data.items ?? [],
                page: data.page ?? page,
                pageSize: data.pageSize ?? pageSize,
                total: data.total ?? 0,
            });
        } catch (ex) {
            const msg =
                ex?.response?.data?.message ||
                ex?.response?.data ||
                ex?.message ||
                "Không tải được dữ liệu lớp học ảo.";

            setErr(typeof msg === "string" ? msg : JSON.stringify(msg));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(1, paged.pageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    const closeModal = () => {
        setOpen(false);
        setEditing(null);
        setClassId("");
        setSubjectId("");
        setMeetingUrl("");
        setStudyDate("");
        setPeriod("");
        setSubjects([]);
    };

    const onReload = () => {
        load(paged.page, paged.pageSize, sortBy, order);
    };

    const onCreateNew = () => {
        setEditing(null);
        setClassId("");
        setSubjectId("");
        setMeetingUrl("");
        
        setSubjects([]);
        setOpen(true);
    };

    const onEdit = async (item) => {
        setEditing(item);
        setClassId(item.classId ?? "");
        setSubjectId(item.subjectId ?? "");
        setMeetingUrl(item.meetingUrl ?? "");
        setStudyDate(item.studyDate ? item.studyDate.substring(0, 10) : "");
        setPeriod(item.period ?? "");

        await loadSubjects(item.classId);
        setOpen(true);
    };

    const onDelete = async (item) => {
        try {
            await virtualClassesApi.delete(item.id);
            message.success("Đã xóa lớp học ảo.");
            await load(paged.page, paged.pageSize, sortBy, order);
        } catch {
            message.error("Không xóa được lớp học ảo.");
        }
    };

    const onJoin = (item) => {
        let url = item.meetingUrl || "";

        if (!url) {
            message.error("Lớp học chưa có link tham gia.");
            return;
        }

        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = `https://${url}`;
        }

        window.open(url, "_blank");
    };

    const onSubmit = async () => {
        if (!classId || !subjectId || !meetingUrl.trim() || !studyDate || !period) {
            message.error("Vui lòng nhập đầy đủ thông tin.");
            return;
        }

        try {
            setSaving(true);

            const data = {
                classId: Number(classId),
                subjectId: Number(subjectId),
                meetingUrl: meetingUrl.trim(),
                studyDate,
                period: Number(period),
            };

            if (editing) {
                await virtualClassesApi.update(editing.id, data);
                message.success("Cập nhật lớp học ảo thành công.");
            } else {
                await virtualClassesApi.create(data);
                message.success("Tạo lớp học ảo thành công.");
            }

            closeModal();
            await load(editing ? paged.page : 1, paged.pageSize, sortBy, order);
        } catch (error) {
            const msg =
                error?.response?.data?.message ||
                error?.response?.data ||
                error?.message ||
                "Không lưu được lớp học ảo.";

            message.error(typeof msg === "string" ? msg : JSON.stringify(msg));
        } finally {
            setSaving(false);
        }
    };

    const handleTableChange = (pagination, filters, sorter) => {
        const current = pagination.current || 1;
        const size = pagination.pageSize || paged.pageSize;

        let nextSortBy = "";
        let nextOrder = "";

        if (!Array.isArray(sorter) && sorter?.field && sorter?.order) {
            nextSortBy = sorter.field;
            nextOrder = sorter.order === "ascend" ? "asc" : "desc";
        }

        setSortBy(nextSortBy);
        setOrder(nextOrder);

        load(current, size, nextSortBy, nextOrder);
    };

    const columns = useMemo(
        () => [
            {
                title: "STT",
                key: "stt",
                width: 80,
                align: "center",
                render: (_, __, index) =>
                    (paged.page - 1) * paged.pageSize + index + 1,
            },
            {
                title: "Lớp",
                dataIndex: "className",
                key: "className",
                ellipsis: true,
                sorter: true,
                sortOrder:
                    sortBy === "className"
                        ? order === "asc"
                            ? "ascend"
                            : "descend"
                        : null,
                render: (value) => value || "-",
            },
            {
                title: "Môn",
                dataIndex: "subjectName",
                key: "subjectName",
                ellipsis: true,
                render: (value) => value || "-",
            },
            {
                title: "Ngày học",
                dataIndex: "studyDate",
                key: "studyDate",
                width: 140,
                sorter: true,
                sortOrder:
                    sortBy === "studyDate"
                        ? order === "asc"
                            ? "ascend"
                            : "descend"
                        : null,
                render: (value) => formatDate(value),
            },
            {
                title: "Tiết",
                dataIndex: "period",
                key: "period",
                width: 190,
                render: (value) => getPeriodLabel(value),
            },
            {
                title: "Giờ học",
                key: "timeRange",
                width: 220,
                render: (_, record) =>
                    `${formatDateTime(record.startTime)} - ${formatDateTime(record.endTime)}`,
            },
            {
                title: "Link vào lớp",
                dataIndex: "meetingUrl",
                key: "meetingUrl",
                ellipsis: true,
                render: (value) =>
                    value ? (
                        <a
                            href={
                                value.startsWith("http://") || value.startsWith("https://")
                                    ? value
                                    : `https://${value}`
                            }
                            target="_blank"
                            rel="noreferrer"
                        >
                            {value}
                        </a>
                    ) : (
                        "-"
                    ),
            },
            {
                title: "Trạng thái",
                key: "status",
                width: 150,
                align: "center",
                sorter: true,
                sortOrder:
                    sortBy === "status"
                        ? order === "asc"
                            ? "ascend"
                            : "descend"
                        : null,
                render: (_, record) => {
                    const status = getStatus(record.startTime, record.endTime);

                    let color = "default";
                    if (status === "Sắp diễn ra") color = "blue";
                    if (status === "Đang diễn ra") color = "green";
                    if (status === "Đã kết thúc") color = "red";

                    return <Tag color={color}>{status}</Tag>;
                },
            },
            {
                title: "Hành động",
                key: "actions",
                width: 230,
                align: "center",
                render: (_, record) => (
                    <Space wrap>
                        <Button
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            onClick={() => onJoin(record)}
                        >
                            Tham gia
                        </Button>

                        <Button
                            icon={<EditOutlined />}
                            onClick={() => onEdit(record)}
                        />

                        <Popconfirm
                            title="Xóa lớp học ảo"
                            description="Bạn có chắc muốn xóa lớp học này?"
                            okText="Xóa"
                            cancelText="Hủy"
                            onConfirm={() => onDelete(record)}
                        >
                            <Button danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Space>
                ),
            },
        ],
        [paged.page, paged.pageSize, sortBy, order]
    );

    return (
        <div className="teacher-home">
            <div className="teacher-topbar">
                <div className="teacher-topbar__inner">
                    <Brand variant="teacher" />

                    <UserActions
                        variant="teacher"
                        fullName={fullName}
                        avatarLetter={avatarLetter}
                        avatarURL={avatarURL}
                        onMyAccount={() => navigate("/my-info")}
                        onChangePassword={() => console.log("change")}
                        onLogout={() => {
                            clearAuthState();
                            navigate("/login", { replace: true });
                        }}
                    />
                </div>
            </div>

            <div className="teacher-virtual-class-antd-page">
                <Card className="teacher-virtual-class-antd-card">
                    <div className="teacher-virtual-class-antd-header">
                        <Title level={2} style={{ margin: 0 }}>
                            Lớp học ảo
                        </Title>

                        <Space>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={onReload}
                                loading={loading}
                            >
                                Tải lại
                            </Button>

                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={onCreateNew}
                            >
                                Thêm mới
                            </Button>
                        </Space>
                    </div>

                    {err ? (
                        <div className="teacher-virtual-class-antd-error">
                            {err}
                        </div>
                    ) : null}

                    <Table
                        rowKey="id"
                        loading={loading}
                        columns={columns}
                        dataSource={paged.items || list || []}
                        onChange={handleTableChange}
                        pagination={{
                            current: paged.page,
                            pageSize: paged.pageSize,
                            total: paged.total,
                            showSizeChanger: true,
                            pageSizeOptions: ["5", "10", "20", "50"],
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} / ${total} lớp học`,
                        }}
                        locale={{
                            emptyText: "Chưa có lớp học ảo",
                        }}
                        scroll={{ x: 1200 }}
                    />
                </Card>

                <Modal
                    title={editing ? "Chỉnh sửa lớp học ảo" : "Tạo lớp học ảo"}
                    open={open}
                    onCancel={closeModal}
                    onOk={onSubmit}
                    confirmLoading={saving}
                    okText="Lưu"
                    cancelText="Hủy"
                    destroyOnHidden
                >
                    <Form layout="vertical">
                        <Form.Item
                            label="Lớp"
                            required
                            validateStatus={!classId && saving ? "error" : ""}
                            help={!classId && saving ? "Vui lòng chọn lớp." : ""}
                        >
                            <Select
                                placeholder="Chọn lớp"
                                value={classId || undefined}
                                onChange={(value) => {
                                    setClassId(value);
                                    setSubjectId("");
                                    loadSubjects(value);
                                }}
                                options={classes.map((c) => ({
                                    value: c.id,
                                    label: `${c.name} (${c.year})`,
                                }))}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Môn"
                            required
                            validateStatus={!subjectId && saving ? "error" : ""}
                            help={!subjectId && saving ? "Vui lòng chọn môn." : ""}
                        >
                            <Select
                                placeholder="Chọn môn"
                                value={subjectId || undefined}
                                onChange={setSubjectId}
                                options={subjects.map((s) => ({
                                    value: s.id,
                                    label: s.name,
                                }))}
                                disabled={!classId}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Link vào lớp"
                            required
                            validateStatus={!meetingUrl.trim() && saving ? "error" : ""}
                            help={
                                !meetingUrl.trim() && saving
                                    ? "Vui lòng nhập link vào lớp."
                                    : ""
                            }
                        >
                            <Input
                                placeholder="Ví dụ: meet.google.com/abc-defg-hij"
                                value={meetingUrl}
                                onChange={(e) => setMeetingUrl(e.target.value)}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Ngày học"
                            required
                            validateStatus={!studyDate && saving ? "error" : ""}
                            help={!studyDate && saving ? "Vui lòng chọn ngày học." : ""}
                        >
                            <Input
                                type="date"
                                value={studyDate}
                                onChange={(e) => setStudyDate(e.target.value)}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Tiết"
                            required
                            validateStatus={!period && saving ? "error" : ""}
                            help={!period && saving ? "Vui lòng chọn tiết học." : ""}
                        >
                            <Select
                                placeholder="Chọn tiết học"
                                value={period || undefined}
                                onChange={setPeriod}
                                options={PERIOD_OPTIONS}
                            />
                        </Form.Item>

                        <div className="teacher-virtual-class-antd-note">
                            <Text type="secondary">
                                Hệ thống sẽ tự động tính giờ bắt đầu và kết thúc theo tiết học đã chọn.
                            </Text>
                        </div>
                    </Form>
                </Modal>
            </div>
        </div>
    );
}
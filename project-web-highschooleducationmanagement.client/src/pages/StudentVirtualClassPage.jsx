import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Button,
    Card,
    Space,
    Table,
    Tag,
    Typography,
    message,
} from "antd";
import {
    ReloadOutlined,
    PlayCircleOutlined,
} from "@ant-design/icons";

import { virtualClassesApi } from "../api/virtualClassesApi";
import Brand from "../components/Brand";
import UserActions from "../components/UserActions";
import { useAuth } from "../context/useAuth";
import "../styles/teacher-virtual-class-antd.css";
import "../styles/student-virtual-class-antd.css";

const { Title } = Typography;
const PERIOD_OPTIONS = [
    { value: 1, label: "Tiết 1 " },
    { value: 2, label: "Tiết 2 " },
    { value: 3, label: "Tiết 3 " },
    { value: 4, label: "Tiết 4" },
    { value: 5, label: "Tiết 5" },
    { value: 6, label: "Tiết 6" },
    { value: 7, label: "Tiết 7 " },
    { value: 8, label: "Tiết 8 " },
    { value: 9, label: "Tiết 9 " },
    { value: 10, label: "Tiết 10 " },
];

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
function getStatus(start, end) {
    const now = new Date();
    const s = new Date(start);
    const e = end ? new Date(end) : null;

    if (Number.isNaN(s.getTime())) return "Không xác định";
    if (now < s) return "Sắp diễn ra";
    if (e && now > e) return "Đã kết thúc";
    return "Đang diễn ra";
}

export default function StudentVirtualClassPage() {
    const navigate = useNavigate();

    const { profile, clearAuthState } = useAuth();

    const fullName = profile?.fullName || "Học sinh";
    const avatarLetter = (fullName?.trim()?.[0] || "H").toUpperCase();
    const avatarURL = profile?.avatarURL || "";

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [order, setOrder] = useState("");
    const [paged, setPaged] = useState({
        items: [],
        page: 1,
        pageSize: 10,
        total: 0,
    });

    const load = async (
        page = paged.page,
        pageSize = paged.pageSize,
        currentSortBy = sortBy,
        currentOrder = order
    ) => {
        setLoading(true);
        setErr("");

        try {
            const res = await virtualClassesApi.listStudent({
                page,
                pageSize,
                sortBy: currentSortBy,
                order: currentOrder,
            });

            const data = res.data ?? res;

            setPaged({
                items: data.items ?? [],
                page: data.page ?? page,
                pageSize: data.pageSize ?? pageSize,
                total: data.total ?? 0,
            });
        } catch (ex) {
            const msg =
                ex?.response?.data?.message ||
                ex?.response?.data ||
                ex?.message ||
                "Không tải được lớp học ảo.";

            setErr(typeof msg === "string" ? msg : JSON.stringify(msg));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(1, paged.pageSize, sortBy, order);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onReload = () => {
        load(paged.page, paged.pageSize, sortBy, order);
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
    function formatTime(value) {
        if (!value) return "-";

        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return value;

        return d.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    }
    const handleTableChange = (pagination, filters, sorter) => {
        const current = pagination.current || 1;
        const size = pagination.pageSize || paged.pageSize;

        let nextSortBy = "";
        let nextOrder = "";

        if (!Array.isArray(sorter) && sorter?.field) {
            nextSortBy = sorter.field;
            nextOrder =
                sorter.order === "ascend"
                    ? "asc"
                    : sorter.order === "descend"
                        ? "desc"
                        : "";
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
                width: 60,
                align: "center",
                render: (_, __, index) =>
                    (paged.page - 1) * paged.pageSize + index + 1,
            },
            {
                title: "Lớp",
                dataIndex: "className",
                key: "className",
                width: 90,
                ellipsis: true,
                sorter: true,
                sortOrder: sortBy === "className"
                    ? order === "asc"
                        ? "ascend"
                        : order === "desc"
                            ? "descend"
                            : null
                    : null,
                render: (value) => value || "-",
            },
            {
                title: "Môn",
                dataIndex: "subjectName",
                key: "subjectName",
                width: 100,
                ellipsis: true,
                sorter: true,
                sortOrder: sortBy === "subjectName"
                    ? order === "asc"
                        ? "ascend"
                        : order === "desc"
                            ? "descend"
                            : null
                    : null,
                render: (value) => value || "-",
            },
            {
                title: "Giáo viên",
                dataIndex: "teacherName",
                key: "teacherName",
                ellipsis: true,
                sorter: true,
                sortOrder: sortBy === "teacherName"
                    ? order === "asc"
                        ? "ascend"
                        : order === "desc"
                            ? "descend"
                            : null
                    : null,
                render: (value) => value || "-",
            },
            {
                title: "Ngày học",
                dataIndex: "studyDate",
                key: "studyDate",
                width: 140,
                sorter: true,
                sortOrder: sortBy === "studyDate"
                    ? order === "asc"
                        ? "ascend"
                        : order === "desc"
                            ? "descend"
                            : null
                    : null,
                render: (value) => formatDate(value),
            },
            {
                title: "Tiết",
                dataIndex: "period",
                key: "period",
                width: 110,
                sorter: true,
                sortOrder: sortBy === "period"
                    ? order === "asc"
                        ? "ascend"
                        : order === "desc"
                            ? "descend"
                            : null
                    : null,
                render: (value) => getPeriodLabel(value),
            },
            {
                title: "Giờ học",
                key: "timeRange",
                width: 120,
                render: (_, record) =>
                    `${formatTime(record.startTime)} - ${formatTime(record.endTime)}`,
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
                sortOrder: sortBy === "status"
                    ? order === "asc"
                        ? "ascend"
                        : order === "desc"
                            ? "descend"
                            : null
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
                width: 160,
                align: "center",
                render: (_, record) => (
                    <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={() => onJoin(record)}
                    >
                        Tham gia
                    </Button>
                ),
            },
        ],
        [paged.page, paged.pageSize, sortBy, order]
    );
    
    return (
        <div className="student-home">
            <div className="student-topbar">
                <div className="student-topbar__inner">
                    <Brand />

                    <UserActions
                        variant="student"
                        fullName={fullName}
                        avatarLetter={avatarLetter}
                        avatarURL={avatarURL}
                        onMyAccount={() => navigate("/my-info")}
                        onChangePassword={() => navigate("/student/change-password")}
                        onLogout={() => {
                            clearAuthState();
                            navigate("/login", { replace: true });
                        }}
                    />
                </div>
            </div>

            <div className="student-virtual-class-antd-page">
                <Card className="student-virtual-class-antd-card">
                    <div className="student-virtual-class-antd-header">
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
                        </Space>
                    </div>

                    {err ? (
                        <div className="student-virtual-class-antd-error">
                            {err}
                        </div>
                    ) : null}

                    <Table
                        rowKey="id"
                        loading={loading}
                        columns={columns}
                        dataSource={paged.items || []}
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
                        scroll={{ x: 1400 }}
                    />
                </Card>
            </div>
        </div>
    );
}
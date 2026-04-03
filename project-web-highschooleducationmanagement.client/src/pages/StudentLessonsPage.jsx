import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Button,
    Card,
    Input,
    Space,
    Table,
    Tag,
    Typography,
    message,
} from "antd";
import {
    ReloadOutlined,
    SearchOutlined,
    DownloadOutlined,
} from "@ant-design/icons";

import { lessonsApi } from "../api/lessonsApi";
import Brand from "../components/Brand";
import UserActions from "../components/UserActions";
import { useAuth } from "../context/useAuth";
import "../styles/student-lessons-antd.css";

const { Title } = Typography;
const { Search } = Input;

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

const STATUS_LABEL = {
    Published: "Đã đăng",
    Draft: "Nháp",
    Hidden: "Ẩn",
};

export default function StudentLessonsPage() {
    const nav = useNavigate();

   

    const [sortBy, setSortBy] = useState("");
    const [order, setOrder] = useState("");
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const { profile, clearAuthState } = useAuth();

    const fullName = profile?.fullName || "Học sinh";
    const avatarLetter = (fullName?.trim()?.[0] || "H").toUpperCase();
    const avatarURL = profile?.avatarURL || "";
    const [paged, setPaged] = useState({
        items: [],
        page: 1,
        pageSize: 10,
        total: 0,
    });

    const onMyAccount = () => nav("/my-info");
    const onChangePassword = () => nav("/student/change-password");
    const onLogout = () => {
        clearAuthState();
        nav("/login", { replace: true });
    };

    const load = async (
        page = 1,
        pageSize = paged.pageSize,
        keyword = q,
        sBy = sortBy,
        ord = order
    ) => {
        setErr("");
        setLoading(true);

        try {
            const { data } = await lessonsApi.listForStudent({
                page,
                pageSize,
                q: keyword,
                sortBy: sBy,
                order: ord,
            });

            setPaged(data);
        } catch (ex) {
            const msg =
                ex?.response?.data?.message ||
                ex?.response?.data ||
                ex?.message ||
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

    const onReload = () => {
        load(paged.page, paged.pageSize, q, sortBy, order);
    };

    const onSearch = (value) => {
        const keyword = value ?? "";
        setQ(keyword);
        load(1, paged.pageSize, keyword, sortBy, order);
    };

    const onDownload = async (item) => {
        try {
            const res = await lessonsApi.downloadForStudent(item.id);

            const blob = new Blob([res.data], {
                type: item.contentType || "application/octet-stream",
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
            message.error(ex?.response?.data?.message || "Không tải được file.");
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

        load(current, size, q, nextSortBy, nextOrder);
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
                title: "Tên bài giảng",
                dataIndex: "title",
                key: "title",
                sorter: true,
                sortOrder:
                    sortBy === "title"
                        ? order === "asc"
                            ? "ascend"
                            : "descend"
                        : null,
                ellipsis: true,
            },
            {
                title: "Mô tả",
                dataIndex: "description",
                key: "description",
                sorter: true,
                sortOrder:
                    sortBy === "description"
                        ? order === "asc"
                            ? "ascend"
                            : "descend"
                        : null,
                ellipsis: true,
                render: (value) => value || "-",
            },
            {
                title: "Thời gian",
                dataIndex: "timeShouldLearn",
                key: "timeShouldLearn",
                sorter: true,
                sortOrder:
                    sortBy === "timeShouldLearn"
                        ? order === "asc"
                            ? "ascend"
                            : "descend"
                        : null,
                width: 160,
                render: (value) => value || "-",
            },
            {
                title: "File",
                key: "fileName",
                dataIndex: "fileName",
                sorter: true,
                sortOrder:
                    sortBy === "fileName"
                        ? order === "asc"
                            ? "ascend"
                            : "descend"
                        : null,
                width: 260,
                render: (_, record) => (
                    <span>
                        {record.fileName} • {bytesToSize(record.fileSize)}
                    </span>
                ),
            },
            {
                title: "Trạng thái",
                dataIndex: "status",
                key: "status",
                width: 140,
                align: "center",
                sorter: true,
                sortOrder:
                    sortBy === "status"
                        ? order === "asc"
                            ? "ascend"
                            : "descend"
                        : null,
                render: (status) => {
                    let color = "default";
                    if (status === "Published") color = "blue";
                    if (status === "Draft") color = "gold";
                    if (status === "Hidden") color = "default";

                    return (
                        <Tag color={color}>
                            {STATUS_LABEL[status] || status}
                        </Tag>
                    );
                },
            },
            {
                title: "Tải xuống",
                key: "download",
                width: 160,
                align: "center",
                render: (_, record) => (
                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={() => onDownload(record)}
                    >
                        Tải xuống
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
                        onMyAccount={onMyAccount}
                        onChangePassword={onChangePassword}
                        onLogout={onLogout}
                    />
                </div>
            </div>

            <div className="student-lessons-antd-page">
                <Card className="student-lessons-antd-card">
                    <div className="student-lessons-antd-header">
                        <Title level={2} style={{ margin: 0 }}>
                            Bài giảng
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

                    <div className="student-lessons-antd-toolbar">
                        <Search
                            allowClear
                            placeholder="Tên bài giảng"
                            enterButton={
                                <>
                                    <SearchOutlined /> Tìm
                                </>
                            }
                            size="large"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onSearch={onSearch}
                        />
                    </div>

                    {err ? (
                        <div className="student-lessons-antd-error">{err}</div>
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
                                `${range[0]}-${range[1]} / ${total} bài giảng`,
                        }}
                        locale={{
                            emptyText:
                                "Không có dữ liệu. Chỉ hiển thị bài giảng đã đăng của giáo viên dạy lớp bạn.",
                        }}
                        scroll={{ x: 1000 }}
                    />
                </Card>
            </div>
        </div>
    );
}
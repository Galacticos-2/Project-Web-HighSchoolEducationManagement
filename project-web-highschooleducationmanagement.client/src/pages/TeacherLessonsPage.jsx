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
    Upload,
    message,
    Popconfirm,
    Card,
} from "antd";
import {
    ReloadOutlined,
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    DownloadOutlined,
    UploadOutlined,
} from "@ant-design/icons";

import { lessonsApi } from "../api/lessonsApi";
import UserActions from "../components/UserActions";
import Brand from "../components/Brand";
import { useAuth } from "../context/useAuth";
import "../styles/teacher-lessons-antd.css";

const { Title, Text } = Typography;
const { Search } = Input;
const { TextArea } = Input;

const STATUS_OPTIONS = [
    { value: "Draft", label: "Nháp" },
    { value: "Published", label: "Đã đăng" },
    { value: "Hidden", label: "Ẩn" },
];

const STATUS_LABEL = {
    Draft: "Nháp",
    Published: "Đã đăng",
    Hidden: "Ẩn",
};




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
   
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [timeShouldLearn, setTimeShouldLearn] = useState("");
    const [createStatus, setCreateStatus] = useState("Draft");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [q, setQ] = useState("");
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
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState(null);
    const [currentFileName, setCurrentFileName] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);

    const load = async (
        page = 1,
        pageSize = paged.pageSize,
        sBy = sortBy,
        ord = order,
        keyword = q
    ) => {
        setErr("");
        setLoading(true);

        try {
            const { data } = await lessonsApi.listMine({
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

    const closeModal = () => {
        setOpen(false);
        setEditing(null);
        setCurrentFileName("");
        setSelectedFile(null);
        setTitle("");
        setDescription("");
        setTimeShouldLearn("");
        setCreateStatus("Draft");
    };

    const onReload = () => load(paged.page, paged.pageSize);

    const onSearch = (value) => {
        setQ(value);
        load(1, paged.pageSize, sortBy, order, value);
    };

    const onEdit = (item) => {
        setEditing(item);
        setCurrentFileName(item.fileName || "");
        setSelectedFile(null);

        setTitle(item.title || "");
        setDescription(item.description || "");
        setTimeShouldLearn(normalizeMinutesInput(item.timeShouldLearn || ""));
        setCreateStatus(item.status || "Draft");

        setOpen(true);
    };
    function normalizeMinutesInput(value) {
        return (value || "").replace(/\D/g, "");
    }

    function formatMinutes(value) {
        const normalized = normalizeMinutesInput(value);
        if (!normalized) return "-";
        return `${normalized} phút`;
    }
    const onCreateNew = () => {
        setEditing(null);
        setCurrentFileName("");
        setSelectedFile(null);
        setTitle("");
        setDescription("");
        setTimeShouldLearn("");
        setCreateStatus("Draft");
        setOpen(true);
    };

    const onDelete = async (item) => {
        try {
            await lessonsApi.deleteLesson(item.id);
            message.success("Đã xóa bài giảng.");
            await load(paged.page, paged.pageSize);
        } catch {
            message.error("Không xóa được bài giảng.");
        }
    };

    const onPublish = async (item) => {
        try {
            const fd = new FormData();
            fd.append("Title", item.title);
            fd.append("Description", item.description || "");
            fd.append("TimeShouldLearn", normalizeMinutesInput(item.timeShouldLearn || ""));
            fd.append("Status", "Published");

            await lessonsApi.updateLesson(item.id, fd);
            message.success("Đã đăng bài giảng.");
            await load(paged.page, paged.pageSize);
        } catch {
            message.error("Không thể đăng bài giảng.");
        }
    };

    const onSubmit = async () => {
        if (!title.trim()) {
            message.error("Tên bài giảng không được trống.");
            return;
        }

        if (!editing && !selectedFile) {
            message.error("Bạn chưa chọn file (PDF/DOC/DOCX).");
            return;
        }

        try {
            const normalizedMinutes = normalizeMinutesInput(timeShouldLearn);
            setCreating(true);

            const fd = new FormData();
            fd.append("Title", title.trim());
            fd.append("Description", description || "");
            fd.append("TimeShouldLearn", normalizedMinutes || "");
            fd.append("Status", createStatus || "Draft");

            if (selectedFile) {
                fd.append("file", selectedFile);
            }

            if (editing) {
                await lessonsApi.updateLesson(editing.id, fd);
                message.success("Cập nhật bài giảng thành công.");
            } else {
                await lessonsApi.createnewlesson(fd);
                message.success("Tạo bài giảng thành công.");
            }

            closeModal();
            await load(1, paged.pageSize);
        } catch (ex) {
            const msg =
                ex?.response?.data?.message ||
                ex?.response?.data ||
                ex?.message ||
                "Lưu bài giảng thất bại.";

            message.error(typeof msg === "string" ? msg : JSON.stringify(msg));
        } finally {
            setCreating(false);
        }
    };

    const onDownload = async (item) => {
        try {
            const res = await lessonsApi.download(item.id);
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
        } catch {
            message.error("Không tải được file.");
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

    const columns = useMemo(() => [
        {
            title: "STT",
            key: "stt",
            width: 80,
            align: "center",
            render: (_, __, index) =>
                (paged.page - 1) * paged.pageSize + index + 1,
        },
        {
            title: "Tên",
            dataIndex: "title",
            key: "title",
            sorter: true,
            sortOrder: sortBy === "title" ? (order === "asc" ? "ascend" : "descend") : null,
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
            render: (value) => formatMinutes(value),
        },
        {
            title: "File",
            key: "fileName",
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
            sorter: true,
            sortOrder:
                sortBy === "status"
                    ? order === "asc"
                        ? "ascend"
                        : "descend"
                    : null,
            align: "center",
            render: (status) => {
                let color = "default";
                if (status === "Published") color = "blue";
                if (status === "Draft") color = "gold";
                if (status === "Hidden") color = "default";

                return <Tag color={color}>{STATUS_LABEL[status] || status}</Tag>;
            },
        },
        {
            title: "Hành động",
            key: "actions",
            width: 220,
            align: "center",
            render: (_, record) => (
                <Space wrap>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => onEdit(record)}
                    />
                    <Popconfirm
                        title="Xóa bài giảng"
                        description="Bạn có chắc muốn xóa bài giảng này?"
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={() => onDelete(record)}
                    >
                        <Button danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={() => onDownload(record)}
                    />
                    {record.status === "Draft" && (
                        <Popconfirm
                            title="Đăng bài giảng"
                            description="Bạn có muốn đăng bài giảng này không?"
                            okText="Đăng"
                            cancelText="Hủy"
                            onConfirm={() => onPublish(record)}
                        >
                            <Button type="primary">Đăng</Button>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ], [paged.page, paged.pageSize, sortBy, order]);

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
                        onChangePassword={() => console.log("change password")}
                        onLogout={() => {
                            clearAuthState();
                            navigate("/login", { replace: true });
                        }}
                    />
                </div>
            </div>

            <div className="teacher-lessons-antd-page">
                <Card className="teacher-lessons-antd-card">
                    <div className="teacher-lessons-antd-header">
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

                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={onCreateNew}
                            >
                                Thêm mới
                            </Button>
                        </Space>
                    </div>

                    <div className="teacher-lessons-antd-toolbar">
                        <Search
                            allowClear
                            placeholder="Tên bài giảng"
                            enterButton={<><SearchOutlined /> Tìm</>}
                            size="large"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onSearch={onSearch}
                        />
                    </div>

                    {err ? (
                        <div className="teacher-lessons-antd-error">
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
                                `${range[0]}-${range[1]} / ${total} bài giảng`,
                        }}
                        locale={{
                            emptyText: "Không có dữ liệu",
                        }}
                        scroll={{ x: 1100 }}
                    />
                </Card>

                <Modal
                    title={editing ? "Chỉnh sửa bài giảng" : "Thêm bài giảng"}
                    open={open}
                    onCancel={closeModal}
                    onOk={onSubmit}
                    confirmLoading={creating}
                    okText="Lưu"
                    cancelText="Hủy"
                    destroyOnHidden
                    centered
                    width={640}
                    maskClosable={false}
                    styles={{
                        body: {
                            maxHeight: "calc(100vh - 220px)",
                            overflowY: "auto",
                            paddingRight: 8,
                        },
                    }}
                >
                    <Form layout="vertical">
                        <Form.Item
                            label="Tên bài giảng"
                            required
                            validateStatus={!title.trim() && creating ? "error" : ""}
                            help={!title.trim() && creating ? "Tên bài giảng không được trống." : ""}
                        >
                            <Input
                                placeholder="Nhập tên bài giảng"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </Form.Item>

                        <Form.Item label="Trạng thái" required>
                            <Select
                                value={createStatus}
                                options={STATUS_OPTIONS}
                                placeholder="Chọn trạng thái"
                                onChange={setCreateStatus}
                            />
                        </Form.Item>

                        <Form.Item label="Mô tả">
                            <TextArea
                                rows={4}
                                placeholder="Nhập mô tả"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </Form.Item>

                        <Form.Item label="Thời lượng dự kiến">
                            <Space.Compact style={{ width: "100%" }}>
                                <Input
                                    inputMode="numeric"
                                    placeholder="Ví dụ: 45"
                                    value={timeShouldLearn}
                                    onChange={(e) =>
                                        setTimeShouldLearn(normalizeMinutesInput(e.target.value))
                                    }
                                    maxLength={4}
                                />
                                <Button disabled>phút</Button>
                            </Space.Compact>
                        </Form.Item>

                        <Form.Item label="File bài giảng">
                            <Upload
                                beforeUpload={(file) => {
                                    const allowedExtensions = [".pdf", ".doc", ".docx"];
                                    const lowerName = file.name.toLowerCase();
                                    const isValid = allowedExtensions.some((ext) =>
                                        lowerName.endsWith(ext)
                                    );

                                    if (!isValid) {
                                        message.error("Chỉ hỗ trợ file PDF/DOC/DOCX.");
                                        return Upload.LIST_IGNORE;
                                    }

                                    setSelectedFile(file);
                                    return false;
                                }}
                                maxCount={1}
                                onRemove={() => {
                                    setSelectedFile(null);
                                }}
                                fileList={
                                    selectedFile
                                        ? [
                                            {
                                                uid: "-1",
                                                name: selectedFile.name,
                                                status: "done",
                                            },
                                        ]
                                        : []
                                }
                            >
                                <Button icon={<UploadOutlined />}>Chọn tệp</Button>
                            </Upload>

                            <div style={{ marginTop: 8 }}>
                                <Text type="secondary">
                                    {selectedFile
                                        ? `Đã chọn: ${selectedFile.name}`
                                        : currentFileName
                                            ? `File hiện tại: ${currentFileName}`
                                            : "Chưa có tệp nào được chọn"}
                                </Text>
                            </div>

                            {editing ? (
                                <div style={{ marginTop: 6 }}>
                                    <Text type="secondary">
                                        Chỉ chọn file nếu muốn thay thế file hiện tại.
                                    </Text>
                                </div>
                            ) : null}
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </div>
    );
}
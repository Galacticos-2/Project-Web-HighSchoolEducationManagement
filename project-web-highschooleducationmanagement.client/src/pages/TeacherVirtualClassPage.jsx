import { Link } from "react-router-dom";

export default function TeacherVirtualClassPage() {
    return (
        <div style={{ padding: 24 }}>
            <h2>Lớp học ảo</h2>
            <p>Trang này sẽ là nơi tạo/phòng học trực tuyến (sau mình làm tiếp).</p>
            <Link to="/teacher">← Quay lại trang chủ giáo viên</Link>
        </div>
    );
}
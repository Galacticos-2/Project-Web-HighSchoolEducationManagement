import { Link } from "react-router-dom";

export default function TeacherSchedulePage() {
    return (
        <div style={{ padding: 24 }}>
            <h2>Lịch trình</h2>
            <p>Trang này sẽ hiển thị lịch dạy, thời khóa biểu, lịch họp... (sau mình làm tiếp).</p>
            <Link to="/teacher">← Quay lại trang chủ giáo viên</Link>
        </div>
    );
}
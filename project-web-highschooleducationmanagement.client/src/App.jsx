import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePageStudent from "./pages/HomePageStudent";
import HomePageTeacher from "./pages/HomePageTeacher";
import PrivateRoute from "./auth/PrivateRoute";
import RoleHomeRedirect from "./auth/RoleHomeRedirect";
import AdminDashboard from "./pages/AdminDashboard";
import MyInfoPage from "./pages/MyInfoPage.jsx";

import TeacherLessonsPage from "./pages/TeacherLessonsPage.jsx";
import TeacherVirtualClassPage from "./pages/TeacherVirtualClassPage.jsx";
import TeacherSchedulePage from "./pages/TeacherSchedulePage.jsx";

export default function App() {
    return (
        <Routes>
            {/* public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* home redirect: chỉ cần đăng nhập */}
            <Route element={<PrivateRoute />}>
                <Route path="/" element={<RoleHomeRedirect />} />
            </Route>

            {/* ALL roles: my info */}
            <Route element={<PrivateRoute allowedRoles={["Admin", "Teacher", "Student"]} />}>
                <Route path="/my-info" element={<MyInfoPage />} />
            </Route>

            {/* STUDENT only */}
            <Route element={<PrivateRoute allowedRoles={["Student"]} />}>
                <Route path="/student" element={<HomePageStudent />} />
                <Route path="/student/my-info" element={<Navigate to="/my-info" replace />} />
            </Route>

            {/* TEACHER only */}
            <Route element={<PrivateRoute allowedRoles={["Teacher"]} />}>
                <Route path="/teacher" element={<HomePageTeacher />} />
                <Route path="/teacher/lessons" element={<TeacherLessonsPage />} />
                <Route path="/teacher/virtual-class" element={<TeacherVirtualClassPage />} />
                <Route path="/teacher/schedule" element={<TeacherSchedulePage />} />
                <Route path="/teacher/my-info" element={<Navigate to="/my-info" replace />} />
            </Route>

            {/* ADMIN only */}
            <Route element={<PrivateRoute allowedRoles={["Admin"]} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/my-info" element={<Navigate to="/my-info" replace />} />
            </Route>

            {/* not found */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}
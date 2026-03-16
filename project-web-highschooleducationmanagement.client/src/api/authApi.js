import { axiosClient } from "./axiosClient";

export const authApi = {
    register: (payload) => axiosClient.post("/api/auth/register", payload),
    login: (payload) => axiosClient.post("/api/auth/login", payload),
    // ✅ NEW: lấy profile của user đang đăng nhập
    getMe: () => axiosClient.get("/api/auth/me"),
    updateProfile: (data) => axiosClient.put("/api/auth/profile", data),

};
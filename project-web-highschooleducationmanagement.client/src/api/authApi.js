import { axiosClient } from "./axiosClient";

export const authApi = {
    register: (payload) => axiosClient.post("/api/auth/register", payload),
    login: (payload) => axiosClient.post("/api/auth/login", payload),
    // ✅ NEW: lấy profile của user đang đăng nhập
    getMe: () => axiosClient.get("/api/auth/me"),
    updateProfile: (data) => axiosClient.put("/api/auth/profile", data),
    uploadAvatar: (file, onUploadProgress) => {
        const formData = new FormData();
        formData.append("file", file);

        return axiosClient.post("/api/auth/upload-avatar", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
            onUploadProgress,
        });
    },
};
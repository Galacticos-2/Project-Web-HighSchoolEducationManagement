import axios from "axios";
import { authStorage } from "../auth/authStorage";

// Nếu bạn đang dùng Vite proxy, bạn có thể để baseURL là "".
// Nếu không có proxy, đặt baseURL là backend URL (VD https://localhost:7190).
export const axiosClient = axios.create({
    baseURL: "", // dùng proxy của Vite (khuyến nghị)
    // baseURL: "https://localhost:31028", // dùng nếu KHÔNG cấu hình proxy
});

// ✅ Request interceptor: tự gắn Bearer token
axiosClient.interceptors.request.use(
    (config) => {
        const token = authStorage.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ✅ Optional: Response interceptor để debug lỗi 401/403
axiosClient.interceptors.response.use(
    (res) => res,
    (err) => {
        // nếu token hết hạn / unauthorized
        if (err?.response?.status === 401) {
            // bạn có thể auto logout ở đây nếu muốn
            // authStorage.clear();
        }
        return Promise.reject(err);
    }
);
axiosClient.interceptors.response.use(
    (res) => res,
    (error) => {
        const message =
            error?.response?.data?.message ||
            "Đã xảy ra lỗi.";

        return Promise.reject({
            ...error,
            message
        });
    }
);
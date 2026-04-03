import { axiosClient } from "./axiosClient";

export const notificationApi = {
    getMine: (take = 20) =>
        axiosClient.get("/api/notifications/mine", { params: { take } }),

    markAsRead: (id) =>
        axiosClient.post(`/api/notifications/${id}/read`),

    getSettings: () =>
        axiosClient.get("/api/admin/notification-settings"),

    updateSettings: (data) =>
        axiosClient.put("/api/admin/notification-settings", data),
    deleteMine: (id) =>
        axiosClient.delete(`/api/notifications/${id}`),
};
import { axiosClient } from "./axiosClient";

export const lessonsApi = {
    listMine: ({ page = 1, pageSize = 10, status = "", q = "" }) =>
        axiosClient.get("/api/teacher/lessons", { params: { page, pageSize, status, q } }),

    create: (formData) =>
        axiosClient.post("/api/teacher/lessons", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),

    download: (id) =>
        axiosClient.get(`/api/lessons/${id}/download`, { responseType: "blob" }),
};
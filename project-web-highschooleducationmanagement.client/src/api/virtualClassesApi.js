import { axiosClient } from "./axiosClient";

export const virtualClassesApi = {

    listTeacher: (params = {}) => {
        const { page = 1, pageSize = 10 } = params;
        return axiosClient.get("/api/teacher/virtual-classes", {
            params: { page, pageSize }
        });
    },

    

    listStudent: (params = {}) => {
        const { page = 1, pageSize = 10 } = params;
        return axiosClient.get("/api/student/virtual-classes", {
            params: { page, pageSize }
        });
    },
    create: (data) =>
        axiosClient.post("/api/teacher/virtual-classes", data),

    delete: (id) =>
        axiosClient.delete(`/api/teacher/virtual-classes/${id}`),

    update: (id, data) =>
        axiosClient.put(`/api/teacher/virtual-classes/${id}`, data)
    
};
import { axiosClient } from "./axiosClient";

export const virtualClassesApi = {

    listTeacher: () =>
        axiosClient.get("/api/teacher/virtual-classes"),

    

    listStudent: () =>
        axiosClient.get("/api/student/virtual-classes"),
    create: (data) =>
        axiosClient.post("/api/teacher/virtual-classes", data),

    delete: (id) =>
        axiosClient.delete(`/api/teacher/virtual-classes/${id}`),

    update: (id, data) =>
        axiosClient.put(`/api/teacher/virtual-classes/${id}`, data)
    
};
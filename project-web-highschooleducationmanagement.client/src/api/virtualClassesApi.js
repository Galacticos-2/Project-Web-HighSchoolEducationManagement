import { axiosClient } from "./axiosClient";

export const virtualClassesApi = {

    listTeacher: (params = {}) => {
        const {
            page = 1,
            pageSize = 10,
            sortBy = "",
            order = "",
        } = params;

        return axiosClient.get("/api/teacher/virtual-classes", {
            params: { page, pageSize, sortBy, order }
        });
    },

    getStudentSubjectColors: () =>
        axiosClient.get("/api/student/virtual-classes/subject-colors"),

    saveStudentSubjectColor: (data) =>
        axiosClient.put("/api/student/virtual-classes/subject-colors", data),

    listStudent: (params = {}) => {
        const {
            page = 1,
            pageSize = 10,
            sortBy = "",
            order = "",
        } = params;

        return axiosClient.get("/api/student/virtual-classes", {
            params: { page, pageSize, sortBy, order }
        });
    },

    create: (data) =>
        axiosClient.post("/api/teacher/virtual-classes", data),

    delete: (id) =>
        axiosClient.delete(`/api/teacher/virtual-classes/${id}`),

    update: (id, data) =>
        axiosClient.put(`/api/teacher/virtual-classes/${id}`, data),

    getTeacherClassColors: () =>
        axiosClient.get("/api/teacher/virtual-classes/class-colors"),

    saveTeacherClassColor: (data) =>
        axiosClient.put("/api/teacher/virtual-classes/class-colors", data),
    
};
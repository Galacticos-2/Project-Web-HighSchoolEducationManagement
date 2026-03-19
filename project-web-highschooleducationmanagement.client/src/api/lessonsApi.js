//Gọi API từ React sang ASP.NET Core
import { axiosClient } from "./axiosClient";

export const lessonsApi = {
    //Get the list of lessons of this teacher
    listMine: ({
        page = 1,
        pageSize = 10,
        status = "",
        q = "",
        sortBy = "",
        order = ""
    }) =>
        axiosClient.get("/api/teacher/lessons/listMine", {
            params: { page, pageSize, status, q, sortBy, order }
        }),
    //Upload new lesson
    createnewlesson: (formData) =>
        axiosClient.post("/api/teacher/lessons/createnewlesson", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),
    updateLesson: (id, formData) =>
        axiosClient.put(`/api/teacher/lessons/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),

    deleteLesson: (id) =>
        axiosClient.delete(`/api/teacher/lessons/${id}`),
    //Download the lesson file
    download: (id) =>
        axiosClient.get(`/api/lessons/${id}/download`, { responseType: "blob" }),


    // student
    listForStudent: ({
        page = 1,
        pageSize = 10,
        q = "",
        sortBy = "",
        order = ""
    }) =>
        axiosClient.get("/api/student/lessons/listMine", {
            params: { page, pageSize, q, sortBy, order }
        }),

    downloadForStudent: (id) =>
        axiosClient.get(`/api/student/lessons/${id}/download`, { responseType: "blob" }),

};
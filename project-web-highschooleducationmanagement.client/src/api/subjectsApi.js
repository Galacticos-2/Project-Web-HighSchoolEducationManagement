import  { axiosClient } from "./axiosClient";

export const subjectsApi = {
    getAll: () => axiosClient.get("/api/subjects"),
    getMine: (classId) =>
        axiosClient.get("/api/teacher/virtual-classes/subjects", {
            params: { classId }
        })
};
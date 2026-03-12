import { axiosClient } from "./axiosClient";

export const classesApi = {
    getAll: () => axiosClient.get("/api/classes"),
    getMine: () => axiosClient.get("/api/teacher/virtual-classes/classes")
};
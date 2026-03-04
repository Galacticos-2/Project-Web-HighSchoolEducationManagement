import { axiosClient } from "./axiosClient";

export const classesApi = {
    getAll: () => axiosClient.get("/api/classes"),
};
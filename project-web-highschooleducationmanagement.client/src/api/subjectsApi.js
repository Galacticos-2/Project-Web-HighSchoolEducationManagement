import  { axiosClient } from "./axiosClient";

export const subjectsApi = {
    getAll: () => axiosClient.get("/api/subjects")
};
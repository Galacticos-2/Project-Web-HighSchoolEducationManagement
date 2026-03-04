import { axiosClient } from "./axiosClient";

export const adminApi = {
    // pending
    getPending: () => axiosClient.get("/api/admin/accounts/pending"),
    approve: (pendingId) =>
        axiosClient.post(`/api/admin/accounts/approve?pendingId=${pendingId}`),
    reject: (pendingId) =>
        axiosClient.post(`/api/admin/accounts/reject?pendingId=${pendingId}`),
    // dashboard
    getSummary: () => axiosClient.get("/api/admin/accounts/summary"),
    listAccounts: ({ role, page = 1, pageSize = 10, q = "" }) =>
        axiosClient.get("/api/admin/accounts", { params: { role, page, pageSize, q } }),
};
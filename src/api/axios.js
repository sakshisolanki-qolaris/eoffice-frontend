import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || "";

      if (
        requestUrl.includes("/auth/set-pin") ||
        requestUrl.includes("/auth/change-password")
      ) {
        return Promise.reject(error);
      }

      if (!globalThis.location.pathname.includes("/login")) {
        localStorage.removeItem("user");
        globalThis.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export const endpoints = {
  auth: {
    login: (data) => api.post("/auth/login", data),
    logout: () => api.post("/auth/logout"),
    changePassword: (data) => api.post("/auth/change-password", data),
    setPin: (data) => api.post("/auth/set-pin", data),
    forgotPassword: (data) => api.post("/auth/forgot-password", data),
    resetPassword: (data) => api.post("/auth/reset-password", data),
    getMe: () => api.get("/auth/me"),
  },
  users: {
    create: (data) =>
      api.post("/users", data, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    getAll: (params) => api.get("/users", { params }),
    update: (id, data) => api.patch(`/users/${id}`, data),
    getDepartments: () => api.get("/users/departments"),
    getDesignations: () => api.get("/users/designations"),
    createDepartment: (data) => api.post("/users/departments", data),
    createDesignation: (data) => api.post("/users/designations", data),
  },
  files: {
    create: (data) => api.post("/files", data),

    drafts: (limit = 10, cursor = null) => {
      const params = { limit };
      if (cursor) params.cursor = cursor;
      return api.get("/files/drafts", { params });
    },

    inbox: (limit = 10, cursor = null) => {
      const params = { limit };
      if (cursor) params.cursor = cursor;
      return api.get("/files/inbox", { params });
    },

    outbox: (limit = 10, cursor = null) => {
      const params = { limit };
      if (cursor) params.cursor = cursor;
      return api.get("/files/outbox", { params });
    },

    search: (queryString) => api.get(`/files/search?${queryString}`),
    history: (id, params) => api.get(`/files/${id}/history`, { params }),
    downloadAttachment: (attachmentId) =>
      api.get(`/files/attachment/${attachmentId}/download`, {
        responseType: "blob",
      }),

    addAttachment: (id, formData) =>
      api.post(`/files/${id}/attachment`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    removeAttachment: (attachmentId) =>
      api.delete(`/files/attachment/${attachmentId}`),
  },
  workflow: {
    move: (fileId, data) => {
      const isFormData = data instanceof FormData;
      return api.post(`/workflow/files/${fileId}/move`, data, {
        headers: isFormData
          ? { "Content-Type": "multipart/form-data" }
          : { "Content-Type": "application/json" },
      });
    },
  },
  common: {
    health: () => api.get("/health"),
    constants: () => api.get("/constants"),
  },
};

export default api;

import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({ baseURL: `${API_URL}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("syncspace_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config.url.includes("/auth/")) {
      localStorage.removeItem("syncspace_token");
      localStorage.removeItem("syncspace_user");
      if (location.pathname !== "/login") location.assign("/login");
    }
    return Promise.reject(err);
  }
);

export const errorMessage = (err, fallback = "Something went wrong") => {
  const data = err?.response?.data;
  const message = data?.message;

  if (Array.isArray(data?.details) && data.details.length > 0) {
    return `${message ? `${message}: ` : ""}${data.details.join(", ")}`;
  }

  return message || err?.message || fallback;
};

export const authApi = {
  login: (body) => api.post("/auth/login", body).then((r) => r.data),
  register: (body) => api.post("/auth/register", body).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
};

export const userApi = {
  update: (body) => api.put("/users/me", body).then((r) => r.data),
};

export const workspaceApi = {
  list: () => api.get("/workspaces").then((r) => r.data.workspaces),
  get: (id) => api.get(`/workspaces/${id}`).then((r) => r.data.workspace),
  create: (body) => api.post("/workspaces", body).then((r) => r.data.workspace),
  update: (id, body) => api.put(`/workspaces/${id}`, body).then((r) => r.data.workspace),
  remove: (id) => api.delete(`/workspaces/${id}`).then((r) => r.data),
  addMember: (id, email) => api.post(`/workspaces/${id}/members`, { email }).then((r) => r.data.workspace),
  removeMember: (id, userId) => api.delete(`/workspaces/${id}/members/${userId}`).then((r) => r.data.workspace),
};

export const roomApi = {
  listByWorkspace: (workspaceId) => api.get(`/rooms/workspace/${workspaceId}`).then((r) => r.data.rooms),
  get: (id) => api.get(`/rooms/${id}`).then((r) => r.data.room),
  create: (body) => api.post("/rooms", body).then((r) => r.data.room),
  update: (id, body) => api.put(`/rooms/${id}`, body).then((r) => r.data.room),
  remove: (id) => api.delete(`/rooms/${id}`).then((r) => r.data),
  members: (id) => api.get(`/rooms/${id}/members`).then((r) => r.data.members),
};

export const historyApi = {
  list: (roomId) => api.get(`/documents/history/${roomId}`).then((r) => r.data.history),
};

export const invitationApi = {
  create: (body) => api.post("/invitations", body).then((r) => r.data.invitation),
  mine: () => api.get("/invitations").then((r) => r.data.invitations),
  accept: (id) => api.post(`/invitations/${id}/accept`).then((r) => r.data.invitation),
};

export default api;

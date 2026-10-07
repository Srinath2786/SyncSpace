import { create } from "zustand";
import { authApi } from "../api/client";

const stored = () => {
  try {
    return JSON.parse(localStorage.getItem("syncspace_user"));
  } catch {
    return null;
  }
};

export const useAuth = create((set) => ({
  token: localStorage.getItem("syncspace_token"),
  user: stored(),

  setSession: ({ token, user }) => {
    localStorage.setItem("syncspace_token", token);
    localStorage.setItem("syncspace_user", JSON.stringify(user));
    set({ token, user });
  },

  login: async (body) => {
    const data = await authApi.login(body);
    useAuth.getState().setSession(data);
  },

  register: async (body) => {
    const data = await authApi.register(body);
    useAuth.getState().setSession(data);
  },

  updateUser: (user) => {
    localStorage.setItem("syncspace_user", JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    localStorage.removeItem("syncspace_token");
    localStorage.removeItem("syncspace_user");
    set({ token: null, user: null });
  },
}));

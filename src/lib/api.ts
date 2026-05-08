import axios from "axios";
import { auth } from "./firebase";

const BACKEND_URL =
  process.env["NEXT_PUBLIC_BACKEND_URL"] ?? "http://localhost:8000";

/**
 * api — Axios instance pointing at the Express backend.
 *
 * Automatically attaches the current Firebase ID token as a Bearer token
 * on every request via a request interceptor.
 *
 * Usage:
 *   import { api } from "@/lib/api";
 *   const res = await api.get("/api/messages");
 */
export const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: false,
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// client/src/api/apiClient.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: false,
});

// Attach token automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto logout on 401
api.interceptors.response.use(
  response => response,
  error => {
    const isLoginRequest =
      error.config?.url?.includes("/auth/login");

    if (
      error.response &&
      error.response.status === 401 &&
      !isLoginRequest
    ) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
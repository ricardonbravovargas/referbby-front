import axios from "axios";
import { getAuthHeaders } from "./auth";

// Backend URL - your NestJS backend
const API_BASE_URL = "http://localhost:3000";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const authHeaders = getAuthHeaders();
  
  // Solución: Asignar headers individualmente
  if (authHeaders) {
    Object.keys(authHeaders).forEach(key => {
      if (config.headers) {
        config.headers[key] = authHeaders[key];
      }
    });
  }
  
  return config;
});

// Handle responses and errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    throw error;
  },
);

export const api = {
  // User analytics endpoints
  getUserAnalytics: (filters?: any) => {
    const params = filters ? new URLSearchParams(filters).toString() : "";
    return apiClient.get(`/analytics/users${params ? `?${params}` : ""}`);
  },
  getProductAnalytics: () => apiClient.get("/analytics/products"),
  getCompanyAnalytics: () => apiClient.get("/analytics/companies"),
  getDashboardStats: () => apiClient.get("/analytics/dashboard"),

  // Existing endpoints that you might already have
  getUsers: () => apiClient.get("/users"),
  getUser: (id: string) => apiClient.get(`/users/${id}`),
  getProducts: (filters?: any) => {
    const params = new URLSearchParams(filters).toString();
    return apiClient.get(`/productos${params ? `?${params}` : ""}`);
  },
  getProduct: (id: string) => apiClient.get(`/productos/${id}`),

  // Auth endpoints (you already have these)
  login: (email: string, password: string) =>
    apiClient.post("/auth/login", { email, password }),
  register: (userData: any) => apiClient.post("/auth/register", userData),
};
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Auth APIs
export const authAPI = {
  signup: (name, email, password, address) =>
    apiClient.post("/auth/signup", { name, email, password, address }),
  login: (email, password) =>
    apiClient.post("/auth/login", { email, password }),
};

// User APIs
export const userAPI = {
  getProfile: () => apiClient.get("/users/profile"),
  changePassword: (currentPassword, newPassword) =>
    apiClient.put("/users/password", { currentPassword, newPassword }),
};

// Store APIs
export const storeAPI = {
  listStores: (params = {}) => apiClient.get("/stores", { params }),
  getStoreById: (id) => apiClient.get(`/stores/${id}`),
};

// Rating APIs
export const ratingAPI = {
  submitRating: (storeId, rating) =>
    apiClient.post("/ratings", { storeId, rating }),
  updateRating: (id, rating) => apiClient.put(`/ratings/${id}`, { rating }),
};

// Admin APIs
export const adminAPI = {
  getDashboard: () => apiClient.get("/admin/dashboard"),
  listUsers: (params = {}) => apiClient.get("/admin/users", { params }),
  getUserById: (id) => apiClient.get(`/admin/users/${id}`),
  createUser: (name, email, password, address, role) =>
    apiClient.post("/admin/users", { name, email, password, address, role }),
  listStores: (params = {}) => apiClient.get("/admin/stores", { params }),
  createStore: (name, email, address, ownerId = null) =>
    apiClient.post("/admin/stores", { name, email, address, ownerId }),
};

export default apiClient;

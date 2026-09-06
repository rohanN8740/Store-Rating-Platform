import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.includes("/auth/");
    if (error.response?.status === 401 && !isAuthRequest) {
      // Token expired or invalid
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
  login: (email, password, role) =>
    apiClient.post("/auth/login", { email, password, role }),
  logout: () => apiClient.post("/auth/logout"),
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
  deleteUser: (id) => apiClient.delete(`/admin/users/${id}`),
  listStores: (params = {}) => apiClient.get("/admin/stores", { params }),
  createStore: (name, email, address, ownerId = null) =>
    apiClient.post("/admin/stores", { name, email, address, ownerId }),
  deleteStore: (id) => apiClient.delete(`/admin/stores/${id}`),
};

export default apiClient;

import { axiosWrapper } from "./axiosWrapper";

// API Endpoints

// Auth Endpoints
export const login = (data) => axiosWrapper.post("/api/user/login", data);
export const register = (data) => axiosWrapper.post("/api/user/register", data);
export const getUserData = () => axiosWrapper.get("/api/user");
export const logout = () => axiosWrapper.post("/api/user/logout");

// Admin User Management Endpoints
export const getAllUsers = () => axiosWrapper.get("/api/user/all");
export const deleteUser = (id) => axiosWrapper.delete(`/api/user/${id}`);
export const updateUser = ({ id, ...data }) => axiosWrapper.put(`/api/user/${id}`, data);

// Table Endpoints
export const addTable = (data) => axiosWrapper.post("/api/table/", data);
export const getTables = () => axiosWrapper.get("/api/table");
export const updateTable = ({ tableId, ...tableData }) =>
  axiosWrapper.put(`/api/table/${tableId}`, tableData);
export const deleteTable = (tableId) => axiosWrapper.delete(`/api/table/${tableId}`);

// Order Endpoints
export const addOrder = (data) => axiosWrapper.post("/api/order/", data);
export const getOrders = (params) => axiosWrapper.get("/api/order", { params });
export const updateOrderStatus = ({ orderId, orderStatus }) =>
  axiosWrapper.put(`/api/order/${orderId}`, { orderStatus });

// Category Endpoints
export const addCategory = (data) => axiosWrapper.post("/api/category/add-category", data);
export const updateCategory = ({ categoryId, ...data }) => axiosWrapper.put(`/api/category/update-category/${categoryId}`, data);
export const deleteCategory = (categoryId) => axiosWrapper.delete(`/api/category/delete-category/${categoryId}`);

export const addDish = (data) => axiosWrapper.post("/api/category/add-dish", data);
export const updateDish = (data) => axiosWrapper.put("/api/category/update-dish", data);
export const deleteDish = (data) => axiosWrapper.post("/api/category/delete-dish", data);

export const getAllCategories = () => axiosWrapper.get("/api/category/get-all");

// Metrics Endpoints
export const getDashboardMetrics = () => axiosWrapper.get("/api/metrics");
export const getCashCutMetrics = () => axiosWrapper.get("/api/metrics/cash-cut");
export const getPopularDishes = (params) => axiosWrapper.get("/api/metrics/popular", { params });

// Restaurant Config Endpoints
export const getRestaurantConfig = () => axiosWrapper.get("/api/restaurant/config");
export const updateRestaurantConfig = (data) => axiosWrapper.put("/api/restaurant/config", data);

// Cash Endpoints
export const addCashMovement = (data) => axiosWrapper.post("/api/cash/movement", data);
export const getCashMovements = (params) => axiosWrapper.get("/api/cash/movement", { params });
export const getCashierCutPreview = (cashierId) => axiosWrapper.get(`/api/cash/cut/cashier-preview/${cashierId}`);
export const getDailyCutPreview = (params) => axiosWrapper.get("/api/cash/cut/daily-preview", { params });
export const createCashCut = (data) => axiosWrapper.post("/api/cash/cut", data);
export const getCashCuts = (params) => axiosWrapper.get("/api/cash/cut", { params });

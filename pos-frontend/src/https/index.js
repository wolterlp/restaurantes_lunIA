import { axiosWrapper } from "./axiosWrapper";
export { axiosWrapper };

// API Endpoints

// Auth Endpoints
export const login = (data) => axiosWrapper.post("/api/user/login", data);
export const verifyAdmin = (data) => axiosWrapper.post("/api/user/verify-admin", data);
export const register = (data) => axiosWrapper.post("/api/user/register", data);
export const getUserData = () => axiosWrapper.get("/api/user");
export const logout = () => axiosWrapper.post("/api/user/logout");

// Admin User Management Endpoints
export const getAllUsers = () => axiosWrapper.get("/api/user/all");
export const getUsers = getAllUsers; // Alias for compatibility
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
export const addItemsToOrder = ({ orderId, items, bills }) => 
  axiosWrapper.put(`/api/order/${orderId}/items`, { items, bills });
export const updateOrderStatus = ({ orderId, ...data }) =>
  axiosWrapper.put(`/api/order/${orderId}`, data);
export const updateItemStatus = ({ orderId, itemId, status }) =>
  axiosWrapper.put(`/api/order/${orderId}/items/${itemId}`, { status });
export const serveAllReadyItems = (orderId) =>
    axiosWrapper.put(`/api/order/${orderId}/serve-all`);

// Category Endpoints
export const addCategory = (data) => axiosWrapper.post("/api/category/add-category", data);
export const updateCategory = ({ categoryId, ...data }) => axiosWrapper.put(`/api/category/update-category/${categoryId}`, data);
export const deleteCategory = (categoryId) => axiosWrapper.delete(`/api/category/delete-category/${categoryId}`);

export const addDish = (data) => axiosWrapper.post("/api/category/add-dish", data);
export const updateDish = (data) => axiosWrapper.put("/api/category/update-dish", data);
export const deleteDish = (data) => axiosWrapper.post("/api/category/delete-dish", data);

export const getAllCategories = () => axiosWrapper.get("/api/category/get-all");

// Metrics Endpoints
export const getDashboardMetrics = (period = 'daily') => axiosWrapper.get(`/api/metrics?period=${period}`);
export const getCashCutMetrics = () => axiosWrapper.get("/api/metrics/cash-cut");
export const getPopularDishes = (params) => axiosWrapper.get("/api/metrics/popular", { params });

// Restaurant Config Endpoints
export const getRestaurantConfig = () => axiosWrapper.get("/api/restaurant/config");
export const getLicenseStatus = () => axiosWrapper.get("/api/restaurant/license/status");
export const updateRestaurantConfig = (data) => axiosWrapper.put("/api/restaurant/config", data);

// Cash Endpoints
export const addCashMovement = (data) => axiosWrapper.post("/api/cash/movement", data);
export const getCashMovements = (params) => axiosWrapper.get("/api/cash/movement", { params });
export const getCashierCutPreview = (cashierId) => axiosWrapper.get(`/api/cash/cut/cashier-preview/${cashierId}`);
export const getDailyCutPreview = (params) => axiosWrapper.get("/api/cash/cut/daily-preview", { params });
export const createCashCut = (data) => axiosWrapper.post("/api/cash/cut", data);
export const getCashCuts = (params) => axiosWrapper.get("/api/cash/cut", { params });

// Report Endpoints
export const getPerformanceStats = (dateRange, comparisonDateRange = null) => {
  const params = { ...dateRange };
  if (comparisonDateRange) {
    params.comparisonStartDate = comparisonDateRange.startDate;
    params.comparisonEndDate = comparisonDateRange.endDate;
  }
  return axiosWrapper.get("/api/reports/performance", { params });
};

export const getEconomicStats = (dateRange, comparisonDateRange = null) => {
  const params = { ...dateRange };
  if (comparisonDateRange) {
    params.comparisonStartDate = comparisonDateRange.startDate;
    params.comparisonEndDate = comparisonDateRange.endDate;
  }
  return axiosWrapper.get("/api/reports/economic", { params });
};

// Role Management
export const getRoles = () => axiosWrapper.get("/api/roles");
export const updateRolePermissions = (data) => axiosWrapper.put(`/api/roles/${data.id}`, data);
export const resetRoles = () => axiosWrapper.post("/api/roles/reset");

// File Upload
export const uploadImage = (formData) => axiosWrapper.post("/api/upload", formData, {
    headers: {
        "Content-Type": "multipart/form-data"
    }
});

// Inventory Endpoints
export const addInventoryMovement = (data) => axiosWrapper.post("/api/inventory/movement", data);
export const getInventoryMovements = (params) => axiosWrapper.get("/api/inventory/movement", { params });

// Supplier Endpoints
export const getSuppliers = () => axiosWrapper.get("/api/supplier");
export const addSupplier = (data) => axiosWrapper.post("/api/supplier", data);
export const updateSupplier = ({ id, ...data }) => axiosWrapper.put(`/api/supplier/${id}`, data);
export const deleteSupplier = (id) => axiosWrapper.delete(`/api/supplier/${id}`);

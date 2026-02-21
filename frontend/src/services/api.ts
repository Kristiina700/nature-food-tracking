import axios from 'axios';
import { User, StockItem, Price, ApiResponse, CreateUserRequest, CreateStockItemRequest, CreatePriceRequest, UpdatePriceRequest } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User API
export const userApi = {
  create: async (userData: CreateUserRequest): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/users', userData);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to create user');
    }
    return response.data.data;
  },

  getAll: async (): Promise<User[]> => {
    const response = await api.get<ApiResponse<User[]>>('/users');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch users');
    }
    return response.data.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch user');
    }
    return response.data.data;
  },
};

// Stock API
export const stockApi = {
  create: async (stockData: CreateStockItemRequest): Promise<StockItem> => {
    const response = await api.post<ApiResponse<StockItem>>('/stock', stockData);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to create collecting item');
    }
    return response.data.data;
  },

  getAll: async (userId?: string, year?: number): Promise<StockItem[]> => {
    const params: any = {};
    if (userId) params.userId = userId;
    if (year) params.year = year.toString();
    
    const response = await api.get<ApiResponse<StockItem[]>>('/stock', { params });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch collecting items');
    }
    return response.data.data;
  },

  getById: async (id: string): Promise<StockItem> => {
    const response = await api.get<ApiResponse<StockItem>>(`/stock/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch collecting item');
    }
    return response.data.data;
  },

  update: async (id: string, updates: Partial<StockItem>): Promise<StockItem> => {
    const response = await api.put<ApiResponse<StockItem>>(`/stock/${id}`, updates);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to update collecting item');
    }
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/stock/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete collecting item');
    }
  },

  // New profit tracking endpoints
  getProfitByYear: async (userId: string, type?: 'berry' | 'mushroom'): Promise<Record<number, { revenue: number; cost: number; profit: number; itemCount: number }>> => {
    const params: any = {};
    if (type) params.type = type;
    
    const response = await api.get<ApiResponse<Record<number, { revenue: number; cost: number; profit: number; itemCount: number }>>>(`/stock/profit/${userId}`, { params });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch profit data');
    }
    return response.data.data;
  },

  getAllYears: async (): Promise<number[]> => {
    const response = await api.get<ApiResponse<number[]>>('/stock/years');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch years');
    }
    return response.data.data;
  },

  getAllUsersSalesByYear: async (type?: 'berry' | 'mushroom'): Promise<{ users: Array<{ user: User; salesByYear: Record<number, { revenue: number; cost: number; profit: number; itemCount: number }> }>; totalsByYear: Record<number, { revenue: number; cost: number; profit: number; itemCount: number }> }> => {
    const params: any = {};
    if (type) params.type = type;
    
    const response = await api.get<ApiResponse<{ users: Array<{ user: User; salesByYear: Record<number, { revenue: number; cost: number; profit: number; itemCount: number }> }>; totalsByYear: Record<number, { revenue: number; cost: number; profit: number; itemCount: number }> }>>('/stock/sales-by-year', { params });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch user sales data by year');
    }
    return response.data.data;
  },

  // Get available inventory for a user
  getAvailableInventory: async (userId: string, type?: 'berry' | 'mushroom', species?: string): Promise<Array<{ type: 'berry' | 'mushroom'; species: string; availableQuantity: number; totalPurchased: number; totalSold: number; }>> => {
    const params: any = {};
    if (type) params.type = type;
    if (species) params.species = species;
    
    const response = await api.get<ApiResponse<Array<{ type: 'berry' | 'mushroom'; species: string; availableQuantity: number; totalPurchased: number; totalSold: number; }>>>(`/stock/inventory/${userId}`, { params });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch inventory');
    }
    return response.data.data;
  },
};

// Price API
export const priceApi = {
  create: async (priceData: CreatePriceRequest): Promise<Price> => {
    const response = await api.post<ApiResponse<Price>>('/prices', priceData);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to create price');
    }
    return response.data.data;
  },

  getAll: async (year?: number, type?: 'berry' | 'mushroom', species?: string): Promise<Price[]> => {
    const params: any = {};
    if (year) params.year = year.toString();
    if (type) params.type = type;
    if (species) params.species = species;
    
    const response = await api.get<ApiResponse<Price[]>>('/prices', { params });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch prices');
    }
    return response.data.data;
  },

  getById: async (id: string): Promise<Price> => {
    const response = await api.get<ApiResponse<Price>>(`/prices/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch price');
    }
    return response.data.data;
  },

  update: async (id: string, updates: UpdatePriceRequest): Promise<Price> => {
    const response = await api.put<ApiResponse<Price>>(`/prices/${id}`, updates);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to update price');
    }
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/prices/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete price');
    }
  },

  getCurrent: async (type: 'berry' | 'mushroom', species: string): Promise<Price | null> => {
    const response = await api.get<ApiResponse<Price | null>>('/prices/current', {
      params: { type, species }
    });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch current price');
    }
    return response.data.data || null;
  },

  getYears: async (): Promise<number[]> => {
    const response = await api.get<ApiResponse<number[]>>('/prices/years');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch price years');
    }
    return response.data.data;
  },

  getProfitAnalysis: async (type?: 'berry' | 'mushroom'): Promise<Record<number, { revenue: number; cost: number; profit: number; itemCount: number }>> => {
    const params: any = {};
    if (type) params.type = type;
    
    const response = await api.get<ApiResponse<Record<number, { revenue: number; cost: number; profit: number; itemCount: number }>>>('/prices/profit-analysis', { params });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch price profit analysis');
    }
    return response.data.data;
  },
};

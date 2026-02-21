export interface User {
  id: string;
  aliasName: string;
  createdAt: string;
  revenue: number;
  profit: number;
}

export interface StockItem {
  id: string;
  userId: string;
  type: 'berry' | 'mushroom';
  species: string;
  quantity: number;
  unitPrice: number; // Deprecated, use sellPrice
  buyPrice: number;  // €/kg buy price
  sellPrice: number; // €/kg sell price
  totalRevenue: number; // calculated from quantity * sellPrice / 1000
  totalCost: number;    // calculated from quantity * buyPrice / 1000
  totalProfit: number;  // calculated from totalRevenue - totalCost
  totalPrice: number;   // Deprecated, kept for backward compatibility
  location?: string;
  collectedAt: string;
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface CreateUserRequest {
  aliasName: string;
}

export interface CreateStockItemRequest {
  userId: string;
  type: 'berry' | 'mushroom';
  species: string;
  quantity: number;
  unitPrice?: number; // Deprecated, use sellPrice
  buyPrice: number;   // €/kg buy price
  sellPrice: number;  // €/kg sell price
  location?: string;
  notes?: string;
}

export interface Price {
  id: string;
  type: 'berry' | 'mushroom';
  species: string;
  year: number;
  buyPrice: number;  // €/kg buy price
  sellPrice: number; // €/kg sell price
  updatedAt: string;
}

export interface CreatePriceRequest {
  type: 'berry' | 'mushroom';
  species: string;
  year: number;
  buyPrice: number;  // €/kg buy price
  sellPrice: number; // €/kg sell price
}

export interface UpdatePriceRequest {
  buyPrice?: number;  // €/kg buy price
  sellPrice?: number; // €/kg sell price
}

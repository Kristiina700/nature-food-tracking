import { User, StockItem, Price } from '../types';
import { v4 as uuidv4 } from 'uuid';

class DataStore {
  private users: User[] = [];
  private stockItems: StockItem[] = [];
  private prices: Price[] = [];

  // User operations
  createUser(aliasName: string): User {
    const user: User = {
      id: uuidv4(),
      aliasName,
      createdAt: new Date(),
      revenue: 0,
      profit: 0
    };
    this.users.push(user);
    return user;
  }

  getUserById(id: string): User | undefined {
    const user = this.users.find(user => user.id === id);
    if (!user) return undefined;
    
    // Calculate current revenue and profit from stock items
    const userItems = this.stockItems.filter(item => item.userId === id);
    const userRevenue = userItems.reduce((total, item) => total + (item.totalRevenue || item.totalPrice || 0), 0);
    const userProfit = userItems.reduce((total, item) => total + (item.totalProfit || (item.totalRevenue || item.totalPrice || 0)), 0);
    
    return { ...user, revenue: userRevenue, profit: userProfit };
  }

  getAllUsers(): User[] {
    return this.users.map(user => {
      // Calculate current revenue and profit from stock items
      const userItems = this.stockItems.filter(item => item.userId === user.id);
      const userRevenue = userItems.reduce((total, item) => total + (item.totalRevenue || item.totalPrice || 0), 0);
      const userProfit = userItems.reduce((total, item) => total + (item.totalProfit || (item.totalRevenue || item.totalPrice || 0)), 0);
      
      return { ...user, revenue: userRevenue, profit: userProfit };
    });
  }

  // Stock item operations
  createStockItem(stockItemData: Omit<StockItem, 'id' | 'collectedAt' | 'totalPrice' | 'totalRevenue' | 'totalCost' | 'totalProfit'>): StockItem {
    // Handle backward compatibility: if unitPrice is provided but not sellPrice, use unitPrice as sellPrice
    let buyPrice = stockItemData.buyPrice || 0;
    let sellPrice = stockItemData.sellPrice || stockItemData.unitPrice || 0;
    let unitPrice = stockItemData.unitPrice || sellPrice; // Keep unitPrice for backward compatibility
    
    // Data consistency validation
    if (sellPrice > 0 && buyPrice === 0 && !stockItemData.unitPrice) {
      // This shouldn't happen with proper API usage
      console.warn('Creating item with sellPrice > 0 but buyPrice = 0 and no unitPrice. This may cause data inconsistency.');
    }
    
    // Calculate all price-related fields (prices are in €/kg, quantity in grams)
    const totalRevenue = (stockItemData.quantity * sellPrice) / 1000;
    const totalCost = (stockItemData.quantity * buyPrice) / 1000;
    const totalProfit = totalRevenue - totalCost;
    const totalPrice = totalRevenue; // For backward compatibility
    
    const stockItem: StockItem = {
      id: uuidv4(),
      ...stockItemData,
      unitPrice,
      buyPrice,
      sellPrice,
      totalRevenue,
      totalCost,
      totalProfit,
      totalPrice,
      collectedAt: new Date()
    };
    this.stockItems.push(stockItem);
    return stockItem;
  }

  getStockItemsByUser(userId: string): StockItem[] {
    return this.stockItems.filter(item => item.userId === userId);
  }
  getAllStockItems(): StockItem[] {
    return [...this.stockItems];
  }

  getStockItemById(id: string): StockItem | undefined {
    return this.stockItems.find(item => item.id === id);
  }

  updateStockItem(id: string, updates: Partial<Omit<StockItem, 'id' | 'userId' | 'collectedAt' | 'totalPrice' | 'totalRevenue' | 'totalCost' | 'totalProfit'>>): StockItem | null {
    const index = this.stockItems.findIndex(item => item.id === id);
    if (index === -1) return null;

    const updatedItem = { ...this.stockItems[index], ...updates };
    
    // Recalculate all price-related fields if relevant fields changed
    if ('quantity' in updates || 'unitPrice' in updates || 'buyPrice' in updates || 'sellPrice' in updates) {
      const buyPrice = updatedItem.buyPrice || 0;
      const sellPrice = updatedItem.sellPrice || updatedItem.unitPrice || 0;
      
      updatedItem.totalRevenue = (updatedItem.quantity * sellPrice) / 1000;
      updatedItem.totalCost = (updatedItem.quantity * buyPrice) / 1000;
      updatedItem.totalProfit = updatedItem.totalRevenue - updatedItem.totalCost;
      updatedItem.totalPrice = updatedItem.totalRevenue; // For backward compatibility
      updatedItem.unitPrice = sellPrice; // Keep unitPrice synced
    }
    
    this.stockItems[index] = updatedItem;
    return updatedItem;
  }

  deleteStockItem(id: string): boolean {
    const index = this.stockItems.findIndex(item => item.id === id);
    if (index === -1) return false;

    this.stockItems.splice(index, 1);
    return true;
  }

  // New methods for profit tracking and yearly analysis
  getUserProfitByYear(userId: string, typeFilter?: 'berry' | 'mushroom'): Record<number, { revenue: number; cost: number; profit: number; itemCount: number }> {
    let userItems = this.stockItems.filter(item => item.userId === userId);
    
    // Filter for sales only (both sellPrice > 0 AND buyPrice > 0, which means it's a proper sale transaction)
    // Items with only sellPrice but no buyPrice are legacy collection items, not sales
    userItems = userItems.filter(item => item.sellPrice > 0 && item.buyPrice > 0);
    
    // Apply type filter if provided
    if (typeFilter) {
      userItems = userItems.filter(item => item.type === typeFilter);
    }
    
    const yearlyData: Record<number, { revenue: number; cost: number; profit: number; itemCount: number }> = {};
    
    userItems.forEach(item => {
      const year = item.collectedAt.getFullYear();
      if (!yearlyData[year]) {
        yearlyData[year] = { revenue: 0, cost: 0, profit: 0, itemCount: 0 };
      }
      
      // Use the calculated values, with proper fallback
      const revenue = item.totalRevenue || item.totalPrice || 0;
      const cost = item.totalCost || 0;
      // Fix: Use the actual totalProfit if available, otherwise calculate it properly
      const profit = item.totalProfit !== undefined ? item.totalProfit : (revenue - cost);
      
      yearlyData[year].revenue += revenue;
      yearlyData[year].cost += cost;
      yearlyData[year].profit += profit;
      yearlyData[year].itemCount += 1;
    });
    
    return yearlyData;
  }

  getStockItemsByUserAndYear(userId: string, year?: number): StockItem[] {
    let items = this.stockItems.filter(item => item.userId === userId);
    
    if (year) {
      items = items.filter(item => item.collectedAt.getFullYear() === year);
    }
    
    return items;
  }

  getAllYears(): number[] {
    const years = new Set<number>();
    this.stockItems.forEach(item => {
      years.add(item.collectedAt.getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a); // Most recent first
  }

  // Price monitoring operations
  createPrice(priceData: Omit<Price, 'id' | 'updatedAt'>): Price {
    const price: Price = {
      id: uuidv4(),
      ...priceData,
      updatedAt: new Date()
    };
    
    // Check if price already exists for this type, species, and year
    const existingIndex = this.prices.findIndex(
      p => p.type === price.type && p.species === price.species && p.year === price.year
    );
    
    if (existingIndex >= 0) {
      // Update existing price
      this.prices[existingIndex] = { ...this.prices[existingIndex], ...priceData, updatedAt: new Date() };
      return this.prices[existingIndex];
    } else {
      // Add new price
      this.prices.push(price);
      return price;
    }
  }

  getAllPrices(): Price[] {
    return [...this.prices];
  }

  getPricesByYear(year: number): Price[] {
    return this.prices.filter(price => price.year === year);
  }

  getPricesByTypeAndSpecies(type: 'berry' | 'mushroom', species: string, year?: number): Price[] {
    let filtered = this.prices.filter(price => price.type === type && price.species === species);
    if (year) {
      filtered = filtered.filter(price => price.year === year);
    }
    return filtered;
  }

  getPriceById(id: string): Price | undefined {
    return this.prices.find(price => price.id === id);
  }

  updatePrice(id: string, updates: Partial<Omit<Price, 'id' | 'type' | 'species' | 'year'>>): Price | null {
    const index = this.prices.findIndex(price => price.id === id);
    if (index === -1) return null;

    this.prices[index] = { 
      ...this.prices[index], 
      ...updates,
      updatedAt: new Date()
    };
    return this.prices[index];
  }

  deletePrice(id: string): boolean {
    const index = this.prices.findIndex(price => price.id === id);
    if (index === -1) return false;

    this.prices.splice(index, 1);
    return true;
  }

  // Get current price for a specific type and species (most recent year)
  getCurrentPrice(type: 'berry' | 'mushroom', species: string): Price | undefined {
    const currentYear = new Date().getFullYear();
    
    // Try current year first
    let price = this.prices.find(p => 
      p.type === type && p.species === species && p.year === currentYear
    );
    
    // If not found, get the most recent year available
    if (!price) {
      const pricesForSpecies = this.prices
        .filter(p => p.type === type && p.species === species)
        .sort((a, b) => b.year - a.year); // Sort by year descending
      
      price = pricesForSpecies[0];
    }
    
    return price;
  }

  // Get all available years for pricing
  getPriceYears(): number[] {
    const years = new Set<number>();
    this.prices.forEach(price => {
      years.add(price.year);
    });
    return Array.from(years).sort((a, b) => b - a); // Most recent first
  }

  // Get price-based profit analysis (not user-specific, based on market prices)
  getPriceProfitAnalysis(typeFilter?: 'berry' | 'mushroom'): Record<number, { revenue: number; cost: number; profit: number; itemCount: number }> {
    let filteredPrices = this.prices;
    
    // Apply type filter if provided
    if (typeFilter) {
      filteredPrices = filteredPrices.filter(price => price.type === typeFilter);
    }
    
    const yearlyData: Record<number, { revenue: number; cost: number; profit: number; itemCount: number }> = {};
    
    filteredPrices.forEach(price => {
      const year = price.year;
      if (!yearlyData[year]) {
        yearlyData[year] = { revenue: 0, cost: 0, profit: 0, itemCount: 0 };
      }
      
      // For price analysis, we calculate theoretical profit per kg
      const profitPerKg = price.sellPrice - price.buyPrice;
      
      // Accumulate data (treating each price entry as representing market data)
      yearlyData[year].revenue += price.sellPrice;
      yearlyData[year].cost += price.buyPrice;
      yearlyData[year].profit += profitPerKg;
      yearlyData[year].itemCount += 1;  // Count of price entries (species/types tracked)
    });
    
    return yearlyData;
  }

  // Get all users' sales data aggregated by year for market analysis
  getAllUsersSalesByYear(typeFilter?: 'berry' | 'mushroom'): { users: Array<{ user: User; salesByYear: Record<number, { revenue: number; cost: number; profit: number; itemCount: number }> }>; totalsByYear: Record<number, { revenue: number; cost: number; profit: number; itemCount: number }> } {
    const users = this.getAllUsers();
    const result = {
      users: [] as Array<{ user: User; salesByYear: Record<number, { revenue: number; cost: number; profit: number; itemCount: number }> }>,
      totalsByYear: {} as Record<number, { revenue: number; cost: number; profit: number; itemCount: number }>
    };

    // Get each user's sales data by year
    users.forEach(user => {
      const userSales = this.getUserProfitByYear(user.id, typeFilter);
      result.users.push({
        user,
        salesByYear: userSales
      });
    });

    // Calculate totals by year across all users
    result.users.forEach(userEntry => {
      Object.entries(userEntry.salesByYear).forEach(([year, data]) => {
        const yearNum = parseInt(year);
        if (!result.totalsByYear[yearNum]) {
          result.totalsByYear[yearNum] = { revenue: 0, cost: 0, profit: 0, itemCount: 0 };
        }
        
        result.totalsByYear[yearNum].revenue += data.revenue;
        result.totalsByYear[yearNum].cost += data.cost;
        result.totalsByYear[yearNum].profit += data.profit;
        result.totalsByYear[yearNum].itemCount += data.itemCount;
      });
    });

    return result;
  }

  // Get available inventory (purchased quantity - sold quantity) for a user
  getAvailableInventory(
    userId: string, 
    typeFilter?: 'berry' | 'mushroom', 
    speciesFilter?: string
  ): Array<{ type: 'berry' | 'mushroom'; species: string; availableQuantity: number; totalPurchased: number; totalSold: number; }> {
    let userItems = this.stockItems.filter(item => item.userId === userId);
    
    // Apply type filter if provided
    if (typeFilter) {
      userItems = userItems.filter(item => item.type === typeFilter);
    }
    
    // Apply species filter if provided
    if (speciesFilter) {
      userItems = userItems.filter(item => item.species === speciesFilter);
    }

    // Group items by type and species
    const inventoryMap = new Map<string, { 
      type: 'berry' | 'mushroom'; 
      species: string; 
      totalPurchased: number; 
      totalSold: number; 
    }>();

    userItems.forEach(item => {
      const key = `${item.type}:${item.species}`;
      
      if (!inventoryMap.has(key)) {
        inventoryMap.set(key, {
          type: item.type,
          species: item.species,
          totalPurchased: 0,
          totalSold: 0
        });
      }
      
      const inventory = inventoryMap.get(key)!;
      
      // If buyPrice > 0 and sellPrice = 0, it's a purchase
      if (item.buyPrice > 0 && item.sellPrice === 0) {
        inventory.totalPurchased += item.quantity;
      }
      // If sellPrice > 0, it's a sale (regardless of buyPrice)
      else if (item.sellPrice > 0) {
        inventory.totalSold += item.quantity;
      }
    });

    // Convert to array and calculate available quantity
    return Array.from(inventoryMap.values()).map(inventory => ({
      ...inventory,
      availableQuantity: inventory.totalPurchased - inventory.totalSold
    }));
  }

  // Data integrity methods
  validateDataIntegrity(): { inconsistentItems: StockItem[]; warnings: string[] } {
    const inconsistentItems: StockItem[] = [];
    const warnings: string[] = [];

    this.stockItems.forEach(item => {
      // Check for items that might be incorrectly categorized
      if (item.sellPrice > 0 && item.buyPrice === 0) {
        inconsistentItems.push(item);
        warnings.push(`Item ${item.id}: Has sellPrice (${item.sellPrice}) but no buyPrice. This might appear in sales when it shouldn't.`);
      }
      
      // Check for items that have both prices but inconsistent calculations
      if (item.sellPrice > 0 && item.buyPrice > 0) {
        const expectedRevenue = (item.quantity * item.sellPrice) / 1000;
        const expectedCost = (item.quantity * item.buyPrice) / 1000;
        const expectedProfit = expectedRevenue - expectedCost;
        
        if (Math.abs(item.totalRevenue - expectedRevenue) > 0.01 ||
            Math.abs(item.totalCost - expectedCost) > 0.01 ||
            Math.abs(item.totalProfit - expectedProfit) > 0.01) {
          inconsistentItems.push(item);
          warnings.push(`Item ${item.id}: Calculated values don't match stored values.`);
        }
      }
    });

    return { inconsistentItems, warnings };
  }
}

export const dataStore = new DataStore();

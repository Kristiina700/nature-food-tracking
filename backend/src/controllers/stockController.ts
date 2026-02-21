import { Request, Response } from 'express';
import { dataStore } from '../models/DataStore';
import { ApiResponse, CreateStockItemRequest } from '../types';

export const createStockItem = (req: Request<{}, ApiResponse<any>, CreateStockItemRequest>, res: Response<ApiResponse<any>>) => {
  try {
    const { userId, type, species, quantity, unitPrice, buyPrice, sellPrice, location, notes } = req.body;

    // Validation - support both old API (unitPrice) and new API (buyPrice + sellPrice)
    if (!userId || !type || !species || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be provided: userId, type, species, quantity'
      });
    }

    // Price validation - need either unitPrice (old API) or sellPrice (new API)
    if (unitPrice === undefined && sellPrice === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Either unitPrice (legacy) or sellPrice must be provided'
      });
    }

    if (!['berry', 'mushroom'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type must be either "berry" or "mushroom"'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be greater than 0'
      });
    }

    // Validate prices
    if (unitPrice !== undefined && unitPrice < 0) {
      return res.status(400).json({
        success: false,
        error: 'Unit price must be greater than or equal to 0'
      });
    }

    if (buyPrice !== undefined && buyPrice < 0) {
      return res.status(400).json({
        success: false,
        error: 'Buy price must be greater than or equal to 0'
      });
    }

    if (sellPrice !== undefined && sellPrice < 0) {
      return res.status(400).json({
        success: false,
        error: 'Sell price must be greater than or equal to 0'
      });
    }

    // Check if user exists
    const user = dataStore.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Handle backward compatibility and defaults
    const finalBuyPrice = buyPrice || 0;
    const finalSellPrice = sellPrice || unitPrice || 0;
    const finalUnitPrice = unitPrice || finalSellPrice;

    // Validation: Ensure we're not creating inconsistent data
    // If this is intended as a sale, both buyPrice and sellPrice should be > 0
    // If this is intended as a legacy collection, unitPrice should be > 0
    if (finalSellPrice > 0 && finalBuyPrice === 0) {
      // This might be legacy data or a potential issue
      // For collections/sales, we expect both buy and sell prices
      console.warn(`Creating item with sellPrice but no buyPrice for user ${userId}. This may be legacy data.`);
    }

    const stockItem = dataStore.createStockItem({
      userId,
      type,
      species: species.trim(),
      quantity,
      unitPrice: finalUnitPrice,
      buyPrice: finalBuyPrice,
      sellPrice: finalSellPrice,
      location: location?.trim() || '',
      notes: notes?.trim()
    });
    
    res.status(201).json({
      success: true,
      data: stockItem,
      message: 'Collecting item created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getStockItems = (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { userId, year } = req.query;
    
    // Require userId parameter to prevent leaking all users' data
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    const yearNum = year && typeof year === 'string' ? parseInt(year, 10) : undefined;
    const stockItems = dataStore.getStockItemsByUserAndYear(userId, yearNum);
    
    res.json({
      success: true,
      data: stockItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getStockItemById = (req: Request<{ id: string }>, res: Response<ApiResponse<any>>) => {
  try {
    const { id } = req.params;
    const stockItem = dataStore.getStockItemById(id);

    if (!stockItem) {
      return res.status(404).json({
        success: false,
        error: 'Collecting item not found'
      });
    }

    res.json({
      success: true,
      data: stockItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const updateStockItem = (req: Request<{ id: string }>, res: Response<ApiResponse<any>>) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const stockItem = dataStore.updateStockItem(id, updates);

    if (!stockItem) {
      return res.status(404).json({
        success: false,
        error: 'Collecting item not found'
      });
    }

    res.json({
      success: true,
      data: stockItem,
      message: 'Collecting item updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const deleteStockItem = (req: Request<{ id: string }>, res: Response<ApiResponse<any>>) => {
  try {
    const { id } = req.params;
    const deleted = dataStore.deleteStockItem(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Collecting item not found'
      });
    }

    res.json({
      success: true,
      message: 'Collecting item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// New endpoints for profit tracking
export const getUserProfitByYear = (req: Request<{ userId: string }>, res: Response<ApiResponse<any>>) => {
  try {
    const { userId } = req.params;
    const { type } = req.query;
    
    // Validate type filter if provided
    let typeFilter: 'berry' | 'mushroom' | undefined = undefined;
    if (type && typeof type === 'string') {
      if (type === 'berry' || type === 'mushroom') {
        typeFilter = type;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Type filter must be either "berry" or "mushroom"'
        });
      }
    }
    
    // Check if user exists
    const user = dataStore.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const yearlyData = dataStore.getUserProfitByYear(userId, typeFilter);
    
    res.json({
      success: true,
      data: yearlyData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getAllYears = (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const years = dataStore.getAllYears();
    
    res.json({
      success: true,
      data: years
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get all users' sales data aggregated by year for market analysis
export const getAllUsersSalesByYear = (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { type } = req.query;
    
    // Validate type filter if provided
    let typeFilter: 'berry' | 'mushroom' | undefined = undefined;
    if (type && typeof type === 'string') {
      if (type === 'berry' || type === 'mushroom') {
        typeFilter = type;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Type filter must be either "berry" or "mushroom"'
        });
      }
    }

    const salesData = dataStore.getAllUsersSalesByYear(typeFilter);
    
    res.json({
      success: true,
      data: salesData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Create buy items (purchases without sales)
export const createBuyItem = (req: Request<{}, ApiResponse<any>, { userId: string; type: 'berry' | 'mushroom'; species: string; quantity: number; buyPrice: number; location?: string; notes?: string; }>, res: Response<ApiResponse<any>>) => {
  try {
    const { userId, type, species, quantity, buyPrice, location, notes } = req.body;

    // Validation
    if (!userId || !type || !species || !quantity || buyPrice === undefined) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be provided: userId, type, species, quantity, buyPrice'
      });
    }

    if (!['berry', 'mushroom'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type must be either "berry" or "mushroom"'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be greater than 0'
      });
    }

    if (buyPrice < 0) {
      return res.status(400).json({
        success: false,
        error: 'Buy price must be greater than or equal to 0'
      });
    }

    // Check if user exists
    const user = dataStore.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Create buy item (purchase only, no sell price)
    const stockItem = dataStore.createStockItem({
      userId,
      type,
      species: species.trim(),
      quantity,
      unitPrice: 0, // No unit price for purchases
      buyPrice,
      sellPrice: 0, // No sell price for purchases
      location: location?.trim() || '',
      notes: notes?.trim()
    });
    
    res.status(201).json({
      success: true,
      data: stockItem,
      message: 'Purchase item created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get buy items for a user
export const getBuyItems = (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { userId, year } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get all stock items for the user
    let stockItems = dataStore.getStockItemsByUser(userId as string);
    
    // Filter for buy items only (sellPrice === 0 and buyPrice > 0)
    const buyItems = stockItems.filter(item => 
      item.sellPrice === 0 && item.buyPrice > 0
    );

    // Filter by year if provided
    let filteredItems = buyItems;
    if (year) {
      const targetYear = parseInt(year as string, 10);
      if (!isNaN(targetYear)) {
        filteredItems = buyItems.filter(item => 
          new Date(item.collectedAt).getFullYear() === targetYear
        );
      }
    }

    // Transform to match the frontend interface
    const transformedItems = filteredItems.map(item => ({
      id: item.id,
      userId: item.userId,
      type: item.type,
      species: item.species,
      quantity: item.quantity,
      buyPrice: item.buyPrice,
      totalCost: item.totalCost,
      location: item.location,
      purchasedAt: item.collectedAt,
      notes: item.notes
    }));
    
    res.json({
      success: true,
      data: transformedItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Delete a buy item
export const deleteBuyItem = (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Buy item ID is required'
      });
    }

    // Check if the item exists and is a buy item
    const item = dataStore.getStockItemById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Buy item not found'
      });
    }

    // Verify it's actually a buy item (sellPrice === 0 and buyPrice > 0)
    if (!(item.sellPrice === 0 && item.buyPrice > 0)) {
      return res.status(400).json({
        success: false,
        error: 'Item is not a buy item'
      });
    }

    // Delete the item
    const deleted = dataStore.deleteStockItem(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Buy item not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Buy item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get available inventory for a user
export const getAvailableInventory = (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { userId } = req.params;
    const { type, species } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Check if user exists
    const user = dataStore.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const inventory = dataStore.getAvailableInventory(
      userId, 
      type as 'berry' | 'mushroom' | undefined, 
      species as string | undefined
    );
    
    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Data integrity endpoint to check for inconsistent items
export const checkDataIntegrity = (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const integrityReport = dataStore.validateDataIntegrity();
    
    res.json({
      success: true,
      data: integrityReport,
      message: `Found ${integrityReport.inconsistentItems.length} inconsistent items`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

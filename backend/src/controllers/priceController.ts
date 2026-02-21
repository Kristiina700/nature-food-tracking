import { Request, Response } from 'express';
import { dataStore } from '../models/DataStore';
import { ApiResponse, CreatePriceRequest, UpdatePriceRequest } from '../types';

export const createPrice = (req: Request<{}, ApiResponse<any>, CreatePriceRequest>, res: Response<ApiResponse<any>>) => {
  try {
    const { type, species, year, buyPrice, sellPrice } = req.body;

    // Validation
    if (!type || !species || !year || buyPrice === undefined || sellPrice === undefined) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be provided: type, species, year, buyPrice, sellPrice'
      });
    }

    if (!['berry', 'mushroom'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type must be either "berry" or "mushroom"'
      });
    }

    if (year < 1900 || year > new Date().getFullYear() + 10) {
      return res.status(400).json({
        success: false,
        error: 'Year must be a valid year'
      });
    }

    if (buyPrice < 0 || sellPrice < 0) {
      return res.status(400).json({
        success: false,
        error: 'Buy price and sell price must be greater than or equal to 0'
      });
    }

    const price = dataStore.createPrice({
      type,
      species: species.trim(),
      year,
      buyPrice,
      sellPrice
    });
    
    res.status(201).json({
      success: true,
      data: price,
      message: 'Price created/updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getAllPrices = (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { year, type, species } = req.query;
    
    let prices;
    if (year && typeof year === 'string') {
      const yearNum = parseInt(year, 10);
      if (isNaN(yearNum)) {
        return res.status(400).json({
          success: false,
          error: 'Year must be a valid number'
        });
      }
      prices = dataStore.getPricesByYear(yearNum);
    } else if (type && species && typeof type === 'string' && typeof species === 'string') {
      if (!['berry', 'mushroom'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Type must be either "berry" or "mushroom"'
        });
      }
      const yearNum = year && typeof year === 'string' ? parseInt(year, 10) : undefined;
      prices = dataStore.getPricesByTypeAndSpecies(type as 'berry' | 'mushroom', species, yearNum);
    } else {
      prices = dataStore.getAllPrices();
    }
    
    res.json({
      success: true,
      data: prices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getPriceById = (req: Request<{ id: string }>, res: Response<ApiResponse<any>>) => {
  try {
    const { id } = req.params;
    const price = dataStore.getPriceById(id);

    if (!price) {
      return res.status(404).json({
        success: false,
        error: 'Price not found'
      });
    }

    res.json({
      success: true,
      data: price
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const updatePrice = (req: Request<{ id: string }, ApiResponse<any>, UpdatePriceRequest>, res: Response<ApiResponse<any>>) => {
  try {
    const { id } = req.params;
    const { buyPrice, sellPrice } = req.body;

    // Validation
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

    if (buyPrice === undefined && sellPrice === undefined) {
      return res.status(400).json({
        success: false,
        error: 'At least one field (buyPrice or sellPrice) must be provided'
      });
    }

    const price = dataStore.updatePrice(id, { buyPrice, sellPrice });

    if (!price) {
      return res.status(404).json({
        success: false,
        error: 'Price not found'
      });
    }

    res.json({
      success: true,
      data: price,
      message: 'Price updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const deletePrice = (req: Request<{ id: string }>, res: Response<ApiResponse<any>>) => {
  try {
    const { id } = req.params;
    const deleted = dataStore.deletePrice(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Price not found'
      });
    }

    res.json({
      success: true,
      message: 'Price deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getCurrentPrice = (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { type, species } = req.query;

    if (!type || !species || typeof type !== 'string' || typeof species !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Both type and species query parameters are required'
      });
    }

    if (!['berry', 'mushroom'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type must be either "berry" or "mushroom"'
      });
    }

    const price = dataStore.getCurrentPrice(type as 'berry' | 'mushroom', species);

    res.json({
      success: true,
      data: price || null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getPriceYears = (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const years = dataStore.getPriceYears();
    
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

export const getPriceProfitAnalysis = (req: Request, res: Response<ApiResponse<any>>) => {
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

    const profitAnalysis = dataStore.getPriceProfitAnalysis(typeFilter);
    
    res.json({
      success: true,
      data: profitAnalysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

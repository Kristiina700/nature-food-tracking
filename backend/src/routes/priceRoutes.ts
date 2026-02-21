import express from 'express';
import { 
  createPrice, 
  getAllPrices, 
  getPriceById, 
  updatePrice, 
  deletePrice, 
  getCurrentPrice,
  getPriceYears,
  getPriceProfitAnalysis
} from '../controllers/priceController';

const router = express.Router();

// Create or update a price
router.post('/', createPrice);

// Get all prices (with optional query filters)
router.get('/', getAllPrices);

// Get current price for a specific type and species
router.get('/current', getCurrentPrice);

// Get all available years for pricing
router.get('/years', getPriceYears);

// Get price-based profit analysis
router.get('/profit-analysis', getPriceProfitAnalysis);

// Get price by ID
router.get('/:id', getPriceById);

// Update price by ID
router.put('/:id', updatePrice);

// Delete price by ID
router.delete('/:id', deletePrice);

export default router;

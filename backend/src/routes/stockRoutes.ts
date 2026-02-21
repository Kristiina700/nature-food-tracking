import { Router } from 'express';
import { 
  createStockItem, 
  getStockItems, 
  getStockItemById, 
  updateStockItem, 
  deleteStockItem,
  getUserProfitByYear,
  getAllYears,
  getAllUsersSalesByYear,
  createBuyItem,
  getAvailableInventory,
  checkDataIntegrity
} from '../controllers/stockController';

const router = Router();

router.post('/', createStockItem); // For sales (existing functionality)
router.post('/buy', createBuyItem); // For buy items
router.get('/', getStockItems);
router.get('/years', getAllYears);
router.get('/profit/:userId', getUserProfitByYear);
router.get('/sales-by-year', getAllUsersSalesByYear);
router.get('/inventory/:userId', getAvailableInventory);
router.get('/data-integrity', checkDataIntegrity); // Check for data inconsistencies
router.get('/:id', getStockItemById);
router.put('/:id', updateStockItem);
router.delete('/:id', deleteStockItem);

export default router;

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import userRoutes from './routes/userRoutes';
import stockRoutes from './routes/stockRoutes';
import priceRoutes from './routes/priceRoutes';
import { errorHandler } from './middleware/errorHandler';
import { createBuyItem, getBuyItems, deleteBuyItem } from './controllers/stockController';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['your-production-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Collecting Stock API is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/users', userRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/prices', priceRoutes);

// Buy items endpoints
app.post('/api/buy-items', createBuyItem);
app.get('/api/buy-items', getBuyItems);
app.delete('/api/buy-items/:id', deleteBuyItem);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌱 Environment: ${process.env.NODE_ENV || 'development'}`);
});

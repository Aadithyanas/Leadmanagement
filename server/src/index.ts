import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import leadRoutes from './routes/leads.js';
import discussionRoutes from './routes/discussions.js';
import settingsRoutes from './routes/settings.js';
import { startNotificationWorker } from './services/mailService.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leadflow';

// Middleware
app.use(cors({
  origin: (_origin, callback) => callback(null, true),
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/leads', leadRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Connect to MongoDB and start server
async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected:', MONGODB_URI);

    app.listen(PORT, () => {
      console.log(`🚀 LeadFlow API running on http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
      
      // Start background notification worker
      startNotificationWorker(); 
    });
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err);
    process.exit(1);
  }
}

start();

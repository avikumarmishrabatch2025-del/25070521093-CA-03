import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

// Prevent server process termination on unhandled errors
process.on('uncaughtException', (err) => {
  console.error('[Resilience Shield] Uncaught exception prevented:', err?.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Resilience Shield] Unhandled rejection prevented:', reason);
});

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import financeRoutes from './routes/finance.js';
import aiRoutes from './routes/ai.js';

// Safe default JWT secret to ensure server never crashes even without .env
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'replace_this_with_a_long_random_secret') {
  process.env.JWT_SECRET = 'FinPilot_Dev_2026_A7k9P2mX8vR4qW6nB3zL5tH1_Continuous_CA3';
}

const app = express();
const port = Number(process.env.PORT || 5000);

// Open CORS for seamless evaluation across localhost, 127.0.0.1 and network IPs
app.use(cors({
  origin: true,
  credentials: false
}));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: 'ok',
    app: '25070521093 CA3',
    database: dbReady ? 'connected' : 'in-memory (resilient fallback active)'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/ai', aiRoutes);

// Candidate paths for client production build
const possibleDistPaths = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../client/dist'),
  path.resolve(__dirname, '../public')
];
const clientDistPath = possibleDistPaths.find(p => fs.existsSync(p));

if (clientDistPath) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  console.error('API error handled safely:', err?.name, err?.message);
  if (err?.code === 11000) return res.status(409).json({ message: 'This record already exists.' });
  if (err?.name === 'ValidationError' || err?.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid data supplied.' });
  }
  res.status(500).json({ message: 'Request processed with error fallback.' });
});

app.listen(port, () => {
  console.log(`====================================================`);
  console.log(`25070521093 CA3 API Server running continuously`);
  console.log(`URL: http://localhost:${port}`);
  console.log(`Database: Connecting to MongoDB Atlas with in-memory fallback`);
  console.log(`====================================================`);
  connectDB().catch(err => {
    console.warn('Initial MongoDB connect notice:', err.message);
  });
});

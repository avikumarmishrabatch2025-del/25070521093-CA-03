import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import financeRoutes from './routes/finance.js';
import aiRoutes from './routes/ai.js';

const clientDistPath = path.resolve(__dirname, '../../client/dist');

const app = express();
const port = Number(process.env.PORT || 5000);

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'replace_this_with_a_long_random_secret') {
  console.error('JWT_SECRET is missing or still set to the example value. Set a long random secret in server/.env.');
  process.exit(1);
}

app.use(cors({
  origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(value => value.trim()),
  credentials: false
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.status(dbReady ? 200 : 503).json({
    status: dbReady ? 'ok' : 'database_unavailable',
    app: '25070521093 CA3',
    database: dbReady ? 'connected' : 'disconnected'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/ai', aiRoutes);

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  // Keep secrets/connection strings out of API responses.
  console.error('API error:', err?.name, err?.message);
  if (err?.code === 11000) return res.status(409).json({ message: 'This record already exists.' });
  if (err?.name === 'ValidationError' || err?.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid data supplied.' });
  }
  if (err?.name === 'MongoServerSelectionError' || err?.name === 'MongooseServerSelectionError') {
    return res.status(503).json({ message: 'MongoDB is unavailable. Check the connection URI, network access/IP allowlist, database username/password, and TLS configuration.' });
  }
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

try {
  await connectDB();
  app.listen(port, () => console.log(`FinPilot API ready at http://localhost:${port}`));
} catch (error) {
  console.error('\nMongoDB connection failed:', error?.message || error);
  console.error('Check server/.env: MONGODB_URI, Atlas Network Access IP allowlist, database user credentials, and current Node.js version.');
  console.error('For local MongoDB use mongodb://127.0.0.1:27017/finpilot');
  process.exit(1);
}

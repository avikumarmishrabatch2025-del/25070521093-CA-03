import mongoose from 'mongoose';

export async function connectDB(retries = 3, delayMs = 2000) {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error('MONGODB_URI is missing. Copy server/.env.example to server/.env and configure MongoDB.');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: Number(process.env.MONGODB_TIMEOUT_MS || 15000),
        connectTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10
      });
      console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
      return;
    } catch (error) {
      if (attempt < retries) {
        console.warn(`MongoDB connection attempt ${attempt} failed (${error.message}). Retrying in ${delayMs / 1000}s...`);
        await new Promise(r => setTimeout(r, delayMs));
      } else {
        throw error;
      }
    }
  }
}

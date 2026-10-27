import mongoose from 'mongoose';

let isConnecting = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) return;
  if (mongoose.connection.readyState === 1 || isConnecting) return;

  isConnecting = true;
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10
    });
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (error) {
    console.warn(`MongoDB connection pending: ${error.message}. Running with in-memory resilient fallback.`);
  } finally {
    isConnecting = false;
  }
}

// Background auto-reconnect: check every 8 seconds
setInterval(() => {
  if (mongoose.connection.readyState !== 1) {
    connectDB().catch(() => {});
  }
}, 8000);

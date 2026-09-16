import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/etf-crypto";

function sanitizeMongoUri(uri) {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
}

export async function connectDB() {
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not set. Set it to your local MongoDB URI or a remote Atlas connection string.");
    return null;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    });
    console.log(`✅ MongoDB connected successfully to ${sanitizeMongoUri(MONGODB_URI)}`);
    return mongoose.connection;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    return null;
  }
}

export function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

export function getDatabaseStatus() {
  return {
    ready: isDatabaseReady(),
    state: mongoose.connection.readyState,
  };
}

export function disconnectDB() {
  return mongoose.disconnect();
}

export default mongoose.connection;

import mongoose from 'mongoose';
import { env } from './env';

export const connectDatabase = async (uri?: string): Promise<typeof mongoose> => {
  const mongoUri = uri || env.MONGODB_URI;
  try {
    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true
    });
    if (env.NODE_ENV !== 'test') {
      console.log(`✅ MongoDB connected successfully to ${conn.connection.host}/${conn.connection.name}`);
    }
    return conn;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    if (env.NODE_ENV !== 'test') {
      console.log('🔌 MongoDB disconnected');
    }
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
    throw error;
  }
};

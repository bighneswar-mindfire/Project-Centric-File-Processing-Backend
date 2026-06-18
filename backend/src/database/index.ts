/* eslint-disable no-console */
import mongoose from 'mongoose';

export const connectDatabase = async (uri: string): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    console.log('MongoDB is already connected (reusing active connection).');
    return;
  }

  if (mongoose.connection.readyState === 2) {
    console.log('MongoDB connection is currently in progress...');
    return;
  }

  try {
    await mongoose.connect(uri, {
      autoIndex: true,
    });
    console.log('Successfully established MongoDB connection.');
  } catch (error) {
    console.error('Critical: Failed to connect to MongoDB:', error);

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
};

/* eslint-disable no-console */
import express from 'express';
import mongoose from 'mongoose';
import { connectDatabase } from './database/index.js';
import projectRoutes from './routes/projectRoutes.js';

const app = express();
app.use(express.json());

app.use('/api', projectRoutes);

app.get('/api/health', (req, res) => {
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  const dbState = states[mongoose.connection.readyState] || 'Unknown';

  res.json({
    status: 'ONLINE',
    timestamp: new Date().toISOString(),
    database: {
      status: dbState,
      readyState: mongoose.connection.readyState,
    },
  });
});

const PORT = process.env.PORT || 3000;

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/project_centric_file_processor';

if (process.env.NODE_ENV === 'production') {
  connectDatabase(MONGO_URI).then(() => {
    app.listen(PORT, () => {
      console.log(`Production server running on port ${PORT}`);
    });
  });
} else {
  connectDatabase(MONGO_URI);
}

export const viteNodeApp = app;

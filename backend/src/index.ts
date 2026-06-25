/* eslint-disable no-console */
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import { connectDatabase } from './database/index.js';
import projectRoutes from './routes/projectRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import authRoutes from './routes/authRoutes.js';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(express.json());

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: ALLOWED_ORIGIN, credentials: true }));

app.use('/api', authRoutes);

app.use('/api', projectRoutes);

app.use('/api', fileRoutes);

app.use('/api', jobRoutes);

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

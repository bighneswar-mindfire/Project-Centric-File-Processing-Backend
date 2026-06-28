/* eslint-disable no-console */
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import { connectDatabase } from './database/index.js';
import projectRoutes from './routes/projectRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import authRoutes from './routes/authRoutes.js';
import multer from 'multer';
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

app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File size too large. Limit is 100MB.' });
      return;
    }
    res.status(400).json({ error: `Upload error: ${err.message}` });
    return;
  }

  if (err instanceof Error) {
    res.status(400).json({ error: err.message });
    return;
  }

  next();
});

const PORT = process.env.PORT;

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/project_centric_file_processor';

if (process.env.NODE_ENV === 'production') {
  connectDatabase(MONGO_URI).then(() => {
    app.listen(PORT, () => {
      console.log(`Production server running on port ${PORT}`);
    });
  });
} else if (process.env.NODE_ENV !== 'test') {
  connectDatabase(MONGO_URI);
}

export const viteNodeApp = app;

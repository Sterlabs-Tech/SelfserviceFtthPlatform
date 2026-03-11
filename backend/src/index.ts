import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

import apiRoutes from './routes/api';

// Main health-check / startup endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Platform is online', phase: 'MVP' });
});

app.use('/api', apiRoutes);

// Start server
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

connectDB();

const app = express();

// Middleware to parse JSON and handle cross-origin requests
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(cors());
app.use('/api/users/register', userRoutes);
app.use('/api/users/login', userRoutes);
app.use('/api/tasks', taskRoutes);

// Basic health check route
app.get('/', (req, res) => {
  res.send('Cognify API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
});
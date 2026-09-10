import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/db.js';
import authRoutes from './routes/auth.js';
import burnoutRoutes from './routes/burnout.js';
import taskRoutes from './routes/tasks.js';
import journalRoutes from './routes/journals.js';
import interventionRoutes from './routes/interventions.js';
import settingsRoutes from './routes/settings.js';

const app = express();
const allowedOrigins = new Set((process.env.FRONTEND_ORIGINS || 'http://127.0.0.1:5174,http://localhost:5174').split(',').map(value => value.trim()).filter(Boolean));
app.use(cors({ origin(origin, callback) { if (!origin || allowedOrigins.has(origin)) return callback(null, true); return callback(new Error('Origin not allowed by CORS')); } }));
app.use(express.json({ limit: '1mb' }));
const authAttempts = new Map();
app.use('/api/auth', (req, res, next) => {
  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  const recent = (authAttempts.get(key) || []).filter(timestamp => now - timestamp < 15 * 60 * 1000);
  if (recent.length >= 10) return res.status(429).json({ message: 'Too many authentication attempts. Try again later.' });
  recent.push(now); authAttempts.set(key, recent); next();
});
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'cognify-backend' }));
app.use('/api/auth', authRoutes); app.use('/api/burnout', burnoutRoutes); app.use('/api/tasks', taskRoutes); app.use('/api/journal', journalRoutes); app.use('/api/interventions', interventionRoutes); app.use('/api/settings', settingsRoutes);
app.use((error, req, res, next) => { console.error(error); res.status(500).json({ message: 'Internal server error' }); });
const port = Number(process.env.PORT || 5001);
connectDatabase().then(() => app.listen(port, () => console.log(`Cognify backend listening on ${port}`))).catch(error => { console.error(`MongoDB startup failed: ${error.message}`); process.exit(1); });

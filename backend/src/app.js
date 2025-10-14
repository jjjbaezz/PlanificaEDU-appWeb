import express from 'express';
import cors from 'cors';
import { errorHandler } from './errorHandler.js';
import { connectDB, supabase } from './db.js';

const app = express();
const parseOrigins = (origs) =>
  (origs || '').split(',').map(s => s.trim()).filter(Boolean);

const allowedOrigins = parseOrigins(process.env.ALLOWED_ORIGINS);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Origen no permitido por CORS: ${origin}`), false);
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json());

app.get('/health/db', async (req, res, next) => {
  try {
    await connectDB();
    res.json({ ok: true, driver: 'supabase' });
  } catch (err) {
    next(err);
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.use(errorHandler);

export default app;

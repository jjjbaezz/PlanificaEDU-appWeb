import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import passport from 'passport';
import './config/passport.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import professorRoutes from './routes/professor.routes.js';
import subjectsRoutes from './routes/subjects.routes.js';
import buildingsRoutes from './routes/buildings.routes.js';
import careerRoutes from './routes/career.routes.js';
import studentsRoutes from './routes/students.routes.js';
import timeBlocksRoutes from './routes/timeBlocks.routes.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(morgan('dev'));

const allowed = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowed.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(passport.initialize());

app.get('/health', (_, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/professors', professorRoutes);
app.use('/subjects', subjectsRoutes);
app.use('/buildings', buildingsRoutes);
app.use('/careers', careerRoutes);
app.use('/students', studentsRoutes);
app.use('/time-blocks', timeBlocksRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import passport from 'passport';
import './config/passport.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import subjectRoutes from './routes/subject.routes.js';
import careerRoutes  from './routes/career.routes.js';
import classrooomRoutes from './routes/classroom.routes.js';
import buildingRoutes from './routes/building.routes.js';
import periodRoutes from './routes/period.routes.js';
import scheduleRoutes from './routes/schedule.routes.js';







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
app.use('/subjects', subjectRoutes);
app.use('/classrooms', classrooomRoutes);
app.use('/careers', careerRoutes);
app.use('/buildings', buildingRoutes);
app.use('/periods', periodRoutes);
app.use('/schedules', scheduleRoutes);




const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));

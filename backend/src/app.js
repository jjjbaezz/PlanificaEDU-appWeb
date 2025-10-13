import express from 'express';
import cors from 'cors';
import { errorHandler } from './errorHandler.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use(errorHandler); 
export default app;

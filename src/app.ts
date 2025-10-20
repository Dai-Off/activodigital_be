import dotenv from 'dotenv';

// IMPORTANTE: Cargar variables de entorno ANTES de cualquier otra cosa
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes';

const app = express();

// Global middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/', routes);

export default app;



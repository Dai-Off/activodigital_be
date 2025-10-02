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
app.use('/api', routes);

export default app;



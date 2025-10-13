import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import app from './app';

dotenv.config();
const port: number = Number(process.env.PORT) || 3000;

// Routes were moved to app.ts via routes/index

// Manejo de errores
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // Prefer console.error, avoids leaking internals to clients
  // In production consider structured logging
  // eslint-disable-next-line no-console
  console.error(err.stack);
  res.status(500).json({ error: '¡Algo salió mal en el servidor!' });
});

// Iniciar el servidor
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Servidor corriendo en http://localhost:${port}`);
  console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`🎯 FRONTEND_URL: ${process.env.FRONTEND_URL || 'NO CONFIGURADO'}`);
});

export default app;



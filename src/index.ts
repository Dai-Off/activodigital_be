import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import app from "./app";

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
  res.status(500).json({ error: "¡Algo salió mal en el servidor!" });
});

// Iniciar el servidor
import http from "http";
import { SocketService } from "./services/socketService";

// ... (imports)

// Crear servidor HTTP explícito para poder adjuntar Socket.io
const server = http.createServer(app);

// Inicializar Socket.io
SocketService.getInstance().initialize(server);

// Inicializar cronjob de alertas de documentos próximos a vencer
import { getDocumentExpirationCronJob } from "./services/documentExpirationCronJob";
const documentExpirationCronJob = getDocumentExpirationCronJob();
documentExpirationCronJob.start();

// Inicializar cronjob de Idealista (1ro de cada mes)
import { getIdealistaCronJob } from "./services/idealistaCronJob";
const idealistaCronJob = getIdealistaCronJob();
idealistaCronJob.start();

// Iniciar workers de cola (Redis/BullMQ). Si Redis no está, solo se registra un aviso.
import { startInvoiceProcessingWorker } from "./services/invoiceProcessingQueue";
import { startCertificateProcessingWorker } from "./services/certificateProcessingQueue";
try {
  startInvoiceProcessingWorker();
} catch (e) {
  console.warn("[InvoiceQueue] No se pudo iniciar el worker de facturas (¿Redis configurado? REDIS_URL):", (e as Error).message);
}
try {
  startCertificateProcessingWorker();
} catch (e) {
  console.warn("[CertificateQueue] No se pudo iniciar el worker de certificados (¿Redis configurado? REDIS_URL):", (e as Error).message);
}

// Iniciar el servidor
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Servidor corriendo en http://localhost:${port}`);
  console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(
    `🎯 FRONTEND_URL: ${process.env.FRONTEND_URL || "NO CONFIGURADO"}`
  );
});

export default app;

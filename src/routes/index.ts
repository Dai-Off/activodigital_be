import { Router } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import edificiosRouter from "./edificios";
import librosDigitalesRouter from "./librosDigitales";
import usersRouter from "./users";
import trazabilityRouter from "./trazability";
import invitationsRouter from "./invitations";
import certificatesEnergeticosRouter from "./certificadosEnergeticos";
import esgRouter from "./esg";
import dashboardRouter from "./dashboard";
import notificationsRouter from "./notifications";
import financialSnapshotsRouter from "./financialSnapshots";
import catastroApi from "./catastroApi";
const router = Router();

router.get("/", (_req, res) => {
  res.json({ message: "¡Bienvenido a la API de Activo Digital Backend!" });
});

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/trazability", trazabilityRouter);
router.use("/edificios", edificiosRouter);
router.use("/libros-digitales", librosDigitalesRouter);
router.use("/invitations", invitationsRouter);
router.use("/certificados-energeticos", certificatesEnergeticosRouter);
router.use("/esg", esgRouter);
router.use("/dashboard", dashboardRouter);
router.use("/notifications", notificationsRouter);
router.use("/financial-snapshots", financialSnapshotsRouter);
router.use("/catastroApi", catastroApi);

export default router;

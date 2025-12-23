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
import monthlyCostsRouter from "./monthlyCosts";
import serviceInvoicesRouter from "./serviceInvoices";
import rentsRouter from "./rents";
import catastroApi from "./catastroApi";
import PVGISApi from "./PVGISApi";
import MITECOApi from "./MITECOApi";
import insurance from "./insurance";
import calendar from "./calendar";
import idealistaScraper from "./idealistaScraper";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ message: "¡Bienvenido a la API de Activo Digital Backend!" });
});

// ! no necesita
router.use("/health", healthRouter);
// ! no necesita
router.use("/auth", authRouter);
// *?completo
router.use("/users", usersRouter);
//TODO modulo
router.use("/trazability", trazabilityRouter);
// *? completo
router.use("/edificios", edificiosRouter);
// ? completo 
router.use("/libros-digitales", librosDigitalesRouter);
// ? completa
router.use("/invitations", invitationsRouter);
// ? completa
router.use("/certificados-energeticos", certificatesEnergeticosRouter);
// !no necesita
router.use("/esg", esgRouter);
// ! no necesita
router.use("/dashboard", dashboardRouter);
// !no necesita
router.use("/notifications", notificationsRouter);
// ? necesita
router.use("/financial-snapshots", financialSnapshotsRouter);
// !no necesita
router.use("/service-expenses", monthlyCostsRouter);
// ? necesita
router.use("/service-invoices", serviceInvoicesRouter);
// ? necesita
router.use("/rents", rentsRouter);
// ! no necesita
router.use("/catastroApi", catastroApi);
// !no necesita
router.use("/PVGISApi", PVGISApi);
// !no necesita
router.use("/MITECOApi", MITECOApi);
// ? necesita
router.use("/insurances", insurance);
// ? necesita
router.use("/calendar", calendar);
// !no necesita
router.use("/idealistascraper", idealistaScraper);


export default router;

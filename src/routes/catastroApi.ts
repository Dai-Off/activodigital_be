import { Router } from "express";
import {
  getMunicipios,
  getAllProvincias,
  getVias,
  getInmuebleRc,
  getInmuebleLoc,
  getInmuebleXY,
} from "../web/controllers/catastroApiController";
import { requestLogger } from "../web/middlewares/requestLogger";
import { requireAuth } from "../web/middlewares/authMiddleware";

const router = Router();
router.use(requireAuth)
router.use(requestLogger)
router.get("/provincias", getAllProvincias);
router.get("/municipios", getMunicipios);
router.get("/vias", getVias);
router.get("/inmuebleLoc", getInmuebleLoc);
router.get("/inmuebleRc", getInmuebleRc);
router.get("/inmuebleXY", getInmuebleXY);

export default router;

import { Router } from "express";
import {
  getMunicipios,
  getAllProvincias,
  getVias,
  getInmuebleRc,
  getInmuebleLoc,
  getInmuebleXY,
} from "../web/controllers/catastroApiController";

const router = Router();

router.get("/provincias", getAllProvincias);
router.get("/municipios", getMunicipios);
router.get("/vias", getVias);
router.get("/inmuebleLoc", getInmuebleLoc);
router.get("/inmuebleRc", getInmuebleRc);
router.get("/inmuebleXY", getInmuebleXY);

export default router;

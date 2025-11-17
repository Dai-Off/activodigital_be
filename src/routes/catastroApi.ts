import { Router } from "express";
import {
  getMunicipios,
  getAllProvincias,
  getVias,
} from "../web/controllers/catastroApiController";

const router = Router();

router.get("/provincias", getAllProvincias);
router.get("/municipios", getMunicipios);
router.get("/vias", getVias);
router.get("/inmuebleLoc");
router.get("/inmuebleRc");

export default router;

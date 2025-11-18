"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const catastroApiController_1 = require("../web/controllers/catastroApiController");
const router = (0, express_1.Router)();
router.get("/provincias", catastroApiController_1.getAllProvincias);
router.get("/municipios", catastroApiController_1.getMunicipios);
router.get("/vias", catastroApiController_1.getVias);
router.get("/inmuebleLoc", catastroApiController_1.getInmuebleLoc);
router.get("/inmuebleRc", catastroApiController_1.getInmuebleRc);
router.get("/inmuebleXY", catastroApiController_1.getInmuebleXY);
exports.default = router;
//# sourceMappingURL=catastroApi.js.map
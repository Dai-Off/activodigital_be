"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const catastroApiController_1 = require("../web/controllers/catastroApiController");
const router = (0, express_1.Router)();
router.get("/provincias", catastroApiController_1.getAllProvincias);
router.get("/municipios", catastroApiController_1.getMunicipios);
router.get("/vias", catastroApiController_1.getVias);
router.get("/inmuebleLoc");
router.get("/inmuebleRc");
exports.default = router;
//# sourceMappingURL=catastroApi.js.map
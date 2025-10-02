"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_1 = __importDefault(require("./health"));
const auth_1 = __importDefault(require("./auth"));
const edificios_1 = __importDefault(require("./edificios"));
const librosDigitales_1 = __importDefault(require("./librosDigitales"));
const users_1 = __importDefault(require("./users"));
const invitations_1 = __importDefault(require("./invitations"));
const certificadosEnergeticos_1 = __importDefault(require("./certificadosEnergeticos"));
const router = (0, express_1.Router)();
router.get('/', (_req, res) => {
    res.json({ message: '¡Bienvenido a la API de Activo Digital Backend!' });
});
router.use('/health', health_1.default);
router.use('/auth', auth_1.default);
router.use('/users', users_1.default);
router.use('/edificios', edificios_1.default);
router.use('/libros-digitales', librosDigitales_1.default);
router.use('/invitations', invitations_1.default);
router.use('/certificados-energeticos', certificadosEnergeticos_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map
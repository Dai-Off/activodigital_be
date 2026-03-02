"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const dataRoomLabels_1 = require("../utils/dataRoomLabels");
(0, vitest_1.describe)('getDataRoomLabel Utility', () => {
    (0, vitest_1.it)('should return the correct label for a valid checklist_id', () => {
        (0, vitest_1.expect)((0, dataRoomLabels_1.getDataRoomLabel)('escritura_de_constitucion_de_la_sociedad')).toBe('Escritura de constitución de la sociedad');
    });
    (0, vitest_1.it)('should return a fallback label for an unknown checklist_id', () => {
        (0, vitest_1.expect)((0, dataRoomLabels_1.getDataRoomLabel)('unknown_id')).toBe('Documento del Data Room');
    });
    (0, vitest_1.it)('should handle numeric suffixes correctly', () => {
        (0, vitest_1.expect)((0, dataRoomLabels_1.getDataRoomLabel)('escritura_de_constitucion_de_la_sociedad_1')).toBe('Escritura de constitución de la sociedad');
    });
    (0, vitest_1.it)('should return the correct label for a newly added ID', () => {
        (0, vitest_1.expect)((0, dataRoomLabels_1.getDataRoomLabel)('plan_de_verificacion_postdesembolso')).toBe('Plan de verificación post-desembolso');
    });
});
//# sourceMappingURL=dataRoomLabels.test.js.map
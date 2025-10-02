"use strict";
// Tipos para Certificados Energéticos
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIExtractionStatus = exports.EnergyRatingLetter = exports.EnergyCertificateKind = void 0;
var EnergyCertificateKind;
(function (EnergyCertificateKind) {
    EnergyCertificateKind["BUILDING"] = "building";
    EnergyCertificateKind["DWELLING"] = "dwelling";
    EnergyCertificateKind["COMMERCIAL_UNIT"] = "commercial_unit";
})(EnergyCertificateKind || (exports.EnergyCertificateKind = EnergyCertificateKind = {}));
var EnergyRatingLetter;
(function (EnergyRatingLetter) {
    EnergyRatingLetter["A"] = "A";
    EnergyRatingLetter["B"] = "B";
    EnergyRatingLetter["C"] = "C";
    EnergyRatingLetter["D"] = "D";
    EnergyRatingLetter["E"] = "E";
    EnergyRatingLetter["F"] = "F";
    EnergyRatingLetter["G"] = "G";
    EnergyRatingLetter["ND"] = "ND";
})(EnergyRatingLetter || (exports.EnergyRatingLetter = EnergyRatingLetter = {}));
var AIExtractionStatus;
(function (AIExtractionStatus) {
    AIExtractionStatus["UPLOADED"] = "uploaded";
    AIExtractionStatus["PROCESSING"] = "processing";
    AIExtractionStatus["EXTRACTED"] = "extracted";
    AIExtractionStatus["REVIEWED"] = "reviewed";
    AIExtractionStatus["CONFIRMED"] = "confirmed";
    AIExtractionStatus["FAILED"] = "failed";
})(AIExtractionStatus || (exports.AIExtractionStatus = AIExtractionStatus = {}));
//# sourceMappingURL=certificateEnergetico.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SectionType = exports.BookStatus = exports.BookSource = exports.LibroDigitalSectionType = exports.LibroDigitalEstado = void 0;
// Estado del libro digital
var LibroDigitalEstado;
(function (LibroDigitalEstado) {
    LibroDigitalEstado["EN_BORRADOR"] = "en_borrador";
    LibroDigitalEstado["VALIDADO"] = "validado";
    LibroDigitalEstado["PUBLICADO"] = "publicado";
})(LibroDigitalEstado || (exports.LibroDigitalEstado = LibroDigitalEstado = {}));
// Tipos de secciones principales
var LibroDigitalSectionType;
(function (LibroDigitalSectionType) {
    LibroDigitalSectionType["DATOS_GENERALES"] = "datos_generales";
    LibroDigitalSectionType["AGENTES_INTERVINIENTES"] = "agentes_intervinientes";
    LibroDigitalSectionType["PROYECTO_TECNICO"] = "proyecto_tecnico";
    LibroDigitalSectionType["DOCUMENTACION_ADMINISTRATIVA"] = "documentacion_administrativa";
    LibroDigitalSectionType["MANUAL_USO_MANTENIMIENTO"] = "manual_uso_mantenimiento";
    LibroDigitalSectionType["REGISTRO_INCIDENCIAS_ACTUACIONES"] = "registro_incidencias_actuaciones";
    LibroDigitalSectionType["CERTIFICADOS_GARANTIAS"] = "certificados_garantias";
    LibroDigitalSectionType["ANEXOS_PLANOS"] = "anexos_planos";
})(LibroDigitalSectionType || (exports.LibroDigitalSectionType = LibroDigitalSectionType = {}));
// LEGACY TYPES (compatibilidad temporal con servicio/controlador actuales)
// Eliminar cuando se refactorice el servicio a `LibroDigital*`
var BookSource;
(function (BookSource) {
    BookSource["MANUAL"] = "manual";
    BookSource["PDF"] = "pdf";
})(BookSource || (exports.BookSource = BookSource = {}));
var BookStatus;
(function (BookStatus) {
    BookStatus["DRAFT"] = "draft";
    BookStatus["IN_PROGRESS"] = "in_progress";
    BookStatus["COMPLETE"] = "complete";
})(BookStatus || (exports.BookStatus = BookStatus = {}));
var SectionType;
(function (SectionType) {
    SectionType["GENERAL_DATA"] = "general_data";
    SectionType["CONSTRUCTION_FEATURES"] = "construction_features";
    SectionType["CERTIFICATES_AND_LICENSES"] = "certificates_and_licenses";
    SectionType["MAINTENANCE_AND_CONSERVATION"] = "maintenance_and_conservation";
    SectionType["FACILITIES_AND_CONSUMPTION"] = "facilities_and_consumption";
    SectionType["RENOVATIONS_AND_REHABILITATIONS"] = "renovations_and_rehabilitations";
    SectionType["SUSTAINABILITY_AND_ESG"] = "sustainability_and_esg";
    SectionType["ANNEX_DOCUMENTS"] = "annex_documents";
})(SectionType || (exports.SectionType = SectionType = {}));
//# sourceMappingURL=libroDigital.js.map
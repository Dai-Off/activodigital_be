"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleValues = exports.ActionsValues = void 0;
// * INTEGRACIONES EN LOS SERVICIOS DE LA APP
/*
    !IMPLEMENTACIÓN RÁPIDA

    ? DECLARACIÓN.
    private trazabilityService = new TrazabilityService()

    ? MÉTODO DENTRO DEL SERVICIO.
    async insertTrazability(data: TrazabilityServiceParams) {
        await this.trazabilityService.registerTrazability(data);
    }
*/
// acciones que se van a hacer sobre los modulos, esto con el fin de facilitar los iconos
// ! NOTA. Añade en front también el icono de la actividad.
var ActionsValues;
(function (ActionsValues) {
    ActionsValues["CREAR"] = "CREAR";
    ActionsValues["ACTUALIZAR O MODIFICAR DOCUMENTOS"] = "ACTUALIZAR O MODIFICAR DOCUMENTOS";
    ActionsValues["ELIMINAR"] = "ELIMINAR";
    ActionsValues["APROBAR"] = "APROBAR";
    ActionsValues["RECHAZAR"] = "RECHAZAR";
    ActionsValues["COMPLETAR MANTENIMIENTO"] = "COMPLETAR MANTENIMIENTO";
    ActionsValues["SUBIR DOCUMENTOS"] = "SUBIR DOCUMENTOS";
    ActionsValues["GENERAR INFORMES"] = "GENERAR INFORMES";
    ActionsValues["PROGRAMAR EVENTOS"] = "PROGRAMAR EVENTOS";
    ActionsValues["ALERTAS"] = "ALERTAS";
    ActionsValues["ACTUALIZAR LIBRE DEL EDIFICIO"] = "ACTUALIZAR LIBRE DEL EDIFICIO";
    ActionsValues["APROBAR PRESUPUESTO"] = "APROBAR PRESUPUESTO";
    ActionsValues["ACTUALIZAR DATOS FINANCIEROS"] = "ACTUALIZAR DATOS FINANCIEROS";
    ActionsValues["COMPLETAR INSPECCION ELECTRICA"] = "COMPLETAR INSPECCION ELECTRICA";
})(ActionsValues || (exports.ActionsValues = ActionsValues = {}));
// Módulos que se le pueden asignar a la trazabilidad
var ModuleValues;
(function (ModuleValues) {
    ModuleValues["ELECTRICIDAD"] = "ELECTRICIDAD";
    ModuleValues["FINANZAS"] = "FINANZAS";
    ModuleValues["DOCUMENTOS"] = "DOCUMENTOS";
    ModuleValues["ALERTAS"] = "ALERTAS";
    ModuleValues["LIBRO-DIGITAL"] = "LIBRO-DIGITAL";
    ModuleValues["CALENDARIO"] = "CALENDARIO";
    ModuleValues["INFORME"] = "INFORME";
    ModuleValues["USUARIOS"] = "USUARIOS";
    ModuleValues["UBICACIONES"] = "UBICACIONES";
})(ModuleValues || (exports.ModuleValues = ModuleValues = {}));
//# sourceMappingURL=interfaceTrazability.js.map
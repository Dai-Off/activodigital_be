"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentController = void 0;
const rentService_1 = require("../../domain/services/rentService");
const TrazabilityService_1 = require("../../domain/trazability/TrazabilityService");
const interfaceTrazability_1 = require("../../domain/trazability/interfaceTrazability");
class RentController {
    constructor() {
        // ========== FACTURAS (con pago incluido) ==========
        this.createRentInvoice = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const data = req.body;
                if (!data.buildingId || !data.unitId || !data.invoiceMonth || !data.dueDate) {
                    res.status(400).json({ error: 'Faltan campos requeridos' });
                    return;
                }
                const invoice = await this.getService().createRentInvoice(data, userId);
                TrazabilityService_1.trazabilityService.registerTrazability({ authUserId: userId, buildingId: data?.buildingId, action: interfaceTrazability_1.ActionsValues['CREAR'], module: interfaceTrazability_1.ModuleValues.DOCUMENTOS, description: "Subir factura de Renta" }).catch(err => console.error("Fallo trazabilidad:", err));
                res.status(201).json({ data: invoice });
            }
            catch (error) {
                console.error('Error al crear factura:', error);
                res.status(500).json({ error: error.message || 'Error interno del servidor' });
            }
        };
        this.getRentInvoicesByBuilding = async (req, res) => {
            try {
                const userId = req.user?.id;
                const { buildingId } = req.params;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                if (!buildingId) {
                    res.status(400).json({ error: 'buildingId es requerido' });
                    return;
                }
                const invoices = await this.getService().getRentInvoicesByBuilding(buildingId, userId);
                res.json({ data: invoices });
            }
            catch (error) {
                console.error('Error al obtener facturas:', error);
                res.status(500).json({ error: error.message || 'Error interno del servidor' });
            }
        };
        this.getRentInvoicesByMonth = async (req, res) => {
            try {
                const userId = req.user?.id;
                const { buildingId, month } = req.params;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                if (!buildingId || !month) {
                    res.status(400).json({ error: 'buildingId y month son requeridos' });
                    return;
                }
                // Validar formato de mes (YYYY-MM)
                if (!/^\d{4}-\d{2}$/.test(month)) {
                    res.status(400).json({ error: 'Formato de mes inválido. Debe ser YYYY-MM' });
                    return;
                }
                const invoices = await this.getService().getRentInvoicesByMonth(buildingId, month, userId);
                res.json({ data: invoices });
            }
            catch (error) {
                console.error('Error al obtener facturas del mes:', error);
                res.status(500).json({ error: error.message || 'Error interno del servidor' });
            }
        };
        this.getRentInvoice = async (req, res) => {
            try {
                const userId = req.user?.id;
                const { id } = req.params;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const invoice = await this.getService().getRentInvoiceById(id, userId);
                if (!invoice) {
                    res.status(404).json({ error: 'Factura no encontrada' });
                    return;
                }
                res.json({ data: invoice });
            }
            catch (error) {
                console.error('Error al obtener factura:', error);
                res.status(500).json({ error: error.message || 'Error interno del servidor' });
            }
        };
        this.updateRentInvoice = async (req, res) => {
            try {
                const userId = req.user?.id;
                const { id } = req.params;
                const data = req.body;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const invoice = await this.getService().updateRentInvoice(id, data, userId);
                if (!invoice) {
                    res.status(404).json({ error: 'Factura no encontrada' });
                    return;
                }
                TrazabilityService_1.trazabilityService.registerTrazability({ authUserId: userId, buildingId: invoice?.buildingId, action: interfaceTrazability_1.ActionsValues['ACTUALIZAR DATOS FINANCIEROS'], module: interfaceTrazability_1.ModuleValues.DOCUMENTOS, description: "Actualizar factura de Renta" }).catch(err => console.error("Fallo trazabilidad:", err));
                res.json({ data: invoice });
            }
            catch (error) {
                console.error('Error al actualizar factura:', error);
                res.status(500).json({ error: error.message || 'Error interno del servidor' });
            }
        };
        this.deleteRentInvoice = async (req, res) => {
            try {
                const userId = req.user?.id;
                const { id } = req.params;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                await this.getService().deleteRentInvoice(id, userId);
                const invoice = await this.getService().getRentInvoiceById(id, userId);
                TrazabilityService_1.trazabilityService.registerTrazability({ authUserId: userId, buildingId: invoice?.buildingId || null, action: interfaceTrazability_1.ActionsValues['ELIMINAR'], module: interfaceTrazability_1.ModuleValues.DOCUMENTOS, description: "Eliminar factura de Renta" }).catch(err => console.error("Fallo trazabilidad:", err));
                res.status(200).json({ message: 'Factura eliminada correctamente' });
            }
            catch (error) {
                console.error('Error al eliminar factura:', error);
                res.status(500).json({ error: error.message || 'Error interno del servidor' });
            }
        };
        // ========== RESUMEN MENSUAL ==========
        this.getMonthlyRentSummary = async (req, res) => {
            try {
                const userId = req.user?.id;
                const { buildingId, month } = req.params;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                if (!buildingId || !month) {
                    res.status(400).json({ error: 'buildingId y month son requeridos' });
                    return;
                }
                // Validar formato de mes (YYYY-MM)
                if (!/^\d{4}-\d{2}$/.test(month)) {
                    res.status(400).json({ error: 'Formato de mes inválido. Debe ser YYYY-MM' });
                    return;
                }
                const summary = await this.getService().getMonthlyRentSummary(buildingId, month, userId);
                res.json({ data: summary });
            }
            catch (error) {
                console.error('Error al obtener resumen mensual:', error);
                res.status(500).json({ error: error.message || 'Error interno del servidor' });
            }
        };
    }
    getService() {
        return new rentService_1.RentService();
    }
}
exports.RentController = RentController;
//# sourceMappingURL=rentController.js.map
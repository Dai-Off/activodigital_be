"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceInvoiceController = void 0;
const serviceInvoiceService_1 = require("../../domain/services/serviceInvoiceService");
const TrazabilityService_1 = require("../../domain/trazability/TrazabilityService");
const interfaceTrazability_1 = require("../../domain/trazability/interfaceTrazability");
class ServiceInvoiceController {
    constructor() {
        this.createServiceInvoice = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const data = req.body;
                // Validación básica
                if (!data.building_id || !data.service_type || !data.invoice_date || data.amount_eur === undefined) {
                    res.status(400).json({ error: 'Faltan campos requeridos: building_id, service_type, invoice_date, amount_eur' });
                    return;
                }
                // Validar service_type
                const validServiceTypes = ['electricity', 'water', 'gas', 'ibi', 'waste'];
                if (!validServiceTypes.includes(data.service_type)) {
                    res.status(400).json({ error: `service_type debe ser uno de: ${validServiceTypes.join(', ')}` });
                    return;
                }
                // Validar amount_eur
                if (data.amount_eur < 0) {
                    res.status(400).json({ error: 'amount_eur debe ser >= 0' });
                    return;
                }
                TrazabilityService_1.trazabilityService.registerTrazability({ authUserId: userId, buildingId: data?.building_id, action: interfaceTrazability_1.ActionsValues['CREAR'], module: interfaceTrazability_1.ModuleValues.DOCUMENTOS, description: "Crear factura de servicios" }).catch(err => console.error("Fallo trazabilidad:", err));
                const invoice = await this.getService().createServiceInvoice(data, userId);
                res.status(201).json({ data: invoice });
            }
            catch (error) {
                console.error('Error al crear factura de servicio:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
        this.getServiceInvoices = async (req, res) => {
            try {
                const userId = req.user?.id;
                const { buildingId } = req.params;
                const serviceType = req.query.serviceType;
                const year = req.query.year ? parseInt(req.query.year) : undefined;
                const month = req.query.month ? parseInt(req.query.month) : undefined;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                if (!buildingId) {
                    res.status(400).json({ error: 'buildingId es requerido' });
                    return;
                }
                const invoices = await this.getService().getServiceInvoicesByBuilding(buildingId, userId, serviceType, year, month);
                res.json({ data: invoices });
            }
            catch (error) {
                console.error('Error al obtener facturas de servicio:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
        this.getServiceInvoice = async (req, res) => {
            try {
                const userId = req.user?.id;
                const { id } = req.params;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const invoice = await this.getService().getServiceInvoiceById(id, userId);
                if (!invoice) {
                    res.status(404).json({ error: 'Factura de servicio no encontrada' });
                    return;
                }
                res.json({ data: invoice });
            }
            catch (error) {
                console.error('Error al obtener factura de servicio:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
        this.updateServiceInvoice = async (req, res) => {
            try {
                const userId = req.user?.id;
                const { id } = req.params;
                const data = req.body;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                // Validar service_type si se está actualizando
                if (data.service_type) {
                    const validServiceTypes = ['electricity', 'water', 'gas', 'ibi', 'waste'];
                    if (!validServiceTypes.includes(data.service_type)) {
                        res.status(400).json({ error: `service_type debe ser uno de: ${validServiceTypes.join(', ')}` });
                        return;
                    }
                }
                // Validar amount_eur si se está actualizando
                if (data.amount_eur !== undefined && data.amount_eur < 0) {
                    res.status(400).json({ error: 'amount_eur debe ser >= 0' });
                    return;
                }
                const invoice = await this.getService().updateServiceInvoice(id, data, userId);
                if (!invoice) {
                    res.status(404).json({ error: 'Factura de servicio no encontrada' });
                    return;
                }
                TrazabilityService_1.trazabilityService.registerTrazability({ authUserId: userId, buildingId: invoice?.building_id, action: interfaceTrazability_1.ActionsValues['ACTUALIZAR DATOS FINANCIEROS'], module: interfaceTrazability_1.ModuleValues.DOCUMENTOS, description: "Actualizar factura de servicios" }).catch(err => console.error("Fallo trazabilidad:", err));
                res.json({ data: invoice });
            }
            catch (error) {
                console.error('Error al actualizar factura de servicio:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
        this.deleteServiceInvoice = async (req, res) => {
            try {
                const userId = req.user?.id;
                const { id } = req.params;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                await this.getService().deleteServiceInvoice(id, userId);
                const invoice = await this.getService().getServiceInvoiceById(id, userId);
                TrazabilityService_1.trazabilityService.registerTrazability({ authUserId: userId, buildingId: invoice?.building_id || null, action: interfaceTrazability_1.ActionsValues['ELIMINAR'], module: interfaceTrazability_1.ModuleValues.DOCUMENTOS, description: "Eliminar factura de servicios" }).catch(err => console.error("Fallo trazabilidad:", err));
                res.status(204).send();
            }
            catch (error) {
                console.error('Error al eliminar factura de servicio:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
    }
    getService() {
        return new serviceInvoiceService_1.ServiceInvoiceService();
    }
}
exports.ServiceInvoiceController = ServiceInvoiceController;
//# sourceMappingURL=serviceInvoiceController.js.map
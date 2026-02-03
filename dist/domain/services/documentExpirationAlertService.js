"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentExpirationAlertService = void 0;
const supabase_1 = require("../../lib/supabase");
class DocumentExpirationAlertService {
    getSupabase() {
        return (0, supabase_1.getSupabaseClient)();
    }
    /**
     * Calcula el nivel de alerta basado en los días hasta el vencimiento
     */
    calculateAlertLevel(daysUntilExpiration) {
        if (daysUntilExpiration < 0) {
            return 'critical'; // Ya venció
        }
        if (daysUntilExpiration <= 7) {
            return 'critical'; // Menos de 7 días
        }
        if (daysUntilExpiration <= 30) {
            return 'warning'; // Entre 7 y 30 días
        }
        return 'info'; // Más de 30 días
    }
    /**
     * Calcula los días hasta el vencimiento
     */
    calculateDaysUntilExpiration(expirationDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiration = new Date(expirationDate);
        expiration.setHours(0, 0, 0, 0);
        const diffTime = expiration.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    /**
     * Obtiene documentos de edificios próximos a vencer
     */
    async getBuildingDocumentsExpiring(daysAhead, includeExpired, buildingId, category) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + daysAhead);
        let query = this.getSupabase()
            .from("building_documents")
            .select(`
        id,
        building_id,
        file_name,
        category,
        expiration_date,
        buildings (
          id,
          name
        )
      `)
            .not("expiration_date", "is", null);
        // Filtrar por rango de fechas
        if (includeExpired) {
            // Incluir vencidos y próximos a vencer
            query = query.lte("expiration_date", futureDate.toISOString().split('T')[0]);
        }
        else {
            // Solo próximos a vencer (no incluir vencidos)
            query = query
                .gte("expiration_date", today.toISOString().split('T')[0])
                .lte("expiration_date", futureDate.toISOString().split('T')[0]);
        }
        if (buildingId) {
            query = query.eq("building_id", buildingId);
        }
        if (category) {
            query = query.eq("category", category);
        }
        // Ya no filtramos por status, solo por expiration_date
        query = query.order("expiration_date", { ascending: true });
        const { data, error } = await query;
        if (error) {
            throw new Error(`Error al obtener documentos de edificios próximos a vencer: ${error.message}`);
        }
        const alerts = [];
        for (const doc of data || []) {
            if (!doc.expiration_date)
                continue;
            const daysUntilExpiration = this.calculateDaysUntilExpiration(doc.expiration_date);
            const alertLevel = this.calculateAlertLevel(daysUntilExpiration);
            const building = Array.isArray(doc.buildings)
                ? doc.buildings[0]
                : doc.buildings;
            alerts.push({
                id: `building_${doc.id}`,
                document_type: 'building',
                building_id: doc.building_id,
                unit_id: null,
                document_id: doc.id,
                file_name: doc.file_name,
                title: doc.file_name, // Usar file_name como title
                category: doc.category,
                expiration_date: doc.expiration_date,
                days_until_expiration: daysUntilExpiration,
                status: 'activo', // Status fijo ya que no lo guardamos en BD
                alert_level: alertLevel,
                building_name: building?.name || null,
                unit_name: null,
            });
        }
        return alerts;
    }
    /**
     * Obtiene documentos de unidades próximos a vencer
     */
    async getUnitDocumentsExpiring(daysAhead, includeExpired, buildingId, unitId, category) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + daysAhead);
        let query = this.getSupabase()
            .from("unit_documents")
            .select(`
        id,
        building_id,
        unit_id,
        file_name,
        category,
        expiration_date,
        buildings (
          id,
          name
        ),
        building_units (
          id,
          name,
          identifier,
          floor
        )
      `)
            .not("expiration_date", "is", null);
        // Filtrar por rango de fechas
        if (includeExpired) {
            query = query.lte("expiration_date", futureDate.toISOString().split('T')[0]);
        }
        else {
            query = query
                .gte("expiration_date", today.toISOString().split('T')[0])
                .lte("expiration_date", futureDate.toISOString().split('T')[0]);
        }
        if (buildingId) {
            query = query.eq("building_id", buildingId);
        }
        if (unitId) {
            query = query.eq("unit_id", unitId);
        }
        if (category) {
            query = query.eq("category", category);
        }
        // Ya no filtramos por status, solo por expiration_date
        query = query.order("expiration_date", { ascending: true });
        const { data, error } = await query;
        if (error) {
            throw new Error(`Error al obtener documentos de unidades próximos a vencer: ${error.message}`);
        }
        const alerts = [];
        for (const doc of data || []) {
            if (!doc.expiration_date)
                continue;
            const daysUntilExpiration = this.calculateDaysUntilExpiration(doc.expiration_date);
            const alertLevel = this.calculateAlertLevel(daysUntilExpiration);
            const unit = Array.isArray(doc.building_units)
                ? doc.building_units[0]
                : doc.building_units;
            // Construir nombre de unidad usando identifier o name
            let unitName = null;
            if (unit) {
                const unitIdentifier = unit.identifier || unit.name;
                if (unitIdentifier) {
                    unitName = unitIdentifier;
                    if (unit.floor) {
                        unitName += ` - Piso ${unit.floor}`;
                    }
                }
            }
            const building = Array.isArray(doc.buildings)
                ? doc.buildings[0]
                : doc.buildings;
            alerts.push({
                id: `unit_${doc.id}`,
                document_type: 'unit',
                building_id: doc.building_id,
                unit_id: doc.unit_id,
                document_id: doc.id,
                file_name: doc.file_name,
                title: doc.file_name, // Usar file_name como title
                category: doc.category,
                expiration_date: doc.expiration_date,
                days_until_expiration: daysUntilExpiration,
                status: 'activo', // Status fijo ya que no lo guardamos en BD
                alert_level: alertLevel,
                building_name: building?.name || null,
                unit_name: unitName,
            });
        }
        return alerts;
    }
    /**
     * Obtiene facturas de servicios próximas a vencer
     */
    async getServiceInvoicesExpiring(daysAhead, includeExpired, buildingId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + daysAhead);
        let query = this.getSupabase()
            .from("service_invoices")
            .select(`
        id,
        building_id,
        service_type,
        invoice_number,
        invoice_date,
        amount_eur,
        expiration_date,
        provider,
        buildings (
          id,
          name
        )
      `)
            .not("expiration_date", "is", null);
        // Filtrar por rango de fechas
        if (includeExpired) {
            query = query.lte("expiration_date", futureDate.toISOString().split('T')[0]);
        }
        else {
            query = query
                .gte("expiration_date", today.toISOString().split('T')[0])
                .lte("expiration_date", futureDate.toISOString().split('T')[0]);
        }
        if (buildingId) {
            query = query.eq("building_id", buildingId);
        }
        query = query.order("expiration_date", { ascending: true });
        const { data, error } = await query;
        if (error) {
            throw new Error(`Error al obtener facturas de servicios próximas a vencer: ${error.message}`);
        }
        const alerts = [];
        for (const invoice of data || []) {
            if (!invoice.expiration_date)
                continue;
            const daysUntilExpiration = this.calculateDaysUntilExpiration(invoice.expiration_date);
            const alertLevel = this.calculateAlertLevel(daysUntilExpiration);
            const building = Array.isArray(invoice.buildings)
                ? invoice.buildings[0]
                : invoice.buildings;
            // Mapear service_type a categoría legible
            const serviceTypeMap = {
                electricity: 'Electricidad',
                water: 'Agua',
                gas: 'Gas',
                ibi: 'IBI',
                waste: 'Basuras'
            };
            const categoryName = serviceTypeMap[invoice.service_type] || invoice.service_type;
            const fileName = invoice.invoice_number
                ? `Factura ${invoice.invoice_number}.pdf`
                : `Factura ${invoice.service_type}`;
            const title = invoice.provider
                ? `${categoryName} - ${invoice.provider}`
                : categoryName;
            alerts.push({
                id: `service_invoice_${invoice.id}`,
                document_type: 'service_invoice',
                building_id: invoice.building_id,
                unit_id: null,
                document_id: invoice.id,
                file_name: fileName,
                title: title,
                category: categoryName,
                expiration_date: invoice.expiration_date,
                days_until_expiration: daysUntilExpiration,
                status: daysUntilExpiration < 0 ? 'overdue' : 'activo',
                alert_level: alertLevel,
                building_name: building?.name || null,
                unit_name: null,
                service_type: invoice.service_type,
                invoice_number: invoice.invoice_number,
                amount_eur: parseFloat(invoice.amount_eur) || null,
            });
        }
        return alerts;
    }
    /**
     * Obtiene todos los documentos próximos a vencer (building, unit y service_invoices)
     */
    async getExpiringDocuments(filters = {}) {
        const { days_ahead = 90, include_expired = true, building_id, unit_id, category, alert_level, } = filters;
        // Obtener documentos de edificios
        const buildingAlerts = await this.getBuildingDocumentsExpiring(days_ahead, include_expired, building_id, category);
        // Obtener documentos de unidades
        const unitAlerts = await this.getUnitDocumentsExpiring(days_ahead, include_expired, building_id, unit_id, category);
        // Obtener facturas de servicios
        const serviceInvoiceAlerts = await this.getServiceInvoicesExpiring(days_ahead, include_expired, building_id);
        // Combinar y ordenar por fecha de vencimiento
        let allAlerts = [...buildingAlerts, ...unitAlerts, ...serviceInvoiceAlerts].sort((a, b) => {
            const dateA = new Date(a.expiration_date).getTime();
            const dateB = new Date(b.expiration_date).getTime();
            return dateA - dateB;
        });
        // Filtrar por nivel de alerta si se especifica
        if (alert_level) {
            allAlerts = allAlerts.filter(alert => alert.alert_level === alert_level);
        }
        // Calcular estadísticas
        const critical = allAlerts.filter(a => a.alert_level === 'critical' && a.days_until_expiration >= 0).length;
        const warning = allAlerts.filter(a => a.alert_level === 'warning').length;
        const info = allAlerts.filter(a => a.alert_level === 'info').length;
        const expired = allAlerts.filter(a => a.days_until_expiration < 0).length;
        return {
            alerts: allAlerts,
            total: allAlerts.length,
            critical,
            warning,
            info,
            expired,
        };
    }
    /**
     * Busca documentos próximos a vencer (próximos 7 días)
     * Este método se llama desde el cronjob para reportar documentos próximos a vencer
     * NO modifica la base de datos, solo busca y reporta
     */
    async findDocumentsExpiringSoon() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        // Buscar documentos próximos a vencer (próximos 7 días)
        const filters = {
            days_ahead: 7,
            include_expired: false, // Solo próximos a vencer, no los ya vencidos
        };
        const result = await this.getExpiringDocuments(filters);
        // Separar por tipo
        const buildingDocs = result.alerts.filter(a => a.document_type === 'building');
        const unitDocs = result.alerts.filter(a => a.document_type === 'unit');
        const serviceInvoices = result.alerts.filter(a => a.document_type === 'service_invoice');
        return {
            total: result.total,
            building_documents: buildingDocs.length,
            unit_documents: unitDocs.length,
            service_invoices: serviceInvoices.length,
            alerts: result.alerts,
        };
    }
}
exports.DocumentExpirationAlertService = DocumentExpirationAlertService;
//# sourceMappingURL=documentExpirationAlertService.js.map
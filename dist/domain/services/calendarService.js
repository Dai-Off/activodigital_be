"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
const supabase_1 = require("../../lib/supabase");
class CalendarService {
    getSupabase() {
        return (0, supabase_1.getSupabaseClient)();
    }
    /**
     * Obtiene los eventos de un edificio.
     * Soporta filtros por rango de fechas (ideal para vista mensual).
     */
    async getBuildingEvents(buildingId, filters = {}) {
        let query = this.getSupabase()
            .from("building_events")
            .select("*")
            .eq("building_id", buildingId)
            .order("event_date", { ascending: true }); // Ordenar por fecha próxima
        // Filtros opcionales
        if (filters.category)
            query = query.eq("category", filters.category);
        if (filters.priority)
            query = query.eq("priority", filters.priority);
        if (filters.status)
            query = query.eq("status", filters.status);
        // Filtro de rango de fechas (Ej: Diciembre 2025)
        if (filters.startDate)
            query = query.gte("event_date", filters.startDate);
        if (filters.endDate)
            query = query.lte("event_date", filters.endDate);
        if (filters.limit)
            query = query.limit(filters.limit);
        const { data, error } = await query;
        if (error) {
            throw new Error(`Error al obtener eventos del calendario: ${error.message}`);
        }
        return data.map((item) => this.mapToEvent(item));
    }
    /**
     * Crea un nuevo evento en el calendario
     */
    async createEvent(data) {
        const eventData = {
            building_id: data.buildingId,
            title: data.title,
            description: data.description,
            event_date: data.eventDate,
            category: data.category,
            priority: data.priority || "normal",
            related_asset: data.relatedAsset,
            status: "pending", // Por defecto siempre pendiente
        };
        const { data: newEvent, error } = await this.getSupabase()
            .from("building_events")
            .insert(eventData)
            .select()
            .single();
        if (error) {
            throw new Error(`Error al crear evento: ${error.message}`);
        }
        return this.mapToEvent(newEvent);
    }
    /**
     * Actualiza un evento (ej: cambiar fecha, marcar como completado)
     */
    async updateEvent(id, data) {
        const updateData = {};
        if (data.title)
            updateData.title = data.title;
        if (data.description)
            updateData.description = data.description;
        if (data.eventDate)
            updateData.event_date = data.eventDate;
        if (data.category)
            updateData.category = data.category;
        if (data.priority)
            updateData.priority = data.priority;
        if (data.status)
            updateData.status = data.status;
        if (data.relatedAsset)
            updateData.related_asset = data.relatedAsset;
        const { data: updatedEvent, error } = await this.getSupabase()
            .from("building_events")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();
        if (error) {
            throw new Error(`Error al actualizar evento: ${error.message}`);
        }
        return this.mapToEvent(updatedEvent);
    }
    /**
     * Elimina un evento
     */
    async deleteEvent(id) {
        const { error } = await this.getSupabase()
            .from("building_events")
            .delete()
            .eq("id", id);
        if (error)
            throw new Error(`Error al eliminar evento: ${error.message}`);
        return true;
    }
    // Mapper privado
    mapToEvent(data) {
        return {
            id: data.id,
            buildingId: data.building_id,
            title: data.title,
            description: data.description,
            eventDate: data.event_date,
            category: data.category,
            priority: data.priority,
            status: data.status,
            relatedAsset: data.related_asset,
            createdAt: data.created_at,
        };
    }
}
exports.CalendarService = CalendarService;
//# sourceMappingURL=calendarService.js.map
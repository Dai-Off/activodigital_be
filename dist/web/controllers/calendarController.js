"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarController = void 0;
const calendarService_1 = require("../../domain/services/calendarService");
class CalendarController {
    constructor() {
        this.calendarService = new calendarService_1.CalendarService();
        /**
         * GET /api/calendar
         * Obtiene eventos. Soporta ?buildingId=...&month=2025-12
         */
        this.getEvents = async (req, res) => {
            try {
                const buildingId = req.query.buildingId;
                if (!buildingId) {
                    res.status(400).json({ error: "buildingId es requerido" });
                    return;
                }
                // Preparar filtros
                const filters = {
                    category: req.query.category,
                    priority: req.query.priority,
                    status: req.query.status,
                    startDate: req.query.startDate,
                    endDate: req.query.endDate,
                };
                const events = await this.calendarService.getBuildingEvents(buildingId, filters);
                res.status(200).json({
                    data: events,
                    count: events.length,
                });
            }
            catch (error) {
                console.error("Error al obtener calendario:", error);
                res.status(500).json({
                    error: "Error interno del servidor",
                    details: error instanceof Error ? error.message : "Error desconocido",
                });
            }
        };
        /**
         * POST /api/calendar
         * Crea un nuevo evento/tarea
         */
        this.createEvent = async (req, res) => {
            try {
                const body = req.body;
                // Validación básica
                if (!body.buildingId || !body.title || !body.eventDate) {
                    res
                        .status(400)
                        .json({
                        error: "Faltan campos obligatorios (buildingId, title, eventDate)",
                    });
                    return;
                }
                const newEvent = await this.calendarService.createEvent(body);
                res.status(201).json({
                    message: "Evento programado con éxito",
                    data: newEvent,
                });
            }
            catch (error) {
                console.error("Error al crear evento:", error);
                res.status(500).json({
                    error: "Error al crear el evento",
                    details: error instanceof Error ? error.message : "Error desconocido",
                });
            }
        };
        /**
         * PUT /api/calendar/:id
         * Actualiza un evento
         */
        this.updateEvent = async (req, res) => {
            try {
                const { id } = req.params;
                const body = req.body;
                const updatedEvent = await this.calendarService.updateEvent(id, body);
                res.status(200).json({
                    message: "Evento actualizado",
                    data: updatedEvent,
                });
            }
            catch (error) {
                console.error("Error al actualizar evento:", error);
                res.status(500).json({
                    error: "Error al actualizar",
                    details: error instanceof Error ? error.message : "Error desconocido",
                });
            }
        };
        /**
         * DELETE /api/calendar/:id
         */
        this.deleteEvent = async (req, res) => {
            try {
                const { id } = req.params;
                await this.calendarService.deleteEvent(id);
                res.status(200).json({ message: "Evento eliminado", success: true });
            }
            catch (error) {
                console.error("Error al eliminar evento:", error);
                res.status(500).json({
                    error: "Error al eliminar",
                    details: error instanceof Error ? error.message : "Error desconocido",
                });
            }
        };
    }
}
exports.CalendarController = CalendarController;
//# sourceMappingURL=calendarController.js.map
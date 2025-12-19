import { Request, Response } from "express";
import { CalendarService } from "../../domain/services/calendarService";
import {
  CreateEventRequest,
  UpdateEventRequest,
  EventFilters,
} from "../../types/calendar";

export class CalendarController {
  private calendarService = new CalendarService();

  /**
   * GET /api/calendar/all
   * Obtiene todos los eventos
   */
  getAllEvents = async (req: Request, res: Response): Promise<void> => {
    try {

      const events = await this.calendarService.getAllBuildingEvents();

      res.status(200).json({
        data: events,
        count: events.length,
      });
    } catch (error) {
      console.error("Error al obtener eventos:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  /**
   * GET /api/calendar
   * Obtiene eventos. Soporta ?buildingId=...&month=2025-12
   */
  getEvents = async (req: Request, res: Response): Promise<void> => {
    try {
      const buildingId = req.query.buildingId as string;
      if (!buildingId) {
        res.status(400).json({ error: "buildingId es requerido" });
        return;
      }

      // Preparar filtros
      const filters: EventFilters = {
        category: req.query.category as any,
        priority: req.query.priority as any,
        status: req.query.status as any,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      const events = await this.calendarService.getBuildingEvents(
        buildingId,
        filters
      );

      res.status(200).json({
        data: events,
        count: events.length,
      });
    } catch (error) {
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
  createEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body as CreateEventRequest;

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
    } catch (error) {
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
  updateEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const body = req.body as UpdateEventRequest;

      const updatedEvent = await this.calendarService.updateEvent(id, body);

      res.status(200).json({
        message: "Evento actualizado",
        data: updatedEvent,
      });
    } catch (error) {
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
  deleteEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.calendarService.deleteEvent(id);
      res.status(200).json({ message: "Evento eliminado", success: true });
    } catch (error) {
      console.error("Error al eliminar evento:", error);
      res.status(500).json({
        error: "Error al eliminar",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };
}

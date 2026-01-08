import { EventEmitter } from "events";
import {
  CreateNotificationRequest,
  NotificationType,
} from "../../types/notification";
import { SocketService } from "../../services/socketService";

// Definimos los tipos de eventos soportados
export enum NotificationEvents {
  NOTIFICATION_CREATED = "NOTIFICATION_CREATED",
  // Se pueden agregar más tipos aquí, ej: DOCUMENT_UPLOADED, etc.
}

interface NotificationPayload {
  [NotificationEvents.NOTIFICATION_CREATED]: CreateNotificationRequest;
}

/**
 * NotificationBus (Singleton)
 *
 * Centraliza la emisión de eventos de notificación para desacoplar
 * la lógica de negocio del envío/persistencia de notificaciones.
 *
 * Uso:
 * NotificationBus.getInstance().emit(NotificationEvents.NOTIFICATION_CREATED, data);
 */
export class NotificationBus extends EventEmitter {
  private static instance: NotificationBus;

  private constructor() {
    super();
    this.initializeListeners();
  }

  public static getInstance(): NotificationBus {
    if (!NotificationBus.instance) {
      NotificationBus.instance = new NotificationBus();
    }
    return NotificationBus.instance;
  }

  /**
   * Inicializa los listeners por defecto.
   * Aquí es donde conectaremos con el servicio para persistir la data.
   * Al ser asíncrono, los errores deben manejarse aquí para no crashear el proceso principal.
   */
  private initializeListeners() {
    this.on(
      NotificationEvents.NOTIFICATION_CREATED,
      async (payload: CreateNotificationRequest) => {
        try {
          // Importación dinámica para evitar dependencias circulares si las hubiera
          // En este caso, importamos el servicio para persistir la notificación
          const { NotificationService } = await import(
            "../services/notificationService"
          );
          const service = new NotificationService();

          // Llamada interna para guardar en BD
          const createdNotification = await service.internalCreateNotification(
            payload
          );

          // Emitir evento via Socket.io en tiempo real
          if (payload.user_id) {
            // Notificación personal
            SocketService.getInstance().emitToUser(
              payload.user_id,
              "notification:new",
              createdNotification
            );
          } else if (payload.building_id) {
            // Notificación general del edificio
            SocketService.getInstance().emitToRoom(
              `building:${payload.building_id}`,
              "notification:new",
              createdNotification
            );
          }

          // Opcional: Aquí se podría integrar Supabase Realtime explícito si fuera necesario,
          // pero Supabase ya emite eventos Postgres Changes automáticamente si está configurado.
        } catch (error) {
          console.error(
            `[NotificationBus] Error processing ${NotificationEvents.NOTIFICATION_CREATED}:`,
            error
          );
          // Aquí podríamos implementar una lógica de reintentos o cola de errores muerta (DLQ)
        }
      }
    );

    console.log("[NotificationBus] Listeners initialized");
  }

  /**
   * Wrapper tipado para emitir eventos
   */
  public emit<K extends keyof NotificationPayload>(
    event: K,
    payload: NotificationPayload[K]
  ): boolean {
    return super.emit(event, payload);
  }
}

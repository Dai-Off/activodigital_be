import { getSupabaseClient } from "../../lib/supabase";
import {
  Notification,
  CreateNotificationRequest,
  NotificationFilters,
} from "../../types/notification";
import { notification_read } from "../../types/notificationRead";
import { BuildingService } from "./edificioService";
const buildingService = new BuildingService();

/**
 * Servicio centralizado para operaciones de Notificaciones.
 * Toda la lógica de filtrado y cruce de datos se realiza en este servicio,
 * sin depender de funciones RPC o Vistas en la base de datos.
 */
export class NotificationService {
  private getSupabase() {
    return getSupabaseClient();
  }

  // ==========================================
  // 1. GESTIÓN DE NOTIFICACIONES (Tabla: notifications)
  // ==========================================

  /**
   * Crea una nueva notificación asociada a un edificio.
   */
  async createNotification(
    data: CreateNotificationRequest
  ): Promise<Notification> {
    const notificationData: any = {
      building_id: data.building_id,
      type: data.type,
      title: data.title,
      expiration: data.expiration,
      priority: data.priority,
    };

    const { data: notification, error } = await this.getSupabase()
      .from("notifications")
      .insert(notificationData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear notificación: ${error.message}`);
    }

    return this.mapToNotification(notification);
  }

  /**
   * Obtiene las notificaciones de un edificio.
   * Útil para traer el "feed" completo del edificio antes de filtrar.
   */
  async getBuildingNotifications(
    buildingId: string,
    filters: NotificationFilters = {}
  ): Promise<Notification[]> {
    let query = this.getSupabase()
      .from("notifications")
      .select("*")
      .eq("building_id", buildingId)
      .order("created_at", { ascending: false });

    if (filters.type) {
      query = query.eq("type", filters.type);
    }

    // Aplicar límites si existen
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 50) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al obtener notificaciones: ${error.message}`);
    }

    return data.map(this.mapToNotification);
  }

  // ==========================================
  // 2. GESTIÓN DE LECTURAS (Tabla: notification_reads)
  // ==========================================

  /**
   * Marca una notificación como leída para un usuario.
   */
  async markNotificationAsRead(
    userId: string,
    notificationId: string
  ): Promise<{ success: boolean; message: string }> {
    const { error } = await this.getSupabase()
      .from("notification_reads")
      .insert([
        {
          user_id: userId,
          notification_id: notificationId,
          read_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      // Ignoramos error de duplicado (ya estaba leída)
      if (error.code === "23505") {
        return {
          success: true,
          message: "La notificación ya estaba marcada como leída.",
        };
      }
      console.error("Error al marcar como leída:", error.message);
      return { success: false, message: `Error: ${error.message}` };
    }

    return {
      success: true,
      message: "Notificación marcada como leída.",
    };
  }

  /**
   * Obtiene los IDs de las notificaciones que el usuario ya leyó.
   * Optimizado para traer solo los IDs necesarios para el filtrado.
   */
  async getUserReadNotificationIds(userId: string): Promise<Set<string>> {
    const { data, error } = await this.getSupabase()
      .from("notification_reads")
      .select("notification_id")
      .eq("user_id", userId);

    if (error) {
      console.error("Error al obtener lecturas:", error.message);
      return new Set();
    }

    // Retornamos un Set para búsqueda instantánea O(1)
    return new Set(data.map((row: any) => row.notification_id));
  }

  // ==========================================
  // 3. LÓGICA DE NEGOCIO / FILTRADO (Combinación)
  // ==========================================

  /**
   * LÓGICA PRINCIPAL: Obtiene las notificaciones NO LEÍDAS de un edificio.
   * Realiza el filtrado en el servicio (cliente) sin stored procedures.
   */
  async getUnreadBuildingNotificationsForUser(
    userId: string,
    limit: number = 50
  ): Promise<Notification[]> {
    const buildingNotifications = await this.getUserNotifications(userId);
    if (buildingNotifications.length === 0) return [];

    const readIds = await this.getUserReadNotificationIds(userId);

    const unreadNotifications = buildingNotifications.filter(
      (notification) => !readIds.has(notification.id)
    );
    // Ajustamos al límite solicitado por el usuario
    return unreadNotifications.slice(0, limit);
  }

  /**
   * Elimina notificaciones antiguas (más de X días) de un edificio.
   * Método de doble consulta para evitar errores de tipo en la llamada a select() y garantizar el conteo.
   */
  async deleteOldNotifications(
    buildingId: string,
    daysOld: number = 30
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffDateISO = cutoffDate.toISOString();

    // PASO 1: Contar cuántas filas se van a borrar (Consulta SEGURA)
    // ESTA CONSULTA NO FALLA CON ERRORES DE TIPO
    const { count: preCount, error: countError } = await this.getSupabase()
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("building_id", buildingId)
      .lt("created_at", cutoffDateISO);

    if (countError) {
      throw new Error(
        `Error (conteo previo) al eliminar notificaciones: ${countError.message}`
      );
    }

    // Si no hay nada que borrar, retornamos 0 inmediatamente
    const countToDelete = preCount || 0;
    if (countToDelete === 0) {
      return 0;
    }

    // PASO 2: Realizar la eliminación (Consulta SEGURA)
    // ESTA CONSULTA NO NECESITA CONTAR, SÓLO BORRAR
    const { error: deleteError } = await this.getSupabase()
      .from("notifications")
      .delete()
      .eq("building_id", buildingId)
      .lt("created_at", cutoffDateISO); // Mismos filtros

    if (deleteError) {
      throw new Error(
        `Error (eliminación) al eliminar notificaciones: ${deleteError.message}`
      );
    }

    // Retornamos el conteo que obtuvimos en el PASO 1.
    return countToDelete;
  }

  /**
   * Obtiene todas las notificaciones (leídas y no leídas) para TODOS los edificios
   * a los que pertenece un usuario.
   * Utiliza el filtro 'in' de Supabase/Postgres para buscar por múltiples IDs.
   */
  async getUserNotifications(
    userId: string,
    filters: NotificationFilters = {}
  ): Promise<Notification[]> {
    // 1. Obtener la lista de IDs de edificios del usuario
    const rawBuildings: { id: string }[] =
      await buildingService.getBuildingsByUser(userId);
    const buildingIds = rawBuildings.map((building: any) => building.id);
    if (buildingIds.length === 0) {
      return []; // Si no pertenece a ningún edificio, retorna vacío.
    }

    let query = this.getSupabase()
      .from("notifications")
      .select("*")
      .in("building_id", buildingIds)
      .order("created_at", { ascending: false });

    if (filters.type) {
      query = query.eq("type", filters.type);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 50) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(
        `Error al obtener notificaciones del usuario: ${error.message}`
      );
    }

    return data.map(this.mapToNotification);
  }

  /**
   * Marca como leídas TODAS las notificaciones pendientes (no leídas)
   * del usuario, abarcando todos sus edificios.
   */
  async markAllAsReadForUser(
    userId: string
  ): Promise<{ count: number; message: string }> {
    try {
      // 1. Obtener TODAS las notificaciones del usuario (leídas y no leídas)
      // Usamos un límite alto para garantizar que capturamos todas las pendientes
      const allUserNotifications = await this.getUserNotifications(userId, {
        limit: 1000,
      });

      // 2. Obtener los IDs de las notificaciones que el usuario YA leyó
      const readIds = await this.getUserReadNotificationIds(userId);

      // 3. Identificar las notificaciones que aún no han sido leídas
      const unreadNotifications = allUserNotifications.filter(
        (notification) => !readIds.has(notification.id)
      );

      if (unreadNotifications.length === 0) {
        return {
          count: 0,
          message: "No hay notificaciones pendientes para marcar como leídas.",
        };
      }

      // 4. Crear el array de objetos para la inserción en lote
      const readsToInsert = unreadNotifications.map((notification) => ({
        user_id: userId,
        notification_id: notification.id,
        read_at: new Date().toISOString(),
      }));

      // 5. Insertar en lote los registros de lectura
      const { error, count } = await this.getSupabase()
        .from("notification_reads")
        .insert(readsToInsert)
        .select()
        .range(0, readsToInsert.length - 1); // Obtener el conteo de filas insertadas

      if (error) {
        throw new Error(error.message);
      }

      const successfulInsertCount = readsToInsert.length;

      return {
        count: successfulInsertCount,
        message: `Se marcaron como leídas ${successfulInsertCount} notificaciones.`,
      };
    } catch (error: any) {
      console.error("Error al marcar todas como leídas:", error.message);
      return {
        count: 0,
        message: `Error al marcar todas como leídas: ${error.message}`,
      };
    }
  }

  /**
   * Verifica si una notificación individual está leída.
   */
  async checkIfRead(userId: string, notificationId: string): Promise<boolean> {
    const { data, error } = await this.getSupabase()
      .from("notification_reads")
      .select("user_id")
      .eq("user_id", userId)
      .eq("notification_id", notificationId)
      .limit(1)
      .single();

    if (error && error.code === "PGR101") return false; // No encontrado
    if (error) return false;

    return !!data;
  }

  // ==========================================
  // 4. ELIMINACIÓN Y UTILIDADES
  // ==========================================

  async deleteNotification(id: string, buildingId: string): Promise<boolean> {
    const { error } = await this.getSupabase()
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("building_id", buildingId);

    if (error) throw new Error(error.message);
    return true;
  }

  private mapToNotification(data: any): Notification {
    return {
      id: data.id,
      buildingId: data.building_id,
      type: data.type,
      title: data.title,
      expiration: data.expiration,
      priority: data.priority,
      created_at: data.created_at,
    };
  }
}

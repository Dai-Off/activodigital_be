import { getSupabaseClient } from "../../lib/supabase";
import { notification_read } from "../../types/notificationRead";

export class notificationReadService {
  private getSupabase() {
    return getSupabaseClient();
  }

  /**
   * Marca una notificación específica como leída para un usuario.
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
      // Código '23505' es el error de "violación de clave única/primaria" en PostgreSQL
      if (error.code === "23505") {
        return {
          success: true,
          message: "La notificación ya estaba marcada como leída.",
        };
      }
      console.error("Error al marcar como leída:", error.message);
      return { success: false, message: `Error desconocido: ${error.message}` };
    }

    return {
      success: true,
      message: "Notificación marcada como leída con éxito.",
    };
  }

  /**
   * Obtiene una lista de todas las notificaciones leídas por un usuario específico.
   */
  async getReadNotificationsByUserId(
    userId: string
  ): Promise<notification_read[]> {
    const { data, error } = await this.getSupabase()
      .from("notification_reads")
      .select("*")
      .eq("user_id", userId)
      .order("read_at", { ascending: false });

    if (error) {
      console.error("Error al obtener notificaciones leídas:", error.message);
      return [];
    }

    return data as notification_read[];
  }

  /**
   * Obtiene una lista de notificaciones no leídas para un usuario usando una función RPC de PG.
   */
  async getUnreadNotificationsForUser(userId: string): Promise<Notification[]> {
    const { data, error } = await this.getSupabase().rpc(
      "get_unread_notifications",
      {
        p_user_id: userId,
      }
    );

    if (error) {
      console.error(
        "Error fetching unread notifications via RPC:",
        error.message
      );
      return [];
    }

    return data as Notification[];
  }

  /**
   * Verifica si una notificación específica ha sido leída por un usuario.
   */
  async checkIfRead(userId: string, notificationId: string): Promise<boolean> {
    const { data, error } = await this.getSupabase()
      .from("notification_reads")
      .select("user_id") // Solo necesitamos saber si existe UNA fila
      .eq("user_id", userId)
      .eq("notification_id", notificationId)
      .single(); // Intenta obtener solo 1 resultado

    if (error && error.code === "PGR101") {
      // PGR101 es el error que devuelve Supabase cuando .single() no encuentra resultados
      return false;
    } else if (error) {
      console.error("Error checking read status:", error.message);
      return false;
    }

    // Si data no es null, significa que se encontró el registro
    return !!data;
  }

  /**
   * Elimina el registro de lectura (desmarca como leído).
   */
  async unmarkNotificationAsRead(
    userId: string,
    notificationId: string
  ): Promise<boolean> {
    const { error } = await this.getSupabase()
      .from("notification_reads")
      .delete()
      .eq("user_id", userId)
      .eq("notification_id", notificationId);

    if (error) {
      console.error("Error al desmarcar como leída:", error.message);
      return false;
    }

    return true;
  }
}

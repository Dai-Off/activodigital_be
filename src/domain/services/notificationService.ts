import { getSupabaseClient } from '../../lib/supabase';
import { 
  Notification, 
  CreateNotificationRequest, 
  UpdateNotificationRequest,
  NotificationFilters,
  NotificationType,
  NotificationStatus
} from '../../types/notification';

export class NotificationService {
  private getSupabase() {
    return getSupabaseClient();
  }

  /**
   * Crea una nueva notificación
   */
  async createNotification(data: CreateNotificationRequest): Promise<Notification> {
    const notificationData = {
      user_id: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      metadata: data.metadata || {},
      status: NotificationStatus.UNREAD
    };

    const { data: notification, error } = await this.getSupabase()
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear notificación: ${error.message}`);
    }

    return this.mapToNotification(notification);
  }

  /**
   * Obtiene las notificaciones de un usuario con filtros opcionales
   */
  async getUserNotifications(
    userId: string, 
    filters: NotificationFilters = {}
  ): Promise<Notification[]> {
    let query = this.getSupabase()
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al obtener notificaciones: ${error.message}`);
    }

    return data.map(this.mapToNotification);
  }

  /**
   * Obtiene el conteo de notificaciones no leídas de un usuario
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { data, error } = await this.getSupabase()
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', NotificationStatus.UNREAD);

    if (error) {
      throw new Error(`Error al obtener conteo de notificaciones: ${error.message}`);
    }

    return data?.length || 0;
  }

  /**
   * Marca una notificación como leída
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.getSupabase()
      .from('notifications')
      .update({ 
        status: NotificationStatus.READ,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .eq('status', NotificationStatus.UNREAD)
      .select();

    if (error) {
      throw new Error(`Error al marcar notificación como leída: ${error.message}`);
    }

    return data && data.length > 0;
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   */
  async markAllAsRead(userId: string): Promise<number> {
    const { data, error } = await this.getSupabase()
      .from('notifications')
      .update({ 
        status: NotificationStatus.READ,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', NotificationStatus.UNREAD)
      .select();

    if (error) {
      throw new Error(`Error al marcar todas las notificaciones como leídas: ${error.message}`);
    }

    return data?.length || 0;
  }

  /**
   * Elimina una notificación
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const { error } = await this.getSupabase()
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Error al eliminar notificación: ${error.message}`);
    }

    return true;
  }

  /**
   * Elimina notificaciones antiguas (más de 30 días)
   */
  async deleteOldNotifications(userId: string, daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await this.getSupabase()
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .lt('created_at', cutoffDate.toISOString())
      .select();

    if (error) {
      throw new Error(`Error al eliminar notificaciones antiguas: ${error.message}`);
    }

    return data?.length || 0;
  }

  /**
   * Métodos específicos para notificaciones de IA
   */
  async createAIProcessingCompleteNotification(userId: string, fileName: string, bookId: string, sectionsCount: number): Promise<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.AI_PROCESSING_COMPLETE,
      title: 'Libro creado',
      message: 'El libro digital ha sido creado exitosamente con todas las secciones completas',
      metadata: {
        fileName,
        bookId,
        sectionsCount,
        stage: 'complete'
      }
    });
  }

  async createAIProcessingErrorNotification(userId: string, fileName: string, errorMessage: string): Promise<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.AI_PROCESSING_ERROR,
      title: 'Error',
      message: 'Hubo un problema al procesar el documento con IA',
      metadata: {
        fileName,
        errorMessage,
        stage: 'error'
      }
    });
  }

  /**
   * Mapea los datos de la base de datos a la interfaz Notification
   */
  private mapToNotification(data: any): Notification {
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      title: data.title,
      message: data.message,
      status: data.status,
      metadata: data.metadata || {},
      createdAt: data.created_at,
      readAt: data.read_at
    };
  }
}

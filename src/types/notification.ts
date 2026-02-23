export enum NotificationType {
  MAINTENANCE = "maintenance",
  FINANCIAL = "financial",
  EXPIRATION = "expiration",
  RENEWAL = "renewal",
  BUILDING_ASSIGNMENT = "building_assignment",
  CERTIFICATE = "certificate",
  DOCUMENT_REJECTED = "document_rejected",
  DOCUMENT_APPROVED = "document_approved",
}

export interface Notification {
  id: string;
  userId?: string;
  buildingId: string;
  type: NotificationType;
  title: string;
  expiration: string | null;
  priority: number;
  message?: string;
  metadata?: any;
  created_at: string;
}

export interface CreateNotificationRequest {
  /** Auth user UUID (users.user_id) para el INSERT en notifications (FK). */
  user_id?: string;
  /** Si se indica, el socket emite a este id (ej. users.id para que el frontend reciba). */
  socket_emit_user_id?: string;
  building_id: string;
  type: NotificationType;
  title: string;
  expiration: string | null;
  priority: number;
  message?: string;
  metadata?: any;
}

export interface NotificationFilters {
  type?: NotificationType;
  limit?: number;
  offset?: number;
}

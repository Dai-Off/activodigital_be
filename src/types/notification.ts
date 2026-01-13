export enum NotificationType {
  MAINTENANCE = "maintenance",
  FINANCIAL = "financial",
  EXPIRATION = "expiration",
  RENEWAL = "renewal",
  BUILDING_ASSIGNMENT = "building_assignment",
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
  user_id?: string;
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

export enum NotificationType {
  MAINTENANCE = "maintenance",
  FINANCIAL = "financial",
  EXPIRATION = "expiration",
  RENEWAL = "renewal",
}

export interface Notification {
  id: string;
  buildingId: string;
  type: NotificationType;
  title: string;
  expiration: string | null;
  priority: number;
  created_at: string;
}

export interface CreateNotificationRequest {
  building_id: string;
  type: NotificationType;
  title: string;
  expiration: string | null;
  priority: number;
}

export interface NotificationFilters {
  type?: NotificationType;
  limit?: number;
  offset?: number;
}

export enum NotificationType {
  MAINTENANCE = "maintenance",
  FINANCIAL = "financial",
  EXPIRATION = "expiration",
  RENEWAL = "renewal",
  BUILDING_ASSIGNMENT = "building_assignment",
}

export interface Notification {
  id: string;
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

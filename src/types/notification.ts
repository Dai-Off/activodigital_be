export enum NotificationType {
  AI_PROCESSING_START = 'ai_processing_start',
  AI_PROCESSING_PROGRESS = 'ai_processing_progress', 
  AI_PROCESSING_COMPLETE = 'ai_processing_complete',
  AI_PROCESSING_ERROR = 'ai_processing_error',
  BOOK_CREATED = 'book_created',
  BOOK_UPDATED = 'book_updated',
  GENERAL = 'general'
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read'
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  metadata?: Record<string, any>;
  createdAt: string;
  readAt?: string;
}

export interface CreateNotificationRequest {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface UpdateNotificationRequest {
  status?: NotificationStatus;
}

export interface NotificationFilters {
  status?: NotificationStatus;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}

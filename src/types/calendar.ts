// types/calendar.ts

export type EventPriority = "low" | "normal" | "high" | "urgent";
export type EventStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type EventCategory =
  | "maintenance"
  | "audit"
  | "operations"
  | "contract"
  | "general"
  | "inspections"
  | "meeting"
  | "expiration";

export type EventExecution =
  | "	scheduled"
  | "urgent"
  | "pending"
  | "confirmed"
  | "refused";

export interface BuildingEvent {
  id: string;
  buildingId: string;
  buildingName?: string;
  title: string;
  description?: string;
  eventDate: string; // ISO String
  category: EventCategory;
  priority: EventPriority;
  status: EventStatus;
  execution?: EventExecution,
  relatedAsset?: string;
  createdAt: string;
}

export interface CreateEventRequest {
  buildingId: string;
  title: string;
  description?: string;
  eventDate: string;
  category: EventCategory;
  priority?: EventPriority;
  relatedAsset?: string;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  status?: EventStatus;
}

export interface EventFilters {
  category?: EventCategory;
  priority?: EventPriority;
  startDate?: string; // Para filtrar por rango (ej: este mes)
  endDate?: string;
  status?: EventStatus;
  limit?: number;
}

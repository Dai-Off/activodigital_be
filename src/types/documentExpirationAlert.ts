// Types para alertas de documentos próximos a vencer

import { BuildingDocument } from './buildingDocument';
import { UnitDocument } from './unitDocument';

export interface DocumentExpirationAlert {
  id: string;
  document_type: 'building' | 'unit' | 'service_invoice';
  building_id: string;
  unit_id?: string | null;
  document_id: string;
  file_name: string;
  title?: string | null;
  category: string;
  expiration_date: string; // ISO date YYYY-MM-DD
  days_until_expiration: number; // Días hasta el vencimiento (negativo si ya venció)
  status: 'activo' | 'pendiente' | 'aprobado' | 'proximo-vencer' | 'overdue';
  alert_level: 'critical' | 'warning' | 'info'; // critical: < 7 días, warning: 7-30 días, info: > 30 días
  building_name?: string | null;
  unit_name?: string | null;
  // Campos adicionales para service_invoices
  service_type?: string | null; // electricity, water, gas, ibi, waste
  invoice_number?: string | null;
  amount_eur?: number | null;
  // Datos completos del documento (opcional, para evitar múltiples queries)
  document?: BuildingDocument | UnitDocument | any; // any para service_invoice
}

export interface DocumentExpirationAlertsResponse {
  alerts: DocumentExpirationAlert[];
  total: number;
  critical: number; // < 7 días
  warning: number; // 7-30 días
  info: number; // > 30 días
  expired: number; // Ya vencieron
}

export interface ExpirationAlertFilters {
  days_ahead?: number; // Días hacia adelante para buscar (default: 90)
  include_expired?: boolean; // Incluir documentos ya vencidos (default: true)
  building_id?: string; // Filtrar por edificio
  unit_id?: string; // Filtrar por unidad
  category?: string; // Filtrar por categoría
  alert_level?: 'critical' | 'warning' | 'info'; // Filtrar por nivel de alerta
}


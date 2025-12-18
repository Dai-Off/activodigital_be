// Types para facturas de servicios del edificio

export type ServiceType = 'electricity' | 'water' | 'gas' | 'ibi' | 'waste';

export interface ServiceInvoice {
  id?: string;
  building_id: string;
  service_type: ServiceType;
  
  // Información de la factura
  invoice_number?: string | null;
  invoice_date: string; // ISO date YYYY-MM-DD
  amount_eur: number;
  units?: number | null;
  
  // Periodo que cubre la factura (opcional)
  period_start?: string | null; // ISO date YYYY-MM-DD
  period_end?: string | null; // ISO date YYYY-MM-DD
  
  // Documento
  document_url?: string | null;
  document_filename?: string | null;
  
  // Metadata
  notes?: string | null;
  provider?: string | null;
  
  // Audit
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
}

export interface CreateServiceInvoiceRequest extends Omit<ServiceInvoice, 'id' | 'created_at' | 'updated_at' | 'created_by'> {}

export interface UpdateServiceInvoiceRequest extends Partial<Omit<ServiceInvoice, 'id' | 'building_id' | 'created_at' | 'updated_at' | 'created_by'>> {}



// Tipos para el sistema de rentas mensuales

export type RentInvoiceStatus = 'pending' | 'paid' | 'overdue';

export type PaymentMethod = 'transfer' | 'cash' | 'check' | 'other';

export interface RentInvoice {
  id: string;
  buildingId: string;
  unitId: string;
  invoiceMonth: string; // YYYY-MM-01 (primer día del mes)
  invoiceNumber?: string | null;
  rentAmount: number;
  additionalCharges: number;
  totalAmount: number;
  status: RentInvoiceStatus;
  dueDate: string; // YYYY-MM-DD
  notes?: string | null;
  
  // Campos de pago (parte de la factura)
  paymentDate?: string | null; // YYYY-MM-DD
  paymentAmount?: number | null;
  paymentMethod?: PaymentMethod | null;
  paymentReferenceNumber?: string | null;
  paymentNotes?: string | null;
  
  createdAt?: string;
  updatedAt?: string;
}

// DTOs para requests
export interface CreateRentInvoiceRequest {
  buildingId: string;
  unitId: string;
  invoiceMonth: string; // YYYY-MM-01
  invoiceNumber?: string;
  rentAmount: number;
  additionalCharges?: number;
  dueDate: string; // YYYY-MM-DD
  notes?: string;
}

export interface UpdateRentInvoiceRequest {
  invoiceNumber?: string;
  rentAmount?: number;
  additionalCharges?: number;
  dueDate?: string;
  notes?: string;
  // Campos de pago
  paymentDate?: string;
  paymentAmount?: number;
  paymentMethod?: PaymentMethod;
  paymentReferenceNumber?: string;
  paymentNotes?: string;
}

// Resumen mensual de rentas
export interface MonthlyRentSummary {
  buildingId: string;
  month: string; // YYYY-MM
  year: number;
  monthNumber: number;
  
  // Totales
  totalInvoiced: number; // Total facturado
  totalCollected: number; // Total cobrado
  collectionPercentage: number; // % cobro (0-100)
  
  // Estados
  paidCount: number; // Número de facturas pagadas
  pendingCount: number; // Número de facturas pendientes
  overdueCount: number; // Número de facturas retrasadas
  
  // Detalles por estado
  paidAmount: number; // Monto pagado
  pendingAmount: number; // Monto pendiente
  overdueAmount: number; // Monto retrasado
  
  // Detalle de facturas
  invoices: RentInvoice[];
}

export interface MonthlyRentSummaryResponse {
  data: MonthlyRentSummary;
}


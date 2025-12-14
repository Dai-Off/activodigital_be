// Financial Snapshot types según el JSON Schema v1

import { BuildingImage } from "./edificio";

export interface FinancialSnapshotMeta {
  libro_edificio_estado?: 'completo' | 'parcial' | 'faltante';
  ite_iee_estado?: 'ok' | 'pendiente' | 'no_aplica';
  mantenimientos_criticos_ok?: boolean;
  planos_estado?: 'ok' | 'faltante';
  eur_m2_ref_p50?: number;
  dom_dias?: number;
  fuente?: string | null;
  version?: string | null;
  notas?: string | null;
}

export interface FinancialSnapshot {
  id?: string;
  building_id: string;
  period_start: string; // ISO date YYYY-MM-DD
  period_end: string; // ISO date YYYY-MM-DD
  currency: 'EUR';

  // Ingresos
  ingresos_brutos_anuales_eur: number;
  otros_ingresos_anuales_eur?: number | null;
  walt_meses: number;
  concentracion_top1_pct_noi: number; // Ratio 0-1
  indexacion_ok?: boolean | null;
  mora_pct_12m?: number | null; // Ratio 0-1
  images?: BuildingImage,

  // OPEX
  opex_total_anual_eur: number;
  opex_energia_anual_eur: number;
  opex_mantenimiento_anual_eur?: number | null;
  opex_seguros_anual_eur?: number | null;
  opex_otros_anual_eur?: number | null;

  // Deuda
  dscr?: number | null; // > 0
  servicio_deuda_anual_eur?: number | null;
  penalidad_prepago_alta?: boolean | null;
  principal_pendiente_eur?: number | null;

  // Rehabilitación
  capex_rehab_estimado_eur?: number | null;
  ahorro_energia_pct_estimado?: number | null; // 0-100
  uplift_precio_pct_estimado?: number | null; // 0-100
  lead_time_rehab_semanas?: number | null;

  estado_actual?: String,
  potencial?: { letra: String, variacion: String },
  tir?: { valor: number, plazo: string },
  cash_on_cash?: { valor: number, multiplicador: number },
  capex?: { total: number, descripcion: string, estimated: number },
  subvencion?: { valor: number, porcentaje: number },
  green_premium?: { valor: number, roi: number },
  plazo?: string,
  taxonomia?: { porcentaje: number },
  estado?: { etiqueta: string, score: number, pendientes?: string /* Aquí van los pendientes para mostrar que falta en front al activo*/ }
  activo?: string,
  topologia?: string,
  direccion?: string,
  // Metadata
  meta?: FinancialSnapshotMeta;
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export interface FinancialSnapshotSummary {
  total_activos: number; // El número total de FinancialSnapshots
  capex_total: number; // Suma de todos los campos 'capex.total'
  valor_creado: number; // Suma de todos los campos 'green_premium.valor'
  tir_promedio: number | null; // El promedio de todos los campos 'tir.valor', o null si no hay datos
  bankReady: number | null; // El total de activos en estado 'Bank-Ready'
}

export interface CreateFinancialSnapshotRequest extends Omit<FinancialSnapshot, 'id' | 'created_at' | 'updated_at'> { }

export interface UpdateFinancialSnapshotRequest extends Partial<Omit<FinancialSnapshot, 'id' | 'building_id' | 'created_at' | 'updated_at'>> { }


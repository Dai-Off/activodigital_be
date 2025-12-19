// Types para gastos de servicios (service expenses) - agrupados por mes

export interface MonthlyCost {
  id?: string;
  building_id: string;
  year: number; // Año (YYYY)
  month: number; // Mes (1-12)
  
  // Costes en EUR
  electricity_eur: number;
  water_eur: number;
  gas_eur: number;
  ibi_eur: number;
  waste_eur: number;
  total_monthly_eur?: number; // Campo calculado, opcional en request
  
  // Unidades (opcionales)
  electricity_units?: number | null;
  water_units?: number | null;
  gas_units?: number | null;
  ibi_units?: number | null;
  waste_units?: number | null;
  
  // Notas adicionales
  notes?: string | null;
  
  // Audit
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
}

export interface CreateMonthlyCostRequest extends Omit<MonthlyCost, 'id' | 'total_monthly_eur' | 'created_at' | 'updated_at' | 'created_by'> {}

export interface UpdateMonthlyCostRequest extends Partial<Omit<MonthlyCost, 'id' | 'building_id' | 'year' | 'month' | 'total_monthly_eur' | 'created_at' | 'updated_at' | 'created_by'>> {}

// Respuesta con resumen anual
export interface MonthlyCostsSummary {
  building_id: string;
  year: number;
  total_annual_eur: number;
  average_monthly_eur: number;
  months_count: number;
  breakdown: {
    electricity_annual: number;
    water_annual: number;
    gas_annual: number;
    ibi_annual: number;
    waste_annual: number;
  };
}



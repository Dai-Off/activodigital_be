// Tipos para las métricas del dashboard

export interface DashboardStats {
  // Métricas financieras
  totalValue: number;
  totalAssets: number;
  totalRehabilitationCost: number;
  totalPotentialValue: number;
  
  // Métricas ambientales y energéticas
  totalSurfaceArea: number; // m²
  totalEmissions: number; // tCO₂ eq
  averageEnergyClass: string | null; // 'A', 'B', 'C', etc. o null si no hay datos
  averageEnergyRating: number | null; // Valor numérico del rating (A=7, B=6, etc.)
  
  // Métricas de completitud
  completedBooks: number;
  pendingBooks: number;
  draftBooks: number;
  completionPercentage: number;
  
  // Financiación verde (para propietarios)
  greenFinancingEligiblePercentage: number;
  greenFinancingEligibleCount: number;
  
  // Promedios
  averageUnitsPerBuilding: number;
  averageBuildingAge: number;
  averageFloorsPerBuilding: number;
  
  // Tipología
  mostCommonTypology: string | null;
  typologyDistribution: {
    residential: number;
    mixed: number;
    commercial: number;
  };
  
  // ESG Score promedio ('Premium' | 'Gold' | 'Silver' | 'Bronze' | 'Crítico', null si no hay edificios con ESG completo)
  averageESGScore: string | null;
}

export interface DashboardMetricsResponse {
  data: DashboardStats;
  message?: string;
}

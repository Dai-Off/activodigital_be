/**
 * Constantes compartidas para el sistema de auditorías (Técnica y Financiera)
 */

export const AUDIT_CONSTANTS = {
  // Factores energéticos (REE 2024)
  ENERGY: {
    CO2_FACTOR_KG_PER_KWH: 0.12,
    PRICE_PER_KWH: 0.17, // PVPC 2024 Q4
    HEATING_CO2_FACTOR: 0.25,
  },

  // Fallbacks de edificios
  BUILDING: {
    DEFAULT_SQ_METERS: 1000,
    OVERLAP_FACTOR: 0.85,
  },

  // Costes estimados por m² de mejora (€/m²)
  // Unificado de technicalAuditService y financialAuditService
  COSTS_PER_M2: {
    INSULATION: 120, // Antes variaba entre 80 y 120
    WINDOWS: 250,    // Antes variaba entre 45 y 250
    HVAC: 150,
    LIGHTING: 35,
    RENEWABLES: 200,
  },

  // Objetivos y multiplicadores
  BENCHMARKS: {
    EPBD_TARGET_CLASS: 'B',
    EPBD_REDUCTION_FACTOR: 0.84, // 16% de reducción según directiva 2024
    BREEAM_PREMIUM_MULTIPLIER: 1.25,
    ESTIMATED_REVALUATION_FACTOR: 1.15, // +15% sobre inversión
    MAX_CONSUMPTION_BENCHMARK: 250, // kWh/m2 para cálculo de progreso
    MAX_EMISSIONS_BENCHMARK: 50,     // kg CO2 para cálculo de progreso
  }
};

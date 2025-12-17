import { Router } from "express";
import {
  GetBuildingPVEnergyOutput,
  GetDetailedHourlyData,
  GetTypicalMeteorologicalYear,
  GetMonthlyRadiation,
} from "../web/controllers/PVGISController";

const router = Router();

// 1. PVcalc (Cálculo de Producción para Edificios)
// URL: /api/v1/pvgis/building-energy-output?lat=...&lon=...&peakpower=...&loss=...
router.get("/building-energy-output", GetBuildingPVEnergyOutput);

// 2. seriescalc (Datos Horarios Detallados)
// Útil para emparejar la curva de consumo del edificio con la producción FV.
// URL: /api/v1/pvgis/hourly-data?lat=...&lon=...&pvcalculation=1&peakpower=...&loss=...
router.get("/hourly-data", GetDetailedHourlyData);

// 3. TMY (Año Meteorológico Típico)
// Crucial para la simulación avanzada en software de energía de edificios.
// URL: /api/v1/pvgis/tmy-data?lat=...&lon=...
router.get("/tmy-data", GetTypicalMeteorologicalYear);

// 4. MRcalc (Radiación Mensual)
// Para determinar la viabilidad y la orientación óptima inicial.
// URL: /api/v1/pvgis/monthly-radiation?lat=...&lon=...&horirrad=1
router.get("/monthly-radiation", GetMonthlyRadiation);

export default router;

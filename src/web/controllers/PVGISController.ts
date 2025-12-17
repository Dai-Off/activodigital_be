import { Request, Response } from "express";
import { PVGISApiService } from "../../domain/services/PVGISApiService";

const pvgisApiService = new PVGISApiService();

export const GetBuildingPVEnergyOutput = async (
  req: Request,
  res: Response
) => {
  const lat = req.query.lat as string;
  const lon = req.query.lon as string;
  const peakpower = req.query.peakpower as string;
  const loss = req.query.loss as string;

  const mountingplace = req.query.mountingplace as
    | "free"
    | "building"
    | undefined;

  if (!lat || !lon || !peakpower || !loss) {
    return res.status(400).json({
      error: "Faltan parámetros obligatorios: lat, lon, peakpower, loss.",
    });
  }

  try {
    const energyOutput = await pvgisApiService.GetBuildingPVEnergyOutput(
      lat,
      lon,
      peakpower,
      loss,
      mountingplace
    );

    res.status(200).json(energyOutput);
  } catch (error) {
    res.status(500).json({
      error: "Error interno del servidor al calcular la producción FV.",
    });
  }
};

export const GetDetailedHourlyData = async (req: Request, res: Response) => {
  const lat = req.query.lat as string;
  const lon = req.query.lon as string;
  const pvcalculation = req.query.pvcalculation as "0" | "1" | undefined;
  const peakpower = req.query.peakpower as string | undefined;
  const loss = req.query.loss as string | undefined;

  if (!lat || !lon || !pvcalculation) {
    return res.status(400).json({
      error: "Faltan parámetros obligatorios: lat, lon, pvcalculation.",
    });
  }

  if (pvcalculation === "1" && (!peakpower || !loss)) {
    return res.status(400).json({
      error: "Si pvcalculation es '1', peakpower y loss son obligatorios.",
    });
  }

  try {
    const hourlyData = await pvgisApiService.GetDetailedHourlyData(
      lat,
      lon,
      pvcalculation,
      peakpower,
      loss
    );
    res.status(200).json(hourlyData);
  } catch (error) {
    console.error("Error al obtener los datos horarios (seriescalc):", error);
    res.status(500).json({
      error: "Error interno del servidor al consultar datos horarios.",
    });
  }
};

export const GetTypicalMeteorologicalYear = async (
  req: Request,
  res: Response
) => {
  const lat = req.query.lat as string;
  const lon = req.query.lon as string;
  if (!lat || !lon) {
    return res
      .status(400)
      .json({ error: "Faltan parámetros obligatorios: lat, lon." });
  }

  try {
    const tmyData = await pvgisApiService.GetTypicalMeteorologicalYear(
      lat,
      lon
    );
    res.status(200).json(tmyData);
  } catch (error) {
    console.error("Error al obtener los datos TMY:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al consultar datos TMY." });
  }
};

export const GetMonthlyRadiation = async (req: Request, res: Response) => {
  const lat = req.query.lat as string;
  const lon = req.query.lon as string;
  const horirrad = req.query.horirrad as "0" | "1" | undefined;
  const optrad = req.query.optrad as "0" | "1" | undefined;
  if (!lat || !lon) {
    return res
      .status(400)
      .json({ error: "Faltan parámetros obligatorios: lat, lon." });
  }

  // Validación de parámetros específicos de MRcalc
  if (horirrad !== "1" && optrad !== "1") {
    return res
      .status(400)
      .json({ error: "Debe especificar 'horirrad=1' o 'optrad=1'." });
  }

  try {
    const radiationData = await pvgisApiService.GetMonthlyRadiation(
      lat,
      lon,
      horirrad || "0", // Aseguramos que sea '0' si es undefined
      optrad || "0"
    );
    res.status(200).json(radiationData);
  } catch (error) {
    console.error("Error al obtener los datos de radiación mensual:", error);
    res.status(500).json({
      error: "Error interno del servidor al consultar radiación mensual.",
    });
  }
};

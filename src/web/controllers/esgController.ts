import { Request, Response } from 'express';
import { EsgService, EsgInput } from '../../domain/services/esgService';

export class EsgController {
  private getService() {
    return new EsgService();
  }

  calculate = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const body: EsgInput = (req.body?.data ?? req.body) as EsgInput;

      // Validación mínima de presencia de campos clave
      const required = [
        'ceeClass',
        'energyConsumptionKwhPerM2Year',
        'co2EmissionsKgPerM2Year',
        'renewableSharePercent',
        'waterFootprintM3PerM2Year',
        'accessibility',
        'indoorAirQualityCo2Ppm',
        'safetyCompliance',
        'digitalBuildingLog',
        'regulatoryCompliancePercent',
      ] as const;

      for (const key of required) {
        if (body[key] === undefined || body[key] === null) {
          res.status(400).json({ error: `Falta el campo requerido: ${key}` });
          return;
        }
      }

      // Validaciones de dominio (enums y rangos)
      const validCee = ['A','B','C','D','E','F','G'];
      const validTriStates = ['full','partial','none'];
      const validSafety = ['full','pending','none'];

      if (!validCee.includes(String(body.ceeClass))) {
        res.status(400).json({ error: 'ceeClass inválido. Valores: A|B|C|D|E|F|G' });
        return;
      }

      const isFiniteNumber = (n: unknown) => typeof n === 'number' && Number.isFinite(n);

      if (!isFiniteNumber(body.energyConsumptionKwhPerM2Year) || body.energyConsumptionKwhPerM2Year < 0) {
        res.status(400).json({ error: 'energyConsumptionKwhPerM2Year debe ser un número >= 0' });
        return;
      }

      if (!isFiniteNumber(body.co2EmissionsKgPerM2Year) || body.co2EmissionsKgPerM2Year < 0) {
        res.status(400).json({ error: 'co2EmissionsKgPerM2Year debe ser un número >= 0' });
        return;
      }

      if (!isFiniteNumber(body.renewableSharePercent) || body.renewableSharePercent < 0 || body.renewableSharePercent > 100) {
        res.status(400).json({ error: 'renewableSharePercent debe estar entre 0 y 100' });
        return;
      }

      if (!isFiniteNumber(body.waterFootprintM3PerM2Year) || body.waterFootprintM3PerM2Year < 0) {
        res.status(400).json({ error: 'waterFootprintM3PerM2Year debe ser un número >= 0' });
        return;
      }

      if (!validTriStates.includes(String(body.accessibility))) {
        res.status(400).json({ error: 'accessibility inválido. Valores: full|partial|none' });
        return;
      }

      if (!isFiniteNumber(body.indoorAirQualityCo2Ppm) || body.indoorAirQualityCo2Ppm < 0) {
        res.status(400).json({ error: 'indoorAirQualityCo2Ppm debe ser un número >= 0' });
        return;
      }

      if (!validSafety.includes(String(body.safetyCompliance))) {
        res.status(400).json({ error: 'safetyCompliance inválido. Valores: full|pending|none' });
        return;
      }

      if (!validTriStates.includes(String(body.digitalBuildingLog))) {
        res.status(400).json({ error: 'digitalBuildingLog inválido. Valores: full|partial|none' });
        return;
      }

      if (!isFiniteNumber(body.regulatoryCompliancePercent) || body.regulatoryCompliancePercent < 0 || body.regulatoryCompliancePercent > 100) {
        res.status(400).json({ error: 'regulatoryCompliancePercent debe estar entre 0 y 100' });
        return;
      }

      const result = this.getService().calculate(body);
      res.json({ data: result });
    } catch (error) {
      console.error('Error al calcular ESG:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      });
    }
  };
}



import { Request, Response } from 'express';
import { FinancialMetricsService } from '../../domain/services/financialMetricsService';
import { MetricsQueryParams } from '../../types/financialMetrics';

export class BuildingMetricsController {
  private getService() {
    return new FinancialMetricsService();
  }

  /**
   * GET /buildings/:id/metrics
   * Obtiene todas las métricas consolidadas del edificio
   */
  getMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const { id: buildingId } = req.params;
      const params: MetricsQueryParams = {
        period: (req.query.period as 'annual' | 'monthly') || 'annual',
        currency: (req.query.currency as 'EUR' | 'USD') || 'EUR'
      };

      const metrics = await this.getService().getBuildingMetrics(buildingId, userId, params);
      res.json({ data: metrics });
    } catch (error) {
      console.error('Error al obtener métricas del edificio:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * GET /buildings/:id/roi
   * Obtiene el ROI operativo del edificio
   */
  getROI = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const { id: buildingId } = req.params;
      const params: MetricsQueryParams = {
        period: (req.query.period as 'annual' | 'monthly') || 'annual',
        currency: (req.query.currency as 'EUR' | 'USD') || 'EUR'
      };

      const roi = await this.getService().getBuildingROI(buildingId, userId, params);
      res.json({ data: roi });
    } catch (error) {
      console.error('Error al obtener ROI del edificio:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * GET /buildings/:id/cap-rate
   * Obtiene el Cap Rate del edificio
   */
  getCapRate = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const { id: buildingId } = req.params;
      const params: MetricsQueryParams = {
        period: (req.query.period as 'annual' | 'monthly') || 'annual',
        currency: (req.query.currency as 'EUR' | 'USD') || 'EUR'
      };

      const capRate = await this.getService().getBuildingCapRate(buildingId, userId, params);
      res.json({ data: capRate });
    } catch (error) {
      console.error('Error al obtener Cap Rate del edificio:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * GET /buildings/:id/noi
   * Obtiene el NOI del edificio
   */
  getNOI = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const { id: buildingId } = req.params;
      const params: MetricsQueryParams = {
        period: (req.query.period as 'annual' | 'monthly') || 'annual',
        currency: (req.query.currency as 'EUR' | 'USD') || 'EUR'
      };

      const noi = await this.getService().getBuildingNOI(buildingId, userId, params);
      res.json({ data: noi });
    } catch (error) {
      console.error('Error al obtener NOI del edificio:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * GET /buildings/:id/dscr
   * Obtiene el DSCR del edificio
   */
  getDSCR = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const { id: buildingId } = req.params;
      const params: MetricsQueryParams = {
        period: (req.query.period as 'annual' | 'monthly') || 'annual',
        currency: (req.query.currency as 'EUR' | 'USD') || 'EUR'
      };

      const dscr = await this.getService().getBuildingDSCR(buildingId, userId, params);
      res.json({ data: dscr });
    } catch (error) {
      console.error('Error al obtener DSCR del edificio:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * GET /buildings/:id/opex-ratio
   * Obtiene el ratio OPEX del edificio
   */
  getOpexRatio = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const { id: buildingId } = req.params;
      const params: MetricsQueryParams = {
        period: (req.query.period as 'annual' | 'monthly') || 'annual',
        currency: (req.query.currency as 'EUR' | 'USD') || 'EUR'
      };

      const opexRatio = await this.getService().getBuildingOpexRatio(buildingId, userId, params);
      res.json({ data: opexRatio });
    } catch (error) {
      console.error('Error al obtener OPEX Ratio del edificio:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * GET /buildings/:id/value-gap
   * Obtiene el Value Gap del edificio
   */
  getValueGap = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const { id: buildingId } = req.params;

      const valueGap = await this.getService().getBuildingValueGap(buildingId, userId);
      res.json({ data: valueGap });
    } catch (error) {
      console.error('Error al obtener Value Gap del edificio:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };
}


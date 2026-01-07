import { Request, Response } from 'express';
import { FinancialSnapshotService } from '../../domain/services/financialSnapshotService';
import { CreateFinancialSnapshotRequest, FinancialSnapshot, FinancialSnapshotSummary, UpdateFinancialSnapshotRequest } from '../../types/financialSnapshot';
import { trazabilityService } from '../../domain/trazability/TrazabilityService';
import { ActionsValues, ModuleValues } from '../../domain/trazability/interfaceTrazability';


const calculateSummary = (snapshots: FinancialSnapshot[]): FinancialSnapshotSummary => {
  const total_activos = snapshots.length;
  let bankReady: number = 0;

  const countReadys = snapshots?.filter(dt => dt?.estado?.etiqueta === "Bank-Ready")

  bankReady = countReadys.length

  const tirValues: number[] = [];

  const summary = snapshots.reduce((acc, snapshot) => {

    const currentCapexTotal = snapshot.capex?.total ?? 0;
    if (typeof currentCapexTotal === 'number') {
      acc.capex_total += currentCapexTotal;
    }

    const currentValorCreado = snapshot.green_premium?.valor ?? 0;
    if (typeof currentValorCreado === 'number') {
      acc.valor_creado += currentValorCreado;
    }

    const currentTirValor = snapshot.tir?.valor;
    if (typeof currentTirValor === 'number') {
      tirValues.push(currentTirValor);
    }

    return acc;
  }, {
    total_activos: total_activos,
    capex_total: 0,
    valor_creado: 0,
    tir_promedio: 0
  } as Omit<FinancialSnapshotSummary, 'tir_promedio'> & { tir_promedio: number }); // Se usa un cast para inicializar con null

  if (tirValues.length > 0) {
    const sumTir = tirValues.reduce((sum, value) => sum + value, 0);

    let rawTirPromedio: number = (sumTir / tirValues.length);
    const formattedTirPromedio = parseFloat(rawTirPromedio.toFixed(2));

    summary.tir_promedio = formattedTirPromedio;
  }

  return { ...summary, total_activos, bankReady };
};


export class FinancialSnapshotController {
  private getService() {
    return new FinancialSnapshotService();
  }

  createFinancialSnapshot = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const data: CreateFinancialSnapshotRequest = req.body;

      // Validación básica
      if (!data.building_id || !data.period_start || !data.period_end) {
        res.status(400).json({ error: 'Faltan campos requeridos' });
        return;
      }

      const snapshot = await this.getService().createFinancialSnapshot(data, userId);

      trazabilityService.registerTrazability({ authUserId: userId, buildingId: data?.building_id, action: ActionsValues['GENERAR INFORMES'], module: ModuleValues.DOCUMENTOS, description: "Crear financial snapshot" }).catch(err => console.error("Fallo trazabilidad:", err));
      res.status(201).json({ data: snapshot });
    } catch (error) {
      console.error('Error al crear financial snapshot:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  getFinancialSnapshots = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { buildingId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      if (!buildingId) {
        res.status(400).json({ error: 'buildingId es requerido' });
        return;
      }

      const snapshots = await this.getService().getFinancialSnapshotsByBuilding(buildingId, userId);
      res.json({ data: snapshots });
    } catch (error) {
      console.error('Error al obtener financial snapshots:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  getAllFinancialSnapshots = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const snapshots = await this.getService().getAllFinancialSnapshotsBuilding();
      res.json({ data: snapshots });
    } catch (error) {
      console.error('Error al obtener financial snapshots:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  getAllFinancialSnapshotsSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const snapshots = await this.getService().getAllFinancialSnapshotsBuilding();

      const summary = calculateSummary(snapshots);

      // 3. Devolver el resumen
      res.json({ data: summary });
    } catch (error) {
      console.error('Error al obtener financial snapshots summary:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  getFinancialSnapshot = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const snapshot = await this.getService().getFinancialSnapshotById(id, userId);

      if (!snapshot) {
        res.status(404).json({ error: 'Financial snapshot no encontrado' });
        return;
      }

      res.json({ data: snapshot });
    } catch (error) {
      console.error('Error al obtener financial snapshot:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  updateFinancialSnapshot = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const data: UpdateFinancialSnapshotRequest = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const snapshot = await this.getService().updateFinancialSnapshot(id, data, userId);

      if (!snapshot) {
        res.status(404).json({ error: 'Financial snapshot no encontrado' });
        return;
      }

      trazabilityService.registerTrazability({ authUserId: userId, buildingId: snapshot?.building_id, action: ActionsValues['ACTUALIZAR DATOS FINANCIEROS'], module: ModuleValues.DOCUMENTOS, description: "Actualizar financial snapshot" }).catch(err => console.error("Fallo trazabilidad:", err));

      res.json({ data: snapshot });
    } catch (error) {
      console.error('Error al actualizar financial snapshot:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  deleteFinancialSnapshot = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      await this.getService().deleteFinancialSnapshot(id, userId);
      const snapshot = await this.getService().getFinancialSnapshotById(id, userId);

      trazabilityService.registerTrazability({ authUserId: userId, buildingId: snapshot?.building_id || null, action: ActionsValues['ELIMINAR'], module: ModuleValues.DOCUMENTOS, description: "Eliminar financial snapshot" }).catch(err => console.error("Fallo trazabilidad:", err));

      res.status(204).send();
    } catch (error) {
      console.error('Error al eliminar financial snapshot:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
}


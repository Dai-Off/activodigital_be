import { Request, Response } from "express";
import { InsuranceService } from "../../domain/services/insuranceService";
import {
  CreateInsuranceRequest,
  UpdateInsuranceRequest,
  InsuranceFilters,
} from "../../types/insurance";
import { trazabilityService } from "../../domain/trazability/TrazabilityService";
import { ActionsValues, ModuleValues } from "../../domain/trazability/interfaceTrazability";

export class InsuranceController {
  private insuranceService = new InsuranceService();

  /**
   * Obtiene todas las pólizas de un edificio.
   * Requiere 'buildingId' como query param.
   * Soporta filtros opcionales: status, limit, offset.
   */
  getBuildingInsurances = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const buildingId = req.query.buildingId as string;

      if (!buildingId) {
        res.status(400).json({ error: "buildingId es requerido" });
        return;
      }

      const filters: InsuranceFilters = {
        status: req.query.status as string, // Ej: 'active'
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const policies = await this.insuranceService.getBuildingInsurances(
        buildingId,
        filters
      );

      res.status(200).json({
        data: policies,
        count: policies.length,
      });
    } catch (error) {
      console.error("Error al obtener seguros del edificio:", error);
      res.status(500).json({
        error: "Error al obtener historial de seguros",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  /**
   * Obtiene el detalle de una póliza específica por su ID.
   */
  getInsuranceById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: "ID de la póliza es requerido" });
        return;
      }

      const policy = await this.insuranceService.getInsuranceById(id);

      if (!policy) {
        res.status(404).json({ error: "Póliza no encontrada" });
        return;
      }

      res.status(200).json({
        data: policy,
      });
    } catch (error) {
      console.error("Error al obtener detalle del seguro:", error);
      res.status(500).json({
        error: "Error al obtener el seguro",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  /**
   * Crea una nueva póliza de seguro.
   */
  createInsurance = async (req: Request, res: Response): Promise<void> => {
    try {
      // Casteamos el body para tener intellisense y seguridad de tipos
      const body = req.body as CreateInsuranceRequest;

      // Validación básica de campos obligatorios
      if (!body.buildingId || !body.policyNumber || !body.insurer) {
        res
          .status(400)
          .json({
            error:
              "Faltan campos obligatorios (buildingId, policyNumber, insurer)",
          });
        return;
      }

      // El servicio se encarga de mapear a snake_case
      const newPolicy = await this.insuranceService.createInsurance(body);

      trazabilityService.registerTrazability({ authUserId: req.user?.id || null, buildingId: body?.buildingId, action: ActionsValues['CREAR'], module: ModuleValues.EDIFICIOS, description: "Subir póliza de seguro" }).catch(err => console.error("Fallo trazabilidad:", err));
      res.status(201).json({
        message: "La póliza de seguro se ha creado con éxito",
        data: newPolicy,
      });
    } catch (error) {
      console.error("Error al crear seguro:", error);
      res.status(500).json({
        error: "Error al crear la póliza",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  /**
   * Actualiza una póliza existente.
   */
  updateInsurance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const body = req.body as UpdateInsuranceRequest;

      if (!id) {
        res.status(400).json({ error: "ID de la póliza es requerido" });
        return;
      }

      const updatedPolicy = await this.insuranceService.updateInsurance(
        id,
        body
      );

      trazabilityService.registerTrazability({ authUserId: req.user?.id || null, buildingId: updatedPolicy?.buildingId, action: ActionsValues['ACTUALIZAR LIBRO DEL EDIFICIO'], module: ModuleValues.EDIFICIOS, description: "Actualizar póliza de seguro" }).catch(err => console.error("Fallo trazabilidad:", err));

      res.status(200).json({
        message: "Póliza actualizada exitosamente",
        data: updatedPolicy,
      });
    } catch (error) {
      console.error("Error al actualizar seguro:", error);
      res.status(500).json({
        error: "Error al actualizar la póliza",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  /**
   * Elimina una póliza de seguro.
   */
  deleteInsurance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: "ID de la póliza requerido" });
        return;
      }

      // Opcional: Podrías verificar permisos del usuario sobre el edificio aquí antes de borrar

      const success = await this.insuranceService.deleteInsurance(id);

      if (success) {
        const policy = await this.insuranceService.getInsuranceById(id);
        trazabilityService.registerTrazability({ authUserId: req.user?.id || null, buildingId: policy?.buildingId || null, action: ActionsValues['ELIMINAR'], module: ModuleValues.EDIFICIOS, description: "Eliminar póliza de seguro" }).catch(err => console.error("Fallo trazabilidad:", err));

        res.status(200).json({
          message: "Póliza eliminada exitosamente",
          success: true,
        });
      } else {
        // En teoría el servicio lanza error si falla, pero por seguridad:
        res.status(404).json({
          error: "No se pudo eliminar la póliza",
          success: false,
        });
      }
    } catch (error) {
      console.error("Error al eliminar seguro:", error);
      res.status(500).json({
        error: "Error al eliminar la póliza",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };
}

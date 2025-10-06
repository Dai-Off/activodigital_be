import { Request, Response } from 'express';
import { CertificateEnergeticoService } from '../../domain/services/certificateEnergeticoService';
import { 
  CreateEnergyCertificateSessionRequest,
  UpdateEnergyCertificateSessionRequest,
  ConfirmEnergyCertificateRequest,
  AIExtractionStatus,
  EnergyCertificateKind
} from '../../types/certificateEnergetico';

export class CertificateEnergeticoController {
  private getCertificateService() {
    return new CertificateEnergeticoService();
  }

  /**
   * Crear sesión de certificado energético simple (solo buildingId)
   * POST /api/certificados-energeticos/sessions/simple
   */
  createSimpleSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const { buildingId } = req.body;
      if (!buildingId) {
        res.status(400).json({ error: 'Falta el campo requerido: buildingId' });
        return;
      }

      // Crear sesión simple usando el método existente pero con datos mínimos
      const simpleRequest = {
        buildingId,
        kind: 'building' as EnergyCertificateKind, // Default kind
        documents: [] // Sin documentos inicialmente
      };

      const session = await this.getCertificateService().createEnergyCertificateSession(
        simpleRequest, 
        userId
      );
      
      res.json({ data: session });
    } catch (error) {
      console.error('Error al crear sesión simple de certificado energético:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      });
    }
  };

  /**
   * Crear sesión de certificado energético con documentos
   * POST /api/certificados-energeticos/sessions
   */
  createSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const data: CreateEnergyCertificateSessionRequest = req.body;
      
      // Validación básica
      if (!data.buildingId || !data.kind || !data.documents || data.documents.length === 0) {
        res.status(400).json({ error: 'Faltan campos requeridos: buildingId, kind, documents' });
        return;
      }

      const session = await this.getCertificateService().createEnergyCertificateSession(data, userId);
      res.status(201).json({ data: session });
    } catch (error) {
      console.error('Error al crear sesión de certificado energético:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      });
    }
  };

  /**
   * Actualizar sesión de certificado energético (para datos de IA)
   * PUT /api/certificados-energeticos/sessions/:sessionId
   */
  updateSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const sessionId = req.params.sessionId;
      const data: UpdateEnergyCertificateSessionRequest = req.body;

      const session = await this.getCertificateService().updateEnergyCertificateSession(
        sessionId, 
        data, 
        userId
      );
      
      res.json({ data: session });
    } catch (error) {
      console.error('Error al actualizar sesión de certificado energético:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      });
    }
  };

  /**
   * Confirmar certificado energético (guardar datos finales)
   * POST /api/certificados-energeticos/sessions/:sessionId/confirm
   */
  confirmCertificate = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const sessionId = req.params.sessionId;
      const finalData = req.body;

      const certificateRequest: ConfirmEnergyCertificateRequest = {
        sessionId,
        finalData
      };

      const certificate = await this.getCertificateService().confirmEnergyCertificate(
        certificateRequest, 
        userId
      );
      
      res.status(201).json({ data: certificate });
    } catch (error) {
      console.error('Error al confirmar certificado energético:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      });
    }
  };

  /**
   * Obtener sesiones y certificados de un edificio
   * GET /api/certificados-energeticos/building/:buildingId
   */
  getByBuilding = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const buildingId = req.params.buildingId;
      const certificatesData = await this.getCertificateService().getEnergyCertificatesByBuilding(
        buildingId, 
        userId
      );
      
      res.json({ data: certificatesData });
    } catch (error) {
      console.error('Error al obtener certificados del edificio:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      });
    }
  };

  /**
   * Obtener todos los certificados energéticos del usuario
   * GET /api/certificados-energeticos
   */
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const certificates = await this.getCertificateService().getAllEnergyCertificatesForUser(userId);
      res.json({ data: certificates });
    } catch (error) {
      console.error('Error al obtener certificados energéticos:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      });
    }
  };

  /**
   * Eliminar sesión de certificado energético
   * DELETE /api/certificados-energeticos/sessions/:sessionId
   */
  deleteSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const sessionId = req.params.sessionId;
      await this.getCertificateService().deleteEnergyCertificateSession(sessionId, userId);
      
      res.status(204).send();
    } catch (error) {
      console.error('Error al eliminar sesión de certificado energético:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      });
    }
  };

  /**
   * Eliminar certificado energético confirmado
   * DELETE /api/certificados-energeticos/:certificateId
   */
  deleteCertificate = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const certificateId = req.params.certificateId;
      await this.getCertificateService().deleteEnergyCertificate(certificateId, userId);
      
      res.status(204).send();
    } catch (error) {
      console.error('Error al eliminar certificado energético:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      });
    }
  };

  /**
   * Procesar certificado con datos de IA desde el frontend
   * POST /api/certificados-energeticos/process-ai-data
   */
  processAIData = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const { sessionId, extractedData } = req.body;
      
      if (!sessionId || !extractedData) {
        res.status(400).json({ error: 'Faltan campos requeridos: sessionId, extractedData' });
        return;
      }

      // Actualizar sesión con datos extraídos por IA
      const updateData: UpdateEnergyCertificateSessionRequest = {
        status: AIExtractionStatus.EXTRACTED,
        extractedData
      };

      const session = await this.getCertificateService().updateEnergyCertificateSession(
        sessionId, 
        updateData, 
        userId
      );
      
      res.json({ data: session });
    } catch (error) {
      console.error('Error al procesar datos de IA:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      });
    }
  };

  /**
   * Obtener documentos de una sesión específica
   * GET /api/certificados-energeticos/sessions/:sessionId/documents
   */
  getSessionDocuments = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const sessionId = req.params.sessionId;
      
      const documents = await this.getCertificateService().getSessionDocuments(sessionId, userId);
      
      res.json({ data: documents });
    } catch (error) {
      console.error('Error al obtener documentos de sesión:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      });
    }
  };
}

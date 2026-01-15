import { Request, Response } from 'express';
import { VencidosService } from '../../domain/services/vencidosService';
import { FiltrosVencidos } from '../../types/vencidos';

export class VencidosController {
  private vencidosService = new VencidosService();

  /**
   * GET /vencidos/kpis
   * Obtiene el resumen de KPIs de documentos vencidos
   */
  getKPIs = async (req: Request, res: Response): Promise<void> => {
    try {
      const kpis = await this.vencidosService.getKPIsResumen();

      res.status(200).json({
        kpis,
        message: 'KPIs obtenidos exitosamente'
      });
    } catch (error) {
      console.error('Error en getKPIs:', error);
      res.status(500).json({
        error: 'Error al obtener KPIs',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * GET /vencidos/categorias
   * Obtiene los conteos por categoría
   */
  getCategorias = async (req: Request, res: Response): Promise<void> => {
    try {
      const categorias = await this.vencidosService.getConteosPorCategoria();

      res.status(200).json({
        categorias,
        message: 'Categorías obtenidas exitosamente'
      });
    } catch (error) {
      console.error('Error en getCategorias:', error);
      res.status(500).json({
        error: 'Error al obtener categorías',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * GET /vencidos/listado
   * Obtiene el listado paginado y filtrado de documentos vencidos
   */
  getListado = async (req: Request, res: Response): Promise<void> => {
    try {
      const filtros: FiltrosVencidos = {
        building_id: req.query.building_id as string,
        unidad: req.query.unidad as string,
        prioridad: req.query.prioridad as 'alta' | 'media' | 'baja' | 'todas' | undefined,
        categoria: req.query.categoria as string,
        tipo_documento: req.query.tipo_documento as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sort: req.query.sort as 'mas_retrasado' | 'menos_retrasado' | 'mas_reciente' | 'menos_reciente' | undefined
      };

      const resultado = await this.vencidosService.getListadoVencidos(filtros);

      res.status(200).json({
        data: resultado,
        message: 'Listado obtenido exitosamente'
      });
    } catch (error) {
      console.error('Error en getListado:', error);
      res.status(500).json({
        error: 'Error al obtener listado',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * GET /vencidos/:id
   * Obtiene el detalle de un documento vencido
   */
  getDetalle = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'ID requerido',
          message: 'Debe proporcionar un ID de documento'
        });
        return;
      }

      const documento = await this.vencidosService.getDetalleItem(id);

      if (!documento) {
        res.status(404).json({
          error: 'Documento no encontrado',
          message: 'El documento no existe o no está vencido'
        });
        return;
      }

      res.status(200).json({
        data: documento,
        message: 'Detalle obtenido exitosamente'
      });
    } catch (error) {
      console.error('Error en getDetalle:', error);
      res.status(500).json({
        error: 'Error al obtener detalle',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * GET /vencidos/filtros
   * Obtiene los valores únicos disponibles para los filtros
   */
  getFiltrosDisponibles = async (req: Request, res: Response): Promise<void> => {
    try {
      const filtros = await this.vencidosService.getFiltrosDisponibles();

      res.status(200).json({
        data: filtros,
        message: 'Filtros disponibles obtenidos exitosamente'
      });
    } catch (error) {
      console.error('Error en getFiltrosDisponibles:', error);
      res.status(500).json({
        error: 'Error al obtener filtros disponibles',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };
}


import { Request, Response } from 'express';
import { ReportService, ReportConfig } from '../../domain/services/reportService';

const reportService = new ReportService();

export class ReportController {
  async getReportableFields(req: Request, res: Response): Promise<void> {
    try {
      const fields = await reportService.getReportableFields();
      res.status(200).json(fields);
    } catch (error: any) {
      console.error('Error in getReportableFields:', error);
      res.status(500).json({ error: error.message || 'Error fetching report fields' });
    }
  }

  async generateReport(req: Request, res: Response): Promise<void> {
    try {
      const { title, buildingIds, selectedFields, format, category, config } = req.body;
      const userAuthId = req.user?.id;

      if (!userAuthId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      if (!title || !buildingIds || !selectedFields || !format) {
        res.status(400).json({ error: 'Faltan parámetros requeridos (title, buildingIds, selectedFields, format)' });
        return;
      }

      const options: ReportConfig = {
        title,
        buildingIds,
        selectedFields,
        format,
        category,
        config
      };

      // Call service
      const reportMetadata = await reportService.generateReport(options, userAuthId);

      // Return the generated metadata (which contains the status and file_url)
      res.status(201).json(reportMetadata);
    } catch (error: any) {
      console.error('Error generating report:', error);
      res.status(500).json({ error: error.message || 'Error generating report' });
    }
  }

  async getReports(req: Request, res: Response): Promise<void> {
    try {
      const userAuthId = req.user?.id;
      const category = req.query.category as string;

      if (!userAuthId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const reports = await reportService.getReports(userAuthId, category);
      res.status(200).json(reports);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ error: error.message || 'Error fetching reports' });
    }
  }

  async deleteReport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userAuthId = req.user?.id;

      if (!userAuthId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const supabase = reportService.getSupabase();
      
      // Check ownership
      const { data: report } = await supabase
        .from('reports')
        .select('created_by')
        .eq('id', id)
        .single();
        
      if (!report) {
         res.status(404).json({ error: 'Reporte no encontrado' });
         return;
      }

      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id)
        .eq('created_by', report.created_by); // Added safety

      if (error) throw error;

      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting report:', error);
      res.status(500).json({ error: error.message || 'Error deleting report' });
    }
  }
}

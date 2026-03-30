import { getSupabaseClient } from "../../lib/supabase";
import { v4 as uuidv4 } from 'uuid';
import * as ExcelJS from 'exceljs';
import puppeteer from 'puppeteer';
import { UserService } from "./userService";
import { BuildingService } from "./edificioService";

export interface ReportConfig {
  title: string;
  buildingIds: string[];
  selectedFields: string[];
  format: "pdf" | "excel";
  category?: string;
  config?: any; // colors, logo
}

export class ReportService {
  private userService = new UserService();
  private buildingService = new BuildingService();

  getSupabase() {
    return getSupabaseClient();
  }

  /**
   * Returns the dynamic definitions of categories and fields that can be included in a report.
   * This matches the frontend's categorization.
   */
  async getReportableFields() {
    return [
      {
        id: "general",
        title: "Información General del Edificio",
        icon: "Building2",
        fields: [
          { id: "b_id", label: "ID del Edificio", type: "text" },
          { id: "b_name", label: "Nombre del Edificio", type: "text" },
          { id: "b_type", label: "Tipo de Edificio", type: "text" },
          { id: "b_address", label: "Dirección", type: "text" },
          { id: "b_year", label: "Año de Construcción", type: "number" },
          { id: "b_floors", label: "Número de Plantas", type: "number" },
          { id: "b_surface", label: "Superficie Total", type: "text" }
        ]
      },
      // ... Add more standard categories mapping to building table and relations
      {
        id: "financial",
        title: "Información Financiera",
        icon: "ChartColumn",
        fields: [
          { id: "f_price", label: "Valor del Activo", type: "currency" },
          { id: "f_rehab", label: "Coste de Rehabilitación", type: "currency" },
          { id: "f_potential", label: "Valor Potencial", type: "currency" }
        ]
      },
      {
        id: "energy",
        title: "Eficiencia Energética",
        icon: "Zap",
        fields: [
          { id: "en_cert", label: "Certificación Energética", type: "text" },
          { id: "en_cons", label: "Consumo Energético", type: "text" },
          { id: "en_carb", label: "Huella de Carbono", type: "text" }
        ]
      },
      {
        id: "occupancy",
        title: "Ocupación y Unidades",
        icon: "Building2",
        fields: [
          { id: "u_total", label: "Total de Unidades", type: "number" }
        ]
      },
      {
        id: "compliance",
        title: "Cumplimiento y Legal",
        icon: "FileText",
        fields: [
          { id: "c_cadastral", label: "Referencia Catastral", type: "text" },
          { id: "c_status", label: "Estado de Libro", type: "text" }
        ]
      },
      {
        id: "maintenance",
        title: "Mantenimiento",
        icon: "Building2",
        fields: [
          { id: "m_floors", label: "Número de Plantas", type: "number" }
        ]
      }
    ];
  }

  /**
   * Helper to map a field ID to a building's property value.
   */
  private getFieldValue(building: any, fieldId: string): string {
    switch (fieldId) {
      case 'b_id': return building.id;
      case 'b_name': return building.name || 'Sin Nombre';
      case 'b_address': return building.address || 'N/A';
      case 'b_year': return building.constructionYear?.toString() || 'N/A';
      case 'b_floors': 
      case 'm_floors': return building.numFloors?.toString() || 'N/A';
      case 'b_type': return building.typology || 'N/A';
      case 'b_surface': return building.squareMeters ? `${building.squareMeters} m²` : 'N/A';
      case 'en_cert': return building.energyRating || 'N/A';
      case 'en_cons': return building.energyConsumption ? `${building.energyConsumption} kWh/m²a` : 'N/A';
      case 'en_carb': return building.carbonEmissions ? `${building.carbonEmissions} kgCO2/m²a` : 'N/A';
      case 'u_total': return building.numUnits?.toString() || 'N/A';
      case 'f_price': return building.price ? `${building.price} €` : 'N/A';
      case 'f_rehab': return building.rehabilitationCost ? `${building.rehabilitationCost} €` : 'N/A';
      case 'f_potential': return building.potentialValue ? `${building.potentialValue} €` : 'N/A';
      case 'c_cadastral': return building.cadastralReference || 'N/A';
      case 'c_status': return building.status || 'N/A';
      default: return 'N/A';
    }
  }

  /**
   * Generates a report securely for a user.
   */
  async generateReport(options: ReportConfig, userAuthId: string) {
    const user = await this.userService.getUserByAuthId(userAuthId);
    if (!user) throw new Error("Usuario no encontrado");

    // 1. Create a "pending" entry in the database
    const supabase = this.getSupabase();
    const { data: reportRecord, error: insertError } = await supabase
      .from('reports')
      .insert({
        title: options.title,
        category: options.category || 'general',
        format: options.format,
        building_ids: options.buildingIds,
        selected_fields: options.selectedFields,
        config: options.config || {},
        created_by: user.id,
        status: 'generating'
      })
      .select()
      .single();

    if (insertError || !reportRecord) {
      console.error("Error creating report record:", insertError);
      throw new Error(`No se pudo crear el registro del reporte: ${insertError?.message}`);
    }

    try {
      // 2. Fetch raw data asynchronously related to the buildings
      const rawData = await this.gatherBuildingData(options.buildingIds, userAuthId);

      // 3. Generate the file based on format
      let fileBuffer: Buffer | null = null;
      let contentType = "";
      let fileExtension = "";

      if (options.format === "excel") {
        fileBuffer = await this.generateExcel(options, rawData);
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        fileExtension = "xlsx";
      } else {
        fileBuffer = await this.generatePDF(options, rawData);
        contentType = "application/pdf";
        fileExtension = "pdf";
      }

      // 4. Upload to Supabase Storage in the 'reports' bucket
      // Sanitizamos el título para evitar problemas en la URL/File system
      const safeTitle = options.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `${user.id}/${safeTitle}_${reportRecord.id}.${fileExtension}`;
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('reports')
        .upload(fileName, fileBuffer, {
          contentType,
          upsert: true
        });

      if (uploadError) throw new Error(`Error subiendo a Storage: ${uploadError.message}`);

      // 5. Get Public URL or signed URL based on bucket settings.
      // Assuming public bucket for simplicity but in pro we would use signed urls on download
      const { data: { publicUrl } } = supabase
        .storage
        .from('reports')
        .getPublicUrl(fileName);

      // 6. Update the report record to completed
      const { data: updatedReport } = await supabase
        .from('reports')
        .update({
          status: 'completed',
          file_url: publicUrl,
          file_size: fileBuffer.length
        })
        .eq('id', reportRecord.id)
        .select()
        .single();

      return updatedReport;
      
    } catch (error: any) {
      console.error("Generación de reporte fallida:", error);
      // Update the record as failed
      await supabase
        .from('reports')
        .update({
          status: 'failed',
          error_message: error.message || 'Error desconocido'
        })
        .eq('id', reportRecord.id);

      throw error;
    }
  }

  /**
   * Retrieves reports for a user, optionally filtering by category.
   */
  async getReports(userAuthId: string, category?: string) {
    const user = await this.userService.getUserByAuthId(userAuthId);
    if (!user) throw new Error("Usuario no encontrado");

    let query = this.getSupabase()
      .from('reports')
      .select('*')
      // Note: adjust access controls as needed. For now assuming user sees their buildings' reports or their own
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Error fetching reports: ${error.message}`);
    return data;
  }

  /**
   * Helper to fetch everything needed for a set of buildings.
   */
  private async gatherBuildingData(buildingIds: string[], userAuthId: string) {
    // Reusing the building logic safely
    const buildings: any[] = [];
    for (const id of buildingIds) {
      try {
        const b = await this.buildingService.getBuildingById(id, userAuthId);
        if (b) {
          // Fetch latest energy certificate
          const { data: cert } = await this.getSupabase()
            .from('energy_certificates')
            .select('rating, primary_energy_kwh_per_m2_year, emissions_kg_co2_per_m2_year')
            .eq('building_id', id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (cert) {
            b.energyRating = cert.rating;
            b.energyConsumption = cert.primary_energy_kwh_per_m2_year;
            b.carbonEmissions = cert.emissions_kg_co2_per_m2_year;
          }
          
          buildings.push(b);
        }
      } catch (e) {
        console.warn(`No se pudo obtener el edificio ${id}`);
      }
    }
    return buildings;
  }

  /**
   * Excel Generation
   */
  private async generateExcel(options: ReportConfig, buildings: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Activo Digital";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(options.title.substring(0, 31) || "Reporte");

    // Dynamic headers based on selected fields
    // NOTE: A robust implementation maps `selectedFields` IDs strictly to DB row keys. 
    // Here we define a basic structure.
    const allFields = await this.getReportableFields();
    const columns: Partial<ExcelJS.Column>[] = [
      { header: "Edificio", key: "b_name", width: 30 }
    ];

    allFields.forEach(cat => {
      cat.fields.forEach(field => {
        if (options.selectedFields.includes(field.id) && field.id !== 'b_name') {
          columns.push({ header: field.label, key: field.id, width: 25 });
        }
      });
    });

    sheet.columns = columns as any;

    const primaryColorHex = options.config?.primaryColor?.replace('#', '') || '1e3a8a';
    const headerColor = `FF${primaryColorHex.toUpperCase()}`;

    // Apply header styling
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: headerColor }
    };

    // Add rows
    buildings.forEach(b => {
      const rowData: any = {
        b_name: b.name || 'Sin Nombre',
      };

      // Automate mapping for all selected fields
      options.selectedFields.forEach(fid => {
        if (fid !== 'b_name') {
          rowData[fid] = this.getFieldValue(b, fid);
        }
      });

      sheet.addRow(rowData);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * PDF Generation 
   * Uses Puppeteer to render a dynamic HTML string and capture a PDF
   */
  private async generatePDF(options: ReportConfig, buildings: any[]): Promise<Buffer> {
    const primaryColor = options.config?.primaryColor || '#1e3a8a';
    const secondaryColor = options.config?.secondaryColor || '#3b82f6';
    const logoBase64 = options.config?.logoBase64;

    const allFields = await this.getReportableFields();
    const fieldMap = new Map();
    allFields.forEach(cat => cat.fields.forEach(f => fieldMap.set(f.id, f.label)));

    let logoHtml = '';
    if (logoBase64) {
      logoHtml = `<div style="text-align: right; margin-bottom: -60px;"><img src="${logoBase64}" alt="Logo" style="max-height: 50px; object-fit: contain; max-width: 150px;" /></div>`;
    }

    const rowsHtml = buildings.map(b => {
      const fieldList = options.selectedFields.map(fid => {
        const label = fieldMap.get(fid) || fid;
        const val = this.getFieldValue(b, fid);
        return `<li><strong>${label}:</strong> <span>${val}</span></li>`;
      }).join('');

      return `
        <div class="building-card">
          <h3>${b.name || 'Sin Nombre'}</h3>
          <ul>${fieldList}</ul>
        </div>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
          .header { border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: ${primaryColor}; margin: 0; padding-right: 160px; font-size: 28px; }
          .subtitle { color: #666; font-size: 14px; margin-top: 5px; }
          .building-card { border: 1px solid #e5e7eb; border-top: 4px solid ${secondaryColor}; border-radius: 8px; padding: 20px; margin-bottom: 20px; page-break-inside: auto; background: #fff; }
          .building-card h3 { margin-top: 0; color: ${primaryColor}; border-bottom: 1px solid #f3f4f6; padding-bottom: 12px; margin-bottom: 16px; font-size: 18px; }
          .building-card ul { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .building-card li { font-size: 13px; padding: 10px 12px; background: #f9fafb; border-radius: 6px; display: flex; flex-direction: column; gap: 4px; border: 1px solid #f3f4f6; position: relative; }
          .building-card li::before { content: ""; position: absolute; left: 0; top: 12px; bottom: 12px; width: 3px; background: ${secondaryColor}; border-radius: 0 4px 4px 0; }
          .building-card li strong { color: #4b5563; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin-left: 4px; }
          .building-card li span { color: #111827; font-weight: 500; margin-left: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoHtml}
          <h1>${options.title}</h1>
          <p class="subtitle">Generado el ${new Date().toLocaleDateString('es-ES')}</p>
          <p class="subtitle">Formato: PDF • Edificios Analizados: ${buildings.length}</p>
        </div>
        
        <h2 style="color: ${primaryColor}; border-left: 5px solid ${secondaryColor}; padding-left: 12px; font-size: 20px; margin-bottom: 24px;">Resumen de Edificios</h2>
        ${rowsHtml}
        
      </body>
      </html>
    `;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}

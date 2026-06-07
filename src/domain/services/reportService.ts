import { getSupabaseClient } from "../../lib/supabase";
import { v4 as uuidv4 } from "uuid";
import * as ExcelJS from "exceljs";
import { UserService } from "./userService";
import { BuildingService } from "./edificioService";
import { createElement as h } from "react";


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
          { id: "b_surface", label: "Superficie Total", type: "text" },
        ],
      },
      // ... Add more standard categories mapping to building table and relations
      {
        id: "financial",
        title: "Información Financiera",
        icon: "ChartColumn",
        fields: [
          { id: "f_price", label: "Valor del Activo", type: "currency" },
          { id: "f_rehab", label: "Coste de Rehabilitación", type: "currency" },
          { id: "f_potential", label: "Valor Potencial", type: "currency" },
        ],
      },
      {
        id: "energy",
        title: "Eficiencia Energética",
        icon: "Zap",
        fields: [
          { id: "en_cert", label: "Certificación Energética", type: "text" },
          { id: "en_cons", label: "Consumo Energético", type: "text" },
          { id: "en_carb", label: "Huella de Carbono", type: "text" },
        ],
      },
      {
        id: "occupancy",
        title: "Ocupación y Unidades",
        icon: "Building2",
        fields: [{ id: "u_total", label: "Total de Unidades", type: "number" }],
      },
      {
        id: "compliance",
        title: "Cumplimiento y Legal",
        icon: "FileText",
        fields: [
          { id: "c_cadastral", label: "Referencia Catastral", type: "text" },
          { id: "c_status", label: "Estado de Libro", type: "text" },
        ],
      },
      {
        id: "maintenance",
        title: "Mantenimiento",
        icon: "Building2",
        fields: [
          { id: "m_floors", label: "Número de Plantas", type: "number" },
        ],
      },
    ];
  }

  /**
   * Helper to map a field ID to a building's property value.
   */
  private getFieldValue(building: any, fieldId: string): string {
    switch (fieldId) {
      case "b_id":
        return building.id;
      case "b_name":
        return building.name || "Sin Nombre";
      case "b_address":
        return building.address || "N/A";
      case "b_year":
        return building.constructionYear?.toString() || "N/A";
      case "b_floors":
      case "m_floors":
        return building.numFloors?.toString() || "N/A";
      case "b_type":
        return building.typology || "N/A";
      case "b_surface":
        return building.squareMeters ? `${building.squareMeters} m²` : "N/A";
      case "en_cert":
        return building.energyRating || "N/A";
      case "en_cons":
        return building.energyConsumption
          ? `${building.energyConsumption} kWh/m²a`
          : "N/A";
      case "en_carb":
        return building.carbonEmissions
          ? `${building.carbonEmissions} kgCO2/m²a`
          : "N/A";
      case "u_total":
        return building.numUnits?.toString() || "N/A";
      case "f_price":
        return building.price ? `${building.price} €` : "N/A";
      case "f_rehab":
        return building.rehabilitationCost
          ? `${building.rehabilitationCost} €`
          : "N/A";
      case "f_potential":
        return building.potentialValue ? `${building.potentialValue} €` : "N/A";
      case "c_cadastral":
        return building.cadastralReference || "N/A";
      case "c_status":
        return building.status || "N/A";
      default:
        return "N/A";
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
      .from("reports")
      .insert({
        title: options.title,
        category: options.category || "general",
        format: options.format,
        building_ids: options.buildingIds,
        selected_fields: options.selectedFields,
        config: options.config || {},
        created_by: user.id,
        status: "generating",
      })
      .select()
      .single();

    if (insertError || !reportRecord) {
      console.error("Error creating report record:", insertError);
      throw new Error(
        `No se pudo crear el registro del reporte: ${insertError?.message}`,
      );
    }

    try {
      // 2. Fetch raw data asynchronously related to the buildings
      const rawData = await this.gatherBuildingData(
        options.buildingIds,
        userAuthId,
      );

      // 3. Generate the file based on format
      let fileBuffer: Buffer | null = null;
      let contentType = "";
      let fileExtension = "";

      if (options.format === "excel") {
        fileBuffer = await this.generateExcel(options, rawData);
        contentType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        fileExtension = "xlsx";
      } else {
        fileBuffer = await this.generatePDF(options, rawData);
        contentType = "application/pdf";
        fileExtension = "pdf";
      }

      // 4. Upload to Supabase Storage in the 'reports' bucket
      // Sanitizamos el título para evitar problemas en la URL/File system
      const safeTitle = options.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const fileName = `${user.id}/${safeTitle}_${reportRecord.id}.${fileExtension}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("reports")
        .upload(fileName, fileBuffer, {
          contentType,
          upsert: true,
        });

      if (uploadError)
        throw new Error(`Error subiendo a Storage: ${uploadError.message}`);

      // 5. Get Public URL or signed URL based on bucket settings.
      // Assuming public bucket for simplicity but in pro we would use signed urls on download
      const {
        data: { publicUrl },
      } = supabase.storage.from("reports").getPublicUrl(fileName);

      // 6. Update the report record to completed
      const { data: updatedReport } = await supabase
        .from("reports")
        .update({
          status: "completed",
          file_url: publicUrl,
          file_size: fileBuffer.length,
        })
        .eq("id", reportRecord.id)
        .select()
        .single();

      return updatedReport;
    } catch (error: any) {
      console.error("Generación de reporte fallida:", error);
      // Update the record as failed
      await supabase
        .from("reports")
        .update({
          status: "failed",
          error_message: error.message || "Error desconocido",
        })
        .eq("id", reportRecord.id);

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
      .from("reports")
      .select("*")
      // Note: adjust access controls as needed. For now assuming user sees their buildings' reports or their own
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (category && category !== "all") {
      query = query.eq("category", category);
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
            .from("energy_certificates")
            .select(
              "rating, primary_energy_kwh_per_m2_year, emissions_kg_co2_per_m2_year",
            )
            .eq("building_id", id)
            .order("created_at", { ascending: false })
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
  private async generateExcel(
    options: ReportConfig,
    buildings: any[],
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Activo Digital";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(
      options.title.substring(0, 31) || "Reporte",
    );

    // Dynamic headers based on selected fields
    // NOTE: A robust implementation maps `selectedFields` IDs strictly to DB row keys.
    // Here we define a basic structure.
    const allFields = await this.getReportableFields();
    const columns: Partial<ExcelJS.Column>[] = [
      { header: "Edificio", key: "b_name", width: 30 },
    ];

    allFields.forEach((cat) => {
      cat.fields.forEach((field) => {
        if (
          options.selectedFields.includes(field.id) &&
          field.id !== "b_name"
        ) {
          columns.push({ header: field.label, key: field.id, width: 25 });
        }
      });
    });

    sheet.columns = columns as any;

    const primaryColorHex =
      options.config?.primaryColor?.replace("#", "") || "1e3a8a";
    const headerColor = `FF${primaryColorHex.toUpperCase()}`;

    // Apply header styling
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: headerColor },
    };

    // Add rows
    buildings.forEach((b) => {
      const rowData: any = {
        b_name: b.name || "Sin Nombre",
      };

      // Automate mapping for all selected fields
      options.selectedFields.forEach((fid) => {
        if (fid !== "b_name") {
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
   * Uses @react-pdf/renderer to generate a professional PDF without a headless browser
   */
  private async generatePDF(
    options: ReportConfig,
    buildings: any[],
  ): Promise<Buffer> {
    // Usamos import dinámico nativo por Function para evadir la interceptación de CommonJS en producción
    const dynamicImport = new Function('modulePath', 'return import(modulePath)');
    const reactPdf = await (dynamicImport("@react-pdf/renderer") as Promise<any>);
    const {
      Document,
      Page,
      View,
      Text,
      Image,
      StyleSheet,
      renderToBuffer,
    } = reactPdf;

    const primaryColor = options.config?.primaryColor || "#1e3a8a";
    const secondaryColor = options.config?.secondaryColor || "#3b82f6";
    const logoBase64 = options.config?.logoBase64;

    const allFields = await this.getReportableFields();
    const fieldMap = new Map();
    allFields.forEach((cat) =>
      cat.fields.forEach((f) => fieldMap.set(f.id, f.label)),
    );

    const styles = StyleSheet.create({
      page: {
        padding: 40,
        fontFamily: "Helvetica",
        color: "#333",
      },
      header: {
        borderBottomWidth: 2,
        borderBottomColor: primaryColor,
        paddingBottom: 20,
        marginBottom: 30,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
      },
      headerInfo: {
        flex: 1,
      },
      logo: {
        maxHeight: 50,
        maxWidth: 150,
        objectFit: "contain",
      },
      title: {
        color: primaryColor,
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 5,
      },
      subtitle: {
        color: "#666",
        fontSize: 12,
        marginBottom: 2,
      },
      sectionTitle: {
        color: primaryColor,
        borderLeftWidth: 5,
        borderLeftColor: secondaryColor,
        paddingLeft: 12,
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 20,
      },
      buildingCard: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderTopWidth: 4,
        borderTopColor: secondaryColor,
        borderRadius: 8,
        padding: 15,
        marginBottom: 20,
        backgroundColor: "#fff",
      },
      buildingName: {
        fontSize: 16,
        fontWeight: "bold",
        color: primaryColor,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
        paddingBottom: 8,
        marginBottom: 12,
      },
      fieldsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
      },
      fieldItem: {
        width: "48%", // Approx 2 columns
        padding: "8 10",
        backgroundColor: "#f9fafb",
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#f3f4f6",
        borderLeftWidth: 3,
        borderLeftColor: secondaryColor,
        flexDirection: "column",
      },
      fieldLabel: {
        color: "#4b5563",
        fontSize: 9,
        fontWeight: "bold",
        textTransform: "uppercase",
      },
      fieldValue: {
        color: "#111827",
        fontSize: 11,
        fontWeight: "medium",
        marginTop: 2,
      },
    });

    const doc = h(
      Document,
      null,
      h(
        Page,
        { size: "A4", style: styles.page },
        h(
          View,
          { style: styles.header },
          h(
            View,
            { style: styles.headerInfo },
            h(Text, { style: styles.title }, options.title),
            h(
              Text,
              { style: styles.subtitle },
              `Generado el ${new Date().toLocaleDateString("es-ES")}`,
            ),
            h(
              Text,
              { style: styles.subtitle },
              `Formato: PDF • Edificios Analizados: ${buildings.length}`,
            ),
          ),
          logoBase64 ? h(Image, { src: logoBase64, style: styles.logo }) : null,
        ),

        h(Text, { style: styles.sectionTitle }, "Resumen de Edificios"),

        buildings.map((b, index) =>
          h(
            View,
            { key: index, style: styles.buildingCard, wrap: false },
            h(Text, { style: styles.buildingName }, b.name || "Sin Nombre"),
            h(
              View,
              { style: styles.fieldsGrid },
              options.selectedFields.map((fid) => {
                const label = fieldMap.get(fid) || fid;
                const val = this.getFieldValue(b, fid);
                return h(
                  View,
                  { key: fid, style: styles.fieldItem },
                  h(Text, { style: styles.fieldLabel }, label),
                  h(Text, { style: styles.fieldValue }, val),
                );
              }),
            ),
          ),
        ),
      ),
    );

    const buffer = await renderToBuffer(doc);
    return Buffer.from(buffer);
  }
}

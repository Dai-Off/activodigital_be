import { getSupabaseClient } from "../../lib/supabase";
import { getDataRoomLabel } from "../../utils/dataRoomLabels";
import type { DataRoomProcessingJob } from "../../types/dataRoomProcessingJob";

const STORAGE_BUCKET = "data-room-audit";

/**
 * Respuesta exitosa del webhook n8n de validación de documentos.
 */
export interface N8nValidationResult {
  building_match: boolean;
  matches_expected: boolean;
  detected_document_type: string;
  confidence: number;
  building_name?: string;
  direccion?: string;
  datos_extraidos?: Record<string, unknown>;
  storage_path?: string;
}

/**
 * Respuesta de error de validación del webhook n8n.
 */
interface N8nValidationError {
  error: true;
  reason: string;
  details?: {
    building_match?: boolean;
    matches_expected?: boolean;
    building_name?: string;
    detected_type?: string;
  };
}

/**
 * Servicio que encapsula la comunicación con el webhook de n8n
 * para la validación de documentos del Data Room con IA.
 */
export class N8nDataRoomService {
  private webhookUrl: string;

  constructor() {
    const url = process.env.N8N_DATAROOM_WEBHOOK_URL;
    if (!url) {
      throw new Error(
        "N8N_DATAROOM_WEBHOOK_URL no está configurado. Agrega esta variable de entorno.",
      );
    }
    this.webhookUrl = url;
  }

  /**
   * Procesa un documento del Data Room enviándolo al webhook de n8n.
   *
   * 1. Descarga el archivo desde Supabase Storage
   * 2. Obtiene el building_name desde la tabla buildings
   * 3. Envía el archivo + metadatos al webhook n8n
   * 4. Retorna los datos extraídos por la IA
   *
   * @throws Error si n8n rechaza el documento (400) o si hay error técnico (5xx)
   */
  async processDocument(
    record: DataRoomProcessingJob,
  ): Promise<N8nValidationResult> {
    const supabase = getSupabaseClient();

    // 1. Descargar archivo desde Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(record.temp_storage_path);

    if (downloadError || !fileData) {
      throw new Error(
        `No se pudo descargar el archivo desde Storage: ${downloadError?.message || "archivo vacío"}`,
      );
    }

    // 2. Obtener building_name
    const buildingName = await this.getBuildingName(record.building_id);

    // 3. Obtener documento_esperado desde el label del checklist
    const isAuto = record.checklist_id === "__auto__";
    const documentoEsperado = isAuto
      ? "auto"
      : getDataRoomLabel(record.checklist_id);

    // 4. Construir FormData para el webhook
    const formData = new FormData();

    // Convertir Blob a un File-like con nombre
    const fileBlob = new Blob([await fileData.arrayBuffer()], {
      type: record.mime_type,
    });
    formData.append("file", fileBlob, record.file_name);
    formData.append("building_id", record.building_id);
    formData.append("building_name", buildingName);
    formData.append("documento_esperado", documentoEsperado);

    // 5. Enviar al webhook n8n
    console.log(
      `[N8nDataRoom] Enviando documento a n8n: ${record.file_name} (building: ${buildingName}, tipo: ${documentoEsperado})`,
    );

    const response = await fetch(this.webhookUrl, {
      method: "POST",
      body: formData,
    });

    // 6. Procesar respuesta
    const responseBody = await response.json();

    if (!response.ok) {
      if (response.status === 400) {
        const errorBody = responseBody as N8nValidationError;
        const reason =
          errorBody.reason || "Validación fallida por el agente IA";
        const details = errorBody.details
          ? ` | building_match: ${errorBody.details.building_match}, matches_expected: ${errorBody.details.matches_expected}, detected_type: ${errorBody.details.detected_type}`
          : "";
        throw new Error(`Documento rechazado por n8n: ${reason}${details}`);
      }

      // Error técnico (5xx): lanzar para que BullMQ reintente
      throw new Error(
        `Error técnico del webhook n8n (HTTP ${response.status}): ${JSON.stringify(responseBody)}`,
      );
    }

    console.log(
      `[N8nDataRoom] Documento procesado exitosamente: ${record.file_name} | confidence: ${responseBody.confidence}`,
    );

    return responseBody as N8nValidationResult;
  }

  /**
   * Obtiene el nombre de un edificio desde la tabla buildings.
   */
  private async getBuildingName(buildingId: string): Promise<string> {
    const { data, error } = await getSupabaseClient()
      .from("buildings")
      .select("name")
      .eq("id", buildingId)
      .single();

    if (error || !data?.name) {
      console.warn(
        `[N8nDataRoom] No se encontró nombre para building ${buildingId}, usando fallback`,
      );
      return "unknown-building";
    }

    return data.name;
  }
}

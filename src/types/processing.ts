/** Registro mínimo que debe tener un job en BD para que el worker pueda procesarlo y notificar. */
export interface ProcessingJobRecord {
    id: string;
    user_id: string;
    building_id: string;
    status: string;
    document_filename?: string;
    [key: string]: unknown;
}

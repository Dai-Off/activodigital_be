// Tipos para documentos vencidos

export interface ContenidoExtraido {
  area?: string;
  estado: string;
  importe?: string;
  resumen?: string;
  vigencia?: string;
  categoria?: string;
  responsable?: string;
  consecuencia?: string;
  fecha_emision?: string;
  numero_referencia?: string;
  prioridad?: string;
}

export interface DocumentoVencido {
  idx: number;
  id: string;
  building_id: string;
  tipo_documento: string;
  contenido_extraido: ContenidoExtraido;
  building_name: string;
  direccion: string;
  validado: boolean;
  confidence: string;
  storage_path: string;
  created_at: string;
  // Campos calculados
  dias_vencido?: number;
  prioridad_calculada?: 'alta' | 'media' | 'baja';
}

export interface KPIsResumen {
  total_vencidos: number;
  alta_prioridad: number;
  media_prioridad: number;
  dias_promedio: number;
  deuda_total: number;
  sin_cobertura: number;
}

export interface CategoriaConteo {
  nombre: string;
  icono?: string;
  cantidad: number;
}

export interface FiltrosVencidos {
  building_id?: string;
  unidad?: string;
  prioridad?: 'alta' | 'media' | 'baja' | 'todas';
  categoria?: string;
  tipo_documento?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'mas_retrasado' | 'menos_retrasado' | 'mas_reciente' | 'menos_reciente';
}

export interface FiltrosDisponibles {
  tipos_documento: string[];
  categorias: string[];
  edificios: Array<{ id: string; nombre: string }>;
}

export interface ListadoVencidosResponse {
  items: DocumentoVencido[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CategoriasResponse {
  categorias: CategoriaConteo[];
}

export interface KPIsResponse {
  kpis: KPIsResumen;
}


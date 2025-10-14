// Estado del libro digital
export enum LibroDigitalEstado {
  EN_BORRADOR = 'en_borrador',
  VALIDADO = 'validado',
  PUBLICADO = 'publicado'
}

// Archivo de documento cargado en Supabase Storage
export interface DocumentFile {
  id: string;
  url: string; // Signed URL de Supabase Storage
  fileName: string;
  fileSize: number; // en bytes
  mimeType: string;
  title?: string;
  uploadedAt: string; // ISO date
  uploadedBy: string; // userId que subió el archivo
}

// Tipos de secciones principales
export enum LibroDigitalSectionType {
  DATOS_GENERALES = 'datos_generales',
  AGENTES_INTERVINIENTES = 'agentes_intervinientes',
  PROYECTO_TECNICO = 'proyecto_tecnico',
  DOCUMENTACION_ADMINISTRATIVA = 'documentacion_administrativa',
  MANUAL_USO_MANTENIMIENTO = 'manual_uso_mantenimiento',
  REGISTRO_INCIDENCIAS_ACTUACIONES = 'registro_incidencias_actuaciones',
  CERTIFICADOS_GARANTIAS = 'certificados_garantias',
  ANEXOS_PLANOS = 'anexos_planos'
}

// GeoJSON mínimo (Point)
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

// Sección: Datos Generales
export interface DatosGenerales {
  nombreEdificio?: string;
  direccion?: string;
  referenciaCatastral?: string;
  anioConstruccion?: number;
  tipologia?: string; // residencial, terciario, público, logístico, etc.
  superficieTotal?: number; // m²
  localizacionGeo?: GeoJSONPoint;
}

// Sección: Agentes Intervinientes
export interface AgenteBasico {
  nombre?: string;
  cif?: string; // o NIF
  contacto?: string;
  colegiado?: string;
}

export interface AgentesIntervinientes {
  promotor?: AgenteBasico | string;
  proyectista?: AgenteBasico | string;
  directorObra?: string;
  constructor?: string;
  otrosAgentes?: string[];
}

// Sección: Proyecto Técnico
export interface ProyectoTecnico {
  proyectoEjecucion?: DocumentFile[]; // Proyecto de ejecución (PDFs, DWGs, etc.)
  modificacionesProyecto?: DocumentFile[]; // Modificaciones al proyecto
  memoriaObra?: DocumentFile[]; // Memoria descriptiva de la obra
  planos?: DocumentFile[]; // Planos técnicos
}

// Sección: Documentación Administrativa y Legal
export interface DocumentacionAdministrativa {
  licenciasObra?: DocumentFile[]; // Licencias de obra
  licenciaPrimeraOcupacion?: DocumentFile[]; // Licencia de primera ocupación
  autorizacionesAdministrativas?: DocumentFile[]; // Autorizaciones administrativas
  garantiasAgentes?: DocumentFile[]; // Garantías de agentes
  seguroDecenal?: DocumentFile[]; // Seguro decenal
}

// Sección: Manual de Uso y Mantenimiento
export interface ManualUsoMantenimiento {
  instruccionesUso?: DocumentFile[]; // Instrucciones de uso
  planMantenimientoPreventivo?: DocumentFile[]; // Plan de mantenimiento preventivo
  recomendacionesConservacion?: DocumentFile[]; // Recomendaciones de conservación
  documentacionInstalaciones?: DocumentFile[]; // Documentación de instalaciones (ascensores, calderas, etc.)
}

// Sección: Registro de Incidencias y Actuaciones
export interface RegistroIncidenciaItem {
  fecha: string; // ISO date
  descripcion: string;
  responsable?: string;
}

export interface RegistroObraRehabilitacionItem {
  fecha: string; // ISO date
  tipo: string;
  coste?: number;
  evidencia?: DocumentFile[]; // Evidencias documentales
}

export interface RegistroMantenimientoItem {
  fecha: string; // ISO date
  tipo: string; // correctivo/preventivo
  responsable?: string;
}

export interface RegistroIncidenciasActuaciones {
  incidencias?: RegistroIncidenciaItem[];
  obrasRehabilitacion?: RegistroObraRehabilitacionItem[];
  mantenimientos?: RegistroMantenimientoItem[];
}

// Sección: Certificados y Garantías
export interface CertificadoEnergeticoItem {
  clase: string; // A-G
  consumo: number; // kWh/m²·año
  emisionesCO2: number; // kgCO₂eq/m²·año
  fechaEmision: string; // ISO
  fechaCaducidad?: string; // ISO
  archivo?: DocumentFile[]; // Archivos del certificado
}

export interface CertificadosGarantias {
  certificadosEnergeticos?: CertificadoEnergeticoItem[];
  certificadosInstalaciones?: DocumentFile[]; // Certificados de instalaciones
  garantiasMaterialesEquipos?: DocumentFile[]; // Garantías de materiales y equipos
}

// Sección: Anexos y Planos
export interface AnexosPlanos {
  planosAdjuntos?: DocumentFile[]; // Planos (PDF/DWG/etc.)
  otrosAnexos?: DocumentFile[]; // Otros anexos (DOC/XLS/etc.)
}

// Campos ambientales y rating (ESG)
export interface CamposAmbientales {
  // Environmental (E)
  renewableSharePercent?: number; // 0-100
  waterFootprintM3PerM2Year?: number; // m³/m²·año
  
  // Social (S)
  accessibility?: 'full' | 'partial' | 'none';
  indoorAirQualityCo2Ppm?: number; // ppm
  safetyCompliance?: 'full' | 'pending' | 'none';
  
  // Governance (G)
  regulatoryCompliancePercent?: number; // 0-100
  
  // Legacy campos (mantener compatibilidad)
  claseEnergeticaActual?: string; // A-G
  consumoEnergiaPrimariaTotal?: number; // kWh/m²·año
  emisionesCO2?: number; // kgCO₂eq/m²·año
  huellaHidrica?: number; // m³/m²·año (deprecated, usar waterFootprintM3PerM2Year)
  ratingPlataforma?: number; // 1-5
  gradoDescarbonizacion?: number; // %
  cumplimientoNormativo?: boolean | string; // boolean o enum
}

// Trazabilidad y control
export interface HistorialVersionItem {
  version: number;
  fecha: string; // ISO
  usuario: string; // usuarioId
}

export interface NotificacionItem {
  fecha: string; // ISO
  mensaje: string;
  tipo?: string; // alerta, etc.
}

export interface Trazabilidad {
  qrVinculado?: string;
  historialVersiones?: HistorialVersionItem[];
  firmasDigitales?: string[]; // usuarios que validan
  notificaciones?: NotificacionItem[];
}

// Entidad principal Libro Digital
export interface LibroDigital {
  id: string;
  edificioId: string;
  version: number;
  fechaCreacion: string; // ISO
  fechaActualizacion: string; // ISO
  estado: LibroDigitalEstado;
  usuarioCreadorId: string;

  // Secciones principales
  datosGenerales?: DatosGenerales;
  agentesIntervinientes?: AgentesIntervinientes;
  proyectoTecnico?: ProyectoTecnico;
  documentacionAdministrativa?: DocumentacionAdministrativa;
  manualUsoMantenimiento?: ManualUsoMantenimiento;
  registroIncidenciasActuaciones?: RegistroIncidenciasActuaciones;
  certificadosGarantias?: CertificadosGarantias;
  anexosPlanos?: AnexosPlanos;

  // Campos adicionales
  camposAmbientales?: CamposAmbientales;
  trazabilidad?: Trazabilidad;
}

// DTOs
export interface CreateLibroDigitalRequest {
  edificioId: string;
  usuarioCreadorId?: string; // si no, se toma del token
  // payload inicial opcional por secciones
  datosGenerales?: DatosGenerales;
  agentesIntervinientes?: AgentesIntervinientes;
  proyectoTecnico?: ProyectoTecnico;
  documentacionAdministrativa?: DocumentacionAdministrativa;
  manualUsoMantenimiento?: ManualUsoMantenimiento;
  registroIncidenciasActuaciones?: RegistroIncidenciasActuaciones;
  certificadosGarantias?: CertificadosGarantias;
  anexosPlanos?: AnexosPlanos;
  camposAmbientales?: CamposAmbientales;
  trazabilidad?: Trazabilidad;
}

export interface UpdateLibroDigitalRequest {
  // Solo se aceptarán cambios por sección en endpoints específicos
  // Esta interfaz puede quedar vacía si usamos update por sección
}

export interface UpdateLibroDigitalSectionRequest<TSection = unknown> {
  content: TSection;
  complete?: boolean; // para cómputo de progreso si lo usamos
}

// LEGACY TYPES (compatibilidad temporal con servicio/controlador actuales)
// Eliminar cuando se refactorice el servicio a `LibroDigital*`
export enum BookSource {
  MANUAL = 'manual',
  PDF = 'pdf'
}

export enum BookStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETE = 'complete'
}

export enum SectionType {
  GENERAL_DATA = 'general_data',
  CONSTRUCTION_FEATURES = 'construction_features',
  CERTIFICATES_AND_LICENSES = 'certificates_and_licenses',
  MAINTENANCE_AND_CONSERVATION = 'maintenance_and_conservation',
  FACILITIES_AND_CONSUMPTION = 'facilities_and_consumption',
  RENOVATIONS_AND_REHABILITATIONS = 'renovations_and_rehabilitations',
  SUSTAINABILITY_AND_ESG = 'sustainability_and_esg',
  ANNEX_DOCUMENTS = 'annex_documents'
}

export interface BookSection {
  id: string;
  type: SectionType;
  complete: boolean;
  content?: Record<string, any>;
}

export interface DigitalBook {
  id: string;
  buildingId: string;
  source: BookSource;
  status: BookStatus;
  progress: number; // 0-8
  sections: BookSection[];
  technicianId?: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

export interface CreateDigitalBookRequest {
  buildingId: string;
  source: BookSource;
  sections?: BookSection[];
}

export interface UpdateDigitalBookRequest {
  status?: BookStatus;
  progress?: number;
  sections?: BookSection[];
}

export interface UpdateSectionRequest {
  content: Record<string, any>;
  complete?: boolean;
}

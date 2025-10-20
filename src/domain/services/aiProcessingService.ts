import OpenAI from 'openai';
import { BookSection, SectionType } from '../../types/libroDigital';

export class AIProcessingService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY no está configurada en las variables de entorno');
    }
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Procesa el texto extraído de un documento y genera las secciones del libro digital
   */
  async processDocumentText(documentText: string): Promise<BookSection[]> {
    try {
      const prompt = this.buildPrompt(documentText);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Modelo más potente para máxima precisión
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente especializado en extraer información estructurada de documentos de libros digitales de edificios. Tu tarea es analizar el documento y extraer datos organizados en 8 secciones específicas. Responde SIEMPRE con un JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1, // Más determinístico para extracción de datos
        max_tokens: 4000, // Suficiente para el JSON completo
        response_format: { type: 'json_object' }
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No se recibió respuesta de OpenAI');
      }

      const parsedData = JSON.parse(responseText);
      return this.convertToBookSections(parsedData);

    } catch (error) {
      console.error('Error al procesar documento con IA:', error);
      throw new Error(`Error en el procesamiento con IA: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Construye el prompt para OpenAI
   */
  private buildPrompt(documentText: string): string {
    return `
Analiza el siguiente documento de libro digital de un edificio y extrae la información relevante organizándola en las siguientes 8 secciones.

IMPORTANTE: Debes responder con un JSON válido con la siguiente estructura:
{
  "general_data": {},
  "construction_features": {},
  "certificates_and_licenses": {},
  "maintenance_and_conservation": {},
  "facilities_and_consumption": {},
  "renovations_and_rehabilitations": {},
  "sustainability_and_esg": {},
  "annex_documents": {}
}

DESCRIPCIÓN DE CADA SECCIÓN:

1. **general_data** (Datos Generales):
   - identification: identificación completa del edificio (nombre, dirección, referencia catastral)
   - ownership: titularidad del edificio
   - building_typology: tipología detallada (residencial, comercial, industrial, etc.)
   - primary_use: uso principal del edificio
   - construction_date: fecha de construcción en formato YYYY-MM-DD

2. **construction_features** (Características Constructivas):
   - materials: materiales principales utilizados
   - insulation_systems: sistemas de aislamiento
   - structural_system: sistema estructural
   - facade_type: tipo de fachada
   - roof_type: tipo de cubierta

3. **certificates_and_licenses** (Certificados y Licencias):
   - energy_certificate: información del certificado energético
   - building_permits: licencias de obra
   - habitability_license: licencia de habitabilidad
   - fire_certificate: certificado contra incendios
   - accessibility_certificate: certificado de accesibilidad

4. **maintenance_and_conservation** (Mantenimiento y Conservación):
   - preventive_plan: plan de mantenimiento preventivo
   - inspection_schedule: programa de revisiones
   - incident_history: historial de incidencias
   - maintenance_contracts: contratos de mantenimiento activos

5. **facilities_and_consumption** (Instalaciones y Consumo):
   - electrical_system: sistema eléctrico
   - water_system: sistema de agua
   - gas_system: sistema de gas
   - hvac_system: sistema HVAC
   - consumption_history: historial de consumos

6. **renovations_and_rehabilitations** (Reformas y Rehabilitaciones):
   - renovation_history: historial de obras
   - structural_modifications: modificaciones estructurales
   - permits_renovations: permisos de reformas
   - improvement_investments: inversiones en mejoras

7. **sustainability_and_esg** (Sostenibilidad y ESG):
   - renewableSharePercent: porcentaje de energía renovable 0-100 (número)
   - waterFootprintM3PerM2Year: huella hídrica m³/m²·año (número)
   - accessibility: "full" | "partial" | "none"
   - indoorAirQualityCo2Ppm: calidad del aire interior CO2 en ppm (número)
   - safetyCompliance: "full" | "pending" | "none"
   - regulatoryCompliancePercent: cumplimiento normativo 0-100 (número)

8. **annex_documents** (Documentos Anexos):
   - additional_documents: documentos adicionales
   - technical_drawings: planos técnicos
   - photographs: fotografías
   - legal_documents: documentos legales

REGLAS IMPORTANTES:
- Si no encuentras información para un campo, NO lo incluyas en el JSON (omite campos vacíos)
- TODOS los valores deben ser strings (texto), NO objetos ni arrays
- Los números deben convertirse a strings (ej: "15" en lugar de 15)
- Las fechas deben estar en formato ISO string (YYYY-MM-DD)
- Para campos de selección (accessibility, safetyCompliance) usa los valores exactos: "full", "partial", "none", "pending"
- No inventes información que no esté en el documento
- Extrae SOLO la información que puedas verificar en el texto
- Si el documento no contiene información clara, devuelve objetos vacíos {}
- EJEMPLO CORRECTO: "identification": "Edificio Residencial Calle Mayor 123, Madrid"
- EJEMPLO INCORRECTO: "identification": {"name": "Edificio", "address": "Calle Mayor 123"}

DOCUMENTO A ANALIZAR:
---
${documentText.slice(0, 50000)}
---

EJEMPLO DE RESPUESTA CORRECTA:
{
  "general_data": {
    "identification": "Edificio Residencial Calle Mayor 123, Madrid",
    "ownership": "Comunidad de Propietarios",
    "building_typology": "Residencial",
    "primary_use": "Vivienda",
    "construction_date": "2010-03-15"
  },
  "construction_features": {
    "materials": "Hormigón armado, ladrillo visto",
    "insulation_systems": "Aislamiento térmico en fachada",
    "structural_system": "Hormigón armado",
    "facade_type": "Ladrillo visto",
    "roof_type": "Plana"
  },
  "sustainability_and_esg": {
    "renewableSharePercent": "15",
    "waterFootprintM3PerM2Year": "2.4",
    "accessibility": "full",
    "indoorAirQualityCo2Ppm": "800",
    "safetyCompliance": "full",
    "regulatoryCompliancePercent": "95"
  }
}

Responde ÚNICAMENTE con el JSON estructurado, sin texto adicional.
`;
  }

  /**
   * Convierte el JSON parseado en un array de BookSection
   */
  private convertToBookSections(parsedData: any): BookSection[] {
    const sections: BookSection[] = [];

    // Mapeo de claves del JSON a SectionType
    const sectionMapping: Record<string, SectionType> = {
      'general_data': SectionType.GENERAL_DATA,
      'construction_features': SectionType.CONSTRUCTION_FEATURES,
      'certificates_and_licenses': SectionType.CERTIFICATES_AND_LICENSES,
      'maintenance_and_conservation': SectionType.MAINTENANCE_AND_CONSERVATION,
      'facilities_and_consumption': SectionType.FACILITIES_AND_CONSUMPTION,
      'renovations_and_rehabilitations': SectionType.RENOVATIONS_AND_REHABILITATIONS,
      'sustainability_and_esg': SectionType.SUSTAINABILITY_AND_ESG,
      'annex_documents': SectionType.ANNEX_DOCUMENTS
    };

    // Crear las 8 secciones
    for (const [key, sectionType] of Object.entries(sectionMapping)) {
      const content = parsedData[key] || {};
      const hasContent = Object.keys(content).length > 0;

      sections.push({
        id: this.generateUUID(),
        type: sectionType,
        complete: hasContent,
        content: content
      });
    }

    return sections;
  }

  /**
   * Genera un UUID v4 simple
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Validación adicional de las secciones generadas
   */
  validateSections(sections: BookSection[]): boolean {
    if (!Array.isArray(sections) || sections.length !== 8) {
      return false;
    }

    const requiredTypes = Object.values(SectionType);
    const sectionTypes = sections.map(s => s.type);

    return requiredTypes.every(type => sectionTypes.includes(type));
  }
}


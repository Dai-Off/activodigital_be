import OpenAI from "openai";
import {
  getSupabaseClient,
  getSupabaseServiceRoleClient,
} from "../../lib/supabase";
import { BookSection, SectionType } from "../../types/libroDigital";

export class AIProcessingService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY no está configurada en las variables de entorno",
      );
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
        model: "gpt-4o", // Modelo más potente para máxima precisión
        messages: [
          {
            role: "system",
            content:
              "Eres un asistente especializado en extraer información estructurada de documentos de libros digitales de edificios. Debes analizar TODO el documento (todas las páginas) y extraer datos para las 8 secciones: general_data, construction_features, certificates_and_licenses, maintenance_and_conservation, facilities_and_consumption, renovations_and_rehabilitations, sustainability_and_esg, annex_documents. Tu respuesta SIEMPRE debe ser un JSON válido que incluya las 8 claves; si una sección no tiene datos en el documento, inclúyela con {}.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1, // Más determinístico para extracción de datos
        max_tokens: 8000, // Suficiente para las 8 secciones completas (evitar truncado)
        response_format: { type: "json_object" },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error("No se recibió respuesta de OpenAI");
      }

      const parsedData = JSON.parse(responseText);
      return this.convertToBookSections(parsedData);
    } catch (error) {
      console.error("Error al procesar documento con IA:", error);
      throw new Error(
        `Error en el procesamiento con IA: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    }
  }

  /**
   * Construye el prompt para OpenAI
   */
  private buildPrompt(documentText: string): string {
    return `
Analiza TODO el documento de principio a fin. La información puede estar repartida en distintas páginas o apartados. Debes extraer datos para LAS 8 SECCIONES y tu respuesta DEBE incluir siempre las 8 claves del JSON (general_data, construction_features, certificates_and_licenses, maintenance_and_conservation, facilities_and_consumption, renovations_and_rehabilitations, sustainability_and_esg, annex_documents). Para cada sección extrae TODA la información relevante que encuentres en el texto; si una sección no tiene datos en el documento, devuelve {} para esa sección.

IMPORTANTE: Responde con un JSON válido que incluya las 8 claves:
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

MAPEO PARA DOCUMENTOS "LIBRO DEL EDIFICIO" (ESPAÑA):
Si el documento tiene estructura tipo Libro del Edificio, usa este mapeo para extraer TODO:
- **general_data**: "Nombre del Edificio" + "Emplazamiento" o "Ubicación" + "Referencia Catastral" → identification (ej: "Torre Goya, Calle Goya 63, 28001 Madrid. Ref. Catastral: 2354810VK4725C"). "Año de terminación" → construction_date (ej: 2012 → "2012-01-01"). "Uso principal" → primary_use (texto literal del documento). "Tipología" o "tipología mixta" → building_typology. "DIRECTORIO DE AGENTES" / "Administración de Finca" / "Comunidad de Propietarios" → ownership.
- **construction_features**: En "DOCUMENTACIÓN TÉCNICA" o "DESCRIPCIÓN": (1) "Estructura:" → structural_system (texto literal). (2) "Fachada:" → facade_type (texto literal). (3) **materials**: incluir TODOS los materiales del apartado: de Estructura (ej. hormigón armado), de Fachada (ej. cerámico, piedra natural, placas ventiladas), de Carpintería (ej. aluminio, doble acristalamiento Climalit) en un solo texto, ej: "Hormigón armado, cerámico, piedra natural, aluminio, doble acristalamiento tipo Climalit". (4) **insulation_systems**: SIEMPRE rellenar cuando el documento mencione "aislamiento térmico", "doble acristalamiento", "rotura de puente térmico", "Climalit"; ej: "Aislamiento térmico reforzado en fachada, aluminio con rotura de puente térmico, doble acristalamiento tipo Climalit". (5) **roof_type**: SIEMPRE rellenar cuando en tablas de mantenimiento o en el texto aparezca "Cubierta" (ej: "Cubierta con revisión anual de sumideros e impermeabilización" o "Plana con impermeabilización").
- **maintenance_and_conservation**: Cualquier tabla con "Elemento / Periodicidad / Tipo de Inspección" (Ascensores, Extintores/BIEs, Fachadas, Cubierta, Calderas/RITE, IEE) → preventive_plan (descripción del plan) e inspection_schedule (resumen: "Ascensores mensual; Extintores/BIEs trimestral; Fachadas cada 5 años; Cubierta anual; Calderas/RITE anual; IEE cada 10 años" o similar). Si en la tabla aparece "Mantenimiento preventivo por empresa autorizada" o "empresa autorizada" → SIEMPRE incluir en maintenance_contracts (ej: "Mantenimiento preventivo por empresa autorizada (ascensores)").
- **facilities_and_consumption**: "Instalaciones destacadas" / "Climatización centralizada" / "Sistema de energía solar" / "ICT" / "ACS" → hvac_system (climatización, solar térmica ACS). Para electrical_system: si el documento solo menciona ICT/telecom y no red eléctrica, poner "No especificado en documento. ICT2 (Infraestructura Común de Telecomunicaciones) mencionado." o similar; si hay descripción de red eléctrica, usarla. water_system y gas_system: si no aparecen, "No especificado en documento".
- **certificates_and_licenses**: "IEE", "Informe de Evaluación de Edificios" → building_permits o habitability_license (ej: "IEE obligatorio cada 10 años (Madrid)"). Si menciona certificado energético o CTE → energy_certificate.
- **annex_documents**: Cualquier mención a "planos finales de obra", "as-built", "acta de recepción", "Proyecto de Fin de Obra" → technical_drawings, legal_documents (extrae el texto literal o un resumen).
- **renovations_and_rehabilitations** y **sustainability_and_esg**: Si el documento no los menciona, devuelve {} para esa clave pero INCLÚYELA en el JSON.

CAMPOS QUE DEBES RELLENAR SIEMPRE QUE APAREZCAN EN EL DOCUMENTO (no los dejes vacíos):
- **ownership**: Si aparece "Comunidad de Propietarios", "Administración de Finca", "DIRECTORIO DE AGENTES" o "titularidad" → rellenar SIEMPRE. Ejemplos: "Comunidad de Propietarios (Administración de Finca a designar)" o "Comunidad de Propietarios" o el texto literal que figure.
- **building_typology**: La interfaz usa un desplegable. Usar EXACTAMENTE uno de: "Residencial", "Comercial", "Mixto", "Industrial". Si el documento dice "tipología mixta", "residencial con uso comercial", "mixta" o "Uso principal: Residencial (con uso comercial en planta baja)" → usar "Mixto". Si solo dice "Residencial" sin comercial → "Residencial".
- **maintenance_contracts**: Si en tablas de mantenimiento aparece "Mantenimiento preventivo por empresa autorizada" o "empresa autorizada" → incluir ese texto en maintenance_contracts (ej: "Mantenimiento preventivo por empresa autorizada (ascensores)").
- **construction_features (materiales, aislamiento, cubierta)**: No dejes materials solo con la carpintería: une Estructura + Fachada + Carpintería. Rellena SIEMPRE insulation_systems si hay "aislamiento", "Climalit", "doble acristalamiento", "rotura de puente térmico". Rellena SIEMPRE roof_type si en el documento aparece "Cubierta" (aunque sea en tablas de mantenimiento).

REGLAS IMPORTANTES:
- Si no encuentras información para un campo, NO lo incluyas en el JSON (omite campos vacíos)
- TODOS los valores deben ser strings (texto), NO objetos ni arrays
- Los números deben convertirse a strings (ej: "15" en lugar de 15)
- Las fechas deben estar en formato ISO string (YYYY-MM-DD)
- Para campos de selección (accessibility, safetyCompliance) usa los valores exactos: "full", "partial", "none", "pending"
- No inventes información que no esté en el documento
- Extrae SOLO la información que puedas verificar en el texto
- Si una sección no tiene datos en el documento, devuelve {} para esa sección, pero INCLUYE siempre las 8 claves en el JSON.
- EJEMPLO CORRECTO: "identification": "Edificio Residencial Calle Mayor 123, Madrid"
- EJEMPLO INCORRECTO: "identification": {"name": "Edificio", "address": "Calle Mayor 123"}

DOCUMENTO A ANALIZAR (léelo completo; la información puede estar en cualquier parte):
---
${documentText.slice(0, 50000)}
---

EJEMPLO DE RESPUESTA (debes incluir las 8 claves; las que no tengan datos van como {}):
{
  "general_data": { "identification": "...", "ownership": "...", "building_typology": "Residencial", "primary_use": "Vivienda", "construction_date": "2010-03-15" },
  "construction_features": { "materials": "...", "structural_system": "...", "facade_type": "...", "roof_type": "..." },
  "certificates_and_licenses": { "energy_certificate": "...", "building_permits": "...", "habitability_license": "..." },
  "maintenance_and_conservation": { "preventive_plan": "...", "inspection_schedule": "...", "maintenance_contracts": "..." },
  "facilities_and_consumption": { "electrical_system": "...", "water_system": "...", "hvac_system": "..." },
  "renovations_and_rehabilitations": { "renovation_history": "...", "permits_renovations": "..." },
  "sustainability_and_esg": { "renewableSharePercent": "15", "accessibility": "full", "regulatoryCompliancePercent": "95" },
  "annex_documents": { "additional_documents": "...", "technical_drawings": "...", "legal_documents": "..." }
}

Responde ÚNICAMENTE con el JSON estructurado con las 8 secciones, sin texto adicional.
`;
  }

  /**
   * Convierte el JSON parseado en un array de BookSection
   */
  private convertToBookSections(parsedData: any): BookSection[] {
    const sections: BookSection[] = [];

    // Mapeo de claves del JSON a SectionType
    const sectionMapping: Record<string, SectionType> = {
      general_data: SectionType.GENERAL_DATA,
      construction_features: SectionType.CONSTRUCTION_FEATURES,
      certificates_and_licenses: SectionType.CERTIFICATES_AND_LICENSES,
      maintenance_and_conservation: SectionType.MAINTENANCE_AND_CONSERVATION,
      facilities_and_consumption: SectionType.FACILITIES_AND_CONSUMPTION,
      renovations_and_rehabilitations:
        SectionType.RENOVATIONS_AND_REHABILITATIONS,
      sustainability_and_esg: SectionType.SUSTAINABILITY_AND_ESG,
      annex_documents: SectionType.ANNEX_DOCUMENTS,
    };

    // Crear las 8 secciones
    for (const [key, sectionType] of Object.entries(sectionMapping)) {
      const content = parsedData[key] || {};
      const hasContent = Object.keys(content).length > 0;

      sections.push({
        id: this.generateUUID(),
        type: sectionType,
        complete: hasContent,
        content: content,
      });
    }

    return sections;
  }

  async extractDocumentExpirationFromUrl(
    fileUrl: string,
  ): Promise<string | null> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Eres un asistente especializado en leer documentos de gestión de edificios (contratos, mantenimientos, seguros, licencias, etc.) y detectar su fecha de vencimiento. " +
              'Tu respuesta debe ser SIEMPRE un JSON válido con el siguiente formato exacto: {"expiration_date": "YYYY-MM-DD" | null}. ' +
              'Si el documento no tiene una fecha de vencimiento clara, devuelve {"expiration_date": null}. No inventes fechas.',
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Analiza este documento y detecta, si existe, la fecha de vencimiento principal del documento (por ejemplo, fin de contrato, fecha hasta la que es válido, fecha de caducidad). " +
                  'Devuelve solo un JSON con la clave "expiration_date" en formato YYYY-MM-DD o null si no puedes determinarla con claridad.',
              },
              {
                type: "image_url",
                image_url: { url: fileUrl },
              },
            ],
          },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        return null;
      }

      const parsed = JSON.parse(content);
      if (!parsed || typeof parsed !== "object") return null;

      const expiration = parsed.expiration_date ?? null;
      if (!expiration || typeof expiration !== "string") {
        return null;
      }

      // Pequeña validación de formato básico YYYY-MM-DD
      const isoMatch = /^\d{4}-\d{2}-\d{2}$/.test(expiration);
      return isoMatch ? expiration : null;
    } catch (error) {
      console.error("Error al extraer fecha de vencimiento con IA:", error);
      return null;
    }
  }

  /**
   * Genera un UUID v4 simple
   */
  private generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }

  /**
   * Validación adicional de las secciones generadas
   */
  validateSections(sections: BookSection[]): boolean {
    if (!Array.isArray(sections) || sections.length !== 8) {
      return false;
    }

    const requiredTypes = Object.values(SectionType);
    const sectionTypes = sections.map((s) => s.type);

    return requiredTypes.every((type) => sectionTypes.includes(type));
  }

  async extractInvoiceData(imageBuffer: Buffer): Promise<any> {
    try {
      const base64Image = imageBuffer.toString("base64");
      const mimeType = "image/jpeg";

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "Eres un asistente especializado en extraer información de facturas de servicios. Extrae los datos y responde SIEMPRE con un JSON válido.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analiza esta factura y extrae la siguiente información en formato JSON:
{
  "invoice_number": "número de factura (string o null)",
  "invoice_date": "fecha de factura en formato YYYY-MM-DD",
  "amount_eur": "importe total en euros (número)",
  "service_type": "tipo de servicio: 'electricity', 'water', 'gas', 'ibi' o 'waste'",
  "provider": "nombre del proveedor (string o null)",
  "period_start": "fecha inicio período en formato YYYY-MM-DD (o null)",
  "period_end": "fecha fin período en formato YYYY-MM-DD (o null)",
  "units": "unidades consumidas (número o null)",
  "notes": "notas relevantes (string o null)",
  "expiration_date": "fecha de vencimiento en formato YYYY-MM-DD (o null)",
  "is_overdue": "true si la factura está vencida (fecha de vencimiento < fecha actual), false si no lo está (booleano)"
}

REGLAS:
- Si no encuentras un dato, usa null
- amount_eur debe ser un número
- service_type debe ser uno de: electricity, water, gas, ibi, waste
- Las fechas deben estar en formato YYYY-MM-DD
- is_overdue debe ser true o false (booleano)
- Para calcular is_overdue: compara expiration_date con la fecha actual (${new Date().toISOString().split("T")[0]})
- Responde SOLO con el JSON, sin texto adicional`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
        response_format: { type: "json_object" },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error("No se recibió respuesta de OpenAI");
      }

      return JSON.parse(responseText);
    } catch (error) {
      console.error("Error al extraer datos de factura con IA:", error);
      throw new Error(
        `Error en extracción de factura: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    }
  }
  async extractMemoriaCalidadesData(documentText: string): Promise<any> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "Eres un experto en construcción y arquitectura técnica. Tu tarea es analizar una Memoria de Calidades de un edificio y determinar si cumple con una serie de especificaciones técnicas. Responde siempre en formato JSON.",
          },
          {
            role: "user",
            content: `Analiza la siguiente Memoria de Calidades y para cada una de las claves del checklist, determina si el edificio lo cumple (true) o no (false) basándote en el texto.
            
Checklist de Especificaciones Técnicas:
1. "sate": SATE - Aislamiento térmico (fachadas con aislamiento exterior).
2. "ventanas": Ventanas - PVC bajo emisivo (o aluminio con rotura de puente térmico y vidrios bajo emisivos).
3. "calefaccion": Calefacción - Aerotermia (o sistemas de alta eficiencia con bomba de calor).
4. "fotovoltaica": Fotovoltaica - Paneles solares (instalación de paneles solares fotovoltaicos).
5. "griferia": Grifería - Bajo consumo agua (monomandos con aireadores o sistemas de ahorro).
6. "acabados": Acabados - Sin COVs (pinturas o materiales ecológicos/sin compuestos orgánicos volátiles).

Responde ÚNICAMENTE con un JSON con este formato:
{
  "checklist": {
    "sate": boolean,
    "ventanas": boolean,
    "calefaccion": boolean,
    "fotovoltaica": boolean,
    "griferia": boolean,
    "acabados": boolean
  },
  "summary": "Breve resumen de por qué cumple o no (máx 200 caracteres)"
}

TEXTO DEL DOCUMENTO:
---
${documentText.slice(0, 40000)}
---`,
          },
        ],
        temperature: 0,
        response_format: { type: "json_object" },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error("No se recibió respuesta de OpenAI");
      }

      return JSON.parse(responseText);
    } catch (error) {
      console.error("Error al analizar Memoria de Calidades:", error);
      throw new Error(
        `Error en el análisis de Memoria de Calidades: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    }
  }

  async extractLicenciaDRRequirements(documentText: string): Promise<any> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "Eres un experto legal y técnico en normativas municipales de construcción. Tu objetivo es procesar las normativas o requisitos de Licencias/Declaraciones Responsables y extraer los requisitos estructurados.",
          },
          {
            role: "user",
            content: `Analiza el siguiente texto de un documento de normativa municipal para Licencias o Declaraciones Responsables (DR) y extrae lo siguiente en formato JSON:
1. "summary": Un resumen claro de lo que exige la normativa.
2. "work_type": El tipo de obra principal detectada (ej. Obra Menor, Obra Mayor, Declaración Responsable).
3. "requirements": Un arreglo de requisitos. Cada requisito debe tener:
   - "key": identificador único en minúsculas y sin acentos (ej. "proyecto_tecnico", "pem").
   - "label": Nombre legible del requisito.
   - "description": Descripción detallada del requisito.
   - "type": "document" si se requiere subir un archivo, "data" si es información de texto, monetaria o numérica que pueda verificarse contra los datos del edificio.

RESPONDE ÚNICAMENTE CON UN JSON VÁLIDO.
EJEMPLO:
{
  "summary": "Requisitos para solicitar...",
  "work_type": "Declaración Responsable",
  "requirements": [
     {"key": "presupuesto", "label": "Presupuesto de ejecución material", "description": "Indicación del PEM", "type": "data"},
     {"key": "proyecto_tecnico", "label": "Proyecto Técnico", "description": "Proyecto firmado por técnico competente", "type": "document"}
  ]
}

TEXTO DEL DOCUMENTO:
---
${documentText.slice(0, 40000)}
---`,
          },
        ],
        temperature: 0,
        response_format: { type: "json_object" },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) throw new Error("No se recibió respuesta de OpenAI");
      return JSON.parse(responseText);
    } catch (error) {
      console.error("Error al extraer requisitos con IA:", error);
      throw new Error("Error en la extracción de requisitos");
    }
  }

  async extractLicenciaDRDocData(
    documentText: string,
    requirementName: string,
  ): Promise<any> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "Eres un asistente especializado en revisar documentos técnicos y extraer datos clave.",
          },
          {
            role: "user",
            content: `Revisa este documento aportado para el requisito "${requirementName}".
Extrae los parámetros clave en formato JSON.
1. "summary_data": Resumen indicando si el documento parece válido para el requisito.
2. "extracted_parameters": Objeto clave-valor con los datos extraídos (ej. pem, tecnicos_firmantes, descripcion_obra).

RESPONDE ÚNICAMENTE CON UN JSON VÁLIDO.
TEXTO DEL DOCUMENTO:
---
${documentText.slice(0, 40000)}
---`,
          },
        ],
        temperature: 0,
        response_format: { type: "json_object" },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) throw new Error("No se recibió respuesta de OpenAI");
      return JSON.parse(responseText);
    } catch (error) {
      console.error("Error al extraer datos del documento con IA:", error);
      throw new Error("Error en la extracción de datos del documento");
    }
  }

  async generateLicenciaDraft(
    buildingData: any,
    extractedData: any,
  ): Promise<Buffer> {
    const { createElement: h } = require('react');
    // Módulo ESM en entorno CommonJS requiere import dinámico
    const reactPdf = await (eval('import("@react-pdf/renderer")') as Promise<any>);
    const { 
      Document, 
      Page, 
      View, 
      Text, 
      StyleSheet, 
      renderToBuffer 
    } = reactPdf;
    const { markdownToReactPdf } = require('../../utils/markdownToReactPdf');

    try {
      // 1. Generar texto con OpenAI en formato Markdown
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              'Actúa como un experto en Derecho Administrativo y Urbanismo en España. Tu objetivo es generar un borrador de "Declaración Responsable Urbanística" que sea visualmente profesional, fácil de leer y legalmente robusto, combinando los estándares de Soto del Real, Benavente y Madrid.',
          },
          {
            role: "user",
            content: `# DIRECTRICES DE FORMATO (OBLIGATORIO)
1. Usa **Tablas de Markdown** para todos los bloques de datos (Interesado, Emplazamiento, Presupuesto).
2. Utiliza **Títulos (H1, H2, H3)** y líneas horizontales (---) para separar secciones.
3. Emplea **Casillas de verificación** [ ] (o [x] si aplican) para opciones y tipos de obra.
4. Aplica **Negrita** en términos clave legales y plazos.
5. El tono debe ser formal, técnico y administrativo.
6. Devuelve ÚNICAMENTE el código Markdown, sin estar envuelto en bloques de código markdown, solo el texto Markdown final.

# ESTRUCTURA DEL DOCUMENTO
Genera el borrador siguiendo estrictamente este orden:

1. **ENCABEZADO:** Título principal y espacio para el Ayuntamiento/Organismo.
2. **SECCIÓN I: DATOS PERSONALES:** Tablas separadas para: El Declarante/Interesado, El Representante (si aplica), y El Contratista/Constructor.
3. **SECCIÓN II: UBICACIÓN Y OBJETO:** Tabla con Dirección, Referencia Catastral y características del inmueble (m², uso actual).
4. **SECCIÓN III: CLASIFICACIÓN DE LA ACTUACIÓN:** Listado con casillas de verificación para seleccionar el tipo de obra (Ej: Obras menores, energía fotovoltaica, primera ocupación, etc., marcando con una X las pertinentes a la actuación).
5. **SECCIÓN IV: DATOS TÉCNICOS Y ECONÓMICOS:** Tabla con: Presupuesto (PEM), Fecha inicio/fin, y Medios auxiliares (Andamios, contenedores).
6. **SECCIÓN V: CUERPO DE DECLARACIÓN (EL "DECLARO BAJO MI RESPONSABILIDAD"):** Puntos numerados legales sobre la veracidad, posesión de proyecto/memoria y cumplimiento de normativa.
7. **SECCIÓN VI: DOCUMENTACIÓN ADJUNTA:** Check-list de lo que el usuario aporta. Incluye referencias a los archivos aportados (solo la documentación marcada como 'satisfied: true' en status_summary).
8. **PIE DE PÁGINA:** Lugar, fecha (usa la fecha actual: ${new Date().toLocaleDateString("es-ES")}), espacio explícito para Firma (dibuja la línea ________) y cláusula de Protección de Datos (RGPD).

# DATOS DE ENTRADA PARA EL BORRADOR
Edificio: ${JSON.stringify(buildingData)}
Datos aportados: ${JSON.stringify(extractedData)}`,
          },
        ],
        temperature: 0.2,
      });

      let draftText =
        completion.choices[0]?.message?.content || "# Borrador generado por IA";

      // Limpiar posibles bloques markdown envolventes
      if (draftText.startsWith("```markdown")) {
        draftText = draftText
          .replace(/^```markdown\n?/, "")
          .replace(/\n?```$/, "");
      } else if (draftText.startsWith("```")) {
        draftText = draftText.replace(/^```\n?/, "").replace(/\n?```$/, "");
      }

      // 2. Definir estilos para el borrador
      const styles = StyleSheet.create({
        page: {
          padding: 40,
          fontFamily: 'Helvetica',
          fontSize: 12,
          color: '#333',
        },
        header: {
          fontSize: 8,
          color: '#aaa',
          textAlign: 'right',
          marginBottom: 10,
        },
        footer: {
          fontSize: 8,
          color: '#aaa',
          textAlign: 'center',
          marginTop: 20,
        }
      });

      // 3. Crear el documento react-pdf
      const pdfComponents = markdownToReactPdf(draftText, reactPdf);
      
      const doc = h(Document, null,
        h(Page, { size: 'A4', style: styles.page },
          h(Text, { style: styles.header }, 'Borrador - Concesión de Licencia / Resolución DR'),
          ...pdfComponents,
          h(Text, { style: styles.footer }, `ActivoDigital - Borrador de resolución para fines informativos - Generado el ${new Date().toLocaleDateString("es-ES")}`)
        )
      );

      // 4. Generar el buffer
      const generatedPdfBuffer = await renderToBuffer(doc);
      const pdfBytes = Uint8Array.from(generatedPdfBuffer);
      const { PDFDocument } = await import("pdf-lib");

      // 5. Merge additional documents if provided
      const docPaths = extractedData.doc_paths || [];
      console.log(`[AIProcessingService] Doc paths to merge:`, docPaths);

      if (docPaths.length > 0) {
        const mergedDoc = await PDFDocument.load(pdfBytes);
        const supabase = getSupabaseServiceRoleClient(); // Use service role to bypass RLS

        for (const path of docPaths) {
          try {
            console.log(
              `[AIProcessingService] Attempting to download: ${path}`,
            );
            const { data, error } = await supabase.storage
              .from("building-documents")
              .download(path);

            if (error || !data) {
              console.error(
                `[AIProcessingService] Failed to download ${path}:`,
                error,
              );
              continue;
            }

            const arrayBuffer = await data.arrayBuffer();
            const externalDoc = await PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedDoc.copyPages(
              externalDoc,
              externalDoc.getPageIndices(),
            );
            copiedPages.forEach((page) => mergedDoc.addPage(page));
            console.log(
              `[AIProcessingService] Merged ${copiedPages.length} pages from ${path}`,
            );
          } catch (err) {
            console.error(`Error merging document at ${path}:`, err);
          }
        }

        const finalPdfBytes = await mergedDoc.save();
        return Buffer.from(finalPdfBytes);
      }

      return Buffer.from(pdfBytes);
    } catch (error) {
      console.error("Error al generar borrador de licencia con IA:", error);
      throw new Error("Error en la generación de borrador PDF");
    }
  }

  async extractDocumentMetadata(
    fileUrl: string,
    mimeType: string,
    category: string,
  ): Promise<any> {
    try {
      const getCategoryPrompt = (cat: string) => {
        const baseInstructions = `Eres un asistente experto en gestión documental de edificios. Tu tarea es extraer metadatos relevantes de documentos y devolverlos en un JSON.
Requerimientos comunes a mantener en el JSON:
1. "summary": Resumen ejecutivo (1-2 frases).
2. "document_type": Tipo específico de documento detectado.
3. "expiration_date": Fecha de caducidad si aplica (YYYY-MM-DD).
4. "key_fields": Un objeto con los datos extraídos específicos de la categoría.`;

        let specificInstructions = "";
        switch (cat) {
          case "financial":
            specificInstructions = `
Para documentos financieros (facturas, presupuestos, recibos), EXTRAER ADEMÁS en "key_fields":
- "amount": Importe total (numérico).
- "issuer": Quién emite el documento.
- "invoice_number": Número de factura.
- "tax_base": Base imponible.
- "vat": IVA / Impuestos.
- "payment_date": Fecha de pago (YYYY-MM-DD).
- "concept": Concepto principal.
- "periodicity": Periodicidad (mensual, anual, puntual).`;
            break;
          case "contracts":
            specificInstructions = `
Para contratos, EXTRAER ADEMÁS en "key_fields":
- "provider": Proveedor o contratista.
- "contract_amount": Importe del contrato.
- "start_date": Fecha de inicio (YYYY-MM-DD).
- "end_date": Fecha de fin (YYYY-MM-DD).
- "renewal_type": Tipo de renovación (automática, manual).
- "service_type": Tipo de servicio.
- "scope": Alcance del contrato.`;
            break;
          case "maintenance":
            specificInstructions = `
Para documentos de mantenimiento o revisión técnica, EXTRAER ADEMÁS en "key_fields":
- "maintenance_type": Tipo de mantenimiento (preventivo, correctivo).
- "system_affected": Sistema afectado (ascensor, clima, estructura, etc.).
- "technician": Técnico o empresa responsable.
- "next_revision_date": Próxima revisión (YYYY-MM-DD).
- "findings": Hallazgos o anomalías detectadas.
- "status": Estado de la revisión (Favorable, Desfavorable, Con defectos).`;
            break;
          case "insurance":
            specificInstructions = `
Para pólizas de seguro o recibos, EXTRAER ADEMÁS en "key_fields":
- "insurer": Aseguradora.
- "policy_number": Número de póliza.
- "coverage_type": Tipo de cobertura.
- "premium": Prima o coste.
- "coverage_amount": Capital asegurado máximo o límite de cobertura.`;
            break;
          case "certificates":
            specificInstructions = `
Para certificados (energéticos, OCA, ITE, etc.), EXTRAER ADEMÁS en "key_fields":
- "certificate_type": Tipo de certificado.
- "rating": Calificación (ej. Letra A-G para energéticos).
- "issuing_body": Organismo emisor.
- "issue_date": Fecha de emisión (YYYY-MM-DD).
- "compliance_status": Estado de cumplimiento.`;
            break;
          case "licenciadr":
            specificInstructions = `
Para licencias, normativas o declaraciones responsables, EXTRAER ADEMÁS en "key_fields":
- "license_type": Tipo de licencia u obra.
- "issuing_municipality": Ayuntamiento u organismo emisor.
- "status": Estado de la licencia.
- "resolution_date": Fecha de resolución (YYYY-MM-DD).
Adicionalmente, extraer a nivel raíz del JSON:
- "is_municipal_regulation": true si es una normativa, false de lo contrario.
- "requirements": (Opcional) Array de requisitos [{ "key": "string_id", "label": "Nombre corto", "description": "Detalle", "type": "document" | "data" }].`;
            break;
          default:
            specificInstructions = `EXTRAER ADEMÁS en "key_fields" cualquier dato clave numérico, fecha (YYYY-MM-DD), emisor o identificador importante detectado.`;
        }

        return `${baseInstructions}\n${specificInstructions}\n\nResponde ÚNICAMENTE con el objeto JSON estructurado.`;
      };

      const systemPrompt = getCategoryPrompt(category);
      const isPdf = mimeType === "application/pdf";

      if (isPdf) {
        // Para PDFs: descargar y extraer texto con pdf-parse
        const response = await fetch(fileUrl);
        const buffer = Buffer.from(await response.arrayBuffer());
        const pdf = await import("pdf-parse");
        const pdfData = await (pdf as any).default(buffer);
        const documentText = pdfData.text;

        const completion = await this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Extrae la información en formato JSON del siguiente texto de un documento de la categoría "${category}":
              
---
${documentText.slice(0, 40000)}
---`,
            },
          ],
          temperature: 0,
          response_format: { type: "json_object" },
        });

        const responseText = completion.choices[0]?.message?.content;
        return responseText ? JSON.parse(responseText) : {};
      } else {
        // Para imágenes: usar Vision API con gpt-4o
        const completion = await this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Extrae la información en formato JSON de esta imagen de un documento de la categoría "${category}".`,
                },
                {
                  type: "image_url",
                  image_url: { url: fileUrl },
                },
              ],
            },
          ],
          temperature: 0,
          response_format: { type: "json_object" },
        });

        const responseText = completion.choices[0]?.message?.content;
        return responseText ? JSON.parse(responseText) : {};
      }
    } catch (error) {
      console.error("Error al extraer metadatos del documento:", error);
      return {};
    }
  }
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIProcessingService = void 0;
const openai_1 = __importDefault(require("openai"));
const libroDigital_1 = require("../../types/libroDigital");
class AIProcessingService {
    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY no está configurada en las variables de entorno');
        }
        this.openai = new openai_1.default({ apiKey });
    }
    /**
     * Procesa el texto extraído de un documento y genera las secciones del libro digital
     */
    async processDocumentText(documentText) {
        try {
            const prompt = this.buildPrompt(documentText);
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o', // Modelo más potente para máxima precisión
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un asistente especializado en extraer información estructurada de documentos de libros digitales de edificios. Debes analizar TODO el documento (todas las páginas) y extraer datos para las 8 secciones: general_data, construction_features, certificates_and_licenses, maintenance_and_conservation, facilities_and_consumption, renovations_and_rehabilitations, sustainability_and_esg, annex_documents. Tu respuesta SIEMPRE debe ser un JSON válido que incluya las 8 claves; si una sección no tiene datos en el documento, inclúyela con {}.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1, // Más determinístico para extracción de datos
                max_tokens: 8000, // Suficiente para las 8 secciones completas (evitar truncado)
                response_format: { type: 'json_object' }
            });
            const responseText = completion.choices[0]?.message?.content;
            if (!responseText) {
                throw new Error('No se recibió respuesta de OpenAI');
            }
            const parsedData = JSON.parse(responseText);
            return this.convertToBookSections(parsedData);
        }
        catch (error) {
            console.error('Error al procesar documento con IA:', error);
            throw new Error(`Error en el procesamiento con IA: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
    /**
     * Construye el prompt para OpenAI
     */
    buildPrompt(documentText) {
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
    convertToBookSections(parsedData) {
        const sections = [];
        // Mapeo de claves del JSON a SectionType
        const sectionMapping = {
            'general_data': libroDigital_1.SectionType.GENERAL_DATA,
            'construction_features': libroDigital_1.SectionType.CONSTRUCTION_FEATURES,
            'certificates_and_licenses': libroDigital_1.SectionType.CERTIFICATES_AND_LICENSES,
            'maintenance_and_conservation': libroDigital_1.SectionType.MAINTENANCE_AND_CONSERVATION,
            'facilities_and_consumption': libroDigital_1.SectionType.FACILITIES_AND_CONSUMPTION,
            'renovations_and_rehabilitations': libroDigital_1.SectionType.RENOVATIONS_AND_REHABILITATIONS,
            'sustainability_and_esg': libroDigital_1.SectionType.SUSTAINABILITY_AND_ESG,
            'annex_documents': libroDigital_1.SectionType.ANNEX_DOCUMENTS
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
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    /**
     * Validación adicional de las secciones generadas
     */
    validateSections(sections) {
        if (!Array.isArray(sections) || sections.length !== 8) {
            return false;
        }
        const requiredTypes = Object.values(libroDigital_1.SectionType);
        const sectionTypes = sections.map(s => s.type);
        return requiredTypes.every(type => sectionTypes.includes(type));
    }
    async extractInvoiceData(imageBuffer) {
        try {
            const base64Image = imageBuffer.toString('base64');
            const mimeType = 'image/jpeg';
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un asistente especializado en extraer información de facturas de servicios. Extrae los datos y responde SIEMPRE con un JSON válido.'
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
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
- Para calcular is_overdue: compara expiration_date con la fecha actual (${new Date().toISOString().split('T')[0]})
- Responde SOLO con el JSON, sin texto adicional`
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                temperature: 0.1,
                max_tokens: 1000,
                response_format: { type: 'json_object' }
            });
            const responseText = completion.choices[0]?.message?.content;
            if (!responseText) {
                throw new Error('No se recibió respuesta de OpenAI');
            }
            return JSON.parse(responseText);
        }
        catch (error) {
            console.error('Error al extraer datos de factura con IA:', error);
            throw new Error(`Error en extracción de factura: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
}
exports.AIProcessingService = AIProcessingService;
//# sourceMappingURL=aiProcessingService.js.map
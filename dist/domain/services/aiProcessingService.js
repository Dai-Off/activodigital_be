"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIProcessingService = void 0;
const openai_1 = __importDefault(require("openai"));
const supabase_1 = require("../../lib/supabase");
const libroDigital_1 = require("../../types/libroDigital");
class AIProcessingService {
    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("OPENAI_API_KEY no está configurada en las variables de entorno");
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
                model: "gpt-4o", // Modelo más potente para máxima precisión
                messages: [
                    {
                        role: "system",
                        content: "Eres un asistente especializado en extraer información estructurada de documentos de libros digitales de edificios. Debes analizar TODO el documento (todas las páginas) y extraer datos para las 8 secciones: general_data, construction_features, certificates_and_licenses, maintenance_and_conservation, facilities_and_consumption, renovations_and_rehabilitations, sustainability_and_esg, annex_documents. Tu respuesta SIEMPRE debe ser un JSON válido que incluya las 8 claves; si una sección no tiene datos en el documento, inclúyela con {}.",
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
        }
        catch (error) {
            console.error("Error al procesar documento con IA:", error);
            throw new Error(`Error en el procesamiento con IA: ${error instanceof Error ? error.message : "Error desconocido"}`);
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
            general_data: libroDigital_1.SectionType.GENERAL_DATA,
            construction_features: libroDigital_1.SectionType.CONSTRUCTION_FEATURES,
            certificates_and_licenses: libroDigital_1.SectionType.CERTIFICATES_AND_LICENSES,
            maintenance_and_conservation: libroDigital_1.SectionType.MAINTENANCE_AND_CONSERVATION,
            facilities_and_consumption: libroDigital_1.SectionType.FACILITIES_AND_CONSUMPTION,
            renovations_and_rehabilitations: libroDigital_1.SectionType.RENOVATIONS_AND_REHABILITATIONS,
            sustainability_and_esg: libroDigital_1.SectionType.SUSTAINABILITY_AND_ESG,
            annex_documents: libroDigital_1.SectionType.ANNEX_DOCUMENTS,
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
    async extractDocumentExpirationFromUrl(fileUrl) {
        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4o",
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: "system",
                        content: "Eres un asistente especializado en leer documentos de gestión de edificios (contratos, mantenimientos, seguros, licencias, etc.) y detectar su fecha de vencimiento. " +
                            'Tu respuesta debe ser SIEMPRE un JSON válido con el siguiente formato exacto: {"expiration_date": "YYYY-MM-DD" | null}. ' +
                            'Si el documento no tiene una fecha de vencimiento clara, devuelve {"expiration_date": null}. No inventes fechas.',
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Analiza este documento y detecta, si existe, la fecha de vencimiento principal del documento (por ejemplo, fin de contrato, fecha hasta la que es válido, fecha de caducidad). " +
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
            if (!parsed || typeof parsed !== "object")
                return null;
            const expiration = parsed.expiration_date ?? null;
            if (!expiration || typeof expiration !== "string") {
                return null;
            }
            // Pequeña validación de formato básico YYYY-MM-DD
            const isoMatch = /^\d{4}-\d{2}-\d{2}$/.test(expiration);
            return isoMatch ? expiration : null;
        }
        catch (error) {
            console.error("Error al extraer fecha de vencimiento con IA:", error);
            return null;
        }
    }
    /**
     * Genera un UUID v4 simple
     */
    generateUUID() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
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
        const sectionTypes = sections.map((s) => s.type);
        return requiredTypes.every((type) => sectionTypes.includes(type));
    }
    async extractInvoiceData(imageBuffer) {
        try {
            const base64Image = imageBuffer.toString("base64");
            const mimeType = "image/jpeg";
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "Eres un asistente especializado en extraer información de facturas de servicios. Extrae los datos y responde SIEMPRE con un JSON válido.",
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
        }
        catch (error) {
            console.error("Error al extraer datos de factura con IA:", error);
            throw new Error(`Error en extracción de factura: ${error instanceof Error ? error.message : "Error desconocido"}`);
        }
    }
    async extractMemoriaCalidadesData(documentText) {
        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "Eres un experto en construcción y arquitectura técnica. Tu tarea es analizar una Memoria de Calidades de un edificio y determinar si cumple con una serie de especificaciones técnicas. Responde siempre en formato JSON.",
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
        }
        catch (error) {
            console.error("Error al analizar Memoria de Calidades:", error);
            throw new Error(`Error en el análisis de Memoria de Calidades: ${error instanceof Error ? error.message : "Error desconocido"}`);
        }
    }
    async extractLicenciaDRRequirements(documentText) {
        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "Eres un experto legal y técnico en normativas municipales de construcción. Tu objetivo es procesar las normativas o requisitos de Licencias/Declaraciones Responsables y extraer los requisitos estructurados.",
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
            if (!responseText)
                throw new Error("No se recibió respuesta de OpenAI");
            return JSON.parse(responseText);
        }
        catch (error) {
            console.error("Error al extraer requisitos con IA:", error);
            throw new Error("Error en la extracción de requisitos");
        }
    }
    async extractLicenciaDRDocData(documentText, requirementName) {
        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "Eres un asistente especializado en revisar documentos técnicos y extraer datos clave.",
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
            if (!responseText)
                throw new Error("No se recibió respuesta de OpenAI");
            return JSON.parse(responseText);
        }
        catch (error) {
            console.error("Error al extraer datos del documento con IA:", error);
            throw new Error("Error en la extracción de datos del documento");
        }
    }
    async generateLicenciaDraft(buildingData, extractedData) {
        const { createElement: h } = require('react');
        // Usamos import dinámico nativo por Function para evadir la interceptación de CommonJS en producción
        const dynamicImport = new Function('modulePath', 'return import(modulePath)');
        const reactPdf = await dynamicImport("@react-pdf/renderer");
        const { Document, Page, View, Text, StyleSheet, renderToBuffer } = reactPdf;
        const { markdownToReactPdf } = require('../../utils/markdownToReactPdf');
        try {
            // 1. Extraer de forma inteligente y segura los campos con fallbacks robustos
            const findValue = (keys, defaultValue = '') => {
                // Safe check helper to avoid checking prototype properties like 'constructor'
                const hasKey = (obj, key) => {
                    return obj && Object.prototype.hasOwnProperty.call(obj, key) && typeof obj[key] !== 'function';
                };
                // Buscar en manual_inputs
                if (extractedData.manual_inputs) {
                    for (const k of keys) {
                        if (hasKey(extractedData.manual_inputs, k) && extractedData.manual_inputs[k] !== undefined && extractedData.manual_inputs[k] !== null && extractedData.manual_inputs[k] !== '') {
                            return extractedData.manual_inputs[k];
                        }
                    }
                }
                // Buscar en extracted_parameters
                if (extractedData.extracted_parameters) {
                    for (const k of keys) {
                        if (hasKey(extractedData.extracted_parameters, k) && extractedData.extracted_parameters[k] !== undefined && extractedData.extracted_parameters[k] !== null && extractedData.extracted_parameters[k] !== '') {
                            return extractedData.extracted_parameters[k];
                        }
                    }
                }
                // Buscar en las claves del objeto raíz
                for (const k of keys) {
                    if (hasKey(extractedData, k) && extractedData[k] !== undefined && extractedData[k] !== null && extractedData[k] !== '') {
                        return extractedData[k];
                    }
                }
                // Búsqueda profunda insensible a mayúsculas/minúsculas
                const lowerKeys = keys.map(k => k.toLowerCase());
                const searchObj = (obj) => {
                    if (!obj || typeof obj !== 'object')
                        return null;
                    for (const [k, val] of Object.entries(obj)) {
                        if (typeof val === 'function')
                            continue;
                        if (lowerKeys.includes(k.toLowerCase()) && val !== undefined && val !== null && val !== '') {
                            return val;
                        }
                        if (typeof val === 'object') {
                            const res = searchObj(val);
                            if (res)
                                return res;
                        }
                    }
                    return null;
                };
                const deepVal = searchObj(extractedData);
                if (deepVal)
                    return deepVal;
                return defaultValue;
            };
            const municipality = buildingData.addressData?.municipality || 'Soto del Real';
            const province = buildingData.addressData?.province || 'Madrid';
            // Declarante / Interesado
            const declaranteNombre = findValue(['propietario', 'declarante', 'solicitante', 'nombre', 'interested_party', 'applicant', 'tecnico'], buildingData.propietarioEmail || '');
            const declaranteNif = findValue(['nif_propietario', 'nif_solicitante', 'nif', 'cif', 'dni', 'nie', 'nif_declarante', 'nif_interesado'], '');
            const declaranteDireccion = buildingData.address || '';
            // Representante
            const representanteNombre = findValue(['representante', 'nombre_representante', 'representative'], '');
            const representanteNif = findValue(['nif_representante', 'dni_representante'], '');
            // Constructor
            const constructorNombre = findValue(['constructor', 'contratista', 'empresa', 'contractor', 'builder'], '');
            const constructorCif = findValue(['cif_constructor', 'cif_contratista', 'cif_empresa'], '');
            // Detalles Obra
            const pemVal = buildingData.rehabilitationCost;
            const presupuesto = pemVal ? `${pemVal.toLocaleString('es-ES')} €` : '';
            const fechaInicio = findValue(['fecha_inicio', 'fecha_comienzo', 'start_date'], '');
            const fechaFin = findValue(['fecha_fin', 'fecha_terminacion', 'end_date'], '');
            // Generar checkboxes para tipos de obra usando unicode directamente para prevenir strips de markdown
            const workType = extractedData.work_type || "Declaración Responsable (DR)";
            const workTypeCheckboxes = `☑ **${workType}** (Actuación principal solicitada)
☐ Obras de edificación de nueva planta de escasa entidad constructiva
☐ Obras de ampliación, modificación, reforma o rehabilitación que no alteren estructura ni volumen`;
            // Generar checkboxes de requisitos presentados y formatear los detalles del JSON de forma legible
            const statusSummary = extractedData.status_summary || [];
            let documentCheckboxes = '';
            if (statusSummary.length > 0) {
                documentCheckboxes = statusSummary.map((item) => {
                    const isOk = item.satisfied;
                    const box = isOk ? '☑' : '☐';
                    let valText = '';
                    if (item.value) {
                        try {
                            const valStr = String(item.value).trim();
                            if (valStr.startsWith('{') || valStr.startsWith('[')) {
                                const parsed = JSON.parse(valStr);
                                if (parsed.summary_data) {
                                    valText = ` (*Detalle: ${parsed.summary_data}*)`;
                                }
                                else if (parsed.extracted_parameters) {
                                    const params = Object.entries(parsed.extracted_parameters)
                                        .map(([k, v]) => `${k}: ${v}`)
                                        .join(', ');
                                    valText = params ? ` (*Detalle: ${params}*)` : '';
                                }
                            }
                            else {
                                valText = ` (*Detalle: ${valStr}*)`;
                            }
                        }
                        catch (e) {
                            valText = ` (*Detalle: ${item.value}*)`;
                        }
                    }
                    return `${box} **${item.label}**${valText}`;
                }).join('\n');
            }
            else {
                documentCheckboxes = `☑ **Documentación Técnica / Proyecto**
☑ **Certificado de Eficiencia Energética**
☐ **Memoria de Calidades y Presupuesto**`;
            }
            const fechaActual = new Date().toLocaleDateString('es-ES');
            // 2. Construir el borrador en Markdown estructurado de forma 100% predecible y profesional
            const draftText = `# DECLARACIÓN RESPONSABLE URBANÍSTICA
---
**ÓRGANO DESTINATARIO:** Ayuntamiento de ${municipality} (${province})

## I. DATOS DE LOS SUJETOS INTERVENIENTES
| Sujeto | Nombre / Razón Social | NIF / CIF / DNI | Dirección / Contacto |
| :--- | :--- | :--- | :--- |
| **Declarante / Interesado** | ${declaranteNombre} | ${declaranteNif} | ${declaranteDireccion} |
| **Representante (si aplica)** | ${representanteNombre} | ${representanteNif} | Mismo domicilio a efectos de notificaciones |
| **Constructor / Contratista** | ${constructorNombre} | ${constructorCif} | A efectos de ejecución de las obras |

## II. UBICACIÓN Y OBJETO DE LA ACTUACIÓN
| Parámetro del Activo | Detalle Técnico |
| :--- | :--- |
| **Emplazamiento / Dirección** | ${buildingData.address || ''} |
| **Referencia Catastral** | ${buildingData.cadastralReference || ''} |
| **Superficie Construida** | ${buildingData.squareMeters || ''} m² |
| **Tipología del Inmueble** | ${buildingData.typology || 'Residencial'} |

## III. CLASIFICACIÓN DE LA ACTUACIÓN
Por la presente declaración responsable, se clasifica la actuación urbanística en:
${workTypeCheckboxes}

## IV. DATOS TÉCNICOS Y ECONÓMICOS
| Detalle de Obra | Valor Estimado / Programado |
| :--- | :--- |
| **Presupuesto (PEM)** | ${presupuesto} |
| **Plazo de Inicio Estimado** | ${fechaInicio} |
| **Plazo de Finalización** | ${fechaFin} |

## V. DECLARACIÓN JURADA (BAJO MI RESPONSABILIDAD)
El abajo firmante **DECLARA BAJO SU EXCLUSIVA RESPONSABILIDAD**:
1. Que todos los datos incorporados en esta declaración y en la documentación técnica aportada son **veraces, exactos e íntegros**.
2. Que la actuación proyectada cumple rigurosamente con las determinaciones del **Plan General de Ordenación Urbana (PGOU)** del municipio y la legislación sectorial aplicable.
3. Que dispone de la documentación técnica y administrativa exigible, y se compromete a mantenerla a disposición del Ayuntamiento durante el desarrollo de la actuación.
4. Que se compromete al inicio de las obras en el plazo establecido y a cumplir con las normas de seguridad, salud y gestión de residuos de construcción.

## VI. DOCUMENTACIÓN ADJUNTA PRESENTADA
A continuación se indica el estado de aportación de los requisitos de la ordenanza municipal:
${documentCheckboxes}

---
En **${municipality}**, a **${fechaActual}**

**Firma del Declarante / Representante:**

\
\
_______________________________________________
**Fdo:** ${declaranteNombre}

---
*En cumplimiento del Reglamento General de Protección de Datos (RGPD), se le informa que sus datos personales serán tratados por el Ayuntamiento con el único fin de tramitar y verificar su declaración responsable urbanística.*`;
            // 3. Definir estilos para el borrador
            const styles = StyleSheet.create({
                page: {
                    padding: 40,
                    fontFamily: 'Helvetica',
                    fontSize: 10,
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
            // 4. Crear el documento react-pdf
            const pdfComponents = markdownToReactPdf(draftText, reactPdf);
            const doc = h(Document, null, h(Page, { size: 'A4', style: styles.page }, h(Text, { style: styles.header }, 'Borrador Oficial - Declaración Responsable Urbanística (DR)'), ...pdfComponents, h(Text, { style: styles.footer }, `ActivoDigital - Documento autogenerado en base a datos catastrales e inputs municipales - ${fechaActual}`)));
            // 5. Generar el buffer
            const generatedPdfBuffer = await renderToBuffer(doc);
            const pdfBytes = Uint8Array.from(generatedPdfBuffer);
            const { PDFDocument } = await Promise.resolve().then(() => __importStar(require("pdf-lib")));
            // 6. Merge additional documents if provided
            const docPaths = extractedData.doc_paths || [];
            console.log(`[AIProcessingService] Doc paths to merge:`, docPaths);
            if (docPaths.length > 0) {
                const mergedDoc = await PDFDocument.load(pdfBytes);
                const supabase = (0, supabase_1.getSupabaseServiceRoleClient)(); // Use service role to bypass RLS
                for (const path of docPaths) {
                    try {
                        console.log(`[AIProcessingService] Attempting to download: ${path}`);
                        const { data, error } = await supabase.storage
                            .from("building-documents")
                            .download(path);
                        if (error || !data) {
                            console.error(`[AIProcessingService] Failed to download ${path}:`, error);
                            continue;
                        }
                        const arrayBuffer = await data.arrayBuffer();
                        const externalDoc = await PDFDocument.load(arrayBuffer);
                        const copiedPages = await mergedDoc.copyPages(externalDoc, externalDoc.getPageIndices());
                        copiedPages.forEach((page) => mergedDoc.addPage(page));
                        console.log(`[AIProcessingService] Merged ${copiedPages.length} pages from ${path}`);
                    }
                    catch (err) {
                        console.error(`Error merging document at ${path}:`, err);
                    }
                }
                const finalPdfBytes = await mergedDoc.save();
                return Buffer.from(finalPdfBytes);
            }
            return Buffer.from(pdfBytes);
        }
        catch (error) {
            console.error("Error al generar borrador de licencia con IA:", error);
            throw new Error("Error en la generación de borrador PDF");
        }
    }
    async extractDocumentMetadata(fileUrl, mimeType, category) {
        try {
            const getCategoryPrompt = (cat) => {
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
                const pdf = await Promise.resolve().then(() => __importStar(require("pdf-parse")));
                const pdfData = await pdf.default(buffer);
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
            }
            else {
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
        }
        catch (error) {
            console.error("Error al extraer metadatos del documento:", error);
            return {};
        }
    }
}
exports.AIProcessingService = AIProcessingService;
//# sourceMappingURL=aiProcessingService.js.map
"use strict";
/**
 * epbdCalculator.ts
 *
 * Utilidad para el cálculo simplificado de la letra energética potencial (EPBD)
 * basado en los umbrales estáticos promediados del Código Técnico de la Edificación (CTE - DB-HE) España.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SAVINGS_PCT = void 0;
exports.calculatePotentialRating = calculatePotentialRating;
// Mapeo simplificado de zonas climáticas principales basadas en la capital de provincia (según CTE DB-HE)
// Nos enfocamos en la severidad climática de invierno (letras A, B, C, D, E) que rige la demanda de calefacción.
exports.DEFAULT_SAVINGS_PCT = 30;
const climateZones = {
    // Zona A (Más cálida)
    "Almería": "A", "Cádiz": "A", "Ceuta": "A", "Huelva": "A", "Málaga": "A", "Melilla": "A", "Sevilla": "A", "Las Palmas": "A", "Santa Cruz de Tenerife": "A",
    // Zona B
    "Alicante": "B", "Illes Balears": "B", "Baleares": "B", "Castellón": "B", "Murcia": "B", "Tarragona": "B", "Valencia": "B", "Badajoz": "B", "Córdoba": "B", "Jaén": "B",
    // Zona C
    "A Coruña": "C", "La Coruña": "C", "Pontevedra": "C", "Barcelona": "C", "Girona": "C", "Gerona": "C", "Granada": "C", "Cáceres": "C", "Ciudad Real": "C", "Toledo": "C",
    // Zona D
    "Asturias": "D", "Cantabria": "D", "Gipuzkoa": "D", "Guipúzcoa": "D", "Bizkaia": "D", "Vizcaya": "D", "Álava": "D", "Lleida": "D", "Lérida": "D", "Navarra": "D", "Ourense": "D", "Orense": "D", "Albacete": "D", "Huesca": "D", "La Rioja": "D", "Madrid": "D", "Zaragoza": "D",
    // Zona E (Más fría)
    "Ávila": "E", "Burgos": "E", "León": "E", "Palencia": "E", "Salamanca": "E", "Segovia": "E", "Soria": "E", "Teruel": "E", "Valladolid": "E", "Zamora": "E", "Cuenca": "E", "Guadalajara": "E"
};
/**
 * Obtiene la letra de la zona climática para una provincia dada.
 * Si no se encuentra, asume una zona intermedia ("C").
 */
function getClimateZone(province) {
    if (!province)
        return "C";
    // Normalizar para búsqueda
    const normalized = province.trim();
    return climateZones[normalized] || "C";
}
function calculatePotentialRating(currentConsumption, savingsPct, typology, currentRating, province) {
    // Verificación de datos mínimos requeridos
    if (currentConsumption === null ||
        currentConsumption === undefined ||
        savingsPct === null ||
        savingsPct === undefined ||
        !typology) {
        return "-";
    }
    // Cálculo del nuevo consumo de energía primaria (kWh/m²·año)
    // Nota: savingsPct representa la reducción de consumo esperado en base a las medidas de mejora
    const newConsumption = currentConsumption * (1 - savingsPct / 100);
    const type = typology.toLowerCase();
    const zone = getClimateZone(province);
    let result = "G";
    // Umbrales aproximados basados en la severidad climática del CTE DB-HE
    if (type === "residential") {
        switch (zone) {
            case "A":
                if (newConsumption < 35)
                    result = "A";
                else if (newConsumption < 50)
                    result = "B";
                else if (newConsumption < 75)
                    result = "C";
                else if (newConsumption < 100)
                    result = "D";
                else if (newConsumption < 135)
                    result = "E";
                else if (newConsumption < 165)
                    result = "F";
                break;
            case "B":
                if (newConsumption < 40)
                    result = "A";
                else if (newConsumption < 55)
                    result = "B";
                else if (newConsumption < 80)
                    result = "C";
                else if (newConsumption < 110)
                    result = "D";
                else if (newConsumption < 145)
                    result = "E";
                else if (newConsumption < 180)
                    result = "F";
                break;
            case "C":
                if (newConsumption < 45)
                    result = "A";
                else if (newConsumption < 65)
                    result = "B";
                else if (newConsumption < 95)
                    result = "C";
                else if (newConsumption < 130)
                    result = "D";
                else if (newConsumption < 170)
                    result = "E";
                else if (newConsumption < 210)
                    result = "F";
                break;
            case "D":
                if (newConsumption < 55)
                    result = "A";
                else if (newConsumption < 80)
                    result = "B";
                else if (newConsumption < 115)
                    result = "C";
                else if (newConsumption < 155)
                    result = "D";
                else if (newConsumption < 200)
                    result = "E";
                else if (newConsumption < 245)
                    result = "F";
                break;
            case "E":
                if (newConsumption < 65)
                    result = "A";
                else if (newConsumption < 95)
                    result = "B";
                else if (newConsumption < 140)
                    result = "C";
                else if (newConsumption < 190)
                    result = "D";
                else if (newConsumption < 245)
                    result = "E";
                else if (newConsumption < 300)
                    result = "F";
                break;
        }
    }
    // Escala Terciario (Comercial, Oficinas, Mixto)
    else {
        switch (zone) {
            case "A":
                if (newConsumption < 40)
                    result = "A";
                else if (newConsumption < 60)
                    result = "B";
                else if (newConsumption < 85)
                    result = "C";
                else if (newConsumption < 115)
                    result = "D";
                else if (newConsumption < 145)
                    result = "E";
                else if (newConsumption < 175)
                    result = "F";
                break;
            case "B":
                if (newConsumption < 45)
                    result = "A";
                else if (newConsumption < 70)
                    result = "B";
                else if (newConsumption < 95)
                    result = "C";
                else if (newConsumption < 125)
                    result = "D";
                else if (newConsumption < 155)
                    result = "E";
                else if (newConsumption < 185)
                    result = "F";
                break;
            case "C":
                if (newConsumption < 50)
                    result = "A";
                else if (newConsumption < 75)
                    result = "B";
                else if (newConsumption < 105)
                    result = "C";
                else if (newConsumption < 135)
                    result = "D";
                else if (newConsumption < 165)
                    result = "E";
                else if (newConsumption < 195)
                    result = "F";
                break;
            case "D":
                if (newConsumption < 60)
                    result = "A";
                else if (newConsumption < 85)
                    result = "B";
                else if (newConsumption < 120)
                    result = "C";
                else if (newConsumption < 155)
                    result = "D";
                else if (newConsumption < 190)
                    result = "E";
                else if (newConsumption < 225)
                    result = "F";
                break;
            case "E":
                if (newConsumption < 70)
                    result = "A";
                else if (newConsumption < 100)
                    result = "B";
                else if (newConsumption < 140)
                    result = "C";
                else if (newConsumption < 180)
                    result = "D";
                else if (newConsumption < 220)
                    result = "E";
                else if (newConsumption < 260)
                    result = "F";
                break;
        }
    }
    // Si ya es "A", no hay más potencial de subida
    if (currentRating?.toUpperCase() === "A")
        return "-";
    // Si la mejora es < 5%, consideramos que no hay potencial significativo
    if (savingsPct < 5)
        return "-";
    return result;
}
//# sourceMappingURL=epbdCalculator.js.map
/**
 * epbdCalculator.ts
 *
 * Utilidad para el cálculo simplificado de la letra energética potencial (EPBD)
 * basado en los umbrales estáticos promediados del Código Técnico de la Edificación (CTE - DB-HE) España.
 */

export function calculatePotentialRating(
  currentConsumption: number | null | undefined,
  savingsPct: number | null | undefined,
  typology: string | null | undefined,
  currentRating?: string | null | undefined,
): string {
  // Verificación de datos mínimos requeridos
  if (
    currentConsumption === null ||
    currentConsumption === undefined ||
    savingsPct === null ||
    savingsPct === undefined ||
    !typology
  ) {
    return "-";
  }

  // Cálculo del nuevo consumo de energía primaria (kWh/m²·año)
  // Nota: savingsPct ahora se presenta como "Probabilidad", pero lo seguimos usando como
  // factor de escala para la reducción de consumo en el cálculo de la letra.
  const newConsumption = currentConsumption * (1 - savingsPct / 100);

  const type = typology.toLowerCase();
  let result = "G";

  // Escala Residencial (Ajustada para mayor sensibilidad en el salto B->A)
  if (type === "residential") {
    if (newConsumption < 45) result = "A";
    else if (newConsumption < 65) result = "B";
    else if (newConsumption < 95) result = "C";
    else if (newConsumption < 125) result = "D";
    else if (newConsumption < 165) result = "E";
    else if (newConsumption < 205) result = "F";
    else result = "G";
  } 
  // Escala Terciario (Comercial, Oficinas, Mixto)
  else {
    if (newConsumption < 50) result = "A";
    else if (newConsumption < 75) result = "B";
    else if (newConsumption < 105) result = "C";
    else if (newConsumption < 135) result = "D";
    else if (newConsumption < 165) result = "E";
    else if (newConsumption < 195) result = "F";
    else result = "G";
  }

  // REGLA DE ORO REFINADA:
  // 1. Si ya es "A", no hay más potencial de subida -> "-" (como pidió el usuario).
  // 2. Si la mejora es < 5%, consideramos que no hay potencial significativo -> "-".
  // 3. Si la mejora es < 15%, no forzamos el salto (solo si el cálculo lo justifica).
  // 4. Si la mejora es >= 15%, forzamos al menos un nivel de mejora para visibilidad.

  if (currentRating?.toUpperCase() === "A") return "-";
  if (savingsPct < 5) return "-";

  if (
    savingsPct >= 15 && 
    currentRating && 
    currentRating !== "-"
  ) {
    const scale = ["A", "B", "C", "D", "E", "F", "G"];
    const currentIndex = scale.indexOf(currentRating.toUpperCase());
    const resultIndex = scale.indexOf(result);

    // Si el cálculo da la misma letra o peor, forzamos la mejora de un nivel
    if (currentIndex !== -1 && (resultIndex === -1 || resultIndex >= currentIndex)) {
      result = scale[Math.max(0, currentIndex - 1)];
    }
  }

  return result;
}

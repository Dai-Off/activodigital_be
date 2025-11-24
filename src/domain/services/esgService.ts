export type EsgInput = {
  // Environmental
  ceeClass: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  energyConsumptionKwhPerM2Year: number; // kWh/m²·año
  co2EmissionsKgPerM2Year: number; // kg CO2eq/m²·año
  renewableSharePercent: number; // 0-100
  waterFootprintM3PerM2Year: number; // m³/m²·año

  // Social
  accessibility: 'full' | 'partial' | 'none';
  indoorAirQualityCo2Ppm: number; // ppm
  safetyCompliance: 'full' | 'pending' | 'none';

  // Governance
  digitalBuildingLog: 'full' | 'partial' | 'none';
  regulatoryCompliancePercent: number; // 0-100
};

export type EsgBreakdown = {
  environmental: {
    ceePoints: number;
    consumptionPoints: number;
    emissionsPoints: number;
    renewablePoints: number;
    waterPoints: number;
    subtotalRaw: number; // out of 70
    normalized: number; // 0-50
  };
  social: {
    accessibilityPoints: number;
    airQualityPoints: number;
    safetyPoints: number;
    subtotalRaw: number; // out of 30
    normalized: number; // 0-30 (same as subtotal)
  };
  governance: {
    digitalLogPoints: number;
    compliancePoints: number;
    subtotalRaw: number; // out of 20
    normalized: number; // 0-20 (same as subtotal)
  };
  total: number; // 0-100
  label: 'Premium' | 'Gold' | 'Silver' | 'Bronze' | 'Crítico';
};

export type EsgResult = 
  | { status: 'complete'; data: EsgBreakdown }
  | { status: 'incomplete'; missingData: string[]; message: string };

export class EsgService {
  /**
   * Calcula ESG dinámicamente desde la base de datos
   * @param buildingId ID del edificio
   * @param supabase Cliente de Supabase
   * @returns Resultado del cálculo ESG con los datos disponibles
   */
  async calculateFromDatabase(buildingId: string, supabase: any): Promise<EsgResult> {
    // Obtener el certificado energético más reciente
    const { data: certificates, error: certError } = await supabase
      .from('energy_certificates')
      .select('rating, primary_energy_kwh_per_m2_year, emissions_kg_co2_per_m2_year')
      .eq('building_id', buildingId)
      .order('issue_date', { ascending: false })
      .limit(1);

    console.log('ESG Service - Building ID:', buildingId);
    console.log('ESG Service - Certificates query result:', { certificates, certError });

    // Obtener el libro digital
    const { data: digitalBooks, error: bookError } = await supabase
      .from('digital_books')
      .select('estado, campos_ambientales')
      .eq('building_id', buildingId)
      .limit(1);

    console.log('ESG Service - Digital books query result:', { digitalBooks, bookError });

    const certificate = certificates?.[0];
    const digitalBook = digitalBooks?.[0];
    const camposAmbientales = digitalBook?.campos_ambientales || {};

    // Verificar datos críticos faltantes
    const missingData: string[] = [];
    
    // Datos críticos del certificado energético
    if (!certificate?.rating) {
      missingData.push('Certificado energético (rating)');
    }
    if (!certificate?.primary_energy_kwh_per_m2_year) {
      missingData.push('Consumo energético (kWh/m²·año)');
    }
    if (!certificate?.emissions_kg_co2_per_m2_year) {
      missingData.push('Emisiones CO₂ (kg CO₂eq/m²·año)');
    }
    
    // Datos críticos del libro digital
    if (!digitalBook?.estado) {
      missingData.push('Estado del libro digital');
    }
    
    // Verificar datos opcionales que deben estar presentes para cálculo completo
    if (camposAmbientales.renewableSharePercent === null || camposAmbientales.renewableSharePercent === undefined) {
      missingData.push('Porcentaje de energía renovable');
    }
    if (camposAmbientales.waterFootprintM3PerM2Year === null || camposAmbientales.waterFootprintM3PerM2Year === undefined) {
      missingData.push('Huella hídrica (m³/m²·año)');
    }
    if (!camposAmbientales.accessibility) {
      missingData.push('Nivel de accesibilidad');
    }
    if (camposAmbientales.indoorAirQualityCo2Ppm === null || camposAmbientales.indoorAirQualityCo2Ppm === undefined) {
      missingData.push('Calidad del aire interior (ppm CO₂)');
    }
    if (!camposAmbientales.safetyCompliance) {
      missingData.push('Cumplimiento de seguridad');
    }
    if (camposAmbientales.regulatoryCompliancePercent === null || camposAmbientales.regulatoryCompliancePercent === undefined) {
      missingData.push('Porcentaje de cumplimiento normativo');
    }
    
    // Si faltan datos críticos, retornar estado incomplete
    if (missingData.length > 0) {
      const incompleteResult: EsgResult = {
        status: 'incomplete',
        missingData,
        message: `Faltan datos críticos para calcular el score ESG: ${missingData.join(', ')}. Completa la información necesaria para obtener un cálculo preciso.`
      };
      
      // Guardar resultado incomplete en la base de datos
      await this.saveEsgScore(buildingId, incompleteResult, supabase);
      
      return incompleteResult;
    }

    // Mapear estado del libro digital a nivel de completitud
    let digitalBuildingLog: EsgInput['digitalBuildingLog'] = 'none';
    if (digitalBook?.estado === 'publicado') {
      digitalBuildingLog = 'full';
    } else if (digitalBook?.estado === 'validado') {
      digitalBuildingLog = 'partial';
    }

    // Construir input con datos reales (todos garantizados por validación anterior)
    const input: EsgInput = {
      // Datos del certificado energético (garantizados por validación anterior)
      ceeClass: certificate.rating as EsgInput['ceeClass'],
      energyConsumptionKwhPerM2Year: certificate.primary_energy_kwh_per_m2_year,
      co2EmissionsKgPerM2Year: certificate.emissions_kg_co2_per_m2_year,
      
      // Datos ambientales (garantizados por validación anterior)
      renewableSharePercent: camposAmbientales.renewableSharePercent,
      waterFootprintM3PerM2Year: camposAmbientales.waterFootprintM3PerM2Year,
      
      // Datos sociales (garantizados por validación anterior)
      accessibility: camposAmbientales.accessibility as EsgInput['accessibility'],
      indoorAirQualityCo2Ppm: camposAmbientales.indoorAirQualityCo2Ppm,
      safetyCompliance: camposAmbientales.safetyCompliance as EsgInput['safetyCompliance'],
      
      // Datos de governance
      digitalBuildingLog,
      regulatoryCompliancePercent: camposAmbientales.regulatoryCompliancePercent,
    };

    const calculatedData = this.calculate(input);
    
    // Guardar resultado en la base de datos
    await this.saveEsgScore(buildingId, { status: 'complete', data: calculatedData }, supabase);

    return {
      status: 'complete',
      data: calculatedData
    };
  }
  
  /**
   * Guarda el resultado del cálculo ESG en la base de datos
   */
  private async saveEsgScore(buildingId: string, result: EsgResult, supabase: any): Promise<void> {
    try {
      if (result.status === 'complete' && result.data) {
        const data = result.data;
        await supabase
          .from('esg_scores')
          .upsert({
            building_id: buildingId,
            status: 'complete',
            environmental_cee_points: data.environmental.ceePoints,
            environmental_consumption_points: data.environmental.consumptionPoints,
            environmental_emissions_points: data.environmental.emissionsPoints,
            environmental_renewable_points: data.environmental.renewablePoints,
            environmental_water_points: data.environmental.waterPoints,
            environmental_subtotal_raw: data.environmental.subtotalRaw,
            environmental_normalized: data.environmental.normalized,
            social_accessibility_points: data.social.accessibilityPoints,
            social_air_quality_points: data.social.airQualityPoints,
            social_safety_points: data.social.safetyPoints,
            social_subtotal_raw: data.social.subtotalRaw,
            social_normalized: data.social.normalized,
            governance_digital_log_points: data.governance.digitalLogPoints,
            governance_compliance_points: data.governance.compliancePoints,
            governance_subtotal_raw: data.governance.subtotalRaw,
            governance_normalized: data.governance.normalized,
            total: data.total,
            label: data.label,
            missing_data: null,
            message: null,
            calculated_at: new Date().toISOString()
          }, {
            onConflict: 'building_id'
          });
      } else if (result.status === 'incomplete') {
        await supabase
          .from('esg_scores')
          .upsert({
            building_id: buildingId,
            status: 'incomplete',
            environmental_cee_points: null,
            environmental_consumption_points: null,
            environmental_emissions_points: null,
            environmental_renewable_points: null,
            environmental_water_points: null,
            environmental_subtotal_raw: null,
            environmental_normalized: null,
            social_accessibility_points: null,
            social_air_quality_points: null,
            social_safety_points: null,
            social_subtotal_raw: null,
            social_normalized: null,
            governance_digital_log_points: null,
            governance_compliance_points: null,
            governance_subtotal_raw: null,
            governance_normalized: null,
            total: null,
            label: null,
            missing_data: JSON.stringify(result.missingData),
            message: result.message,
            calculated_at: new Date().toISOString()
          }, {
            onConflict: 'building_id'
          });
      }

      const { generateBuildingEmbedding } = await import('../../lib/embeddingHelper');
      generateBuildingEmbedding(buildingId).catch(err => {
        console.error('Error generando embeddings:', err);
      });
    } catch (error) {
      console.error('Error guardando ESG score:', error);
      // No lanzar error para no bloquear el cálculo
    }
  }
  
  /**
   * Obtiene el ESG guardado desde la base de datos
   */
  async getStoredEsgScore(buildingId: string, supabase: any): Promise<EsgResult | null> {
    try {
      const { data, error } = await supabase
        .from('esg_scores')
        .select('*')
        .eq('building_id', buildingId)
        .single();
      
      if (error || !data) {
        return null;
      }
      
      if (data.status === 'complete') {
        return {
          status: 'complete',
          data: {
            environmental: {
              ceePoints: data.environmental_cee_points,
              consumptionPoints: data.environmental_consumption_points,
              emissionsPoints: data.environmental_emissions_points,
              renewablePoints: data.environmental_renewable_points,
              waterPoints: data.environmental_water_points,
              subtotalRaw: data.environmental_subtotal_raw,
              normalized: data.environmental_normalized
            },
            social: {
              accessibilityPoints: data.social_accessibility_points,
              airQualityPoints: data.social_air_quality_points,
              safetyPoints: data.social_safety_points,
              subtotalRaw: data.social_subtotal_raw,
              normalized: data.social_normalized
            },
            governance: {
              digitalLogPoints: data.governance_digital_log_points,
              compliancePoints: data.governance_compliance_points,
              subtotalRaw: data.governance_subtotal_raw,
              normalized: data.governance_normalized
            },
            total: data.total,
            label: data.label
          }
        };
      } else {
        return {
          status: 'incomplete',
          missingData: JSON.parse(data.missing_data || '[]'),
          message: data.message || 'Datos incompletos'
        };
      }
    } catch (error) {
      console.error('Error obteniendo ESG score guardado:', error);
      return null;
    }
  }

  calculate(input: EsgInput): EsgBreakdown {
    const ceePoints = this.pointsForCee(input.ceeClass);
    const consumptionPoints = this.pointsForConsumption(input.energyConsumptionKwhPerM2Year);
    const emissionsPoints = this.pointsForEmissions(input.co2EmissionsKgPerM2Year);
    const renewablePoints = this.pointsForRenewables(input.renewableSharePercent);
    const waterPoints = this.pointsForWater(input.waterFootprintM3PerM2Year);

    const eSubtotalRaw = ceePoints + consumptionPoints + emissionsPoints + renewablePoints + waterPoints; // out of 70
    const eNormalized = Math.round((eSubtotalRaw / 70) * 50); // normalize to 0-50

    const accessibilityPoints = this.pointsForAccessibility(input.accessibility);
    const airQualityPoints = this.pointsForAirQuality(input.indoorAirQualityCo2Ppm);
    const safetyPoints = this.pointsForSafety(input.safetyCompliance);

    const sSubtotalRaw = accessibilityPoints + airQualityPoints + safetyPoints; // out of 30
    const sNormalized = sSubtotalRaw; // direct scale 0-30

    const digitalLogPoints = this.pointsForDigitalLog(input.digitalBuildingLog);
    const compliancePoints = this.pointsForRegulatoryCompliance(input.regulatoryCompliancePercent);

    const gSubtotalRaw = digitalLogPoints + compliancePoints; // out of 20
    const gNormalized = gSubtotalRaw; // direct scale 0-20

    const total = eNormalized + sNormalized + gNormalized;
    const label = this.labelForTotal(total);

    return {
      environmental: {
        ceePoints,
        consumptionPoints,
        emissionsPoints,
        renewablePoints,
        waterPoints,
        subtotalRaw: eSubtotalRaw,
        normalized: eNormalized,
      },
      social: {
        accessibilityPoints,
        airQualityPoints,
        safetyPoints,
        subtotalRaw: sSubtotalRaw,
        normalized: sNormalized,
      },
      governance: {
        digitalLogPoints,
        compliancePoints,
        subtotalRaw: gSubtotalRaw,
        normalized: gNormalized,
      },
      total,
      label,
    };
  }

  private pointsForCee(cee: EsgInput['ceeClass']): number {
    switch (cee) {
      case 'A': return 50;
      case 'B': return 40;
      case 'C': return 30;
      case 'D': return 20;
      case 'E': return 10;
      default: return 0; // F-G
    }
  }

  private pointsForConsumption(kwhPerM2Year: number): number {
    if (kwhPerM2Year < 50) return 10;
    if (kwhPerM2Year <= 100) return 8;
    if (kwhPerM2Year <= 150) return 6;
    if (kwhPerM2Year <= 200) return 4;
    return 0;
  }

  private pointsForEmissions(kgCo2PerM2Year: number): number {
    if (kgCo2PerM2Year < 5) return 10;
    if (kgCo2PerM2Year <= 15) return 8;
    if (kgCo2PerM2Year <= 30) return 6;
    if (kgCo2PerM2Year <= 50) return 4;
    return 0;
  }

  private pointsForRenewables(percent: number): number {
    if (percent > 70) return 10;
    if (percent >= 40) return 7;
    if (percent >= 20) return 5;
    return 0;
  }

  private pointsForWater(m3PerM2Year: number): number {
    if (m3PerM2Year < 0.5) return 10;
    if (m3PerM2Year <= 1.0) return 7;
    if (m3PerM2Year <= 2.0) return 5;
    return 0;
  }

  private pointsForAccessibility(level: EsgInput['accessibility']): number {
    if (level === 'full') return 10;
    if (level === 'partial') return 5;
    return 0;
  }

  private pointsForAirQuality(ppm: number): number {
    if (ppm < 600) return 10;
    if (ppm <= 1000) return 7;
    if (ppm <= 1500) return 5;
    return 0;
  }

  private pointsForSafety(level: EsgInput['safetyCompliance']): number {
    if (level === 'full') return 10;
    if (level === 'pending') return 5;
    return 0;
  }

  private pointsForDigitalLog(level: EsgInput['digitalBuildingLog']): number {
    if (level === 'full') return 10;
    if (level === 'partial') return 5;
    return 0;
  }

  private pointsForRegulatoryCompliance(percent: number): number {
    if (percent >= 90) return 10;
    if (percent >= 70) return 7;
    if (percent >= 50) return 5;
    return 0;
  }

  private labelForTotal(total: number): EsgBreakdown['label'] {
    if (total >= 90) return 'Premium';
    if (total >= 80) return 'Gold';
    if (total >= 60) return 'Silver';
    if (total >= 40) return 'Bronze';
    return 'Crítico';
  }
}



import { getSupabaseClient } from '../../lib/supabase';
import { TechnicalAuditResult, TechnicalTask, EnergyImprovement } from '../../types/technicalAudit';
import { EsgService } from './esgService';
import { SectionType } from '../../types/libroDigital';
import { AUDIT_CONSTANTS } from '../constants/auditConstants';

export class TechnicalAuditService {
  private esgService = new EsgService();


  private getSupabase() {
    return getSupabaseClient();
  }

  /**
   * Valida que todos los datos críticos estén presentes antes de ejecutar la auditoría
   * @param digitalBook Libro digital del edificio
   * @param certificate Certificado energético
   * @param esgResult Resultado del cálculo ESG
   * @throws Error si faltan datos críticos
   */
  private validateRequiredData(
    digitalBook: any,
    certificate: any,
    esgResult: any
  ): string[] {
    const missingData: string[] = [];

    // Validar libro digital
    if (!digitalBook) {
      missingData.push('Libro digital del edificio');
    } else if (!digitalBook.estado) {
      missingData.push('Estado del libro digital');
    }

    // Validar certificado energético
    if (!certificate) {
      missingData.push('Certificado energético (CEE)');
    } else {
      if (!certificate.rating) {
        missingData.push('Rating del certificado energético');
      }
      if (!certificate.primary_energy_kwh_per_m2_year) {
        missingData.push('Consumo energético primario (kWh/m²·año)');
      }
      if (!certificate.emissions_kg_co2_per_m2_year) {
        missingData.push('Emisiones CO₂ (kg CO₂eq/m²·año)');
      }
    }

    // Validar ESG completo
    if (!esgResult) {
      missingData.push('Score ESG (no se pudo calcular)');
    } else if (esgResult.status !== 'complete') {
      if (esgResult.status === 'incomplete' && esgResult.missingData) {
        esgResult.missingData.forEach((item: string) => missingData.push(`Datos ESG: ${item}`));
      } else {
        missingData.push('Score ESG completo');
      }
    }

    return missingData;
  }

  /**
   * Obtiene la auditoría técnica de un edificio
   * @param buildingId ID del edificio
   * @param userAuthId ID del usuario autenticado (para validar permisos)
   * @returns Resultado de la auditoría técnica
   * @throws Error si faltan datos críticos (libro digital, CEE, ESG completo)
   */
  async getTechnicalAudit(buildingId: string, userAuthId: string): Promise<TechnicalAuditResult> {
    const supabase = this.getSupabase();

    // Verificar que el edificio existe
    const { data: building, error: buildingError } = await supabase
      .from('buildings')
      .select('id, square_meters, construction_year')
      .eq('id', buildingId)
      .eq('deleted', false)
      .single();

    if (buildingError || !building) {
      throw new Error('Edificio no encontrado');
    }

    // Obtener libro digital
    const { data: digitalBook, error: bookError } = await supabase
      .from('digital_books')
      .select('id, status, progress, sections, estado, campos_ambientales')
      .eq('building_id', buildingId)
      .limit(1)
      .maybeSingle();

    if (bookError) {
      console.error('Error obteniendo libro digital:', bookError);
      throw new Error(`Error al obtener el libro digital: ${bookError.message}`);
    }

    // Obtener certificado energético más reciente
    const { data: certificate, error: certError } = await supabase
      .from('energy_certificates')
      .select('rating, primary_energy_kwh_per_m2_year, emissions_kg_co2_per_m2_year, issue_date')
      .eq('building_id', buildingId)
      .order('issue_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (certError) {
      console.error('Error obteniendo certificado energético:', certError);
      throw new Error(`Error al obtener el certificado energético: ${certError.message}`);
    }

    // Obtener o calcular ESG
    let esgResult = null;
    try {
      console.log(`[TechnicalAudit] Obteniendo ESG para edificio ${buildingId}`);
      esgResult = await this.esgService.getStoredEsgScore(buildingId, supabase);
      
      if (!esgResult) {
        console.log(`[TechnicalAudit] No hay ESG guardado, calculando desde BD para edificio ${buildingId}`);
        // Si no hay ESG guardado, calcularlo
        esgResult = await this.esgService.calculateFromDatabase(buildingId, supabase);
        console.log(`[TechnicalAudit] ESG calculado:`, {
          status: esgResult?.status,
          hasData: esgResult?.status === 'complete' ? !!esgResult.data : false,
          missingDataCount: esgResult?.status === 'incomplete' ? esgResult.missingData?.length : 0
        });
      } else {
        console.log(`[TechnicalAudit] ESG obtenido de BD:`, {
          status: esgResult?.status,
          hasData: esgResult?.status === 'complete' ? !!esgResult.data : false
        });
      }
    } catch (error) {
      console.error(`[TechnicalAudit] Error obteniendo/calculando ESG para edificio ${buildingId}:`, error);
      throw new Error(
        `Error al calcular el score ESG: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }

    // VALIDAR QUE TODOS LOS DATOS CRÍTICOS ESTÉN PRESENTES
    const missingData = this.validateRequiredData(digitalBook, certificate, esgResult);
    const isComplete = missingData.length === 0;

    console.log(`[TechnicalAudit] Validación para edificio ${buildingId}:`, {
      isComplete,
      missingCount: missingData.length,
      hasDigitalBook: !!digitalBook,
      hasCertificate: !!certificate
    });

    // Calcular porcentaje de completitud
    const completionPercentage = this.calculateCompletionPercentage(
      digitalBook,
      certificate,
      esgResult
    );

    // Generar tareas
    const tasks = this.generateTasks(digitalBook, certificate, esgResult, building);

    // Generar mejoras energéticas (usando certificado, libro digital y ESG)
    const energyImprovements = this.generateEnergyImprovements(certificate, digitalBook, esgResult, building);

    // Calcular ahorro potencial
    const potentialSavingsKwhPerM2 = this.calculatePotentialSavings(
      certificate,
      energyImprovements
    );

    // Filter priority improvements for financial summary
    const priorityImprovements = energyImprovements.filter(imp => imp.priority === 'high' || imp.priority === 'medium');
    
    // Sumar inversiones, ahorros económicos y CO2
    const sqMeters = building?.square_meters || AUDIT_CONSTANTS.BUILDING.DEFAULT_SQ_METERS;
    const pricePerKwh = AUDIT_CONSTANTS.ENERGY.PRICE_PER_KWH;
    
    const totalInvestment = priorityImprovements.reduce((sum, imp) => sum + (imp.estimatedCost || 0), 0);
    const totalAnnualSavings = priorityImprovements.reduce((sum, imp) => sum + (imp.estimatedSavingsKwhPerM2 * sqMeters * pricePerKwh), 0) * AUDIT_CONSTANTS.BUILDING.OVERLAP_FACTOR;
    const totalCo2Reduction = priorityImprovements.reduce((sum, imp) => sum + (imp.estimatedCo2Reduction || 0), 0) * AUDIT_CONSTANTS.BUILDING.OVERLAP_FACTOR;
    
    const roiAggregated = totalAnnualSavings > 0 ? Number((totalInvestment / totalAnnualSavings).toFixed(1)) : 0;

    // Resumen
    const summary = {
      totalTasks: tasks.length,
      highPriorityTasks: tasks.filter(t => t.priority === 'high').length,
      mediumPriorityTasks: tasks.filter(t => t.priority === 'medium').length,
      lowPriorityTasks: tasks.filter(t => t.priority === 'low').length,
      recommendedImprovements: energyImprovements.length,
      totalInvestment: Math.round(totalInvestment),
      totalAnnualSavings: Math.round(totalAnnualSavings),
      totalCo2Reduction: Number(totalCo2Reduction.toFixed(1)),
      roiAggregated
    };

    return {
      isComplete,
      missingData: missingData.length > 0 ? missingData : undefined,
      completionPercentage,
      tasks,
      energyImprovements,
      potentialSavingsKwhPerM2,
      esgResult, // Incluir resultado ESG en la respuesta
      summary
    };
  }

  /**
   * Calcula el porcentaje de completitud técnico (0-100)
   */
  private calculateCompletionPercentage(
    digitalBook: any,
    certificate: any,
    esgResult: any
  ): number {
    let score = 0;
    let maxScore = 0;

    // Libro digital (50 puntos máx)
    maxScore += 50;
    if (digitalBook) {
      // Progreso de secciones técnicas (maintenance, facilities, renovations, sustainability)
      const technicalSections = [
        SectionType.MAINTENANCE_AND_CONSERVATION,
        SectionType.FACILITIES_AND_CONSUMPTION,
        SectionType.RENOVATIONS_AND_REHABILITATIONS,
        SectionType.SUSTAINABILITY_AND_ESG
      ];

      const sections = digitalBook.sections || [];
      const technicalComplete = sections.filter((s: any) => 
        technicalSections.includes(s.type) && s.complete
      ).length;
      
      // Puntos por secciones técnicas completas (4 secciones = 40 puntos)
      score += (technicalComplete / technicalSections.length) * 40;

      // Puntos por estado del libro (10 puntos)
      if (digitalBook.estado === 'publicado') {
        score += 10;
      } else if (digitalBook.estado === 'validado') {
        score += 6;
      } else if (digitalBook.estado === 'en_borrador' || digitalBook.status === 'in_progress') {
        score += 3;
      }
    }

    // Certificado energético (30 puntos máx)
    maxScore += 30;
    if (certificate?.rating && certificate?.primary_energy_kwh_per_m2_year) {
      score += 30;
    }

    // ESG completo (20 puntos máx)
    maxScore += 20;
    if (esgResult) {
      if (esgResult.status === 'complete') {
        score += 20;
      } else if (esgResult.status === 'incomplete') {
        // Puntos parciales si tiene algunos datos
        const missingCount = esgResult.missingData?.length || 0;
        const completenessRatio = Math.max(0, 1 - (missingCount / 10)); // Aproximado
        score += completenessRatio * 10;
      }
    }
    // Si esgResult es null, no se suman puntos (0/20)

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Genera lista de tareas pendientes
   */
  private generateTasks(
    digitalBook: any,
    certificate: any,
    esgResult: any,
    building: any
  ): TechnicalTask[] {
    const tasks: TechnicalTask[] = [];
    let taskId = 1;

    // Tareas relacionadas con el libro digital
    if (!digitalBook) {
      tasks.push({
        id: `task-${taskId++}`,
        category: 'documentation',
        title: 'Crear libro digital del edificio',
        description: 'El edificio no tiene un libro digital asociado. Es necesario crear uno para cumplir con la normativa.',
        priority: 'high',
        relatedData: 'digital_book'
      });
    } else {
      const sections = digitalBook.sections || [];
      
      // Verificar sección de mantenimiento
      const maintenanceSection = sections.find((s: any) => 
        s.type === SectionType.MAINTENANCE_AND_CONSERVATION
      );
      if (!maintenanceSection || !maintenanceSection.complete) {
        tasks.push({
          id: `task-${taskId++}`,
          category: 'maintenance',
          title: 'Completar plan de mantenimiento preventivo',
          description: 'La sección de mantenimiento y conservación del libro digital está incompleta. Es necesario definir un plan de mantenimiento preventivo.',
          priority: 'high',
          relatedData: 'maintenance_section'
        });
      }

      // Verificar sección de instalaciones
      const facilitiesSection = sections.find((s: any) => 
        s.type === SectionType.FACILITIES_AND_CONSUMPTION
      );
      if (!facilitiesSection || !facilitiesSection.complete) {
        tasks.push({
          id: `task-${taskId++}`,
          category: 'energy',
          title: 'Documentar instalaciones y consumos',
          description: 'La sección de instalaciones y consumo del libro digital está incompleta. Es necesario documentar los sistemas de calefacción, electricidad y agua.',
          priority: 'medium',
          relatedData: 'facilities_section'
        });
      }

      // Verificar sección de reformas
      const renovationsSection = sections.find((s: any) => 
        s.type === SectionType.RENOVATIONS_AND_REHABILITATIONS
      );
      if (!renovationsSection || !renovationsSection.complete) {
        tasks.push({
          id: `task-${taskId++}`,
          category: 'documentation',
          title: 'Documentar historial de reformas',
          description: 'La sección de reformas y rehabilitaciones está incompleta. Documentar las obras realizadas ayuda a evaluar mejoras energéticas.',
          priority: 'low',
          relatedData: 'renovations_section'
        });
      }

      // Verificar sección de sostenibilidad
      const sustainabilitySection = sections.find((s: any) => 
        s.type === SectionType.SUSTAINABILITY_AND_ESG
      );
      if (!sustainabilitySection || !sustainabilitySection.complete) {
        tasks.push({
          id: `task-${taskId++}`,
          category: 'energy',
          title: 'Completar datos de sostenibilidad',
          description: 'La sección de sostenibilidad y ESG está incompleta. Completarla permitirá calcular el score ESG del edificio.',
          priority: 'medium',
          relatedData: 'sustainability_section'
        });
      }

      // Verificar campos ambientales
      const camposAmbientales = digitalBook.campos_ambientales || {};
      if (!camposAmbientales.accessibility || camposAmbientales.accessibility === 'none') {
        tasks.push({
          id: `task-${taskId++}`,
          category: 'safety',
          title: 'Evaluar accesibilidad del edificio',
          description: 'No se ha evaluado el nivel de accesibilidad del edificio. Es importante para cumplir con normativas de accesibilidad.',
          priority: 'medium',
          relatedData: 'accessibility'
        });
      }

      if (!camposAmbientales.safetyCompliance || camposAmbientales.safetyCompliance === 'none') {
        tasks.push({
          id: `task-${taskId++}`,
          category: 'safety',
          title: 'Verificar cumplimiento de seguridad',
          description: 'No se ha verificado el cumplimiento de las normativas de seguridad del edificio.',
          priority: 'high',
          relatedData: 'safety_compliance'
        });
      }
    }

    // Tareas relacionadas con certificado energético
    if (!certificate) {
      tasks.push({
        id: `task-${taskId++}`,
        category: 'energy',
        title: 'Obtener certificado energético',
        description: 'El edificio no tiene un certificado energético registrado. Es obligatorio tener uno vigente.',
        priority: 'high',
        relatedData: 'energy_certificate'
      });
    } else {
      // Verificar si el certificado está vigente (menos de 10 años)
      const issueDate = new Date(certificate.issue_date);
      const yearsSinceIssue = (new Date().getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (yearsSinceIssue > 10) {
        tasks.push({
          id: `task-${taskId++}`,
          category: 'energy',
          title: 'Renovar certificado energético',
          description: `El certificado energético tiene más de ${Math.round(yearsSinceIssue)} años. Se recomienda renovarlo para obtener datos actualizados.`,
          priority: 'medium',
          relatedData: 'energy_certificate_expired'
        });
      }
    }

    // Tareas relacionadas con ESG
    if (!esgResult) {
      tasks.push({
        id: `task-${taskId++}`,
        category: 'compliance',
        title: 'Calcular score ESG',
        description: 'No se pudo obtener o calcular el score ESG del edificio. Verifica que existan certificado energético y libro digital con datos completos.',
        priority: 'medium',
        relatedData: 'esg_score'
      });
    } else if (esgResult.status === 'incomplete' && esgResult.missingData) {
      esgResult.missingData.forEach((missing: string) => {
        tasks.push({
          id: `task-${taskId++}`,
          category: 'compliance',
          title: `Completar: ${missing}`,
          description: `Falta información necesaria para calcular el score ESG: ${missing}.`,
          priority: 'medium',
          relatedData: missing
        });
      });
    }

    return tasks;
  }

  /**
   * Genera sugerencias de mejoras energéticas
   * Usa datos del certificado energético, libro digital y ESG para generar recomendaciones precisas
   */
  private generateEnergyImprovements(
    certificate: any,
    digitalBook: any,
    esgResult: any,
    building: any
  ): EnergyImprovement[] {
    const improvements: EnergyImprovement[] = [];
    let improvementId = 1;

    if (!certificate) {
      return improvements;
    }

    const rating = certificate.rating;
    const currentConsumption = certificate.primary_energy_kwh_per_m2_year || 0;
    const emissions = certificate.emissions_kg_co2_per_m2_year || 0;
    const camposAmbientales = digitalBook?.campos_ambientales || {};
    const sqMeters = building?.square_meters || AUDIT_CONSTANTS.BUILDING.DEFAULT_SQ_METERS;
    
    // Usar datos del ESG si está disponible para mejorar las recomendaciones
    const esgScore = esgResult?.status === 'complete' ? esgResult.data?.total : null;
    const esgEnvironmental = esgResult?.status === 'complete' ? esgResult.data?.environmental?.normalized : null;

    // Factores aproximados de coste (euros) y reducción CO2 para España
    const factorCo2 = AUDIT_CONSTANTS.ENERGY.CO2_FACTOR_KG_PER_KWH;

    if (['D', 'E', 'F', 'G'].includes(rating)) {
      const savingsKwh = rating === 'G' ? 80 : rating === 'F' ? 60 : rating === 'E' ? 40 : 25;
      improvements.push({
        id: `improvement-${improvementId++}`,
        type: 'insulation',
        title: 'Mejora del aislamiento térmico',
        description: 'Instalar o mejorar el aislamiento en fachadas (SATE), cubierta y suelos.',
        estimatedSavingsKwhPerM2: savingsKwh,
        priority: 'high',
        estimatedCost: Math.round(sqMeters * AUDIT_CONSTANTS.COSTS_PER_M2.INSULATION), // ~120€/m2 envolvente
        estimatedRoi: 9, // ~9 años
        estimatedCo2Reduction: Number((savingsKwh * factorCo2).toFixed(1))
      });

      improvements.push({
        id: `improvement-${improvementId++}`,
        type: 'windows',
        title: 'Sustitución de ventanas',
        description: 'Instalar ventanas de doble acristalamiento con marcos eficientes (RPT).',
        estimatedSavingsKwhPerM2: 15,
        priority: 'high',
        estimatedCost: Math.round(sqMeters * AUDIT_CONSTANTS.COSTS_PER_M2.WINDOWS), // Estimación basada en m2 edificio vs envolvente hueca
        estimatedRoi: 10,
        estimatedCo2Reduction: Number((15 * factorCo2).toFixed(1))
      });
    }

    if (currentConsumption > 150) {
      improvements.push({
        id: `improvement-${improvementId++}`,
        type: 'heating',
        title: 'Optimización del sistema de calefacción',
        description: 'Sustituir calderas antiguas por aerotermia de alta eficiencia.',
        estimatedSavingsKwhPerM2: 30,
        priority: 'high',
        estimatedCost: Math.round(sqMeters * AUDIT_CONSTANTS.COSTS_PER_M2.HVAC), // Equipo térmico por m2
        estimatedRoi: 7,
        estimatedCo2Reduction: Number((30 * AUDIT_CONSTANTS.ENERGY.HEATING_CO2_FACTOR).toFixed(1)) // Mayor factor para salto fósil a eléctrico
      });
    }

    improvements.push({
      id: `improvement-${improvementId++}`,
      type: 'lighting',
      title: 'Sustitución a iluminación LED',
      description: 'Reemplazar iluminación tradicional por LED con sensores de presencia.',
      estimatedSavingsKwhPerM2: 8,
      priority: 'medium',
      estimatedCost: Math.round(sqMeters * AUDIT_CONSTANTS.COSTS_PER_M2.LIGHTING), 
      estimatedRoi: 3,
      estimatedCo2Reduction: Number((8 * factorCo2).toFixed(1))
    });

    const renewableShare = camposAmbientales.renewableSharePercent || 0;
    if (renewableShare < 30) {
      const shouldPrioritizeRenewable = esgEnvironmental !== null && esgEnvironmental < 30;
      improvements.push({
        id: `improvement-${improvementId++}`,
        type: 'renewable',
        title: 'Instalación de energías renovables',
        description: 'Instalar paneles solares fotovoltaicos en cubierta para autoconsumo.',
        estimatedSavingsKwhPerM2: 20,
        priority: renewableShare === 0 || shouldPrioritizeRenewable ? 'high' : 'medium',
        estimatedCost: Math.round(sqMeters * AUDIT_CONSTANTS.COSTS_PER_M2.RENEWABLES), // Instalación FV ratio por m2 de edificio aprox
        estimatedRoi: 5,
        estimatedCo2Reduction: Number((20 * factorCo2).toFixed(1))
      });
    }

    if (esgEnvironmental !== null && esgEnvironmental < 35) {
      improvements.push({
        id: `improvement-${improvementId++}`,
        type: 'esg',
        title: 'Mejoras integrales ESG',
        description: `El score ESG ambiental es bajo (${esgEnvironmental.toFixed(1)}/50). Intervenir en sistemas pasivos y activos.`,
        estimatedSavingsKwhPerM2: 25,
        priority: 'high',
        estimatedCost: Math.round(sqMeters * 80),
        estimatedRoi: 8,
        estimatedCo2Reduction: Number((25 * factorCo2).toFixed(1))
      });
    }

    if (currentConsumption > 100) {
      improvements.push({
        id: `improvement-${improvementId++}`,
        type: 'hvac',
        title: 'Sistemas de Control HVAC y VMC',
        description: 'Domótica, control inteligente de clima y ventilación con recuperación.',
        estimatedSavingsKwhPerM2: 18,
        priority: 'medium',
        estimatedCost: Math.round(sqMeters * 35),
        estimatedRoi: 6,
        estimatedCo2Reduction: Number((18 * factorCo2).toFixed(1))
      });
    }

    if (['A', 'B'].includes(rating)) {
      return improvements.filter(imp => imp.type === 'lighting' || imp.type === 'renewable');
    }

    return improvements;
  }

  /**
   * Calcula el ahorro potencial total en kWh/m²·año
   */
  private calculatePotentialSavings(
    certificate: any,
    improvements: EnergyImprovement[]
  ): number {
    if (!certificate) {
      return 0;
    }

    // Sumar ahorros de mejoras prioritarias (high y medium)
    const priorityImprovements = improvements.filter(imp => 
      imp.priority === 'high' || imp.priority === 'medium'
    );

    // Calcular ahorro total (suma de mejoras, con un factor de solapamiento del 0.85)
    // porque algunas mejoras pueden tener efectos parcialmente solapados
    const totalSavings = priorityImprovements.reduce(
      (sum, imp) => sum + imp.estimatedSavingsKwhPerM2,
      0
    );

    // Aplicar factor de solapamiento
    return Math.round(totalSavings * AUDIT_CONSTANTS.BUILDING.OVERLAP_FACTOR);
  }
}


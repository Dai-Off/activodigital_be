import { getSupabaseClient } from '../../lib/supabase';
import { TechnicalAuditResult, TechnicalTask, EnergyImprovement } from '../../types/technicalAudit';
import { EsgService } from './esgService';
import { SectionType } from '../../types/libroDigital';

export class TechnicalAuditService {
  private esgService = new EsgService();

  private getSupabase() {
    return getSupabaseClient();
  }

  /**
   * Obtiene la auditoría técnica de un edificio
   * @param buildingId ID del edificio
   * @param userAuthId ID del usuario autenticado (para validar permisos)
   * @returns Resultado de la auditoría técnica
   */
  async getTechnicalAudit(buildingId: string, userAuthId: string): Promise<TechnicalAuditResult> {
    const supabase = this.getSupabase();

    // Verificar que el edificio existe
    const { data: building, error: buildingError } = await supabase
      .from('buildings')
      .select('id, square_meters, construction_year')
      .eq('id', buildingId)
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
    }

    // Obtener o calcular ESG
    let esgResult = await this.esgService.getStoredEsgScore(buildingId, supabase);
    if (!esgResult) {
      // Si no hay ESG guardado, calcularlo
      esgResult = await this.esgService.calculateFromDatabase(buildingId, supabase);
    }

    // Calcular porcentaje de completitud
    const completionPercentage = this.calculateCompletionPercentage(
      digitalBook,
      certificate,
      esgResult
    );

    // Generar tareas
    const tasks = this.generateTasks(digitalBook, certificate, esgResult, building);

    // Generar mejoras energéticas
    const energyImprovements = this.generateEnergyImprovements(certificate, digitalBook);

    // Calcular ahorro potencial
    const potentialSavingsKwhPerM2 = this.calculatePotentialSavings(
      certificate,
      energyImprovements
    );

    // Resumen
    const summary = {
      totalTasks: tasks.length,
      highPriorityTasks: tasks.filter(t => t.priority === 'high').length,
      mediumPriorityTasks: tasks.filter(t => t.priority === 'medium').length,
      lowPriorityTasks: tasks.filter(t => t.priority === 'low').length,
      recommendedImprovements: energyImprovements.length
    };

    return {
      completionPercentage,
      tasks,
      energyImprovements,
      potentialSavingsKwhPerM2,
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
    if (esgResult?.status === 'complete') {
      score += 20;
    } else if (esgResult?.status === 'incomplete') {
      // Puntos parciales si tiene algunos datos
      const missingCount = esgResult.missingData?.length || 0;
      const completenessRatio = Math.max(0, 1 - (missingCount / 10)); // Aproximado
      score += completenessRatio * 10;
    }

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
    if (esgResult?.status === 'incomplete' && esgResult.missingData) {
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
   */
  private generateEnergyImprovements(
    certificate: any,
    digitalBook: any
  ): EnergyImprovement[] {
    const improvements: EnergyImprovement[] = [];
    let improvementId = 1;

    if (!certificate) {
      return improvements;
    }

    const rating = certificate.rating;
    const currentConsumption = certificate.primary_energy_kwh_per_m2_year || 0;
    const camposAmbientales = digitalBook?.campos_ambientales || {};

    // Mejoras según clase energética
    if (['D', 'E', 'F', 'G'].includes(rating)) {
      // Mejora de aislamiento (alta prioridad para clases bajas)
      improvements.push({
        id: `improvement-${improvementId++}`,
        type: 'insulation',
        title: 'Mejora del aislamiento térmico',
        description: 'Instalar o mejorar el aislamiento en fachadas, cubierta y suelos puede reducir significativamente el consumo energético.',
        estimatedSavingsKwhPerM2: rating === 'G' ? 80 : rating === 'F' ? 60 : rating === 'E' ? 40 : 25,
        priority: 'high'
      });

      // Mejora de ventanas
      improvements.push({
        id: `improvement-${improvementId++}`,
        type: 'windows',
        title: 'Sustitución de ventanas',
        description: 'Instalar ventanas de doble o triple acristalamiento con marcos eficientes reduce pérdidas térmicas.',
        estimatedSavingsKwhPerM2: 15,
        priority: 'high'
      });
    }

    // Si el consumo es alto (>150 kWh/m²·año)
    if (currentConsumption > 150) {
      improvements.push({
        id: `improvement-${improvementId++}`,
        type: 'heating',
        title: 'Optimización del sistema de calefacción',
        description: 'Sustituir calderas antiguas por sistemas de alta eficiencia o bombas de calor puede reducir el consumo de calefacción.',
        estimatedSavingsKwhPerM2: 30,
        priority: 'high'
      });
    }

    // Mejora de iluminación (siempre recomendable)
    improvements.push({
      id: `improvement-${improvementId++}`,
      type: 'lighting',
      title: 'Sustitución a iluminación LED',
      description: 'Reemplazar iluminación tradicional por LED de bajo consumo reduce el consumo eléctrico.',
      estimatedSavingsKwhPerM2: 8,
      priority: 'medium'
    });

    // Energías renovables (si no hay o es bajo el porcentaje)
    const renewableShare = camposAmbientales.renewableSharePercent || 0;
    if (renewableShare < 30) {
      improvements.push({
        id: `improvement-${improvementId++}`,
        type: 'renewable',
        title: 'Instalación de energías renovables',
        description: 'Instalar paneles solares u otros sistemas de energía renovable puede reducir significativamente el consumo energético y las emisiones.',
        estimatedSavingsKwhPerM2: 20,
        priority: renewableShare === 0 ? 'high' : 'medium'
      });
    }

    // Mejora HVAC si el consumo es moderado-alto
    if (currentConsumption > 100) {
      improvements.push({
        id: `improvement-${improvementId++}`,
        type: 'hvac',
        title: 'Optimización de sistemas HVAC',
        description: 'Mejorar sistemas de climatización y ventilación con equipos más eficientes y mejor control.',
        estimatedSavingsKwhPerM2: 18,
        priority: 'medium'
      });
    }

    // Si está en clase B o mejor, solo mejoras menores
    if (['A', 'B'].includes(rating)) {
      // Mantener solo mejoras de bajo impacto
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
    return Math.round(totalSavings * 0.85);
  }
}


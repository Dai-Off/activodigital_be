import { getSupabaseClient } from '../../lib/supabase';
import { 
  RegulatoryAuditResult, 
  RegulatoryMev, 
  MevStatus, 
  RegulatoryCurrentState, 
  RegulatoryTargetState 
} from '../../types/regulatoryAudit';

export class RegulatoryAuditService {
  private getSupabase() {
    return getSupabaseClient();
  }

  async getRegulatoryAudit(buildingId: string, userAuthId: string): Promise<RegulatoryAuditResult> {
    const supabase = this.getSupabase();

    // 1. Verificar edificio
    const { data: building, error: buildingError } = await supabase
      .from('buildings')
      .select('id, custom_data')
      .eq('id', buildingId)
      .single();

    if (buildingError || !building) {
      throw new Error('Edificio no encontrado');
    }

    // 2. Obtener certificado energético más reciente
    const { data: certificate } = await supabase
      .from('energy_certificates')
      .select('*')
      .eq('building_id', buildingId)
      .order('issue_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 3. Obtener documentos del edificio para MEVs y Certificados
    const { data: documents } = await supabase
      .from('building_documents')
      .select('*')
      .eq('building_id', buildingId)
      .order('uploaded_at', { ascending: false });

    // 4. Calcular Estado Actual basado en el certificado o datos manuales (custom_data)
    const currentState: RegulatoryCurrentState = {
      energy_class: certificate?.rating || (building as any)?.custom_data?.calificacion || 'G',
      consumption_kwh_m2_year: certificate?.primary_energy_kwh_per_m2_year || (building as any)?.custom_data?.costeEnergetico || 0,
      emissions_kg_co2_m2_year: certificate?.emissions_kg_co2_per_m2_year || (building as any)?.custom_data?.emisiones || 0,
      heating_demand: (building as any)?.custom_data?.demandaCalefaccion,
      cooling_demand: (building as any)?.custom_data?.demandaRefrigeracion,
    };

    // 5. Definir el Estado Objetivo (Target EPBD 2030)
    // Para simplificar, asumimos un objetivo clase D con valores conservadores
    const targetState: RegulatoryTargetState = {
      target_class: 'D',
      target_consumption: 65,
      target_emissions: 12
    };

    // Calcular la brecha (Gap Analysis)
    let consumptionGap = 0;
    let consumptionProgress = 0;
    let emissionsGap = 0;
    let emissionsProgress = 0;

    const hasManualData = !!(building as any)?.custom_data?.calificacion;

    if (certificate || hasManualData) {
      consumptionGap = currentState.consumption_kwh_m2_year > targetState.target_consumption 
        ? currentState.consumption_kwh_m2_year - targetState.target_consumption 
        : 0;
        
      // Porcentaje de avance hacia el objetivo desde un peor escenario (ej. 250 kWh)
      const maxConsumption = 250;
      consumptionProgress = Math.max(0, Math.min(100, 100 - ((currentState.consumption_kwh_m2_year - targetState.target_consumption) / (maxConsumption - targetState.target_consumption) * 100)));

      emissionsGap = currentState.emissions_kg_co2_m2_year > targetState.target_emissions
        ? currentState.emissions_kg_co2_m2_year - targetState.target_emissions
        : 0;
      
      const maxEmissions = 50;
      emissionsProgress = Math.max(0, Math.min(100, 100 - ((currentState.emissions_kg_co2_m2_year - targetState.target_emissions) / (maxEmissions - targetState.target_emissions) * 100)));
    } else {
      // Si no hay certificado ni datos manuales, no hay progreso
      consumptionGap = 0;
      consumptionProgress = 0;
      emissionsGap = 0;
      emissionsProgress = 0;
    }

    // 6. Analizar MEVs (Medidas de Eficiencia en Viviendas)
    const mevs = this.analyzeMEVs(documents || [], certificate);

    // 7. Calcular resumen (Summary) sobre certificados específicos
    // Los 4 jinetes del apocalipsis regulatorio: Nota Simple, CEE, Cédula, ITE
    const docList = documents || [];
    
    const hasNotaSimple = docList.some(d => {
      const t = (d.file_name || '').toLowerCase();
      const meta = this.safeParseMetadata(d.metadata);
      const type = (meta?.document_type || '').toLowerCase();
      return t.includes('nota simple') || t.includes('registral') || type.includes('nota_simple') || type.includes('registro');
    });

    const hasCEE = !!certificate || !!(building as any)?.custom_data?.calificacion || docList.some(d => {
      const t = (d.file_name || '').toLowerCase();
      const meta = this.safeParseMetadata(d.metadata);
      const type = (meta?.document_type || '').toLowerCase();
      return t.includes('cee') || t.includes('energético') || type.includes('cee') || d.category === 'certificates';
    });

    const hasCedula = docList.some(d => {
      const t = (d.file_name || '').toLowerCase();
      const meta = this.safeParseMetadata(d.metadata);
      const type = (meta?.document_type || '').toLowerCase();
      return t.includes('cédula') || t.includes('habitabilidad') || type.includes('cedula');
    });

    const hasITE = docList.some(d => {
      const t = (d.file_name || '').toLowerCase();
      const meta = this.safeParseMetadata(d.metadata);
      const type = (meta?.document_type || '').toLowerCase();
      return t.includes('ite') || t.includes('inspección técnica') || type.includes('ite');
    });

    const certificatesFound = [hasNotaSimple, hasCEE, hasCedula, hasITE].filter(Boolean).length;
    const mevsImplementedLength = mevs.filter(m => m.status === 'implementada').length;
    const mevsPartialLength = mevs.filter(m => m.status === 'parcial').length;
    const mevsPendingLength = mevs.filter(m => m.status === 'no_implementada').length;

    // Detalle de los 4 certificados clave
    const certificates: any[] = [
      { 
        id: 'cert-01', 
        title: 'Nota Simple / Certificación Registral', 
        status: hasNotaSimple ? 'valid' : 'missing', 
        description: 'Titularidad y cargas del inmueble',
        uploaded_at: docList.find(d => (d.file_name || '').toLowerCase().includes('nota simple') || (d.file_name || '').toLowerCase().includes('registral'))?.uploaded_at
      },
      { 
        id: 'cert-02', 
        title: 'Certificado de Eficiencia Energética (CEE)', 
        status: hasCEE ? 'valid' : 'missing', 
        description: 'Calificación de consumo y emisiones',
        uploaded_at: certificate?.issue_date || docList.find(d => (d.file_name || '').toLowerCase().includes('cee'))?.uploaded_at
      },
      { 
        id: 'cert-03', 
        title: 'Cédula de Habitabilidad', 
        status: hasCedula ? 'valid' : 'missing', 
        description: 'Acreditación de condiciones de habitabilidad',
        uploaded_at: docList.find(d => (d.file_name || '').toLowerCase().includes('cédula') || (d.file_name || '').toLowerCase().includes('habitabilidad'))?.uploaded_at
      },
      { 
        id: 'cert-04', 
        title: 'Inspección Técnica del Edificio (ITE)', 
        status: hasITE ? 'valid' : 'missing', 
        description: 'Estado de conservación del edificio',
        uploaded_at: docList.find(d => (d.file_name || '').toLowerCase().includes('ite'))?.uploaded_at
      }
    ];

    // Normativas cumplidas: Calculamos según la presencia de los 4 documentos base + progreso MEVs
    const normativesCompliant = certificatesFound + (mevsImplementedLength >= 4 ? 4 : Math.min(mevsImplementedLength, 3));

    return {
      buildingId,
      current_state: currentState,
      target_state: targetState,
      gap_analysis: {
        consumption_gap: Number(consumptionGap.toFixed(2)),
        consumption_progress_percent: Number(consumptionProgress.toFixed(2)),
        emissions_gap: Number(emissionsGap.toFixed(2)),
        emissions_progress_percent: Number(emissionsProgress.toFixed(2))
      },
      mevs,
      certificates,
      summary: {
        normatives_compliant: normativesCompliant,
        normatives_total: 8,
        mevs_implemented: mevsImplementedLength,
        mevs_total: 8,
        mevs_partial: mevsPartialLength,
        mevs_pending: mevsPendingLength,
        certificates_active: certificatesFound,
        certificates_total: 4,
        pending_audits_count: 4 - certificatesFound,
        pending_audits_text: certificatesFound === 4 ? 'Al día' : `Pendientes: ${4 - certificatesFound}`,
        total_potential_savings: '46-76 kWh/m²·año',
        total_potential_co2_reduction: '13-22 kg CO₂eq/m²·año'
      },
      calculatedAt: new Date().toISOString()
    };
  }

  private analyzeMEVs(documents: any[], certificate: any): RegulatoryMev[] {
    // Definimos la plantilla base para las 8 MEVs oficiales
    const defaultMevs: RegulatoryMev[] = [
      { id: 'mev-01', code: 'MEV-01', title: 'Aislamiento Térmico de Envolvente', description: 'Fachadas, cubiertas y medianeras', status: 'no_implementada', current_state: 'Aislamiento insuficiente', potential_savings: '15-25', potential_co2_reduction: '3-5' },
      { id: 'mev-02', code: 'MEV-02', title: 'Sustitución de Carpinterías Exteriores', description: 'Ventanas y puertas con rotura de puente térmico', status: 'no_implementada', current_state: 'Carpintería antigua', potential_savings: '10-18', potential_co2_reduction: '2-4' },
      { id: 'mev-03', code: 'MEV-03', title: 'Sistemas de Climatización Eficientes', description: 'Calderas de condensación, bombas de calor, sistemas VRV', status: 'no_implementada', current_state: 'Caldera estándar', potential_savings: '12-20', potential_co2_reduction: '2-3' },
      { id: 'mev-04', code: 'MEV-04', title: 'Iluminación LED de Alta Eficiencia', description: 'Zonas comunes y exteriores', status: 'no_implementada', current_state: 'Iluminación convencional', potential_savings: '3-5', potential_co2_reduction: '0.5-1' },
      { id: 'mev-05', code: 'MEV-05', title: 'Integración de Energías Renovables', description: 'Fotovoltaica, solar térmica, aerotermia', status: 'no_implementada', current_state: 'Sin renovables', potential_savings: '20-35', potential_co2_reduction: '8-12' },
      { id: 'mev-06', code: 'MEV-06', title: 'Sistemas de Control y Gestión Energética', description: 'Domótica, sensores, termostatos inteligentes', status: 'no_implementada', current_state: 'Sin control', potential_savings: '5-10', potential_co2_reduction: '1-2' },
      { id: 'mev-07', code: 'MEV-07', title: 'Ventilación Mecánica con Recuperación de Calor', description: 'Sistemas de ventilación controlada (VMC)', status: 'no_implementada', current_state: 'Ventilación natural', potential_savings: '8-15', potential_co2_reduction: '1.5-3' },
      { id: 'mev-08', code: 'MEV-08', title: 'Protección Solar y Control de Radiación', description: 'Persianas, toldos, lamas, vidrios selectivos', status: 'no_implementada', current_state: 'Protección básica', potential_savings: '3-8', potential_co2_reduction: '0.5-1.5' }
    ];

    // Recorremos TODOS los documentos para agregar evidencias
    // Los documentos vienen ordenados por uploaded_at DESC
    for (const doc of documents) {
      const meta = this.safeParseMetadata(doc.metadata);
      const fileName = (doc.file_name || '').toLowerCase();
      const checklist = meta?.checklist || {};
      const keyFields = meta?.key_fields || {};
      const manualChecks = meta?.manual_checks || {};
      const type = (meta?.document_type || '').toLowerCase();
      const summary = (meta?.summary || '').toLowerCase();

      // MEV-01: Aislamiento (SATE)
      if (defaultMevs[0].status !== 'implementada') {
        if (manualChecks.sate || checklist.sate || keyFields.insulation || fileName.includes('sate') || fileName.includes('aislamiento') || summary.includes('sate') || summary.includes('aislamiento')) {
          defaultMevs[0].status = 'implementada';
          defaultMevs[0].current_state = manualChecks.sate ? 'Validación manual: SATE verificado' : 'SATE / Aislamiento verificado';
        } else if (checklist.sate === false) {
          defaultMevs[0].status = 'no_implementada';
        }
      }

      // MEV-02: Ventanas
      if (defaultMevs[1].status !== 'implementada') {
        if (manualChecks.ventanas || manualChecks.windows || checklist.ventanas || checklist.windows || keyFields.windows || fileName.includes('ventana') || fileName.includes('carpinteria') || summary.includes('ventana')) {
          defaultMevs[1].status = 'implementada';
          defaultMevs[1].current_state = (manualChecks.ventanas || manualChecks.windows) ? 'Validación manual: Ventanas eficientes' : 'Ventanas RPT / Bajo emisivo';
        }
      }

      // MEV-03: Climatización / Calefacción
      if (defaultMevs[2].status !== 'implementada') {
        if (manualChecks.calefaccion || manualChecks.heating || checklist.calefaccion || keyFields.hvac || keyFields.heating || fileName.includes('caldera') || fileName.includes('clima') || fileName.includes('calefaccion') || fileName.includes('bomba') || summary.includes('caldera') || summary.includes('calefaccion') || summary.includes('climatizac')) {
          defaultMevs[2].status = 'implementada';
          defaultMevs[2].current_state = (manualChecks.calefaccion || manualChecks.heating) ? 'Validación manual: Climatización verificada' : 'Alta eficiencia / Aerotermia';
        }
      }

      // MEV-04: LED
      if (defaultMevs[3].status !== 'implementada') {
        if (manualChecks.led || checklist.led || keyFields.lighting || fileName.includes('led') || fileName.includes('iluminacion') || summary.includes('led')) {
          defaultMevs[3].status = 'implementada';
          defaultMevs[3].current_state = manualChecks.led ? 'Validación manual: LED verificado' : '100% LED verificado';
        }
      }

      // MEV-05: Renovables (Fotovoltaica)
      if (defaultMevs[4].status !== 'implementada') {
        if (manualChecks.fotovoltaica || manualChecks.solar || checklist.fotovoltaica || keyFields.solar || keyFields.renewable || fileName.includes('solar') || fileName.includes('foto') || fileName.includes('renovabl') || summary.includes('solar') || summary.includes('fotovoltaic')) {
          defaultMevs[4].status = 'implementada';
          defaultMevs[4].current_state = (manualChecks.fotovoltaica || manualChecks.solar) ? 'Validación manual: Renovables verificadas' : 'Paneles fotovoltaicos / térmicos';
        }
      }
      
      // Control / Gestión (MEV-06)
      if (defaultMevs[5].status !== 'implementada') {
        if (manualChecks.control || checklist.control || fileName.includes('domotica') || fileName.includes('sensor') || fileName.includes('control') || summary.includes('domotica') || summary.includes('inteligente')) {
          defaultMevs[5].status = 'implementada';
          defaultMevs[5].current_state = 'Sistemas de control inteligente';
        }
      }

      // Ventilación (VMC) (MEV-07)
      if (defaultMevs[6].status !== 'implementada') {
        if (manualChecks.ventilacion || manualChecks.ventilation || checklist.ventilacion || fileName.includes('vmc') || fileName.includes('recuperador') || fileName.includes('ventilacion') || summary.includes('vmc') || summary.includes('recuperador') || summary.includes('ventilacion')) {
          defaultMevs[6].status = 'implementada';
          defaultMevs[6].current_state = 'Ventilación con recuperación';
        }
      }

      // Protección Solar (MEV-08)
      if (defaultMevs[7].status !== 'implementada') {
        if (manualChecks.proteccion || manualChecks.protection || checklist.proteccion || fileName.includes('persiana') || fileName.includes('toldo') || fileName.includes('lama') || fileName.includes('proteccion') || summary.includes('persiana') || summary.includes('toldo') || summary.includes('lama') || summary.includes('control solar') || summary.includes('vidrio selectivo')) {
          defaultMevs[7].status = 'implementada';
          defaultMevs[7].current_state = 'Control de radiación solar / Lamas / Toldos';
        }
      }
    }

    // Inferir por Certificado (si sigue no_implementada o si no hay documentos)
    if (certificate?.rating === 'A' || certificate?.rating === 'B') {
      if (defaultMevs[0].status === 'no_implementada') { defaultMevs[0].status = 'implementada'; defaultMevs[0].current_state = 'Aislamiento de alta eficiencia'; }
      if (defaultMevs[1].status === 'no_implementada') { defaultMevs[1].status = 'implementada'; defaultMevs[1].current_state = 'Ventanas eficientes'; }
      if (defaultMevs[2].status === 'no_implementada') { defaultMevs[2].status = 'implementada'; defaultMevs[2].current_state = 'Climatización óptima'; }
      if (defaultMevs[4].status === 'no_implementada') { defaultMevs[4].status = 'parcial';      defaultMevs[4].current_state = 'Paneles / Aerotermia parcial'; }
      
      // Inferencia general para el resto
      defaultMevs.forEach(m => {
        if (m.status === 'no_implementada') m.status = 'parcial';
      });
    }

    return defaultMevs;
  }

  private safeParseMetadata(metadata: any): any {
    if (!metadata) return null;
    if (typeof metadata === 'object') return metadata;
    try {
      return JSON.parse(metadata);
    } catch (e) {
      console.error('Error parsing metadata JSON:', e);
      return null;
    }
  }
}

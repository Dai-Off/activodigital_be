import { getSupabaseClient } from '../../lib/supabase';
import { DashboardStats } from '../../types/dashboard';
import { UserService } from './userService';
import { UserRole } from '../../types/user';
import { BuildingUnitService } from './buildingUnitService';
import { CalendarService } from './calendarService';

export class DashboardService {
  private userService = new UserService();
  private buildingUnitService = new BuildingUnitService();
  private calendarService = new CalendarService();

  getSupabase() {
    return getSupabaseClient();
  }

  private calculateAverageCompliance(
    buildings: any[],
    books: any[]
  ): number {
    if (buildings.length === 0) return 0;

    const bookStatusMap = new Map<string, string>();
    books.forEach(b => bookStatusMap.set(b.building_id, b.status));

    let totalCompliance = 0;

    buildings.forEach(b => {
      const status = bookStatusMap.get(b.id);

      switch (status) {
        case 'complete':
          totalCompliance += 100;
          break;
        case 'in_progress':
          totalCompliance += 50;
          break;
        case 'draft':
          totalCompliance += 25;
          break;
        default:
          totalCompliance += 0;
      }
    });

    return Math.round(totalCompliance / buildings.length);
  }

  /**
   * Obtiene las estadísticas del dashboard para un usuario
   * Las métricas varían según el rol (propietario vs técnico)
   */
  async getDashboardStats(userAuthId: string): Promise<DashboardStats> {
    const user = await this.userService.getUserByAuthId(userAuthId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // const isPropietario = user.role.name === UserRole.PROPIETARIO;
    // const isAdministrador = user.role.name === UserRole.ADMINISTRADOR;
    // const isTecnico = user.role.name === UserRole.TECNICO;

    // if (isPropietario) {
    //   return this.getPropietarioStats(user.id, userAuthId);
    // } else if (isAdministrador) {
    //   return this.getOwnerStats(user.id, userAuthId);
    // } else if (isTecnico) {
    //   return this.getTechnicianStats(user.id, userAuthId);
    // } else {
    //   return this.getCFOStats(user.id, userAuthId);
    // }

    return this.getAllStats(user.id, userAuthId);
  }

  /**
 * Estadísticas para el CFO (Visión financiera global)
 */
  private async getAllStats(userId: string, userAuthId: string): Promise<DashboardStats> {
    const supabase = this.getSupabase();

    // El CFO usualmente ve todos los edificios de la plataforma o de su empresa
    // Si el CFO está ligado a un owner_id específico, filtrar por él. 
    // Si es global, quitamos el .eq()
    const { data: buildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('*')

    if (buildingsError) {
      console.error('Error fetching buildings for CFO:', buildingsError);
      throw new Error('Error al obtener edificios para CFO');
    }

    const buildingIds = buildings?.map(b => b.id) || [];
    const placeholderId = ['00000000-0000-0000-0000-000000000000'];

    // Obtener libros digitales
    const { data: books } = await supabase
      .from('digital_books')
      .select('status, building_id')
      .in('building_id', buildingIds.length > 0 ? buildingIds : placeholderId);

    // Obtener certificados energéticos
    const { data: certificates } = await supabase
      .from('energy_certificates')
      .select('rating, building_id, emissions_kg_co2_per_m2_year')
      .in('building_id', buildingIds.length > 0 ? buildingIds : placeholderId);

    // Obtener scores ESG completos
    const { data: esgScores } = await supabase
      .from('esg_scores')
      .select('building_id, status, total')
      .in('building_id', buildingIds.length > 0 ? buildingIds : placeholderId)
      .eq('status', 'complete');

    // El CFO utiliza el cálculo de métricas de Owner porque necesita ver valores $, ESG y cumplimiento
    return this.calculateOwnerMetrics(buildings || [], books || [], certificates || [], esgScores || []);
  }

  /**
 * Estadísticas para el CFO (Visión financiera global)
 */
  private async getCFOStats(userId: string, userAuthId: string): Promise<DashboardStats> {
    const supabase = this.getSupabase();

    // El CFO usualmente ve todos los edificios de la plataforma o de su empresa
    // Si el CFO está ligado a un owner_id específico, filtrar por él. 
    // Si es global, quitamos el .eq()
    const { data: buildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('*')
      .eq('cfo_id', userId);

    if (buildingsError) {
      console.error('Error fetching buildings for CFO:', buildingsError);
      throw new Error('Error al obtener edificios para CFO');
    }

    const buildingIds = buildings?.map(b => b.id) || [];
    const placeholderId = ['00000000-0000-0000-0000-000000000000'];

    // Obtener libros digitales
    const { data: books } = await supabase
      .from('digital_books')
      .select('status, building_id')
      .in('building_id', buildingIds.length > 0 ? buildingIds : placeholderId);

    // Obtener certificados energéticos
    const { data: certificates } = await supabase
      .from('energy_certificates')
      .select('rating, building_id, emissions_kg_co2_per_m2_year')
      .in('building_id', buildingIds.length > 0 ? buildingIds : placeholderId);

    // Obtener scores ESG completos
    const { data: esgScores } = await supabase
      .from('esg_scores')
      .select('building_id, status, total')
      .in('building_id', buildingIds.length > 0 ? buildingIds : placeholderId)
      .eq('status', 'complete');

    // El CFO utiliza el cálculo de métricas de Owner porque necesita ver valores $, ESG y cumplimiento
    return this.calculateOwnerMetrics(buildings || [], books || [], certificates || [], esgScores || []);
  }

  /**
   * Estadísticas para propietarios (solo lectura)
   */
  private async getPropietarioStats(userId: string, userAuthId: string): Promise<DashboardStats> {
    const supabase = this.getSupabase();

    // Obtener edificios asignados al propietario
    const assignedBuildingIds = await this.userService.getPropietarioBuildings(userAuthId);
    if (assignedBuildingIds.length === 0) {
      return this.getEmptyStats();
    }

    const { data: buildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('*')
      .in('id', assignedBuildingIds);

    if (buildingsError) {
      console.error('Error fetching buildings:', buildingsError);
      throw new Error('Error al obtener edificios');
    }

    // Obtener libros digitales de estos edificios
    const { data: books, error: booksError } = await supabase
      .from('digital_books')
      .select('status, building_id')
      .in('building_id', assignedBuildingIds);

    if (booksError) {
      console.error('Error fetching books:', booksError);
    }

    // Obtener certificados energéticos
    const { data: certificates, error: certsError } = await supabase
      .from('energy_certificates')
      .select('rating, building_id, emissions_kg_co2_per_m2_year')
      .in('building_id', assignedBuildingIds);

    if (certsError) {
      console.error('Error fetching certificates:', certsError);
    }

    // Obtener scores ESG
    const { data: esgScores, error: esgError } = await supabase
      .from('esg_scores')
      .select('building_id, status, total')
      .in('building_id', assignedBuildingIds)
      .eq('status', 'complete');

    if (esgError) {
      console.error('Error fetching ESG scores:', esgError);
    }

    return this.calculateOwnerMetrics(buildings || [], books || [], certificates || [], esgScores || []);
  }

  /**
   * Estadísticas para administradores
   */
  private async getOwnerStats(userId: string, userAuthId: string): Promise<DashboardStats> {
    const supabase = this.getSupabase();

    // Obtener edificios del propietario/administrador
    const { data: buildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('*')
      .eq('owner_id', userId);

    if (buildingsError) {
      console.error('Error fetching buildings:', buildingsError);
      throw new Error('Error al obtener edificios');
    }

    const buildingIds = buildings?.map(b => b.id) || [];

    // Obtener libros digitales de estos edificios
    const { data: books, error: booksError } = await supabase
      .from('digital_books')
      .select('status, building_id')
      .in('building_id', buildingIds.length > 0 ? buildingIds : ['00000000-0000-0000-0000-000000000000']);

    if (booksError) {
      console.error('Error fetching books:', booksError);
    }

    // Obtener certificados energéticos
    const { data: certificates, error: certsError } = await supabase
      .from('energy_certificates')
      .select('rating, building_id, emissions_kg_co2_per_m2_year')
      .in('building_id', buildingIds.length > 0 ? buildingIds : ['00000000-0000-0000-0000-000000000000']);

    if (certsError) {
      console.error('Error fetching certificates:', certsError);
    }

    // Obtener scores ESG
    const { data: esgScores, error: esgError } = await supabase
      .from('esg_scores')
      .select('building_id, status, total')
      .in('building_id', buildingIds.length > 0 ? buildingIds : ['00000000-0000-0000-0000-000000000000'])
      .eq('status', 'complete');

    if (esgError) {
      console.error('Error fetching ESG scores:', esgError);
    }

    return this.calculateOwnerMetrics(buildings || [], books || [], certificates || [], esgScores || []);
  }

  /**
   * Estadísticas para técnicos
   */
  private async getTechnicianStats(userId: string, userAuthId: string): Promise<DashboardStats> {
    const supabase = this.getSupabase();

    // Obtener edificios asignados al técnico
    const { data: assignments, error: assignmentsError } = await supabase
      .from('building_technician_assignments')
      .select('building_id')
      .eq('technician_id', userId)
      .eq('status', 'active');

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      throw new Error('Error al obtener asignaciones');
    }

    const buildingIds = assignments?.map(a => a.building_id) || [];

    // Obtener edificios asignados
    const { data: buildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('*')
      .in('id', buildingIds.length > 0 ? buildingIds : ['00000000-0000-0000-0000-000000000000']);

    if (buildingsError) {
      console.error('Error fetching buildings:', buildingsError);
      throw new Error('Error al obtener edificios');
    }

    // Obtener libros digitales
    const { data: books, error: booksError } = await supabase
      .from('digital_books')
      .select('status, building_id')
      .in('building_id', buildingIds.length > 0 ? buildingIds : ['00000000-0000-0000-0000-000000000000']);

    if (booksError) {
      console.error('Error fetching books:', booksError);
    }

    return this.calculateTechnicianMetrics(buildings || [], books || []);
  }

  /**
   * Calcula métricas para propietarios
   */
  private async calculateOwnerMetrics(
    buildings: any[],
    books: any[],
    certificates: any[],
    esgScores: any[] = []
  ): Promise<DashboardStats> {
    const totalAssets = buildings.length;

    // Métricas financieras
    const totalValue = buildings.reduce((sum, b) => sum + (b.price || 0), 0);
    const totalRehabilitationCost = buildings.reduce((sum, b) => sum + (b.rehabilitation_cost || 0), 0);
    const totalPotentialValue = buildings.reduce((sum, b) => sum + (b.potential_value || 0), 0);

    // Superficie total (usar square_meters si está disponible, sino 0)
    const totalSurfaceArea = buildings.reduce((sum, b) => sum + (b.square_meters || 0), 0);

    // Emisiones (estimación: 0.12 tCO₂ eq por m² si no hay certificados)
    let totalEmissions = 0;
    if (certificates.length > 0) {
      // Usar datos reales de certificados
      totalEmissions = certificates.reduce((sum, c) => {
        const building = buildings.find(b => b.id === c.building_id);
        const surfaceArea = building ? (building.square_meters || 0) : 0;
        return sum + ((c.emissions_kg_co2_per_m2_year || 0) * surfaceArea / 1000); // kg a toneladas
      }, 0);
    } else {
      // Estimación
      totalEmissions = Math.round(totalSurfaceArea * 0.12);
    }

    // Clase energética promedio
    const { averageEnergyClass, averageEnergyRating } = this.calculateAverageEnergyClass(certificates);

    // Libros digitales
    const completedBooks = books.filter(b => b.status === 'complete').length;
    const inProgressBooks = books.filter(b => b.status === 'in_progress').length;
    const draftBooks = books.filter(b => b.status === 'draft').length;
    const pendingBooks = inProgressBooks + draftBooks;
    const completionPercentage = totalAssets > 0 ? Math.round((completedBooks / totalAssets) * 100) : 0;

    // Financiación verde (edificios con clase energética A, B o C)
    const greenEligibleCount = this.calculateGreenFinancingEligible(buildings, certificates);
    const greenFinancingEligiblePercentage = totalAssets > 0
      ? Math.round((greenEligibleCount / totalAssets) * 100)
      : 0;

    // Promedios
    const averageUnitsPerBuilding = totalAssets > 0
      ? Math.round(buildings.reduce((sum, b) => sum + (b.num_units || 0), 0) / totalAssets)
      : 0;

    const currentYear = new Date().getFullYear();
    const averageBuildingAge = totalAssets > 0
      ? Math.round(buildings.reduce((sum, b) => sum + (currentYear - (b.construction_year || currentYear)), 0) / totalAssets)
      : 0;

    const averageFloorsPerBuilding = totalAssets > 0
      ? Math.round(buildings.reduce((sum, b) => sum + (b.num_floors || 0), 0) / totalAssets)
      : 0;

    // Tipología
    const { mostCommonTypology, typologyDistribution } = this.calculateTypologyStats(buildings);

    // ESG promedio (solo edificios con score completo)
    const averageESGScore = this.calculateAverageESGScore(esgScores);

    // Nuevas métricas
    const averageOccupancy = await this.calculateAverageOccupancy(buildings.map(b => b.id));
    const nextEventsCount = await this.calculateNextEventsCount(buildings.map(b => b.id));
    const topPerformingBuildings = this.getTopPerformingBuildings(buildings, books);

    const complianceAverage = this.calculateAverageCompliance(buildings, books);

    return {
      totalValue,
      totalAssets,
      totalRehabilitationCost,
      totalPotentialValue,
      complianceAverage: complianceAverage,
      totalSurfaceArea,
      totalEmissions,
      averageEnergyClass,
      averageEnergyRating,
      completedBooks,
      pendingBooks,
      draftBooks,
      completionPercentage,
      greenFinancingEligiblePercentage,
      greenFinancingEligibleCount: greenEligibleCount,
      averageUnitsPerBuilding,
      averageBuildingAge,
      averageFloorsPerBuilding,
      mostCommonTypology,
      typologyDistribution,
      averageESGScore,
      averageOccupancy,
      nextEventsCount,
      topPerformingBuildings,
      assetsGrowth: await this.calculateAssetsGrowth(buildings),
      complianceGrowth: 0, // Por ahora 0 o lógica compleja si hay histórico
      alertsGrowth: 0 // Por ahora 0 o lógica compleja si hay histórico
    };
  }

  /**
   * Calcula métricas para técnicos
   */
  private async calculateTechnicianMetrics(buildings: any[], books: any[]): Promise<DashboardStats> {
    const totalAssets = buildings.length;

    // Superficie total (usar square_meters si está disponible, sino 0)
    const totalSurfaceArea = buildings.reduce((sum, b) => sum + (b.square_meters || 0), 0);

    // Libros digitales
    const completedBooks = books.filter(b => b.status === 'complete').length;
    const inProgressBooks = books.filter(b => b.status === 'in_progress').length;
    const draftBooks = books.filter(b => b.status === 'draft').length;
    const pendingBooks = inProgressBooks + draftBooks;
    const completionPercentage = totalAssets > 0 ? Math.round((completedBooks / totalAssets) * 100) : 0;

    // Promedios
    const averageUnitsPerBuilding = totalAssets > 0
      ? Math.round(buildings.reduce((sum, b) => sum + (b.num_units || 0), 0) / totalAssets)
      : 0;

    const currentYear = new Date().getFullYear();
    const averageBuildingAge = totalAssets > 0
      ? Math.round(buildings.reduce((sum, b) => sum + (currentYear - (b.construction_year || currentYear)), 0) / totalAssets)
      : 0;

    const averageFloorsPerBuilding = totalAssets > 0
      ? Math.round(buildings.reduce((sum, b) => sum + (b.num_floors || 0), 0) / totalAssets)
      : 0;

    // Tipología
    const { mostCommonTypology, typologyDistribution } = this.calculateTypologyStats(buildings);

    // Nuevas métricas
    const averageOccupancy = await this.calculateAverageOccupancy(buildings.map(b => b.id));
    const nextEventsCount = await this.calculateNextEventsCount(buildings.map(b => b.id));
    const topPerformingBuildings = this.getTopPerformingBuildings(buildings, books);
    const complianceAverage = this.calculateAverageCompliance(buildings, books);

    return {
      totalValue: 0, // Técnicos no ven valores financieros
      totalAssets,
      totalRehabilitationCost: 0,
      totalPotentialValue: 0,
      totalSurfaceArea,
      complianceAverage,
      totalEmissions: 0,
      averageEnergyClass: null,
      averageEnergyRating: null,
      completedBooks,
      pendingBooks,
      draftBooks,
      completionPercentage,
      greenFinancingEligiblePercentage: 0,
      greenFinancingEligibleCount: 0,
      averageUnitsPerBuilding,
      averageBuildingAge,
      averageFloorsPerBuilding,
      mostCommonTypology,
      typologyDistribution,
      averageESGScore: null,
      averageOccupancy,
      nextEventsCount,
      topPerformingBuildings,
      assetsGrowth: await this.calculateAssetsGrowth(buildings),
      complianceGrowth: 0,
      alertsGrowth: 0
    };
  }

  /**
   * Calcula la clase energética promedio
   */
  private calculateAverageEnergyClass(certificates: any[]): {
    averageEnergyClass: string | null;
    averageEnergyRating: number | null;
  } {
    if (certificates.length === 0) {
      return { averageEnergyClass: null, averageEnergyRating: null };
    }

    // Mapeo de letras a números (A=7, B=6, C=5, D=4, E=3, F=2, G=1, ND=0)
    const ratingToNumber: { [key: string]: number } = {
      'A': 7, 'B': 6, 'C': 5, 'D': 4, 'E': 3, 'F': 2, 'G': 1, 'ND': 0
    };

    const numberToRating: { [key: number]: string } = {
      7: 'A', 6: 'B', 5: 'C', 4: 'D', 3: 'E', 2: 'F', 1: 'G', 0: 'ND'
    };

    const validCertificates = certificates.filter(c => c.rating && ratingToNumber[c.rating] !== undefined);

    if (validCertificates.length === 0) {
      return { averageEnergyClass: null, averageEnergyRating: null };
    }

    const totalRating = validCertificates.reduce((sum, c) => sum + ratingToNumber[c.rating], 0);
    const averageRating = Math.round(totalRating / validCertificates.length);

    return {
      averageEnergyClass: numberToRating[averageRating] || null,
      averageEnergyRating: averageRating
    };
  }

  /**
   * Calcula edificios elegibles para financiación verde
   * Criterio: Clase energética A, B o C
   */
  private calculateGreenFinancingEligible(buildings: any[], certificates: any[]): number {
    const greenClasses = ['A', 'B', 'C'];

    // Crear un mapa de building_id -> rating
    const buildingRatings = new Map<string, string>();
    certificates.forEach(cert => {
      if (cert.rating && greenClasses.includes(cert.rating)) {
        buildingRatings.set(cert.building_id, cert.rating);
      }
    });

    // Contar edificios con certificados verdes
    return buildings.filter(b => buildingRatings.has(b.id)).length;
  }

  /**
   * Calcula estadísticas de tipología
   */
  private calculateTypologyStats(buildings: any[]): {
    mostCommonTypology: string | null;
    typologyDistribution: { residential: number; mixed: number; commercial: number };
  } {
    const distribution = {
      residential: 0,
      mixed: 0,
      commercial: 0
    };

    buildings.forEach(b => {
      if (b.typology === 'residential') distribution.residential++;
      else if (b.typology === 'mixed') distribution.mixed++;
      else if (b.typology === 'commercial') distribution.commercial++;
    });

    // Encontrar la más común
    let mostCommonTypology: string | null = null;
    let maxCount = 0;

    Object.entries(distribution).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonTypology = type;
      }
    });

    return { mostCommonTypology, typologyDistribution: distribution };
  }

  /**
   * Calcula el promedio de scores ESG y retorna el label correspondiente
   * Solo considera edificios con score completo
   */
  private calculateAverageESGScore(esgScores: any[]): string | null {
    // Filtrar scores válidos (status = 'complete' y total existe)
    const validScores = esgScores.filter(score =>
      score.status === 'complete' &&
      score.total !== null &&
      score.total !== undefined
    );

    if (validScores.length === 0) {
      return null;
    }

    // Calcular promedio numérico
    const totalSum = validScores.reduce((sum, score) => sum + score.total, 0);
    const average = totalSum / validScores.length;

    // Convertir el promedio a label según los rangos ESG
    return this.getLabelForESGScore(Math.round(average));
  }

  /**
   * Convierte un score numérico a su label correspondiente
   */
  private getLabelForESGScore(score: number): string {
    if (score >= 90) return 'Premium';
    if (score >= 80) return 'Gold';
    if (score >= 60) return 'Silver';
    if (score >= 40) return 'Bronze';
    return 'Crítico';
  }

  /**
   * Retorna estadísticas vacías cuando no hay edificios asignados
   */
  private getEmptyStats(): DashboardStats {
    return {
      totalValue: 0,
      totalAssets: 0,
      totalRehabilitationCost: 0,
      complianceAverage: 0,
      totalPotentialValue: 0,
      totalSurfaceArea: 0,
      totalEmissions: 0,
      averageEnergyClass: null,
      averageEnergyRating: null,
      completedBooks: 0,
      pendingBooks: 0,
      draftBooks: 0,
      completionPercentage: 0,
      greenFinancingEligiblePercentage: 0,
      greenFinancingEligibleCount: 0,
      averageUnitsPerBuilding: 0,
      averageBuildingAge: 0,
      averageFloorsPerBuilding: 0,
      mostCommonTypology: null,
      typologyDistribution: {
        residential: 0,
        mixed: 0,
        commercial: 0
      },
      averageESGScore: null,
      averageOccupancy: null,
      nextEventsCount: 0,
      topPerformingBuildings: [],
      assetsGrowth: 0,
      complianceGrowth: 0,
      alertsGrowth: 0
    };
  }

  /**
   * Calcula la ocupación promedio de los edificios
   */
  private async calculateAverageOccupancy(buildingIds: string[]): Promise<number | null> {
    if (buildingIds.length === 0) return null;

    let totalOccupancy = 0;
    let buildingCount = 0;

    // Para optimizar, podríamos hacer una query directa, pero por ahora iteramos
    // en una implementación real esto debería ser una query agregada
    for (const id of buildingIds) {
      try {
        const units = await this.buildingUnitService.listUnits(id);
        const occupancy = this.buildingUnitService.calculateOccupancy(units);
        if (occupancy !== null) {
          totalOccupancy += occupancy;
          buildingCount++;
        }
      } catch (error) {
        console.error(`Error calculating occupancy for building ${id}:`, error);
      }
    }

    if (buildingCount === 0) return null;
    return Math.round(totalOccupancy / buildingCount);
  }

  /**
   * Cuenta los próximos eventos para los edificios dados
   */
  private async calculateNextEventsCount(buildingIds: string[]): Promise<number> {
    if (buildingIds.length === 0) return 0;

    const supabase = this.getSupabase();
    const today = new Date().toISOString().split('T')[0];

    const { count, error } = await supabase
      .from('building_events')
      .select('*', { count: 'exact', head: true })
      .in('building_id', buildingIds)
      .gte('event_date', today)
      .not('status', 'eq', 'completed');

    if (error) {
      console.error('Error counting next events:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Obtiene los edificios con mejor rendimiento (basado en completitud del libro)
   */
  private getTopPerformingBuildings(buildings: any[], books: any[]): { id: string; name: string; type: string; percentage: number }[] {
    // Mapa de estado de libros por edificio
    const buildingBookStatus = new Map<string, string>();
    books.forEach(b => buildingBookStatus.set(b.building_id, b.status));

    const buildingPerformance = buildings.map(b => {
      const bookStatus = buildingBookStatus.get(b.id);
      let percentage = 0;

      switch (bookStatus) {
        case 'complete': percentage = 100; break;
        case 'in_progress': percentage = 50; break;
        case 'draft': percentage = 25; break;
        default: percentage = 0;
      }

      return {
        id: b.id,
        name: b.name,
        type: b.typology || 'Desconocido',
        percentage
      };
    });

    // Ordenar por porcentaje descendente y tomar los top 5
    return buildingPerformance
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);
  }
  /**
   * Calcula el crecimiento de activos (edificios nuevos este mes)
   */
  private async calculateAssetsGrowth(buildings: any[]): Promise<number> {
    if (buildings.length === 0) return 0;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const newBuildings = buildings.filter(b => {
      const createdAt = new Date(b.created_at);
      return createdAt.getFullYear() === currentYear && createdAt.getMonth() === currentMonth;
    });

    return newBuildings.length;
  }
}

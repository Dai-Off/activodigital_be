import { getSupabaseClient } from '../../lib/supabase';
import { DashboardStats } from '../../types/dashboard';
import { UserService } from './userService';
import { UserRole } from '../../types/user';

export class DashboardService {
  private userService = new UserService();

  getSupabase() {
    return getSupabaseClient();
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

    const isPropietario = user.role.name === UserRole.PROPIETARIO;

    if (isPropietario) {
      return this.getOwnerStats(user.id, userAuthId);
    } else {
      return this.getTechnicianStats(user.id, userAuthId);
    }
  }

  /**
   * Estadísticas para propietarios
   */
  private async getOwnerStats(userId: string, userAuthId: string): Promise<DashboardStats> {
    const supabase = this.getSupabase();

    // Obtener todos los edificios del propietario
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
  private calculateOwnerMetrics(
    buildings: any[],
    books: any[],
    certificates: any[],
    esgScores: any[] = []
  ): DashboardStats {
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

    return {
      totalValue,
      totalAssets,
      totalRehabilitationCost,
      totalPotentialValue,
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
    };
  }

  /**
   * Calcula métricas para técnicos
   */
  private calculateTechnicianMetrics(buildings: any[], books: any[]): DashboardStats {
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

    return {
      totalValue: 0, // Técnicos no ven valores financieros
      totalAssets,
      totalRehabilitationCost: 0,
      totalPotentialValue: 0,
      totalSurfaceArea,
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
}

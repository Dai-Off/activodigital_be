import { getSupabaseClient } from "../../lib/supabase";
import {
  InsurancePolicy,
  CreateInsuranceRequest,
  UpdateInsuranceRequest,
  InsuranceFilters,
} from "../../types/insurance";

/**
 * Servicio centralizado para operaciones de Pólizas de Seguros (insurance_policies).
 */
export class InsuranceService {
  private getSupabase() {
    return getSupabaseClient();
  }

  // ==========================================
  // 1. CREACIÓN (CREATE)
  // ==========================================

  /**
   * Registra una nueva póliza de seguro asociada a un edificio.
   */
  async createInsurance(
    data: CreateInsuranceRequest
  ): Promise<InsurancePolicy> {
    // Mapeo de camelCase (App) a snake_case (DB)
    const insuranceData = {
      building_id: data.buildingId,
      policy_number: data.policyNumber,
      status: data.status,
      coverage_type: data.coverageType,
      insurer: data.insurer, // O insurer_id si usas relación
      issue_date: data.issueDate,
      expiration_date: data.expirationDate,
      coverage_details: data.coverageDetails,
      annual_premium: data.annualPremium,
      document_url: data.documentUrl,
    };

    const { data: newPolicy, error } = await this.getSupabase()
      .from("insurance_policies")
      .insert(insuranceData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear el seguro: ${error.message}`);
    }

    return this.mapToInsurance(newPolicy);
  }

  // ==========================================
  // 2. LECTURA (READ)
  // ==========================================

  /**
   * Obtiene un seguro específico por su ID.
   */
  async getInsuranceById(id: string): Promise<InsurancePolicy | null> {
    const { data, error } = await this.getSupabase()
      .from("insurance_policies")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      // Si el error es que no existe, retornamos null
      if (error.code === "PGRST116") return null;
      throw new Error(`Error al obtener el seguro: ${error.message}`);
    }

    return this.mapToInsurance(data);
  }

  /**
   * Obtiene todas las pólizas asociadas a un edificio.
   * Soporta filtros por estado y paginación.
   */
  async getBuildingInsurances(
    buildingId: string,
    filters: InsuranceFilters = {}
  ): Promise<InsurancePolicy[]> {
    let query = this.getSupabase()
      .from("insurance_policies")
      .select("*")
      .eq("building_id", buildingId)
      .order("expiration_date", { ascending: true }); // Ordenar por fecha de vencimiento es útil aquí

    // Filtro opcional por estado (ej: solo 'active')
    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    // Paginación
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 50) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(
        `Error al obtener seguros del edificio: ${error.message}`
      );
    }

    return data.map((item: any) => this.mapToInsurance(item));
  }

  // ==========================================
  // 3. ACTUALIZACIÓN (UPDATE)
  // ==========================================

  /**
   * Actualiza los datos de una póliza existente.
   */
  async updateInsurance(
    id: string,
    data: UpdateInsuranceRequest
  ): Promise<InsurancePolicy> {
    // Preparamos solo los campos que vienen definidos en el request
    const updateData: any = {};
    if (data.policyNumber !== undefined)
      updateData.policy_number = data.policyNumber;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.coverageType !== undefined)
      updateData.coverage_type = data.coverageType;
    if (data.insurer !== undefined) updateData.insurer = data.insurer;
    if (data.issueDate !== undefined) updateData.issue_date = data.issueDate;
    if (data.expirationDate !== undefined)
      updateData.expiration_date = data.expirationDate;
    if (data.coverageDetails !== undefined)
      updateData.coverage_details = data.coverageDetails;
    if (data.annualPremium !== undefined)
      updateData.annual_premium = data.annualPremium;
    if (data.documentUrl !== undefined)
      updateData.document_url = data.documentUrl;

    const { data: updatedPolicy, error } = await this.getSupabase()
      .from("insurance_policies")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar el seguro: ${error.message}`);
    }

    return this.mapToInsurance(updatedPolicy);
  }

  // ==========================================
  // 4. ELIMINACIÓN (DELETE)
  // ==========================================

  /**
   * Elimina una póliza de seguro.
   */
  async deleteInsurance(id: string): Promise<boolean> {
    const { error } = await this.getSupabase()
      .from("insurance_policies")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Error al eliminar el seguro: ${error.message}`);
    }

    return true;
  }

  // ==========================================
  // 5. UTILIDADES Y MAPEO
  // ==========================================

  /**
   * Transforma los datos crudos de la BD (snake_case) al tipo de la aplicación (camelCase).
   */
  private mapToInsurance(data: any): InsurancePolicy {
    return {
      id: data.id,
      buildingId: data.building_id,
      policyNumber: data.policy_number,
      status: data.status,
      coverageType: data.coverage_type,
      insurer: data.insurer,
      issueDate: data.issue_date,
      expirationDate: data.expiration_date,
      coverageDetails: data.coverage_details,
      annualPremium: data.annual_premium,
      documentUrl: data.document_url,
      createdAt: data.created_at,
    };
  }
}

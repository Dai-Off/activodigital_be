import { getSupabaseClient } from '../../lib/supabase';
import { TrazabilityMap, TrazabilityServiceParams } from './interfaceTrazability';

export class TrazabilityService {
    private getSupabase() {
        return getSupabaseClient();
    }

    async registerTrazability(
        { action, module, description, buildingId, authUserId }: TrazabilityServiceParams) {
        const { data: userData, error: userError } = await this.getSupabase()
            .from('users')
            .select('id')
            .eq('user_id', authUserId)
            .single();

        if (userError || !userData) {
            throw new Error('Usuario no encontrado');
        }

        const { data: buildingExists, error: buildingError } = await this.getSupabase()
            .from('buildings')
            .select('id')
            .eq('id', buildingId)
            .single();

        if (buildingError || !buildingExists) {
            throw new Error('Edificio no encontrado');
        }

        const trazabilityData = {
            user_id: userData.id,
            building_id: buildingId,
            description: description,
            action: action,
            module: module,
        };

        const { data: trazabilityResponse, error } = await this.getSupabase()
            .from('trazability_history')
            .insert(trazabilityData)
            .select()
            .single();

        if (error) {
            throw new Error(`Error al registrar trazabilidad: ${error.message}`);
        }

        return this.mapToTrazability(trazabilityResponse);
    }


    private mapToTrazability(data: any): TrazabilityMap {
        return {
            id: data.id,
            authUserId: data.user_id,
            buildingId: data.building_id,
            action: data.action,
            module: data.module,
            description: data.description,
            createdAt: data.created_at,
        };
    }
}
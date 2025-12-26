"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trazabilityService = exports.TrazabilityService = void 0;
const supabase_1 = require("../../lib/supabase");
class TrazabilityService {
    getSupabase() {
        return (0, supabase_1.getSupabaseServiceRoleClient)();
    }
    async registerTrazability({ action, module, description, buildingId, authUserId }) {
        const { data: userData, error: userError } = await this.getSupabase()
            .from('users')
            .select('user_id')
            .eq('user_id', authUserId)
            .single();
        if (userError || !userData) {
            throw new Error('Usuario no encontrado');
        }
        let trazabilityData = {
            user_id: userData?.user_id,
            description: description,
            action: action,
            module: module,
        };
        if (buildingId) {
            const { data: dataBuilding, error: buildingError } = await this.getSupabase()
                .from('buildings')
                .select('id')
                .eq('id', buildingId)
                .single();
            console.log(buildingError);
            if (buildingError) {
                throw new Error('Edificio no encontrado');
            }
            trazabilityData.building_id = dataBuilding?.id;
        }
        console.log("Trazability Data: ", trazabilityData);
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
    async getGroupedActionCounts() {
        const { data, error } = await this.getSupabase()
            .from('trazability_history')
            .select('action');
        if (error) {
            throw new Error(`Error al obtener el conteo: ${error.message}`);
        }
        const datos = data.reduce((acc, current) => {
            const actionName = current.action;
            acc[actionName] = (acc[actionName] || 0) + 1;
            return acc;
        }, {});
        return datos;
    }
    async getActionCount(actionString) {
        const counts = await this.getGroupedActionCounts();
        let totalUpdateCount = 0;
        for (const actionName in counts) {
            if (Object.prototype.hasOwnProperty.call(counts, actionName)) {
                const normalizedAction = actionName.toLowerCase();
                const normalizedActionParam = actionString.toLowerCase();
                if (normalizedAction.includes(normalizedActionParam))
                    totalUpdateCount += counts[actionName];
            }
        }
        return totalUpdateCount;
    }
    async listTrazability() {
        const listQuery = this.getSupabase()
            .from('trazability_history')
            .select(`
                *,
                user:users!user_id(*),
                building:buildings(*)
            `, { count: 'exact' })
            .order('created_at', { ascending: false });
        const queryUsers = this.getSupabase()
            .from('users')
            .select(`
                id
            `, { count: 'exact' })
            .eq('two_factor_enabled', true)
            .order('created_at', { ascending: false });
        const { error: errorsUsers, count: activeUsers } = await queryUsers;
        const { data, error, count: totalCount } = await listQuery;
        if (error)
            throw new Error(`Error al listar trazabilidad: ${error.message}`);
        if (errorsUsers)
            throw new Error(`Error al listar trazabilidad: ${errorsUsers.message}`);
        const countUpdates = await this.getActionCount('actualiz'); // ! Buscar en acciones de Actualizar
        const countCompleted = await this.getActionCount('completa'); // ! Buscar en acciones de Completar
        const countAlerts = await this.getActionCount('alerta'); // ! Buscar en acciones de Completar
        const mappedData = data.map(item => this.mapToTrazabilityWithRelations(item));
        const datos = {
            data: mappedData,
            total: totalCount || 0,
            activeUsers: activeUsers || 0,
            completed: countCompleted,
            alerts: countAlerts,
            updates: countUpdates,
        };
        return datos;
    }
    mapToTrazability(data) {
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
    mapToTrazabilityWithRelations(row) {
        return {
            id: row.id,
            action: row.action,
            module: row.module,
            description: row.description,
            createdAt: row.created_at,
            user: row.user
                ? {
                    id: row.user.id,
                    userId: row.user.user_id,
                    email: row.user.email,
                    fullName: row.user.full_name,
                    roleId: row.user.role_id,
                }
                : null,
            // 🏢 Edificio relacionado
            building: row.building
                ? {
                    id: row.building.id,
                    name: row.building.name,
                    address: row.building.address,
                }
                : null,
        };
    }
}
exports.TrazabilityService = TrazabilityService;
exports.trazabilityService = new TrazabilityService();
//# sourceMappingURL=TrazabilityService.js.map
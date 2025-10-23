"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildingService = void 0;
const supabase_1 = require("../../lib/supabase");
const edificio_1 = require("../../types/edificio");
const userService_1 = require("./userService");
const invitationService_1 = require("./invitationService");
const user_1 = require("../../types/user");
class BuildingService {
    constructor() {
        this.userService = new userService_1.UserService();
        this.invitationService = new invitationService_1.InvitationService();
    }
    getSupabase() {
        return (0, supabase_1.getSupabaseClient)();
    }
    async createBuilding(data, userAuthId) {
        // Verificar que el usuario sea propietario
        const user = await this.userService.getUserByAuthId(userAuthId);
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
        if (user.role.name !== user_1.UserRole.ADMINISTRADOR) {
            throw new Error('Solo los administradores pueden crear edificios');
        }
        const buildingData = {
            name: data.name,
            address: data.address,
            cadastral_reference: data.cadastralReference,
            construction_year: data.constructionYear,
            typology: data.typology,
            num_floors: data.numFloors,
            num_units: data.numUnits,
            lat: data.lat,
            lng: data.lng,
            images: data.images || [],
            status: edificio_1.BuildingStatus.DRAFT,
            price: data.price,
            technician_email: data.technicianEmail,
            cfo_email: data.cfoEmail,
            owner_id: user.id,
            user_id: userAuthId, // Mantener por compatibilidad
            // Campos financieros con valores por defecto
            rehabilitation_cost: data.rehabilitationCost || 0,
            potential_value: data.potentialValue || 0,
            square_meters: data.squareMeters
        };
        const { data: building, error } = await this.getSupabase()
            .from('buildings')
            .insert(buildingData)
            .select()
            .single();
        if (error) {
            throw new Error(`Error al crear edificio: ${error.message}`);
        }
        // Si se especificó un email de técnico, intentar asignarlo o enviar invitación
        if (data.technicianEmail) {
            try {
                await this.handleTechnicianAssignment(building.id, data.technicianEmail, userAuthId);
            }
            catch (error) {
                // Si falla la asignación/invitación, eliminar el edificio creado
                await this.getSupabase()
                    .from('buildings')
                    .delete()
                    .eq('id', building.id);
                throw new Error(`Error al asignar técnico: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        }
        // Si se especificó un email de CFO, enviar invitación
        if (data.cfoEmail) {
            try {
                await this.handleCfoInvitation(building.id, data.cfoEmail, userAuthId);
            }
            catch (error) {
                // Si falla la invitación CFO, no eliminar el edificio (es menos crítico)
                throw new Error(`Error al invitar CFO: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        }
        // Si se especificó un email de propietario, enviar invitación
        if (data.propietarioEmail) {
            try {
                await this.handlePropietarioInvitation(building.id, data.propietarioEmail, userAuthId);
            }
            catch (error) {
                // Si falla la invitación del propietario, no eliminar el edificio (es menos crítico)
                throw new Error(`Error al invitar propietario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        }
        return this.mapToBuilding(building);
    }
    async getBuildingById(id, userAuthId) {
        // Si se proporciona userAuthId, verificar acceso
        if (userAuthId) {
            const hasAccess = await this.userHasAccessToBuilding(userAuthId, id);
            if (!hasAccess) {
                return null; // Usuario no tiene acceso
            }
        }
        const { data, error } = await this.getSupabase()
            .from('buildings')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                return null; // No encontrado
            }
            throw new Error(`Error al obtener edificio: ${error.message}`);
        }
        return this.mapToBuilding(data);
    }
    async getBuildingsByUser(userAuthId) {
        const user = await this.userService.getUserByAuthId(userAuthId);
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
        let query;
        if (user.role.name === user_1.UserRole.PROPIETARIO) {
            // Los propietarios ven solo los edificios que les fueron asignados
            const assignedBuildingIds = await this.userService.getPropietarioBuildings(userAuthId);
            if (assignedBuildingIds.length === 0) {
                return []; // No tiene edificios asignados
            }
            query = this.getSupabase()
                .from('buildings')
                .select('*')
                .in('id', assignedBuildingIds);
        }
        else if (user.role.name === user_1.UserRole.TECNICO) {
            // Los técnicos ven edificios asignados
            const assignedBuildingIds = await this.userService.getTechnicianBuildings(userAuthId);
            if (assignedBuildingIds.length === 0) {
                return []; // No tiene edificios asignados
            }
            query = this.getSupabase()
                .from('buildings')
                .select('*')
                .in('id', assignedBuildingIds);
        }
        else if (user.role.name === user_1.UserRole.CFO) {
            // Los CFOs ven edificios asignados
            const assignedBuildingIds = await this.userService.getCfoBuildings(userAuthId);
            if (assignedBuildingIds.length === 0) {
                return []; // No tiene edificios asignados
            }
            query = this.getSupabase()
                .from('buildings')
                .select('*')
                .in('id', assignedBuildingIds);
        }
        else if (user.role.name === user_1.UserRole.ADMINISTRADOR) {
            // Los administradores ven solo los edificios que ellos crearon
            query = this.getSupabase()
                .from('buildings')
                .select('*')
                .eq('owner_id', user.id);
        }
        else {
            throw new Error('Rol no autorizado');
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) {
            throw new Error(`Error al obtener edificios: ${error.message}`);
        }
        return data.map(this.mapToBuilding);
    }
    async updateBuilding(id, data, userAuthId) {
        // Verificar que el usuario tenga permisos para actualizar el edificio
        const canUpdate = await this.userCanUpdateBuilding(userAuthId, id);
        if (!canUpdate) {
            throw new Error('No tienes permisos para actualizar este edificio');
        }
        // Mapear campos camelCase a snake_case
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.address !== undefined)
            updateData.address = data.address;
        if (data.cadastralReference !== undefined)
            updateData.cadastral_reference = data.cadastralReference;
        if (data.constructionYear !== undefined)
            updateData.construction_year = data.constructionYear;
        if (data.typology !== undefined)
            updateData.typology = data.typology;
        if (data.numFloors !== undefined)
            updateData.num_floors = data.numFloors;
        if (data.numUnits !== undefined)
            updateData.num_units = data.numUnits;
        if (data.lat !== undefined)
            updateData.lat = data.lat;
        if (data.lng !== undefined)
            updateData.lng = data.lng;
        if (data.images !== undefined)
            updateData.images = data.images;
        if (data.status !== undefined)
            updateData.status = data.status;
        if (data.price !== undefined)
            updateData.price = data.price;
        if (data.technicianEmail !== undefined)
            updateData.technician_email = data.technicianEmail;
        if (data.cfoEmail !== undefined)
            updateData.cfo_email = data.cfoEmail;
        // Campos financieros
        if (data.rehabilitationCost !== undefined)
            updateData.rehabilitation_cost = data.rehabilitationCost;
        if (data.potentialValue !== undefined)
            updateData.potential_value = data.potentialValue;
        if (data.squareMeters !== undefined)
            updateData.square_meters = data.squareMeters;
        const { data: building, error } = await this.getSupabase()
            .from('buildings')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            throw new Error(`Error al actualizar edificio: ${error.message}`);
        }
        return this.mapToBuilding(building);
    }
    async deleteBuilding(id, userAuthId) {
        // Solo los propietarios pueden eliminar edificios
        const isOwner = await this.userService.isOwnerOfBuilding(userAuthId, id);
        if (!isOwner) {
            throw new Error('Solo el propietario puede eliminar el edificio');
        }
        const { error } = await this.getSupabase()
            .from('buildings')
            .delete()
            .eq('id', id);
        if (error) {
            throw new Error(`Error al eliminar edificio: ${error.message}`);
        }
    }
    async updateStatus(id, status, userAuthId) {
        return this.updateBuilding(id, { status }, userAuthId);
    }
    async addImage(buildingId, image, userAuthId) {
        // Primero obtenemos el edificio actual
        const building = await this.getBuildingById(buildingId, userAuthId);
        if (!building) {
            throw new Error('Edificio no encontrado');
        }
        // Agregamos la nueva imagen
        const newImages = [...building.images, image];
        return this.updateBuilding(buildingId, { images: newImages }, userAuthId);
    }
    async removeImage(buildingId, imageId, userAuthId) {
        // Primero obtenemos el edificio actual
        const building = await this.getBuildingById(buildingId, userAuthId);
        if (!building) {
            throw new Error('Edificio no encontrado');
        }
        // Removemos la imagen
        const newImages = building.images.filter(img => img.id !== imageId);
        return this.updateBuilding(buildingId, { images: newImages }, userAuthId);
    }
    async setMainImage(buildingId, imageId, userAuthId) {
        // Primero obtenemos el edificio actual
        const building = await this.getBuildingById(buildingId, userAuthId);
        if (!building) {
            throw new Error('Edificio no encontrado');
        }
        // Actualizamos las imágenes para que solo una sea principal
        const newImages = building.images.map(img => ({
            ...img,
            isMain: img.id === imageId
        }));
        return this.updateBuilding(buildingId, { images: newImages }, userAuthId);
    }
    // Método para verificar si un edificio tiene libro digital
    async hasDigitalBook(buildingId, userAuthId) {
        // Verificar acceso al edificio
        const hasAccess = await this.userHasAccessToBuilding(userAuthId, buildingId);
        if (!hasAccess) {
            return false;
        }
        const { data, error } = await this.getSupabase()
            .from('digital_books')
            .select('id')
            .eq('building_id', buildingId)
            .single();
        return !error && !!data;
    }
    // Método para obtener edificio con su libro digital
    async getBuildingWithBook(buildingId, userAuthId) {
        const building = await this.getBuildingById(buildingId, userAuthId);
        if (!building) {
            throw new Error('Edificio no encontrado');
        }
        // Obtener el libro digital asociado
        const { data: book } = await this.getSupabase()
            .from('digital_books')
            .select('*')
            .eq('building_id', buildingId)
            .single();
        return {
            ...building,
            digitalBook: book || null
        };
    }
    // Métodos auxiliares para verificar permisos
    async userHasAccessToBuilding(userAuthId, buildingId) {
        const user = await this.userService.getUserByAuthId(userAuthId);
        if (!user)
            return false;
        if (user.role.name === user_1.UserRole.PROPIETARIO) {
            // Los propietarios tienen acceso a edificios asignados
            return await this.propietarioHasAccessToBuilding(userAuthId, buildingId);
        }
        else if (user.role.name === user_1.UserRole.TECNICO) {
            // Los técnicos tienen acceso a edificios asignados
            return await this.userService.technicianHasAccessToBuilding(userAuthId, buildingId);
        }
        else if (user.role.name === user_1.UserRole.CFO) {
            // Los CFOs tienen acceso a edificios asignados
            return await this.cfoHasAccessToBuilding(userAuthId, buildingId);
        }
        else if (user.role.name === user_1.UserRole.ADMINISTRADOR) {
            // Los administradores tienen acceso a edificios que ellos crearon
            const { data: building } = await this.getSupabase()
                .from('buildings')
                .select('owner_id')
                .eq('id', buildingId)
                .single();
            return !!(building && building.owner_id === user.id);
        }
        return false;
    }
    async userCanUpdateBuilding(userAuthId, buildingId) {
        const user = await this.userService.getUserByAuthId(userAuthId);
        if (!user)
            return false;
        if (user.role.name === user_1.UserRole.PROPIETARIO) {
            // Los propietarios NO pueden actualizar edificios, solo verlos
            return false;
        }
        else if (user.role.name === user_1.UserRole.TECNICO) {
            // Los técnicos pueden actualizar solo algunos campos de edificios asignados
            return await this.userService.technicianHasAccessToBuilding(userAuthId, buildingId);
        }
        else if (user.role.name === user_1.UserRole.CFO) {
            // Los CFOs pueden actualizar campos financieros de edificios asignados
            return await this.cfoHasAccessToBuilding(userAuthId, buildingId);
        }
        else if (user.role.name === user_1.UserRole.ADMINISTRADOR) {
            // Los administradores pueden actualizar edificios que ellos crearon
            const { data: building } = await this.getSupabase()
                .from('buildings')
                .select('owner_id')
                .eq('id', buildingId)
                .single();
            return !!(building && building.owner_id === user.id);
        }
        return false;
    }
    /**
     * Maneja la asignación de técnico: si existe, lo asigna; si no, envía invitación
     */
    async handleTechnicianAssignment(buildingId, technicianEmail, userAuthId) {
        console.log(`\n🔍 ASIGNACIÓN TÉCNICO - Email: ${technicianEmail} | Building: ${buildingId}`);
        // Primero verificar si el usuario ya existe
        const existingTechnician = await this.userService.getUserByEmail(technicianEmail);
        if (existingTechnician) {
            console.log(`✅ Usuario existe - Rol: ${existingTechnician.role.name} | ID: ${existingTechnician.id}`);
        }
        else {
            console.log(`❌ Usuario NO existe - Creando invitación de registro`);
        }
        if (existingTechnician) {
            // Si existe y es técnico, asignarlo directamente
            if (existingTechnician.role.name === user_1.UserRole.TECNICO) {
                console.log(`📧 Enviando EMAIL DE ASIGNACIÓN para técnico existente`);
                // Enviar email de notificación de asignación directamente
                const assignedByUser = await this.userService.getUserByAuthId(userAuthId);
                const building = await this.getBuildingById(buildingId);
                if (assignedByUser && building) {
                    try {
                        // PRIMERO: Crear la asignación en la base de datos
                        console.log(`🏢 CREANDO ASIGNACIÓN en BD para técnico existente`);
                        await this.assignTechnicianToBuilding(buildingId, existingTechnician.userId, userAuthId);
                        console.log(`✅ ASIGNACIÓN CREADA en BD exitosamente`);
                        // SEGUNDO: Enviar email de notificación
                        console.log(`📧 Enviando EMAIL DE ASIGNACIÓN para técnico existente`);
                        await this.sendAssignmentNotificationEmail(existingTechnician, building, assignedByUser);
                        console.log(`✅ EMAIL DE ASIGNACIÓN enviado exitosamente`);
                    }
                    catch (error) {
                        console.error(`❌ Error en asignación:`, error);
                        throw error; // Re-lanzar el error para que se maneje apropiadamente
                    }
                }
            }
            else {
                console.log('❌ User exists but is not a technician');
                throw new Error('El usuario existe pero no es un técnico');
            }
        }
        else {
            // Si no existe, enviar invitación
            console.log(`📧 Creando INVITACIÓN DE REGISTRO para usuario nuevo`);
            await this.invitationService.createInvitation({
                email: technicianEmail,
                role: user_1.UserRole.TECNICO,
                buildingId: buildingId
            }, userAuthId);
            console.log(`✅ INVITACIÓN DE REGISTRO creada exitosamente`);
        }
    }
    /**
     * Maneja la invitación de CFO
     */
    async handleCfoInvitation(buildingId, cfoEmail, userAuthId) {
        // Verificar si el usuario ya existe
        const existingCfo = await this.userService.getUserByEmail(cfoEmail);
        if (existingCfo) {
            // Si existe y es CFO, asignarlo directamente
            if (existingCfo.role.name === user_1.UserRole.CFO) {
                await this.assignCfoToBuilding(buildingId, existingCfo.id, userAuthId);
            }
            else {
                throw new Error('El usuario existe pero no es un CFO');
            }
        }
        else {
            // Si no existe, enviar invitación
            await this.invitationService.createInvitation({
                email: cfoEmail,
                role: user_1.UserRole.CFO,
                buildingId: buildingId
            }, userAuthId);
        }
    }
    /**
     * Maneja la invitación de propietario
     */
    async handlePropietarioInvitation(buildingId, propietarioEmail, userAuthId) {
        // Verificar si el usuario ya existe
        const existingPropietario = await this.userService.getUserByEmail(propietarioEmail);
        if (existingPropietario) {
            // Si existe y es propietario, asignarlo directamente
            if (existingPropietario.role.name === user_1.UserRole.PROPIETARIO) {
                // Enviar email de notificación de asignación directamente
                const assignedByUser = await this.userService.getUserByAuthId(userAuthId);
                const building = await this.getBuildingById(buildingId);
                if (assignedByUser && building) {
                    try {
                        // PRIMERO: Crear la asignación en la base de datos
                        await this.assignPropietarioToBuilding(buildingId, existingPropietario.id, userAuthId);
                        // SEGUNDO: Enviar email de notificación
                        await this.sendAssignmentNotificationEmail(existingPropietario, building, assignedByUser);
                    }
                    catch (error) {
                        throw error;
                    }
                }
            }
            else {
                throw new Error('El usuario existe pero no es un propietario');
            }
        }
        else {
            // Si no existe, enviar invitación de registro
            await this.invitationService.createInvitation({
                email: propietarioEmail,
                role: user_1.UserRole.PROPIETARIO,
                buildingId: buildingId
            }, userAuthId);
        }
    }
    /**
     * Obtiene el propietario de un edificio
     */
    async getBuildingOwner(buildingId) {
        const { data, error } = await this.getSupabase()
            .from('buildings')
            .select(`
        id,
        owner:users!owner_id(
          id,
          user_id,
          email,
          full_name,
          role_id
        )
      `)
            .eq('id', buildingId)
            .single();
        if (error || !data) {
            throw new Error('Edificio no encontrado');
        }
        return data.owner;
    }
    /**
     * Verifica si un CFO tiene acceso a un edificio
     */
    async cfoHasAccessToBuilding(cfoAuthId, buildingId) {
        const user = await this.userService.getUserByAuthId(cfoAuthId);
        if (!user)
            return false;
        const { data, error } = await this.getSupabase()
            .from('building_cfo_assignments')
            .select('id')
            .eq('building_id', buildingId)
            .eq('cfo_id', user.id)
            .eq('status', 'active')
            .single();
        return !error && !!data;
    }
    async propietarioHasAccessToBuilding(propietarioAuthId, buildingId) {
        const user = await this.userService.getUserByAuthId(propietarioAuthId);
        if (!user)
            return false;
        const { data, error } = await this.getSupabase()
            .from('building_propietario_assignments')
            .select('id')
            .eq('building_id', buildingId)
            .eq('propietario_id', user.id)
            .eq('status', 'active')
            .single();
        return !error && !!data;
    }
    /**
     * Asigna un técnico a un edificio
     */
    async assignTechnicianToBuilding(buildingId, technicianAuthId, assignedByUserId) {
        const technician = await this.userService.getUserByAuthId(technicianAuthId);
        if (!technician) {
            throw new Error('Técnico no encontrado');
        }
        if (technician.role.name !== user_1.UserRole.TECNICO) {
            throw new Error('El usuario no es un técnico');
        }
        // Verificar que el técnico no esté ya asignado a este edificio
        const existingAssignment = await this.getSupabase()
            .from('building_technician_assignments')
            .select('id')
            .eq('building_id', buildingId)
            .eq('technician_id', technician.id)
            .eq('status', 'active')
            .single();
        if (existingAssignment.data) {
            throw new Error('El técnico ya está asignado a este edificio');
        }
        const assignedByUser = await this.userService.getUserByAuthId(assignedByUserId);
        if (!assignedByUser) {
            throw new Error('Usuario asignador no encontrado');
        }
        const assignmentData = {
            building_id: buildingId,
            technician_id: technician.id,
            assigned_by: assignedByUser.id,
            status: 'active'
        };
        const { error } = await this.getSupabase()
            .from('building_technician_assignments')
            .insert(assignmentData);
        if (error) {
            throw new Error(`Error al asignar técnico: ${error.message}`);
        }
    }
    /**
     * Asigna un CFO a un edificio
     */
    async assignCfoToBuilding(buildingId, cfoId, assignedByUserId) {
        const assignedByUser = await this.userService.getUserByAuthId(assignedByUserId);
        if (!assignedByUser) {
            throw new Error('Usuario asignador no encontrado');
        }
        const assignmentData = {
            building_id: buildingId,
            cfo_id: cfoId,
            assigned_by: assignedByUser.id,
            status: 'active'
        };
        const { error } = await this.getSupabase()
            .from('building_cfo_assignments')
            .insert(assignmentData);
        if (error) {
            throw new Error(`Error al asignar CFO: ${error.message}`);
        }
    }
    /**
     * Asigna un propietario a un edificio
     */
    async assignPropietarioToBuilding(buildingId, propietarioId, assignedByUserId) {
        const assignedByUser = await this.userService.getUserByAuthId(assignedByUserId);
        if (!assignedByUser) {
            throw new Error('Usuario asignador no encontrado');
        }
        const assignmentData = {
            building_id: buildingId,
            propietario_id: propietarioId,
            assigned_by: assignedByUser.id,
            status: 'active'
        };
        const { error } = await this.getSupabase()
            .from('building_propietario_assignments')
            .insert(assignmentData);
        if (error) {
            throw new Error(`Error al asignar propietario: ${error.message}`);
        }
    }
    /**
     * Envía un email de notificación cuando se asigna un técnico existente a un nuevo edificio
     */
    async sendAssignmentNotificationEmail(technician, building, assignedByUser) {
        const emailService = new (await Promise.resolve().then(() => __importStar(require('./emailService')))).EmailService();
        // Usar el método de notificación de asignación
        await emailService.sendAssignmentNotificationEmail(technician, building, assignedByUser);
    }
    /**
     * Valida las asignaciones de técnico y CFO antes de crear el edificio
     */
    async validateUserAssignments(technicianEmail, cfoEmail, propietarioEmail, userAuthId) {
        const technicianValidation = { isValid: true, errors: {} };
        const cfoValidation = { isValid: true, errors: {} };
        const propietarioValidation = { isValid: true, errors: {} };
        // Validar técnico si se proporciona
        if (technicianEmail) {
            const technicianResult = await this.validateTechnicianEmail(technicianEmail, cfoEmail, propietarioEmail);
            if (!technicianResult.isValid) {
                technicianValidation.isValid = false;
                technicianValidation.errors.technician = technicianResult.error;
            }
        }
        // Validar CFO si se proporciona
        if (cfoEmail) {
            const cfoResult = await this.validateCfoEmail(cfoEmail, technicianEmail, propietarioEmail);
            if (!cfoResult.isValid) {
                cfoValidation.isValid = false;
                cfoValidation.errors.cfo = cfoResult.error;
            }
        }
        // Validar propietario si se proporciona
        if (propietarioEmail) {
            const propietarioResult = await this.validatePropietarioEmail(propietarioEmail, technicianEmail, cfoEmail);
            if (!propietarioResult.isValid) {
                propietarioValidation.isValid = false;
                propietarioValidation.errors.propietario = propietarioResult.error;
            }
        }
        const overallValid = technicianValidation.isValid && cfoValidation.isValid && propietarioValidation.isValid;
        return {
            technicianValidation,
            cfoValidation,
            propietarioValidation,
            overallValid
        };
    }
    /**
     * Valida si un email de técnico es válido para asignación
     */
    async validateTechnicianEmail(technicianEmail, cfoEmail, propietarioEmail) {
        // Verificar si el email ya existe
        const existingUser = await this.userService.getUserByEmail(technicianEmail);
        if (existingUser) {
            // Si existe, verificar el rol
            if (existingUser.role.name === user_1.UserRole.PROPIETARIO) {
                return {
                    isValid: false,
                    error: 'Este email corresponde a un usuario propietario. Los propietarios no pueden ser asignados como técnicos.'
                };
            }
            if (existingUser.role.name === user_1.UserRole.CFO) {
                return {
                    isValid: false,
                    error: 'Este email corresponde a un usuario CFO. Un usuario no puede tener roles múltiples (CFO y técnico).'
                };
            }
            if (existingUser.role.name === user_1.UserRole.TECNICO) {
                // Es técnico válido
                return { isValid: true };
            }
            if (existingUser.role.name === user_1.UserRole.ADMINISTRADOR) {
                return {
                    isValid: false,
                    error: 'Este email corresponde a un usuario administrador. Los administradores no pueden ser asignados como técnicos.'
                };
            }
        }
        // Si no existe, es válido (se enviará invitación)
        return { isValid: true };
    }
    /**
     * Valida si un email de CFO es válido para asignación
     */
    async validateCfoEmail(cfoEmail, technicianEmail, propietarioEmail) {
        // Verificar si es el mismo email que el técnico
        if (technicianEmail && cfoEmail === technicianEmail) {
            return {
                isValid: false,
                error: 'El CFO y el técnico no pueden ser la misma persona.'
            };
        }
        // Verificar si es el mismo email que el propietario
        if (propietarioEmail && cfoEmail === propietarioEmail) {
            return {
                isValid: false,
                error: 'El CFO y el propietario no pueden ser la misma persona.'
            };
        }
        // Verificar si el email ya existe
        const existingUser = await this.userService.getUserByEmail(cfoEmail);
        if (existingUser) {
            // Si existe, verificar el rol
            if (existingUser.role.name === user_1.UserRole.PROPIETARIO) {
                return {
                    isValid: false,
                    error: 'Este email corresponde a un usuario propietario. Los propietarios no pueden ser asignados como CFO.'
                };
            }
            if (existingUser.role.name === user_1.UserRole.TECNICO) {
                return {
                    isValid: false,
                    error: 'Este email corresponde a un usuario técnico. Un usuario no puede tener roles múltiples (técnico y CFO).'
                };
            }
            if (existingUser.role.name === user_1.UserRole.CFO) {
                // Es CFO válido
                return { isValid: true };
            }
            if (existingUser.role.name === user_1.UserRole.ADMINISTRADOR) {
                return {
                    isValid: false,
                    error: 'Este email corresponde a un usuario administrador. Los administradores no pueden ser asignados como CFO.'
                };
            }
        }
        // Si no existe, es válido (se enviará invitación)
        return { isValid: true };
    }
    /**
     * Valida si un email de propietario es válido para asignación
     */
    async validatePropietarioEmail(propietarioEmail, technicianEmail, cfoEmail) {
        // Verificar si es el mismo email que el técnico
        if (technicianEmail && propietarioEmail === technicianEmail) {
            return {
                isValid: false,
                error: 'El propietario y el técnico no pueden ser la misma persona.'
            };
        }
        // Verificar si es el mismo email que el CFO
        if (cfoEmail && propietarioEmail === cfoEmail) {
            return {
                isValid: false,
                error: 'El propietario y el CFO no pueden ser la misma persona.'
            };
        }
        // Verificar si el email ya existe
        const existingUser = await this.userService.getUserByEmail(propietarioEmail);
        if (existingUser) {
            // Si existe, verificar el rol
            if (existingUser.role.name === user_1.UserRole.TECNICO) {
                return {
                    isValid: false,
                    error: 'Este email corresponde a un usuario técnico. Los técnicos no pueden ser asignados como propietarios.'
                };
            }
            if (existingUser.role.name === user_1.UserRole.CFO) {
                return {
                    isValid: false,
                    error: 'Este email corresponde a un usuario CFO. Los CFOs no pueden ser asignados como propietarios.'
                };
            }
            if (existingUser.role.name === user_1.UserRole.ADMINISTRADOR) {
                return {
                    isValid: false,
                    error: 'Este email corresponde a un usuario administrador. Los administradores no pueden ser asignados como propietarios.'
                };
            }
            if (existingUser.role.name === user_1.UserRole.PROPIETARIO) {
                // Es propietario válido
                return { isValid: true };
            }
        }
        // Si no existe, es válido (se enviará invitación)
        return { isValid: true };
    }
    mapToBuilding(data) {
        return {
            id: data.id,
            name: data.name,
            address: data.address,
            cadastralReference: data.cadastral_reference || data.cadastralReference,
            constructionYear: data.construction_year || data.constructionYear,
            typology: data.typology,
            numFloors: data.num_floors || data.numFloors,
            numUnits: data.num_units || data.numUnits,
            lat: data.lat,
            lng: data.lng,
            images: (data.images || []).map((img) => ({
                id: img.id,
                url: img.url,
                title: img.title,
                filename: img.filename || img.title,
                isMain: img.isMain,
                uploadedAt: img.uploadedAt || new Date().toISOString()
            })),
            status: data.status,
            price: data.price,
            technicianEmail: data.technician_email,
            cfoEmail: data.cfo_email,
            ownerId: data.owner_id,
            // Campos financieros
            rehabilitationCost: data.rehabilitation_cost || 0,
            potentialValue: data.potential_value || 0,
            squareMeters: data.square_meters,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            userId: data.user_id // Mantener por compatibilidad
        };
    }
}
exports.BuildingService = BuildingService;
//# sourceMappingURL=edificioService.js.map
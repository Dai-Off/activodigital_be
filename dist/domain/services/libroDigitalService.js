"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DigitalBookService = void 0;
const supabase_1 = require("../../lib/supabase");
const libroDigital_1 = require("../../types/libroDigital");
const userService_1 = require("./userService");
const user_1 = require("../../types/user");
class DigitalBookService {
    constructor() {
        this.userService = new userService_1.UserService();
    }
    getSupabase() {
        return (0, supabase_1.getSupabaseClient)();
    }
    /**
     * Valida que un array contenga objetos DocumentFile válidos
     */
    validateDocumentFiles(files) {
        if (!Array.isArray(files))
            return false;
        return files.every(file => {
            return (typeof file === 'object' &&
                file !== null &&
                typeof file.id === 'string' &&
                typeof file.url === 'string' &&
                typeof file.fileName === 'string' &&
                typeof file.fileSize === 'number' &&
                typeof file.mimeType === 'string' &&
                typeof file.uploadedAt === 'string' &&
                typeof file.uploadedBy === 'string' &&
                (file.title === undefined || typeof file.title === 'string'));
        });
    }
    /**
     * Valida el contenido de una sección antes de guardarlo
     */
    validateSectionContent(sectionType, content) {
        if (!content || typeof content !== 'object') {
            throw new Error('El contenido de la sección debe ser un objeto');
        }
        // Validar arrays de DocumentFile en el contenido
        for (const [key, value] of Object.entries(content)) {
            if (Array.isArray(value) && value.length > 0) {
                // Si es un array, verificar si contiene DocumentFiles
                const firstItem = value[0];
                if (firstItem && typeof firstItem === 'object' && 'fileName' in firstItem) {
                    if (!this.validateDocumentFiles(value)) {
                        throw new Error(`El campo '${key}' contiene archivos con formato inválido`);
                    }
                }
            }
        }
    }
    async createDigitalBook(data, userAuthId) {
        // Verificar que el usuario tenga permisos para crear libro digital
        const canCreate = await this.userCanCreateDigitalBook(userAuthId, data.buildingId);
        if (!canCreate) {
            throw new Error('No tienes permisos para crear un libro digital para este edificio');
        }
        // Verificar que el edificio no tenga ya un libro digital
        const existingBook = await this.getBookByBuildingId(data.buildingId);
        if (existingBook) {
            throw new Error('Este edificio ya tiene un libro digital asociado');
        }
        // Obtener el usuario para asignar como técnico
        const user = await this.userService.getUserByAuthId(userAuthId);
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
        // Crear secciones por defecto si no se proporcionan
        const defaultSections = data.sections || this.createDefaultSections();
        const bookData = {
            building_id: data.buildingId,
            source: data.source,
            status: libroDigital_1.BookStatus.DRAFT,
            progress: 0,
            sections: defaultSections,
            user_id: userAuthId, // Mantener por compatibilidad
            // Si el creador es técnico, establecerlo como técnico del libro
            technician_id: user.role.name === user_1.UserRole.TECNICO ? user.id : null
        };
        const { data: book, error } = await this.getSupabase()
            .from('digital_books')
            .insert(bookData)
            .select()
            .single();
        if (error) {
            throw new Error(`Error al crear libro digital: ${error.message}`);
        }
        return this.mapToDigitalBook(book);
    }
    async getBookById(id, userAuthId) {
        // Si se proporciona userAuthId, verificar acceso
        if (userAuthId) {
            const hasAccess = await this.userCanAccessDigitalBook(userAuthId, id);
            if (!hasAccess) {
                return null; // Usuario no tiene acceso
            }
        }
        const { data, error } = await this.getSupabase()
            .from('digital_books')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                return null; // No encontrado
            }
            throw new Error(`Error al obtener libro digital: ${error.message}`);
        }
        return this.mapToDigitalBook(data);
    }
    async getBookByBuildingId(buildingId, userAuthId) {
        // Si se proporciona userAuthId, verificar acceso al edificio
        if (userAuthId) {
            const hasAccess = await this.userCanAccessBuildingBook(userAuthId, buildingId);
            if (!hasAccess) {
                return null; // Usuario no tiene acceso
            }
        }
        const { data, error } = await this.getSupabase()
            .from('digital_books')
            .select('*')
            .eq('building_id', buildingId)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                return null; // No encontrado
            }
            throw new Error(`Error al obtener libro digital: ${error.message}`);
        }
        return this.mapToDigitalBook(data);
    }
    async getBooksByUser(userAuthId) {
        const user = await this.userService.getUserByAuthId(userAuthId);
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
        let query;
        if (user.role.name === user_1.UserRole.TECNICO) {
            // Los técnicos ven solo los libros que gestionan
            query = this.getSupabase()
                .from('digital_books')
                .select('*')
                .eq('technician_id', user.id);
        }
        else if (user.role.name === user_1.UserRole.PROPIETARIO) {
            // Los propietarios ven libros de sus edificios
            query = this.getSupabase()
                .from('digital_books')
                .select(`
          *,
          building:buildings!inner(owner_id)
        `)
                .eq('buildings.owner_id', user.id);
        }
        else {
            throw new Error('Rol no autorizado');
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) {
            throw new Error(`Error al obtener libros digitales: ${error.message}`);
        }
        return data.map(this.mapToDigitalBook);
    }
    async updateBook(id, data, userAuthId) {
        // Verificar que el usuario pueda actualizar el libro
        const canUpdate = await this.userCanUpdateDigitalBook(userAuthId, id);
        if (!canUpdate) {
            throw new Error('No tienes permisos para actualizar este libro digital');
        }
        const { data: book, error } = await this.getSupabase()
            .from('digital_books')
            .update(data)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            throw new Error(`Error al actualizar libro digital: ${error.message}`);
        }
        return this.mapToDigitalBook(book);
    }
    async updateSection(bookId, sectionType, data, userAuthId) {
        // Verificar permisos de actualización
        const canUpdate = await this.userCanUpdateDigitalBook(userAuthId, bookId);
        if (!canUpdate) {
            throw new Error('No tienes permisos para actualizar este libro digital');
        }
        // Obtener el libro actual
        const book = await this.getBookById(bookId);
        if (!book) {
            throw new Error('Libro digital no encontrado');
        }
        // Validar el contenido de la sección
        try {
            this.validateSectionContent(sectionType, data.content);
        }
        catch (error) {
            throw new Error(`Validación falló: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
        // Actualizar la sección específica
        const newSections = book.sections.map(section => {
            if (section.type === sectionType) {
                return {
                    ...section,
                    content: data.content,
                    complete: data.complete !== undefined ? data.complete : section.complete
                };
            }
            return section;
        });
        // Calcular nuevo progreso
        const completeSections = newSections.filter(s => s.complete).length;
        const newProgress = completeSections;
        // Determinar nuevo estado basado en el progreso
        let newStatus = book.status;
        if (newProgress > 0 && newStatus === libroDigital_1.BookStatus.DRAFT) {
            newStatus = libroDigital_1.BookStatus.IN_PROGRESS;
        }
        else if (newProgress === 8) {
            newStatus = libroDigital_1.BookStatus.COMPLETE;
        }
        // Actualizar (sin usar columna "estado" si no existe en la DB)
        const { data: updated, error } = await this.getSupabase()
            .from('digital_books')
            .update({
            sections: newSections,
            progress: newProgress,
            status: newStatus
        })
            .eq('id', bookId)
            .select()
            .single();
        if (error) {
            throw new Error(`Error al actualizar libro digital: ${error.message}`);
        }
        return this.mapToDigitalBook(updated);
    }
    async deleteBook(id, userAuthId) {
        // Verificar permisos para eliminar
        const canDelete = await this.userCanDeleteDigitalBook(userAuthId, id);
        if (!canDelete) {
            throw new Error('No tienes permisos para eliminar este libro digital');
        }
        const { error } = await this.getSupabase()
            .from('digital_books')
            .delete()
            .eq('id', id);
        if (error) {
            throw new Error(`Error al eliminar libro digital: ${error.message}`);
        }
    }
    createDefaultSections() {
        const types = Object.values(libroDigital_1.SectionType);
        return types.map(type => ({
            id: this.generateUUID(),
            type,
            complete: false,
            content: {}
        }));
    }
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    // Métodos auxiliares para verificar permisos
    async userCanCreateDigitalBook(userAuthId, buildingId) {
        const user = await this.userService.getUserByAuthId(userAuthId);
        if (!user)
            return false;
        if (user.role.name === user_1.UserRole.TECNICO) {
            // Los técnicos pueden crear libros solo para edificios asignados
            return await this.userService.technicianHasAccessToBuilding(userAuthId, buildingId);
        }
        else if (user.role.name === user_1.UserRole.PROPIETARIO) {
            // Los propietarios pueden crear libros para sus propios edificios
            return await this.userService.isOwnerOfBuilding(userAuthId, buildingId);
        }
        return false;
    }
    async userCanAccessDigitalBook(userAuthId, bookId) {
        const user = await this.userService.getUserByAuthId(userAuthId);
        if (!user)
            return false;
        const { data: book } = await this.getSupabase()
            .from('digital_books')
            .select('building_id, technician_id')
            .eq('id', bookId)
            .single();
        if (!book)
            return false;
        if (user.role.name === user_1.UserRole.TECNICO) {
            // Los técnicos pueden acceder a libros que gestionan
            return book.technician_id === user.id;
        }
        else if (user.role.name === user_1.UserRole.PROPIETARIO) {
            // Los propietarios pueden acceder a libros de sus edificios
            return await this.userService.isOwnerOfBuilding(userAuthId, book.building_id);
        }
        return false;
    }
    async userCanAccessBuildingBook(userAuthId, buildingId) {
        const user = await this.userService.getUserByAuthId(userAuthId);
        if (!user)
            return false;
        if (user.role.name === user_1.UserRole.TECNICO) {
            // Los técnicos pueden acceder a libros de edificios asignados
            return await this.userService.technicianHasAccessToBuilding(userAuthId, buildingId);
        }
        else if (user.role.name === user_1.UserRole.PROPIETARIO) {
            // Los propietarios pueden acceder a libros de sus edificios
            return await this.userService.isOwnerOfBuilding(userAuthId, buildingId);
        }
        return false;
    }
    async userCanUpdateDigitalBook(userAuthId, bookId) {
        const user = await this.userService.getUserByAuthId(userAuthId);
        if (!user)
            return false;
        if (user.role.name === user_1.UserRole.TECNICO) {
            // Los técnicos pueden actualizar libros que gestionan
            // Caso 1: technician_id coincide
            const { data: book } = await this.getSupabase()
                .from('digital_books')
                .select('technician_id, building_id')
                .eq('id', bookId)
                .single();
            if (!book)
                return false;
            if (book.technician_id === user.id)
                return true;
            // Caso 2: technician_id nulo o distinto, pero el técnico tiene asignación activa al edificio
            return await this.userService.technicianHasAccessToBuilding(userAuthId, book.building_id);
        }
        // Los propietarios no pueden actualizar libros digitales directamente
        return false;
    }
    async userCanDeleteDigitalBook(userAuthId, bookId) {
        const user = await this.userService.getUserByAuthId(userAuthId);
        if (!user)
            return false;
        const { data: book } = await this.getSupabase()
            .from('digital_books')
            .select('building_id, technician_id')
            .eq('id', bookId)
            .single();
        if (!book)
            return false;
        if (user.role.name === user_1.UserRole.PROPIETARIO) {
            // Los propietarios pueden eliminar libros de sus edificios
            return await this.userService.isOwnerOfBuilding(userAuthId, book.building_id);
        }
        else if (user.role.name === user_1.UserRole.TECNICO) {
            // Los técnicos pueden eliminar libros que gestionan
            return book.technician_id === user.id;
        }
        return false;
    }
    mapToDigitalBook(data) {
        return {
            id: data.id,
            buildingId: data.building_id,
            source: data.source,
            status: data.status,
            progress: data.progress,
            sections: data.sections || [],
            technicianId: data.technician_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            userId: data.user_id // Mantener por compatibilidad
        };
    }
}
exports.DigitalBookService = DigitalBookService;
//# sourceMappingURL=libroDigitalService.js.map
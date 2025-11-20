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
    async createDigitalBook(data, userAuthId, overwrite = false) {
        // Todos los usuarios pueden crear libros digitales para cualquier edificio
        // Verificar si el edificio ya tiene un libro digital
        const existingBook = await this.getBookByBuildingId(data.buildingId);
        if (existingBook && !overwrite) {
            throw new Error('Este edificio ya tiene un libro digital asociado');
        }
        // Si existe y se permite sobrescribir, eliminarlo primero
        if (existingBook && overwrite) {
            await this.deleteBook(existingBook.id, userAuthId);
        }
        // Obtener el usuario para asignar como técnico
        const user = await this.userService.getUserByAuthId(userAuthId);
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
        // Crear secciones por defecto si no se proporcionan
        const defaultSections = data.sections || this.createDefaultSections();
        // Calcular progreso inicial basado en secciones completas
        const completeSections = defaultSections.filter(section => section.complete).length;
        const initialProgress = completeSections;
        // Determinar estado inicial basado en el progreso
        let initialStatus = libroDigital_1.BookStatus.DRAFT;
        if (initialProgress > 0 && initialProgress < 8) {
            initialStatus = libroDigital_1.BookStatus.IN_PROGRESS;
        }
        else if (initialProgress === 8) {
            initialStatus = libroDigital_1.BookStatus.COMPLETE;
        }
        const bookData = {
            building_id: data.buildingId,
            source: data.source,
            status: initialStatus,
            progress: initialProgress,
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
        // Todos los usuarios pueden ver cualquier libro digital
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
        // Todos los usuarios pueden ver libros digitales de cualquier edificio
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
        // Todos los usuarios pueden ver todos los libros digitales
        const { data, error } = await this.getSupabase()
            .from('digital_books')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            throw new Error(`Error al obtener libros digitales: ${error.message}`);
        }
        return data.map(this.mapToDigitalBook);
    }
    async updateBook(id, data, userAuthId) {
        // Todos los usuarios pueden actualizar cualquier libro digital
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
        // Todos los usuarios pueden actualizar cualquier sección de cualquier libro digital
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
        // Si se actualizó la sección de sostenibilidad, actualizar campos_ambientales en el libro digital
        if (sectionType === 'sustainability_and_esg') {
            await this.updateCamposAmbientalesInDigitalBook(bookId, data.content);
        }
        return this.mapToDigitalBook(updated);
    }
    async deleteBook(id, userAuthId) {
        // Todos los usuarios pueden eliminar cualquier libro digital
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
    // Métodos auxiliares para verificar permisos - Todos permiten acceso total
    async userCanCreateDigitalBook(userAuthId, buildingId) {
        return true;
    }
    async userCanAccessDigitalBook(userAuthId, bookId) {
        return true;
    }
    async userCanAccessBuildingBook(userAuthId, buildingId) {
        return true;
    }
    async userCanUpdateDigitalBook(userAuthId, bookId) {
        return true;
    }
    async userCanDeleteDigitalBook(userAuthId, bookId) {
        return true;
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
    /**
     * Actualiza los campos ambientales desde la sección de sostenibilidad (público para uso en controladores)
     */
    async updateCamposAmbientalesFromSection(bookId, sustainabilityContent) {
        return this.updateCamposAmbientalesInDigitalBook(bookId, sustainabilityContent);
    }
    /**
     * Actualiza los campos_ambientales en el libro digital
     * para que el ESG service pueda leerlos correctamente
     */
    async updateCamposAmbientalesInDigitalBook(bookId, sustainabilityContent) {
        try {
            // Obtener el libro actual
            const { data: book, error: selectError } = await this.getSupabase()
                .from('digital_books')
                .select('campos_ambientales')
                .eq('id', bookId)
                .single();
            if (selectError) {
                console.error('Error al obtener libro digital:', selectError);
                return;
            }
            // Crear o actualizar campos_ambientales
            const camposAmbientalesData = {
                renewableSharePercent: sustainabilityContent.renewableSharePercent || null,
                waterFootprintM3PerM2Year: sustainabilityContent.waterFootprintM3PerM2Year || null,
                accessibility: sustainabilityContent.accessibility || null,
                indoorAirQualityCo2Ppm: sustainabilityContent.indoorAirQualityCo2Ppm || null,
                safetyCompliance: sustainabilityContent.safetyCompliance || null,
                regulatoryCompliancePercent: sustainabilityContent.regulatoryCompliancePercent || null,
                updated_at: new Date().toISOString()
            };
            // Actualizar el campo campos_ambientales en el libro digital
            const { error: updateError } = await this.getSupabase()
                .from('digital_books')
                .update({ campos_ambientales: camposAmbientalesData })
                .eq('id', bookId);
            if (updateError) {
                console.error('Error al actualizar campos_ambientales en libro digital:', updateError);
            }
            else {
                console.log('✅ Campos ambientales actualizados en libro digital:', bookId);
            }
        }
        catch (error) {
            console.error('Error en updateCamposAmbientalesInDigitalBook:', error);
        }
    }
}
exports.DigitalBookService = DigitalBookService;
//# sourceMappingURL=libroDigitalService.js.map
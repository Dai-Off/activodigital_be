import { getSupabaseClient } from '../../lib/supabase';
import { 
  DigitalBook, 
  CreateDigitalBookRequest, 
  UpdateDigitalBookRequest,
  UpdateSectionRequest,
  BookSection,
  SectionType,
  BookStatus,
  BookSource
} from '../../types/libroDigital';
import { UserService } from './userService';
import { UserRole } from '../../types/user';

export class DigitalBookService {
  private userService = new UserService();

  private getSupabase() {
    return getSupabaseClient();
  }

  async createDigitalBook(data: CreateDigitalBookRequest, userAuthId: string): Promise<DigitalBook> {
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
      status: BookStatus.DRAFT,
      progress: 0,
      sections: defaultSections,
      technician_id: user.id,
      user_id: userAuthId // Mantener por compatibilidad
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

  async getBookById(id: string, userAuthId?: string): Promise<DigitalBook | null> {
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

  async getBookByBuildingId(buildingId: string, userAuthId?: string): Promise<DigitalBook | null> {
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

  async getBooksByUser(userAuthId: string): Promise<DigitalBook[]> {
    const user = await this.userService.getUserByAuthId(userAuthId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    let query;
    if (user.role.name === UserRole.TECNICO) {
      // Los técnicos ven solo los libros que gestionan
      query = this.getSupabase()
        .from('digital_books')
        .select('*')
        .eq('technician_id', user.id);
    } else if (user.role.name === UserRole.PROPIETARIO) {
      // Los propietarios ven libros de sus edificios
      query = this.getSupabase()
        .from('digital_books')
        .select(`
          *,
          building:buildings!inner(owner_id)
        `)
        .eq('buildings.owner_id', user.id);
    } else {
      throw new Error('Rol no autorizado');
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener libros digitales: ${error.message}`);
    }

    return data.map(this.mapToDigitalBook);
  }

  async updateBook(id: string, data: UpdateDigitalBookRequest, userAuthId: string): Promise<DigitalBook> {
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

  async updateSection(
    bookId: string, 
    sectionType: SectionType, 
    data: UpdateSectionRequest, 
    userAuthId: string
  ): Promise<DigitalBook> {
    // Obtener el libro actual
    const book = await this.getBookById(bookId, userAuthId);
    if (!book) {
      throw new Error('Libro digital no encontrado');
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
    if (newProgress > 0 && newStatus === BookStatus.DRAFT) {
      newStatus = BookStatus.IN_PROGRESS;
    } else if (newProgress === 8) {
      newStatus = BookStatus.COMPLETE;
    }

    return this.updateBook(bookId, {
      sections: newSections,
      progress: newProgress,
      status: newStatus
    }, userAuthId);
  }

  async deleteBook(id: string, userAuthId: string): Promise<void> {
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

  private createDefaultSections(): BookSection[] {
    const types = Object.values(SectionType);
    return types.map(type => ({
      id: this.generateUUID(),
      type,
      complete: false,
      content: {}
    }));
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Métodos auxiliares para verificar permisos
  private async userCanCreateDigitalBook(userAuthId: string, buildingId: string): Promise<boolean> {
    const user = await this.userService.getUserByAuthId(userAuthId);
    if (!user) return false;

    if (user.role.name === UserRole.TECNICO) {
      // Los técnicos pueden crear libros solo para edificios asignados
      return await this.userService.technicianHasAccessToBuilding(userAuthId, buildingId);
    } else if (user.role.name === UserRole.PROPIETARIO) {
      // Los propietarios pueden crear libros para sus propios edificios
      return await this.userService.isOwnerOfBuilding(userAuthId, buildingId);
    }

    return false;
  }

  private async userCanAccessDigitalBook(userAuthId: string, bookId: string): Promise<boolean> {
    const user = await this.userService.getUserByAuthId(userAuthId);
    if (!user) return false;

    const { data: book } = await this.getSupabase()
      .from('digital_books')
      .select('building_id, technician_id')
      .eq('id', bookId)
      .single();

    if (!book) return false;

    if (user.role.name === UserRole.TECNICO) {
      // Los técnicos pueden acceder a libros que gestionan
      return book.technician_id === user.id;
    } else if (user.role.name === UserRole.PROPIETARIO) {
      // Los propietarios pueden acceder a libros de sus edificios
      return await this.userService.isOwnerOfBuilding(userAuthId, book.building_id);
    }

    return false;
  }

  private async userCanAccessBuildingBook(userAuthId: string, buildingId: string): Promise<boolean> {
    const user = await this.userService.getUserByAuthId(userAuthId);
    if (!user) return false;

    if (user.role.name === UserRole.TECNICO) {
      // Los técnicos pueden acceder a libros de edificios asignados
      return await this.userService.technicianHasAccessToBuilding(userAuthId, buildingId);
    } else if (user.role.name === UserRole.PROPIETARIO) {
      // Los propietarios pueden acceder a libros de sus edificios
      return await this.userService.isOwnerOfBuilding(userAuthId, buildingId);
    }

    return false;
  }

  private async userCanUpdateDigitalBook(userAuthId: string, bookId: string): Promise<boolean> {
    const user = await this.userService.getUserByAuthId(userAuthId);
    if (!user) return false;

    if (user.role.name === UserRole.TECNICO) {
      // Los técnicos pueden actualizar libros que gestionan
      const { data: book } = await this.getSupabase()
        .from('digital_books')
        .select('technician_id')
        .eq('id', bookId)
        .single();

      return book !== null && book.technician_id === user.id;
    }

    // Los propietarios no pueden actualizar libros digitales directamente
    return false;
  }

  private async userCanDeleteDigitalBook(userAuthId: string, bookId: string): Promise<boolean> {
    const user = await this.userService.getUserByAuthId(userAuthId);
    if (!user) return false;

    const { data: book } = await this.getSupabase()
      .from('digital_books')
      .select('building_id, technician_id')
      .eq('id', bookId)
      .single();

    if (!book) return false;

    if (user.role.name === UserRole.PROPIETARIO) {
      // Los propietarios pueden eliminar libros de sus edificios
      return await this.userService.isOwnerOfBuilding(userAuthId, book.building_id);
    } else if (user.role.name === UserRole.TECNICO) {
      // Los técnicos pueden eliminar libros que gestionan
      return book.technician_id === user.id;
    }

    return false;
  }

  private mapToDigitalBook(data: any): DigitalBook {
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

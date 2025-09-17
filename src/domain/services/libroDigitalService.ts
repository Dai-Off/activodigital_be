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

export class DigitalBookService {
  private getSupabase() {
    return getSupabaseClient();
  }

  async createDigitalBook(data: CreateDigitalBookRequest, userId: string): Promise<DigitalBook> {
    // Verificar que el edificio pertenece al usuario
    const { data: building, error: buildingError } = await this.getSupabase()
      .from('buildings')
      .select('id')
      .eq('id', data.buildingId)
      .eq('user_id', userId)
      .single();

    if (buildingError || !building) {
      throw new Error('Edificio no encontrado o no tienes permisos para acceder a él');
    }

    // Verificar que el edificio no tenga ya un libro digital
    const existingBook = await this.getBookByBuildingId(data.buildingId, userId);
    if (existingBook) {
      throw new Error('Este edificio ya tiene un libro digital asociado');
    }

    // Crear secciones por defecto si no se proporcionan
    const defaultSections = data.sections || this.createDefaultSections();

    const bookData = {
      building_id: data.buildingId,
      source: data.source,
      status: BookStatus.DRAFT,
      progress: 0,
      sections: defaultSections,
      user_id: userId
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

  async getBookById(id: string, userId?: string): Promise<DigitalBook | null> {
    let query = this.getSupabase()
      .from('digital_books')
      .select('*')
      .eq('id', id);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw new Error(`Error al obtener libro digital: ${error.message}`);
    }

    return this.mapToDigitalBook(data);
  }

  async getBookByBuildingId(buildingId: string, userId: string): Promise<DigitalBook | null> {
    const { data, error } = await this.getSupabase()
      .from('digital_books')
      .select('*')
      .eq('building_id', buildingId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw new Error(`Error al obtener libro digital: ${error.message}`);
    }

    return this.mapToDigitalBook(data);
  }

  async getBooksByUser(userId: string): Promise<DigitalBook[]> {
    const { data, error } = await this.getSupabase()
      .from('digital_books')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener libros digitales: ${error.message}`);
    }

    return data.map(this.mapToDigitalBook);
  }

  async updateBook(id: string, data: UpdateDigitalBookRequest, userId: string): Promise<DigitalBook> {
    const { data: book, error } = await this.getSupabase()
      .from('digital_books')
      .update(data)
      .eq('id', id)
      .eq('user_id', userId)
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
    userId: string
  ): Promise<DigitalBook> {
    // Obtener el libro actual
    const book = await this.getBookById(bookId, userId);
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
    }, userId);
  }

  async deleteBook(id: string, userId: string): Promise<void> {
    const { error } = await this.getSupabase()
      .from('digital_books')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

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

  private mapToDigitalBook(data: any): DigitalBook {
    return {
      id: data.id,
      buildingId: data.building_id,
      source: data.source,
      status: data.status,
      progress: data.progress,
      sections: data.sections || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}

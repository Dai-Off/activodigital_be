"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VencidosService = void 0;
const supabase_1 = require("../../lib/supabase");
class VencidosService {
    getSupabase() {
        return (0, supabase_1.getSupabaseClient)();
    }
    /**
     * Obtiene el resumen de KPIs de documentos vencidos
     */
    async getKPIsResumen() {
        const supabase = this.getSupabase();
        // Obtener todos los documentos vencidos
        const { data: documentos, error } = await supabase
            .from('data-room-docs')
            .select('contenido_extraido, tipo_documento');
        if (error) {
            console.error('Error obteniendo documentos vencidos:', error);
            throw new Error('Error al obtener documentos vencidos');
        }
        if (!documentos || documentos.length === 0) {
            return {
                total_vencidos: 0,
                alta_prioridad: 0,
                media_prioridad: 0,
                dias_promedio: 0,
                deuda_total: 0,
                sin_cobertura: 0
            };
        }
        const hoy = new Date();
        let totalDias = 0;
        let altaPrioridad = 0;
        let mediaPrioridad = 0;
        let deudaTotal = 0;
        let sinCobertura = 0;
        documentos.forEach((doc) => {
            const contenido = typeof doc.contenido_extraido === 'string'
                ? JSON.parse(doc.contenido_extraido)
                : doc.contenido_extraido;
            if (contenido.estado !== 'VENCIDO')
                return;
            // Calcular días vencido
            if (contenido.vigencia) {
                const fechaVencimiento = new Date(contenido.vigencia);
                const diasVencido = Math.floor((hoy.getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24));
                if (diasVencido > 0) {
                    totalDias += diasVencido;
                }
            }
            // Determinar prioridad
            const prioridad = this.calcularPrioridad(contenido);
            if (prioridad === 'alta')
                altaPrioridad++;
            else if (prioridad === 'media')
                mediaPrioridad++;
            // Sumar deuda
            if (contenido.importe && contenido.importe !== 'No especificado') {
                const importe = this.parsearImporte(contenido.importe);
                if (importe > 0) {
                    deudaTotal += importe;
                }
            }
            // Contar sin cobertura (documentos sin vigencia o sin información crítica)
            if (!contenido.vigencia || !contenido.consecuencia) {
                sinCobertura++;
            }
        });
        const totalVencidos = documentos.filter((doc) => {
            const contenido = typeof doc.contenido_extraido === 'string'
                ? JSON.parse(doc.contenido_extraido)
                : doc.contenido_extraido;
            return contenido.estado === 'VENCIDO';
        }).length;
        const diasPromedio = totalVencidos > 0 ? Math.round(totalDias / totalVencidos) : 0;
        return {
            total_vencidos: totalVencidos,
            alta_prioridad: altaPrioridad,
            media_prioridad: mediaPrioridad,
            dias_promedio: diasPromedio,
            deuda_total: Math.round(deudaTotal),
            sin_cobertura: sinCobertura
        };
    }
    /**
     * Obtiene los conteos por categoría
     */
    async getConteosPorCategoria() {
        const supabase = this.getSupabase();
        const { data: documentos, error } = await supabase
            .from('data-room-docs')
            .select('tipo_documento, contenido_extraido');
        if (error) {
            console.error('Error obteniendo documentos:', error);
            throw new Error('Error al obtener documentos');
        }
        if (!documentos || documentos.length === 0) {
            return [];
        }
        // Mapeo de tipos de documento a categorías
        const categoriaMap = {
            'Certificado': 'Certificados',
            'Certificados': 'Certificados',
            'Contrato': 'Contratos',
            'Contratos': 'Contratos',
            'Inspeccion': 'Inspecciones',
            'Inspecciones': 'Inspecciones',
            'Pago': 'Pagos',
            'Pagos': 'Pagos',
            'Cuota_Comunidad': 'Pagos',
            'Mantenimiento': 'Mantenimiento',
            'Documento': 'Documentos',
            'Documentos': 'Documentos'
        };
        const conteos = {};
        documentos.forEach((doc) => {
            const contenido = typeof doc.contenido_extraido === 'string'
                ? JSON.parse(doc.contenido_extraido)
                : doc.contenido_extraido;
            if (contenido.estado !== 'VENCIDO')
                return;
            // Determinar categoría
            let categoria = 'Documentos'; // default
            // Primero intentar por tipo_documento
            if (doc.tipo_documento) {
                for (const [key, value] of Object.entries(categoriaMap)) {
                    if (doc.tipo_documento.includes(key) || doc.tipo_documento === key) {
                        categoria = value;
                        break;
                    }
                }
            }
            // Si no se encontró, intentar por contenido.categoria
            if (categoria === 'Documentos' && contenido.categoria) {
                for (const [key, value] of Object.entries(categoriaMap)) {
                    if (contenido.categoria.includes(key) || contenido.categoria === key) {
                        categoria = value;
                        break;
                    }
                }
            }
            conteos[categoria] = (conteos[categoria] || 0) + 1;
        });
        // Convertir a array de CategoriaConteo
        const categorias = Object.entries(conteos).map(([nombre, cantidad]) => ({
            nombre,
            cantidad
        }));
        return categorias;
    }
    /**
     * Obtiene el listado paginado y filtrado de documentos vencidos
     */
    async getListadoVencidos(filtros) {
        const supabase = this.getSupabase();
        const page = filtros.page || 1;
        const limit = filtros.limit || 10;
        const offset = (page - 1) * limit;
        // Construir query base
        let query = supabase
            .from('data-room-docs')
            .select('*', { count: 'exact' });
        // Aplicar filtros
        if (filtros.building_id) {
            query = query.eq('building_id', filtros.building_id);
        }
        // Obtener todos los documentos primero para filtrar por contenido_extraido
        const { data: todosDocumentos, error, count } = await query;
        if (error) {
            console.error('Error obteniendo documentos:', error);
            throw new Error('Error al obtener documentos vencidos');
        }
        if (!todosDocumentos || todosDocumentos.length === 0) {
            return {
                items: [],
                total: 0,
                page,
                limit,
                total_pages: 0
            };
        }
        // Filtrar documentos vencidos y aplicar filtros adicionales
        let documentosVencidos = todosDocumentos
            .map((doc) => this.mapToDocumentoVencido(doc))
            .filter((doc) => {
            const contenido = doc.contenido_extraido;
            // Solo documentos vencidos
            if (contenido.estado !== 'VENCIDO')
                return false;
            // Filtro por prioridad
            if (filtros.prioridad && filtros.prioridad !== 'todas') {
                if (doc.prioridad_calculada !== filtros.prioridad)
                    return false;
            }
            // Filtro por categoría
            if (filtros.categoria) {
                const categoriaDoc = this.obtenerCategoria(doc);
                if (categoriaDoc !== filtros.categoria)
                    return false;
            }
            // Filtro por búsqueda
            if (filtros.search) {
                const searchLower = filtros.search.toLowerCase();
                const matchTitulo = doc.tipo_documento?.toLowerCase().includes(searchLower);
                const matchResumen = contenido.resumen?.toLowerCase().includes(searchLower);
                const matchBuilding = doc.building_name?.toLowerCase().includes(searchLower);
                if (!matchTitulo && !matchResumen && !matchBuilding)
                    return false;
            }
            return true;
        });
        // Ordenar
        if (filtros.sort) {
            switch (filtros.sort) {
                case 'mas_retrasado':
                    documentosVencidos.sort((a, b) => (b.dias_vencido || 0) - (a.dias_vencido || 0));
                    break;
                case 'menos_retrasado':
                    documentosVencidos.sort((a, b) => (a.dias_vencido || 0) - (b.dias_vencido || 0));
                    break;
                case 'mas_reciente':
                    documentosVencidos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    break;
                case 'menos_reciente':
                    documentosVencidos.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                    break;
                default:
                    // Por defecto: más retrasado
                    documentosVencidos.sort((a, b) => (b.dias_vencido || 0) - (a.dias_vencido || 0));
            }
        }
        else {
            // Por defecto: más retrasado
            documentosVencidos.sort((a, b) => (b.dias_vencido || 0) - (a.dias_vencido || 0));
        }
        // Paginar
        const total = documentosVencidos.length;
        const items = documentosVencidos.slice(offset, offset + limit);
        const total_pages = Math.ceil(total / limit);
        return {
            items,
            total,
            page,
            limit,
            total_pages
        };
    }
    /**
     * Obtiene el detalle de un documento vencido por ID
     */
    async getDetalleItem(id) {
        const supabase = this.getSupabase();
        const { data, error } = await supabase
            .from('data-room-docs')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            console.error('Error obteniendo documento:', error);
            throw new Error('Error al obtener documento');
        }
        if (!data) {
            return null;
        }
        const documento = this.mapToDocumentoVencido(data);
        // Verificar que esté vencido
        if (documento.contenido_extraido.estado !== 'VENCIDO') {
            return null;
        }
        return documento;
    }
    /**
     * Mapea un documento de la BD a DocumentoVencido
     */
    mapToDocumentoVencido(doc) {
        const contenido = typeof doc.contenido_extraido === 'string'
            ? JSON.parse(doc.contenido_extraido)
            : doc.contenido_extraido;
        const hoy = new Date();
        let diasVencido = 0;
        if (contenido.vigencia) {
            const fechaVencimiento = new Date(contenido.vigencia);
            diasVencido = Math.floor((hoy.getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24));
            if (diasVencido < 0)
                diasVencido = 0;
        }
        const prioridad = this.calcularPrioridad(contenido);
        return {
            idx: doc.idx || 0,
            id: doc.id,
            building_id: doc.building_id,
            tipo_documento: doc.tipo_documento,
            contenido_extraido: contenido,
            building_name: doc.building_name,
            direccion: doc.direccion,
            validado: doc.validado,
            confidence: doc.confidence,
            storage_path: doc.storage_path,
            created_at: doc.created_at,
            dias_vencido: diasVencido,
            prioridad_calculada: prioridad
        };
    }
    /**
     * Calcula la prioridad basándose en el contenido
     */
    calcularPrioridad(contenido) {
        // Si tiene prioridad explícita
        if (contenido.prioridad) {
            const prioridadLower = contenido.prioridad.toLowerCase();
            if (prioridadLower.includes('alta') || prioridadLower.includes('high'))
                return 'alta';
            if (prioridadLower.includes('media') || prioridadLower.includes('medium'))
                return 'media';
            if (prioridadLower.includes('baja') || prioridadLower.includes('low'))
                return 'baja';
        }
        // Calcular por días vencido
        if (contenido.vigencia) {
            const hoy = new Date();
            const fechaVencimiento = new Date(contenido.vigencia);
            const diasVencido = Math.floor((hoy.getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24));
            if (diasVencido > 180)
                return 'alta';
            if (diasVencido > 90)
                return 'media';
            return 'baja';
        }
        // Calcular por consecuencia
        if (contenido.consecuencia) {
            const consecuenciaLower = contenido.consecuencia.toLowerCase();
            if (consecuenciaLower.includes('sanci') ||
                consecuenciaLower.includes('cierre') ||
                consecuenciaLower.includes('judicial') ||
                consecuenciaLower.includes('multa')) {
                return 'alta';
            }
        }
        // Por defecto: media
        return 'media';
    }
    /**
     * Obtiene la categoría de un documento
     */
    obtenerCategoria(doc) {
        const categoriaMap = {
            'Certificado': 'Certificados',
            'Certificados': 'Certificados',
            'Contrato': 'Contratos',
            'Contratos': 'Contratos',
            'Inspeccion': 'Inspecciones',
            'Inspecciones': 'Inspecciones',
            'Pago': 'Pagos',
            'Pagos': 'Pagos',
            'Cuota_Comunidad': 'Pagos',
            'Mantenimiento': 'Mantenimiento',
            'Documento': 'Documentos',
            'Documentos': 'Documentos'
        };
        if (doc.tipo_documento) {
            for (const [key, value] of Object.entries(categoriaMap)) {
                if (doc.tipo_documento.includes(key) || doc.tipo_documento === key) {
                    return value;
                }
            }
        }
        if (doc.contenido_extraido.categoria) {
            for (const [key, value] of Object.entries(categoriaMap)) {
                if (doc.contenido_extraido.categoria?.includes(key) || doc.contenido_extraido.categoria === key) {
                    return value;
                }
            }
        }
        return 'Documentos';
    }
    /**
     * Parsea un importe de string a número
     */
    parsearImporte(importeStr) {
        // Remover símbolos de moneda y espacios
        const limpio = importeStr
            .replace(/[€$£]/g, '')
            .replace(/\./g, '')
            .replace(',', '.')
            .trim();
        const numero = parseFloat(limpio);
        return isNaN(numero) ? 0 : numero;
    }
}
exports.VencidosService = VencidosService;
//# sourceMappingURL=vencidosService.js.map
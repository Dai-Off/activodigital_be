"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DigitalBookController = void 0;
const libroDigitalService_1 = require("../../domain/services/libroDigitalService");
const libroDigital_1 = require("../../types/libroDigital");
class DigitalBookController {
    constructor() {
        this.createDigitalBook = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const data = req.body;
                // Validación básica
                if (!data.buildingId || !data.source) {
                    res.status(400).json({ error: 'Faltan campos requeridos' });
                    return;
                }
                const book = await this.getDigitalBookService().createDigitalBook(data, userId);
                res.status(201).json({ data: book });
            }
            catch (error) {
                console.error('Error al crear libro digital:', error);
                if (error instanceof Error && error.message.includes('no encontrado')) {
                    res.status(404).json({ error: error.message });
                }
                else {
                    res.status(500).json({ error: 'Error interno del servidor' });
                }
            }
        };
        this.getBooks = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const books = await this.getDigitalBookService().getBooksByUser(userId);
                res.json({ data: books });
            }
            catch (error) {
                console.error('Error al obtener libros digitales:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
        this.getBook = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const { id } = req.params;
                const book = await this.getDigitalBookService().getBookById(id, userId);
                if (!book) {
                    res.status(404).json({ error: 'Libro digital no encontrado' });
                    return;
                }
                res.json({ data: book });
            }
            catch (error) {
                console.error('Error al obtener libro digital:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
        this.getBookByBuilding = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const { buildingId } = req.params;
                const book = await this.getDigitalBookService().getBookByBuildingId(buildingId, userId);
                if (!book) {
                    res.status(404).json({ error: 'Libro digital no encontrado para este edificio' });
                    return;
                }
                res.json({ data: book });
            }
            catch (error) {
                console.error('Error al obtener libro digital por edificio:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
        this.updateBook = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const { id } = req.params;
                const data = req.body;
                const book = await this.getDigitalBookService().updateBook(id, data, userId);
                res.json({ data: book });
            }
            catch (error) {
                console.error('Error al actualizar libro digital:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
        this.updateSection = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const { id, sectionType } = req.params;
                const data = req.body;
                // Validar tipo de sección
                if (!Object.values(libroDigital_1.SectionType).includes(sectionType)) {
                    res.status(400).json({ error: 'Tipo de sección inválido' });
                    return;
                }
                if (!data.content) {
                    res.status(400).json({ error: 'Contenido es requerido' });
                    return;
                }
                const book = await this.getDigitalBookService().updateSection(id, sectionType, data, userId);
                res.json({ data: book });
            }
            catch (error) {
                console.error('Error al actualizar sección:', error);
                if (error instanceof Error && error.message.includes('no encontrado')) {
                    res.status(404).json({ error: error.message });
                }
                else {
                    res.status(500).json({ error: 'Error interno del servidor' });
                }
            }
        };
    }
    getDigitalBookService() {
        return new libroDigitalService_1.DigitalBookService();
    }
}
exports.DigitalBookController = DigitalBookController;
//# sourceMappingURL=libroDigitalController.js.map
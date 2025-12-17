"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialSnapshotController = void 0;
const financialSnapshotService_1 = require("../../domain/services/financialSnapshotService");
const calculateSummary = (snapshots) => {
    const total_activos = snapshots.length;
    let bankReady = 0;
    const countReadys = snapshots?.filter(dt => dt?.estado?.etiqueta === "Bank-Ready");
    bankReady = countReadys.length;
    const tirValues = [];
    const summary = snapshots.reduce((acc, snapshot) => {
        const currentCapexTotal = snapshot.capex?.total ?? 0;
        if (typeof currentCapexTotal === 'number') {
            acc.capex_total += currentCapexTotal;
        }
        const currentValorCreado = snapshot.green_premium?.valor ?? 0;
        if (typeof currentValorCreado === 'number') {
            acc.valor_creado += currentValorCreado;
        }
        const currentTirValor = snapshot.tir?.valor;
        if (typeof currentTirValor === 'number') {
            tirValues.push(currentTirValor);
        }
        return acc;
    }, {
        total_activos: total_activos,
        capex_total: 0,
        valor_creado: 0,
        tir_promedio: 0
    }); // Se usa un cast para inicializar con null
    if (tirValues.length > 0) {
        const sumTir = tirValues.reduce((sum, value) => sum + value, 0);
        let rawTirPromedio = (sumTir / tirValues.length);
        const formattedTirPromedio = parseFloat(rawTirPromedio.toFixed(2));
        summary.tir_promedio = formattedTirPromedio;
    }
    return { ...summary, total_activos, bankReady };
};
class FinancialSnapshotController {
    constructor() {
        this.createFinancialSnapshot = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const data = req.body;
                // Validación básica
                if (!data.building_id || !data.period_start || !data.period_end) {
                    res.status(400).json({ error: 'Faltan campos requeridos' });
                    return;
                }
                const snapshot = await this.getService().createFinancialSnapshot(data, userId);
                res.status(201).json({ data: snapshot });
            }
            catch (error) {
                console.error('Error al crear financial snapshot:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
        this.getFinancialSnapshots = async (req, res) => {
            try {
                const userId = req.user?.id;
                const { buildingId } = req.params;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                if (!buildingId) {
                    res.status(400).json({ error: 'buildingId es requerido' });
                    return;
                }
                const snapshots = await this.getService().getFinancialSnapshotsByBuilding(buildingId, userId);
                res.json({ data: snapshots });
            }
            catch (error) {
                console.error('Error al obtener financial snapshots:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
        this.getAllFinancialSnapshots = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const snapshots = await this.getService().getAllFinancialSnapshotsBuilding();
                res.json({ data: snapshots });
            }
            catch (error) {
                console.error('Error al obtener financial snapshots:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
        this.getAllFinancialSnapshotsSummary = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const snapshots = await this.getService().getAllFinancialSnapshotsBuilding();
                const summary = calculateSummary(snapshots);
                // 3. Devolver el resumen
                res.json({ data: summary });
            }
            catch (error) {
                console.error('Error al obtener financial snapshots summary:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
        this.getFinancialSnapshot = async (req, res) => {
            try {
                const userId = req.user?.id;
                const { id } = req.params;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const snapshot = await this.getService().getFinancialSnapshotById(id, userId);
                if (!snapshot) {
                    res.status(404).json({ error: 'Financial snapshot no encontrado' });
                    return;
                }
                res.json({ data: snapshot });
            }
            catch (error) {
                console.error('Error al obtener financial snapshot:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
        this.updateFinancialSnapshot = async (req, res) => {
            try {
                const userId = req.user?.id;
                const { id } = req.params;
                const data = req.body;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const snapshot = await this.getService().updateFinancialSnapshot(id, data, userId);
                if (!snapshot) {
                    res.status(404).json({ error: 'Financial snapshot no encontrado' });
                    return;
                }
                res.json({ data: snapshot });
            }
            catch (error) {
                console.error('Error al actualizar financial snapshot:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
        this.deleteFinancialSnapshot = async (req, res) => {
            try {
                const userId = req.user?.id;
                const { id } = req.params;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                await this.getService().deleteFinancialSnapshot(id, userId);
                res.status(204).send();
            }
            catch (error) {
                console.error('Error al eliminar financial snapshot:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
    }
    getService() {
        return new financialSnapshotService_1.FinancialSnapshotService();
    }
}
exports.FinancialSnapshotController = FinancialSnapshotController;
//# sourceMappingURL=financialSnapshotController.js.map
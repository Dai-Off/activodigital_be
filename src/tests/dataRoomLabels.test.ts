import { describe, it, expect } from 'vitest';
import { getDataRoomLabel } from '../utils/dataRoomLabels';

describe('getDataRoomLabel Utility', () => {
    it('should return the correct label for a valid checklist_id', () => {
        expect(getDataRoomLabel('escritura_de_constitucion_de_la_sociedad')).toBe('Escritura de constitución de la sociedad');
    });

    it('should return a fallback label for an unknown checklist_id', () => {
        expect(getDataRoomLabel('unknown_id')).toBe('Documento del Data Room');
    });

    it('should handle numeric suffixes correctly', () => {
        expect(getDataRoomLabel('escritura_de_constitucion_de_la_sociedad_1')).toBe('Escritura de constitución de la sociedad');
    });

    it('should return the correct label for a newly added ID', () => {
        expect(getDataRoomLabel('plan_de_verificacion_postdesembolso')).toBe('Plan de verificación post-desembolso');
    });
});

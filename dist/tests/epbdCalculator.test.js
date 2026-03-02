"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const epbdCalculator_1 = require("../utils/epbdCalculator");
(0, vitest_1.describe)('epbdCalculator', () => {
    (0, vitest_1.it)('should return "-" if currentConsumption is missing', () => {
        (0, vitest_1.expect)((0, epbdCalculator_1.calculatePotentialRating)(null, 45, 'commercial')).toBe('-');
        (0, vitest_1.expect)((0, epbdCalculator_1.calculatePotentialRating)(undefined, 45, 'commercial')).toBe('-');
    });
    (0, vitest_1.it)('should return "-" if savingsPct is missing', () => {
        (0, vitest_1.expect)((0, epbdCalculator_1.calculatePotentialRating)(135, null, 'commercial')).toBe('-');
        (0, vitest_1.expect)((0, epbdCalculator_1.calculatePotentialRating)(135, undefined, 'commercial')).toBe('-');
    });
    (0, vitest_1.it)('should return "-" if typology is missing', () => {
        (0, vitest_1.expect)((0, epbdCalculator_1.calculatePotentialRating)(135, 45, null)).toBe('-');
        (0, vitest_1.expect)((0, epbdCalculator_1.calculatePotentialRating)(135, 45, undefined)).toBe('-');
        (0, vitest_1.expect)((0, epbdCalculator_1.calculatePotentialRating)(135, 45, '')).toBe('-');
    });
    (0, vitest_1.it)('should calculate correct rating for generic commercial typology (zone C assumed when no province)', () => {
        // 135 * (1 - 0.45) = 74.25
        // Commercial in Zone C: < 75 is "B"
        (0, vitest_1.expect)((0, epbdCalculator_1.calculatePotentialRating)(135, 45, 'commercial')).toBe('B');
        // 200 * (1 - 0.10) = 180
        // Commercial in Zone C: < 195 is "F"
        (0, vitest_1.expect)((0, epbdCalculator_1.calculatePotentialRating)(200, 10, 'mixed')).toBe('F');
    });
    (0, vitest_1.it)('should calculate correct rating for generic residential typology (zone C assumed when no province)', () => {
        // 100 * (1 - 0.50) = 50
        // Residential in Zone C: < 65 is "B"
        (0, vitest_1.expect)((0, epbdCalculator_1.calculatePotentialRating)(100, 50, 'residential')).toBe('B');
        // 150 * (1 - 0.1) = 135
        // Residential in Zone C: < 170 is "E"
        (0, vitest_1.expect)((0, epbdCalculator_1.calculatePotentialRating)(150, 10, 'residential')).toBe('E');
    });
    (0, vitest_1.it)('should calculate different ratings based on climate zone (province)', () => {
        // Residential with 60 kWh/m2 result
        // Consumo base 100, savings 40% -> 60
        // Cádiz -> Zone A -> Residential A: <35, B:<50, C:<75. So 60 is C.
        (0, vitest_1.expect)((0, epbdCalculator_1.calculatePotentialRating)(100, 40, 'residential', undefined, 'Cádiz')).toBe('C');
        // Burgos -> Zone E -> Residential E: A:<65. So 60 is A.
        (0, vitest_1.expect)((0, epbdCalculator_1.calculatePotentialRating)(100, 40, 'residential', undefined, 'Burgos')).toBe('A');
    });
    (0, vitest_1.it)('should return "-" if it is already A', () => {
        (0, vitest_1.expect)((0, epbdCalculator_1.calculatePotentialRating)(100, 50, 'residential', 'A')).toBe('-');
    });
    (0, vitest_1.it)('should return "-" if savings are too low (< 5%)', () => {
        (0, vitest_1.expect)((0, epbdCalculator_1.calculatePotentialRating)(100, 4, 'residential', 'D')).toBe('-');
    });
});
//# sourceMappingURL=epbdCalculator.test.js.map
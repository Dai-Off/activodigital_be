import { describe, it, expect } from "vitest";
import { calculatePotentialRating } from "../utils/epbdCalculator";

describe('epbdCalculator', () => {
  it('should return "-" if currentConsumption is missing', () => {
    expect(calculatePotentialRating(null, 45, 'commercial')).toBe('-');
    expect(calculatePotentialRating(undefined, 45, 'commercial')).toBe('-');
  });

  it('should return "-" if savingsPct is missing', () => {
    expect(calculatePotentialRating(135, null, 'commercial')).toBe('-');
    expect(calculatePotentialRating(135, undefined, 'commercial')).toBe('-');
  });

  it('should return "-" if typology is missing', () => {
    expect(calculatePotentialRating(135, 45, null)).toBe('-');
    expect(calculatePotentialRating(135, 45, undefined)).toBe('-');
    expect(calculatePotentialRating(135, 45, '')).toBe('-');
  });

  it('should calculate correct rating for generic commercial typology (zone C assumed when no province)', () => {
    // 135 * (1 - 0.45) = 74.25
    // Commercial in Zone C: < 75 is "B"
    expect(calculatePotentialRating(135, 45, 'commercial')).toBe('B');
    
    // 200 * (1 - 0.10) = 180
    // Commercial in Zone C: < 195 is "F"
    expect(calculatePotentialRating(200, 10, 'mixed')).toBe('F');
  });

  it('should calculate correct rating for generic residential typology (zone C assumed when no province)', () => {
    // 100 * (1 - 0.50) = 50
    // Residential in Zone C: < 65 is "B"
    expect(calculatePotentialRating(100, 50, 'residential')).toBe('B');
    
    // 150 * (1 - 0.1) = 135
    // Residential in Zone C: < 170 is "E"
    expect(calculatePotentialRating(150, 10, 'residential')).toBe('E');
  });

  it('should calculate different ratings based on climate zone (province)', () => {
    // Residential with 60 kWh/m2 result
    // Consumo base 100, savings 40% -> 60
    
    // Cádiz -> Zone A -> Residential A: <35, B:<50, C:<75. So 60 is C.
    expect(calculatePotentialRating(100, 40, 'residential', undefined, 'Cádiz')).toBe('C');
    
    // Burgos -> Zone E -> Residential E: A:<65. So 60 is A.
    expect(calculatePotentialRating(100, 40, 'residential', undefined, 'Burgos')).toBe('A');
  });

  it('should return "-" if it is already A', () => {
    expect(calculatePotentialRating(100, 50, 'residential', 'A')).toBe('-');
  });

  it('should return "-" if savings are too low (< 5%)', () => {
    expect(calculatePotentialRating(100, 4, 'residential', 'D')).toBe('-');
  });
});

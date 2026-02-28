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

  it('should calculate correct rating for commercial typology', () => {
    // 135 * (1 - 0.45) = 74.25 => Commercial: < 100 is "C"
    expect(calculatePotentialRating(135, 45, 'commercial')).toBe('C');
    
    // 200 * (1 - 0.10) = 180 => Commercial: < 190 is "F"
    expect(calculatePotentialRating(200, 10, 'mixed')).toBe('F');
  });

  it('should calculate correct rating for residential typology', () => {
    // 100 * (1 - 0.50) = 50 => Residential: < 60 is "B"
    expect(calculatePotentialRating(100, 50, 'residential')).toBe('B');
    
    // 150 * (1 - 0.1) = 135 => Residential: < 160 is "E"
    expect(calculatePotentialRating(150, 10, 'residential')).toBe('E');
  });
});

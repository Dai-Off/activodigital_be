"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EsgService = void 0;
class EsgService {
    calculate(input) {
        const ceePoints = this.pointsForCee(input.ceeClass);
        const consumptionPoints = this.pointsForConsumption(input.energyConsumptionKwhPerM2Year);
        const emissionsPoints = this.pointsForEmissions(input.co2EmissionsKgPerM2Year);
        const renewablePoints = this.pointsForRenewables(input.renewableSharePercent);
        const waterPoints = this.pointsForWater(input.waterFootprintM3PerM2Year);
        const eSubtotalRaw = ceePoints + consumptionPoints + emissionsPoints + renewablePoints + waterPoints; // out of 70
        const eNormalized = Math.round((eSubtotalRaw / 70) * 50); // normalize to 0-50
        const accessibilityPoints = this.pointsForAccessibility(input.accessibility);
        const airQualityPoints = this.pointsForAirQuality(input.indoorAirQualityCo2Ppm);
        const safetyPoints = this.pointsForSafety(input.safetyCompliance);
        const sSubtotalRaw = accessibilityPoints + airQualityPoints + safetyPoints; // out of 30
        const sNormalized = sSubtotalRaw; // direct scale 0-30
        const digitalLogPoints = this.pointsForDigitalLog(input.digitalBuildingLog);
        const compliancePoints = this.pointsForRegulatoryCompliance(input.regulatoryCompliancePercent);
        const gSubtotalRaw = digitalLogPoints + compliancePoints; // out of 20
        const gNormalized = gSubtotalRaw; // direct scale 0-20
        const total = eNormalized + sNormalized + gNormalized;
        const label = this.labelForTotal(total);
        return {
            environmental: {
                ceePoints,
                consumptionPoints,
                emissionsPoints,
                renewablePoints,
                waterPoints,
                subtotalRaw: eSubtotalRaw,
                normalized: eNormalized,
            },
            social: {
                accessibilityPoints,
                airQualityPoints,
                safetyPoints,
                subtotalRaw: sSubtotalRaw,
                normalized: sNormalized,
            },
            governance: {
                digitalLogPoints,
                compliancePoints,
                subtotalRaw: gSubtotalRaw,
                normalized: gNormalized,
            },
            total,
            label,
        };
    }
    pointsForCee(cee) {
        switch (cee) {
            case 'A': return 50;
            case 'B': return 40;
            case 'C': return 30;
            case 'D': return 20;
            case 'E': return 10;
            default: return 0; // F-G
        }
    }
    pointsForConsumption(kwhPerM2Year) {
        if (kwhPerM2Year < 50)
            return 10;
        if (kwhPerM2Year <= 100)
            return 8;
        if (kwhPerM2Year <= 150)
            return 6;
        if (kwhPerM2Year <= 200)
            return 4;
        return 0;
    }
    pointsForEmissions(kgCo2PerM2Year) {
        if (kgCo2PerM2Year < 5)
            return 10;
        if (kgCo2PerM2Year <= 15)
            return 8;
        if (kgCo2PerM2Year <= 30)
            return 6;
        if (kgCo2PerM2Year <= 50)
            return 4;
        return 0;
    }
    pointsForRenewables(percent) {
        if (percent > 70)
            return 10;
        if (percent >= 40)
            return 7;
        if (percent >= 20)
            return 5;
        return 0;
    }
    pointsForWater(m3PerM2Year) {
        if (m3PerM2Year < 0.5)
            return 10;
        if (m3PerM2Year <= 1.0)
            return 7;
        if (m3PerM2Year <= 2.0)
            return 5;
        return 0;
    }
    pointsForAccessibility(level) {
        if (level === 'full')
            return 10;
        if (level === 'partial')
            return 5;
        return 0;
    }
    pointsForAirQuality(ppm) {
        if (ppm < 600)
            return 10;
        if (ppm <= 1000)
            return 7;
        if (ppm <= 1500)
            return 5;
        return 0;
    }
    pointsForSafety(level) {
        if (level === 'full')
            return 10;
        if (level === 'pending')
            return 5;
        return 0;
    }
    pointsForDigitalLog(level) {
        if (level === 'full')
            return 10;
        if (level === 'partial')
            return 5;
        return 0;
    }
    pointsForRegulatoryCompliance(percent) {
        if (percent >= 90)
            return 10;
        if (percent >= 70)
            return 7;
        if (percent >= 50)
            return 5;
        return 0;
    }
    labelForTotal(total) {
        if (total >= 90)
            return 'Premium';
        if (total >= 80)
            return 'Gold';
        if (total >= 60)
            return 'Silver';
        if (total >= 40)
            return 'Bronze';
        return 'Crítico';
    }
}
exports.EsgService = EsgService;
//# sourceMappingURL=esgService.js.map
import { BaseAPI } from '../core';

export class EnvironmentService extends BaseAPI {
    getFloodRiskLegacy(simplify = 0.0001) {
        return this.get(`/api/environment/flood-risk?simplify=${simplify}`);
    }

    getFloodRisk(lat: number, lng: number, scenario = 'current') {
        return this.get(`/api/environmental/flood/risk?lat=${lat}&lng=${lng}&scenario=${scenario}`);
    }

    getAirQuality(lat?: number, lng?: number) {
        let url = '/api/environmental/air-quality';
        if (lat !== undefined && lng !== undefined) {
            url += `?lat=${lat}&lng=${lng}`;
        }
        return this.get(url);
    }

    getGreenSpaceAccessibility(lat: number, lng: number) {
        return this.get(`/api/environmental/green-space/accessibility?lat=${lat}&lng=${lng}`);
    }

    getClimateResilience(areaId: string) {
        return this.get(`/api/environmental/climate/resilience?area_id=${areaId}`);
    }
}

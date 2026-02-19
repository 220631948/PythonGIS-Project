import { BaseAPI } from '../core';

export class AnalysisService extends BaseAPI {
    calculateViewshed(lat: number, lng: number, observerHeight = 1.7, maxDistance = 5000, resolution = 36) {
        return this.post('/api/analysis/viewshed', {
            lat, lng, observer_height: observerHeight, max_distance: maxDistance, resolution
        });
    }

    checkVisibility(fromLat: number, fromLng: number, toLat: number, toLng: number, fromHeight = 1.7, toHeight = 0) {
        return this.get(
            `/api/analysis/visibility-check?from_lat=${fromLat}&from_lng=${fromLng}&to_lat=${toLat}&to_lng=${toHeight}`
        );
    }

    validateTopology(dataset: string, checkSelfIntersections = true, checkOverlaps = true) {
        return this.get(
            `/api/analysis/topology/validate/${dataset}?check_self_intersections=${checkSelfIntersections}&check_overlaps=${checkOverlaps}`
        );
    }

    calculateRouteAdvanced(fromLat: number, fromLng: number, toLat: number, toLng: number, mode = 'driving') {
        return this.get(
            `/api/analysis/route?from_lat=${fromLat}&from_lng=${fromLng}&to_lat=${toLat}&to_lng=${toLng}&mode=${mode}`
        );
    }

    calculateIsochroneAdvanced(lat: number, lng: number, timeMinutes = 15, mode = 'driving') {
        return this.get(
            `/api/analysis/isochrone?lat=${lat}&lng=${lng}&time_minutes=${timeMinutes}&mode=${mode}`
        );
    }

    findNearestFacility(lat: number, lng: number, facilityType: string, limit = 5) {
        return this.get(
            `/api/analysis/nearest-facility?lat=${lat}&lng=${lng}&facility_type=${facilityType}&limit=${limit}`
        );
    }
}

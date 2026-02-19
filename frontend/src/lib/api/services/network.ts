import { BaseAPI } from '../core';

export class NetworkService extends BaseAPI {
    calculateRoute(originLat: number, originLon: number, destLat: number, destLon: number, mode = 'driving') {
        return this.get(
            `/api/network/route?origin_lat=${originLat}&origin_lon=${originLon}&dest_lat=${destLat}&dest_lon=${destLon}&mode=${mode}`
        );
    }

    calculateIsochrone(lat: number, lon: number, timeMinutes = 15, mode = 'walking', intervals = 3) {
        return this.get(
            `/api/network/isochrone?lat=${lat}&lon=${lon}&time_minutes=${timeMinutes}&mode=${mode}&intervals=${intervals}`
        );
    }

    calculateServiceArea(facilityType: string, timeMinutes = 15, mode = 'walking') {
        return this.get(
            `/api/network/service-area?facility_type=${facilityType}&time_minutes=${timeMinutes}&mode=${mode}`
        );
    }

    findNearest(lat: number, lon: number, facilityType: string, count = 5) {
        return this.get(
            `/api/network/nearest?lat=${lat}&lon=${lon}&facility_type=${facilityType}&count=${count}`
        );
    }

    getTransitConnectivity(lat: number, lon: number, radiusMeters = 1000) {
        return this.get(
            `/api/network/connectivity?lat=${lat}&lon=${lon}&radius_meters=${radiusMeters}`
        );
    }
}

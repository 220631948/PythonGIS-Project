import { BaseAPI } from '../core';

export class GeocodingService extends BaseAPI {
    searchPlaces(query: string, limit = 10) {
        return this.get(`/api/geocode/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    }

    getAutocomplete(query: string, limit = 8) {
        return this.get(`/api/geocode/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`);
    }

    reverseGeocode(lat: number, lon: number) {
        return this.get(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
    }
}

import { BaseAPI } from '../core';

export class TransportService extends BaseAPI {
    getAccessibility(lat: number, lon: number, simplify = 0.0001) {
        return this.get(`/api/transport/accessibility?lat=${lat}&lon=${lon}&simplify=${simplify}`);
    }
}

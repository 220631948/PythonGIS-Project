import { BaseAPI } from '../core';

export class SpatialService extends BaseAPI {
    pointInPolygon(polygon: unknown, layers: string[]) {
        return this.post('/api/spatial/point-in-polygon', { polygon, layers });
    }

    getBuffer(lat: number, lon: number, distance = 500) {
        return this.get(`/api/spatial/buffer?lat=${lat}&lon=${lon}&distance=${distance}`);
    }

    getNearbyFeatures(layer: string, lat: number, lon: number, radius = 1000) {
        return this.get(`/api/spatial/nearby?layer=${layer}&lat=${lat}&lon=${lon}&radius=${radius}`);
    }
}

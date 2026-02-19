import { BaseAPI } from '../core';
import { API_BASE_URL } from '../config';

export class Visualization3DService extends BaseAPI {
    extrudeBuildings(request: unknown) {
        return this.post('/api/3d/buildings/extrude', request);
    }

    getElevationProfile(request: unknown) {
        return this.post('/api/3d/elevation/profile', request);
    }

    analyzeShadows(request: unknown) {
        return this.post('/api/3d/shadow/analysis', request);
    }

    calculateViewshed(request: unknown) {
        return this.post('/api/3d/viewshed', request);
    }

    getTerrainTile(z: number, x: number, y: number) {
        return fetch(`${API_BASE_URL}/api/3d/terrain/tiles/${z}/${x}/${y}`);
    }
}

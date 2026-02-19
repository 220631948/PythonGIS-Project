import { BaseAPI } from '../core';

export class InfrastructureService extends BaseAPI {
    getLayer(layerId: string, simplify = 0.0001) {
        return this.get(`/api/infrastructure/${layerId}?simplify=${simplify}`);
    }
}

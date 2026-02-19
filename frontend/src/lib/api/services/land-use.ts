import { BaseAPI } from '../core';

export class LandUseService extends BaseAPI {
    getZoning(simplify = 0.001) {
        return this.get(`/api/land-use/zoning?simplify=${simplify}`);
    }
}

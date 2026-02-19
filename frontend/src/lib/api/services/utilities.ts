import { BaseAPI } from '../core';

export class UtilitiesService extends BaseAPI {
    getWaste(simplify = 0.001) {
        return this.get(`/api/utilities/waste?simplify=${simplify}`);
    }
}

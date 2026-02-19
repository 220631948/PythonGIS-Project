import { BaseAPI } from '../core';

export class SafetyService extends BaseAPI {
    getPrecincts(simplify = 0.001) {
        return this.get(`/api/safety/precincts?simplify=${simplify}`);
    }
}

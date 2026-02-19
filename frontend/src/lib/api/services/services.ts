import { BaseAPI } from '../core';

export class ServicesService extends BaseAPI {
    getAccess(simplify = 0.0001) {
        return this.get(`/api/services/access?simplify=${simplify}`);
    }
}

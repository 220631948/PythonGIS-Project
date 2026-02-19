// Export types first
export * from './types';
export * from './config';
export * from './core';
export { APIClient } from './client';

import { APIClient } from './client';
import { fetchData, fetchDataset, addRequestInterceptor, addResponseInterceptor, createCancellableRequest } from './core';
import { API_ENDPOINTS } from './config';

export const apiClient = new APIClient();

export default {
    fetchData,
    fetchDataset,
    apiClient,
    API_ENDPOINTS,
    addRequestInterceptor,
    addResponseInterceptor,
    createCancellableRequest,
};

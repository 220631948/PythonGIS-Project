import { BaseAPI } from '../core';

export class FilterService extends BaseAPI {
    getSchema(dataset: string) {
        return this.get(`/api/filter/schema/${dataset}`);
    }

    filterDataset(dataset: string, conditions: unknown, logic = 'and', simplify = 0.0001) {
        return this.post('/api/filter/query', { dataset, conditions, logic, simplify });
    }

    getFacets(dataset: string, facetFields: string[], filters: unknown = null) {
        return this.post('/api/filter/facets', { dataset, facet_fields: facetFields, filters });
    }

    textSearch(dataset: string, query: string, fields: string | null = null, limit = 100) {
        let url = `/api/filter/search/${dataset}?q=${encodeURIComponent(query)}&limit=${limit}`;
        if (fields) url += `&fields=${fields}`;
        return this.get(url);
    }
}

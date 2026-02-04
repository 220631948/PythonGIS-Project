
export interface Repository<T, ID = string> {
    findById(id: ID): Promise<T | null>;
    findAll(): Promise<T[]>;
    save(item: T): Promise<void>;
    delete(id: ID): Promise<void>;
    clear(): Promise<void>;
}

export interface CachedItem<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

export interface GeoFeature {
    type: 'Feature';
    properties: Record<string, any>;
    geometry: {
        type: string;
        coordinates: any[];
    };
}

export interface GeoJSON {
    type: 'FeatureCollection';
    features: GeoFeature[];
    crs?: {
        type: string;
        properties: {
            name: string;
        };
    };
}

export type GeoData = GeoJSON;

// spatialAnalysis.worker.ts
import * as turf from '@turf/turf';
import { FeatureCollection, Point, Polygon } from 'geojson';

// Types for messages (should be shared but for now inline is fine for worker)
interface WorkerMessage {
    id: string;
    polygon: Polygon;
    layers: { [layerName: string]: FeatureCollection<Point> };
}

interface WorkerResponse {
    id: string;
    counts: { [layerName: string]: number };
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const { id, polygon, layers } = e.data;
    const counts: { [key: string]: number } = {};

    try {
        const polygonFeature = turf.polygon(polygon.coordinates);

        Object.entries(layers).forEach(([name, featureCollection]) => {
            if (featureCollection && featureCollection.features) {
                const within = turf.pointsWithinPolygon(featureCollection, polygonFeature);
                counts[name] = within.features.length;
            }
        });

        const response: WorkerResponse = { id, counts };
        self.postMessage(response);
    } catch (error) {
        console.error("Worker error:", error);
        self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
    }
};

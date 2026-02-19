import { renderHook, act } from '@testing-library/react';
import { useSpatialAnalysis } from '../modules/Tools/hooks/useSpatialAnalysis';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as turf from '@turf/turf';

describe('useSpatialAnalysis', () => {
    let originalWorker: any;
    let mockWorker: any;

    beforeEach(() => {
        originalWorker = global.Worker;

        mockWorker = {
            postMessage: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            terminate: vi.fn(),
        };

        global.Worker = vi.fn(() => mockWorker) as any;
    });

    afterEach(() => {
        global.Worker = originalWorker;
        vi.clearAllMocks();
    });

    it('should initialize worker on mount', () => {
        renderHook(() => useSpatialAnalysis());
        expect(global.Worker).toHaveBeenCalledTimes(1);
    });

    it('should calculate features in polygon using worker', async () => {
        const { result } = renderHook(() => useSpatialAnalysis());

        const polygon = turf.polygon([
            [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]
        ]).geometry;

        const layers = {
            points: turf.featureCollection([
                turf.point([5, 5])
            ])
        };

        // Start analysis
        const analysisPromise = result.current.analyzeGeometry(polygon, 'polygon', layers as any);

        // Expect postMessage to be called
        expect(mockWorker.postMessage).toHaveBeenCalled();
        const callArgs = mockWorker.postMessage.mock.calls[0][0];
        expect(callArgs).toHaveProperty('id');
        expect(callArgs.polygon.coordinates).toEqual(polygon.coordinates);
        expect(callArgs.layers).toEqual(layers);

        // Find the event listener for 'message'
        const addListenerCalls = mockWorker.addEventListener.mock.calls;
        const messageHandlerCall = addListenerCalls.find((call: any[]) => call[0] === 'message');
        expect(messageHandlerCall).toBeDefined();
        const messageHandler = messageHandlerCall[1];

        // Simulate worker response
        act(() => {
            messageHandler({
                data: {
                    id: callArgs.id,
                    counts: { points: 1 }
                }
            });
        });

        // Await result
        const analysisResult = await analysisPromise;
        expect(analysisResult.featureCounts).toEqual({ points: 1 });

        // Verify listener cleanup (optional but good)
        // Note: Our implementation calls removeEventListener inside the handler
        expect(mockWorker.removeEventListener).toHaveBeenCalledWith('message', messageHandler);
    });
});

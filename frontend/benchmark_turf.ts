import * as turf from '@turf/turf';

function runBenchmark() {
    const pointsCount = 100000;

    console.log(`Generating ${pointsCount} points...`);
    // turf.randomPoint might return points anywhere, let's constrain to a bbox slightly larger than our polygon
    const points = turf.randomPoint(pointsCount, { bbox: [-20, -20, 20, 20] });

    // Create a polygon
    const polygon = turf.polygon([[
        [-10, -10],
        [10, -10],
        [10, 10],
        [-10, 10],
        [-10, -10]
    ]]);

    console.log('Starting calculation...');
    const start = performance.now();
    const within = turf.pointsWithinPolygon(points, polygon);
    const end = performance.now();

    console.log(`Found ${within.features.length} points within polygon.`);
    console.log(`Time taken: ${(end - start).toFixed(2)} ms`);
}

runBenchmark();

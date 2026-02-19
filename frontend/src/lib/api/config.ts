export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const API_ENDPOINTS = {
    services: {
        settlements: 'informal_settlements',
        water: 'water_facilities',
        clinics: 'clinics',
        schools: 'schools',
        parks: 'parks',
        sports: 'sports_grounds',
        pools: 'swimming_pools',
    },
    transport: {
        myciti_stops: 'myciti_stops',
        myciti_routes: 'myciti_routes',
        rail_stations: 'rail_stations',
    },
    environment: {
        flood_zones: 'flood_zones',
        open_spaces: 'open_spaces',
    },
    landuse: {
        zoning: 'zoning',
        suburbs: 'suburbs',
    },
    utilities: {
        electricity: 'electricity_facilities',
        waste: 'waste_collection',
        recycling: 'recycling_facilities',
    },
    safety: {}
} as const;

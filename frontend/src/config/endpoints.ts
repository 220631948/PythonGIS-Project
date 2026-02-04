/**
 * CCT Open Data API Endpoints
 * Base URL: https://citymaps.capetown.gov.za/agsext1/rest/services
 */

export const CCT_API_BASE = 'https://citymaps.capetown.gov.za/agsext1/rest/services';

export const DATASETS = {
    // Services
    libraries: `${CCT_API_BASE}/Theme_CommunityFacilities/MapServer/5/query?outFields=*&where=1%3D1&f=geojson`,
    clinics: `${CCT_API_BASE}/Theme_CommunityFacilities/MapServer/3/query?outFields=*&where=1%3D1&f=geojson`,
    allsport: `${CCT_API_BASE}/Theme_CommunityFacilities/MapServer/1/query?outFields=*&where=1%3D1&f=geojson`,

    // Transport
    bus_stops: `${CCT_API_BASE}/Theme_Transport/MapServer/1/query?outFields=*&where=1%3D1&f=geojson`,
    train_stations: `${CCT_API_BASE}/Theme_Transport/MapServer/3/query?outFields=*&where=1%3D1&f=geojson`,

    // Environment
    parks: `${CCT_API_BASE}/Theme_OpenSpace/MapServer/0/query?outFields=*&where=1%3D1&f=geojson`,
    flood_zones_100y: `${CCT_API_BASE}/Theme_Water/MapServer/10/query?outFields=*&where=1%3D1&f=geojson`,

    // Land Use
    zoning: `${CCT_API_BASE}/Theme_Planning/MapServer/15/query?outFields=*&where=1%3D1&f=geojson`, // Simplified

    // Utilities
    water_treatment: `${CCT_API_BASE}/Theme_Water/MapServer/4/query?outFields=*&where=1%3D1&f=geojson`,
};

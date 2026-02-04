/**
 * Module Configuration for Cape Town GeoHub
 * Defines the 7-module architecture per Vibecoding spec
 */

import {
    Building2,
    Bus,
    Shield,
    TreePine,
    Map,
    Trash2,
    Database,
    LucideIcon
} from 'lucide-react';

export interface ModuleConfig {
    id: string;
    name: string;
    icon: LucideIcon;
    color: string;
    description: string;
    dataLayers: string[];
}

/**
 * 7-Module Architecture
 * Services | Transport | Safety | Environment | Land Use | Utilities | Open Data
 */
export const MODULES: ModuleConfig[] = [
    {
        id: 'services',
        name: 'Services',
        icon: Building2,
        color: '#3b82f6', // Blue
        description: 'Analyze access to water, sanitation, health & education services',
        dataLayers: ['water_facilities', 'clinics', 'schools', 'suburbs']
    },
    {
        id: 'transport',
        name: 'Transport',
        icon: Bus,
        color: '#10b981', // Emerald
        description: 'MyCiTi & rail accessibility with walking buffer analysis',
        dataLayers: ['myciti_stops', 'myciti_routes', 'rail_stations']
    },
    {
        id: 'safety',
        name: 'Safety',
        icon: Shield,
        color: '#ef4444', // Red
        description: 'Precinct-level crime patterns (ethical, aggregated data only)',
        dataLayers: []
    },
    {
        id: 'environment',
        name: 'Environment',
        icon: TreePine,
        color: '#22c55e', // Green
        description: 'Flood zones, rivers, wetlands & green space access',
        dataLayers: ['flood_zones', 'parks', 'open_spaces']
    },
    {
        id: 'landuse',
        name: 'Land Use',
        icon: Map,
        color: '#8b5cf6', // Purple
        description: 'Zoning vs actual land use comparison',
        dataLayers: ['zoning', 'building_footprints']
    },
    {
        id: 'utilities',
        name: 'Utilities',
        icon: Trash2,
        color: '#f59e0b', // Amber
        description: 'Waste collection schedules & recycling facilities',
        dataLayers: ['waste_collection', 'recycling_facilities']
    },
    {
        id: 'opendata',
        name: 'Open Data',
        icon: Database,
        color: '#6366f1', // Indigo
        description: 'Browse & download Cape Town open data catalogue',
        dataLayers: []
    }
];

export const getModuleById = (id: string): ModuleConfig | undefined => {
    return MODULES.find(m => m.id === id);
};

export const getModuleColor = (id: string): string => {
    return getModuleById(id)?.color ?? '#6b7280';
};

export default MODULES;

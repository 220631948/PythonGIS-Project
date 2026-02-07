/**
 * Popup content formatters for GeoJSON layers
 * Generates HTML popup content based on layer type and feature properties
 */

interface DatasetInfo {
  name?: string;
}

/** Safely extract latitude from a GeoJSON Point feature's coordinates */
const getPointLat = (feature: GeoJSON.Feature): number => {
  const geom = feature.geometry;
  if (geom.type === 'Point') return geom.coordinates[1] ?? 0;
  return 0;
};

/** Safely extract longitude from a GeoJSON Point feature's coordinates */
const getPointLng = (feature: GeoJSON.Feature): number => {
  const geom = feature.geometry;
  if (geom.type === 'Point') return geom.coordinates[0] ?? 0;
  return 0;
};

/**
 * Format popup HTML for a GeoJSON feature based on its layer context.
 */
export const formatPopupContent = (
  feature: GeoJSON.Feature,
  layerId: string,
  datasetInfo: DatasetInfo | null,
): string => {
  const props = feature.properties ?? {};

  const formatters: Record<string, () => string> = {
    'services-layer': () => `
      <div class="popup-content services">
        <h4>${props.name ?? 'Settlement Area'}</h4>
        <div class="popup-stat">
          <span class="stat-label">Access Score</span>
          <span class="stat-value ${props.access_score > 70 ? 'good' : props.access_score > 40 ? 'medium' : 'poor'}">${props.access_score ?? 'N/A'}%</span>
        </div>
        ${props.water_access ? `<div class="popup-detail"><span>💧 Water:</span> ${String(props.water_access)}</div>` : ''}
        ${props.electricity_access ? `<div class="popup-detail"><span>⚡ Electricity:</span> ${String(props.electricity_access)}</div>` : ''}
        <div class="popup-actions">
          <button onclick="window.dispatchEvent(new CustomEvent('suitabilityAnalysis', {detail: {lat: ${getPointLat(feature)}, lng: ${getPointLng(feature)}}}))">
            Analyze Site
          </button>
        </div>
      </div>
    `,
    'safety-layer': () => `
      <div class="popup-content safety">
        <h4>${props.precinct ?? props.name ?? 'Precinct Area'}</h4>
        <div class="popup-stat">
          <span class="stat-label">Risk Level</span>
          <span class="stat-value ${String(props.risk_level ?? 'unknown').toLowerCase()}">${String(props.risk_level ?? 'Unknown')}</span>
        </div>
        ${props.crime_index ? `<div class="popup-detail"><span>Crime Index:</span> ${String(props.crime_index)}</div>` : ''}
        <p class="popup-note">⚠️ Data aggregated at precinct level for privacy</p>
      </div>
    `,
    'flood-layer': () => `
      <div class="popup-content flood">
        <h4>${props.suburb ?? props.name ?? 'Suburb'}</h4>
        <div class="popup-stat">
          <span class="stat-label">Flood Risk</span>
          <span class="stat-value">${props.risk_percentage ?? 0}%</span>
        </div>
        ${props.flood_zone ? `<div class="popup-detail"><span>Zone:</span> ${String(props.flood_zone)}</div>` : ''}
      </div>
    `,
    'zoning-layer': () => `
      <div class="popup-content zoning">
        <h4>${props.zone_name ?? props.name ?? 'Zone'}</h4>
        ${props.zone_type ? `<div class="popup-detail"><span>Type:</span> ${String(props.zone_type)}</div>` : ''}
        ${props.land_use ? `<div class="popup-detail"><span>Land Use:</span> ${String(props.land_use)}</div>` : ''}
      </div>
    `,
  };

  const defaultFormatter = () => `
    <div class="popup-content default">
      <h4>${String(props.name ?? datasetInfo?.name ?? 'Feature')}</h4>
      ${Object.entries(props)
        .slice(0, 5)
        .map(([key, value]) => `<div class="popup-detail"><span>${key}:</span> ${String(value)}</div>`)
        .join('')}
      ${Object.keys(props).length > 5 ? '<div class="popup-note">...and more properties</div>' : ''}
    </div>
  `;

  const formatter = formatters[layerId] ?? defaultFormatter;
  return formatter();
};

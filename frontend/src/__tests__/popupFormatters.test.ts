/**
 * Unit tests for map/popupFormatters.ts – popup HTML generation
 */
import { describe, it, expect } from 'vitest';
import { formatPopupContent } from '../components/map/popupFormatters';

const mkFeature = (
  props: Record<string, unknown>,
  geomType: GeoJSON.GeoJsonGeometryTypes = 'Point',
  coordinates: unknown = [18.4241, -33.9249],
): GeoJSON.Feature => ({
  type: 'Feature',
  geometry: { type: geomType, coordinates } as GeoJSON.Geometry,
  properties: props,
});

describe('formatPopupContent', () => {
  it('services-layer shows name and access_score', () => {
    const html = formatPopupContent(
      mkFeature({ name: 'Imizamo Yethu', access_score: 85, water_access: 'Communal tap' }),
      'services-layer',
      null,
    );
    expect(html).toContain('Imizamo Yethu');
    expect(html).toContain('85');
    expect(html).toContain('💧 Water:');
    expect(html).toContain('Communal tap');
  });

  it('services-layer highlights poor access_score', () => {
    const html = formatPopupContent(
      mkFeature({ access_score: 20 }),
      'services-layer',
      null,
    );
    expect(html).toContain('poor');
  });

  it('safety-layer includes risk_level', () => {
    const html = formatPopupContent(
      mkFeature({ precinct: 'Camps Bay', risk_level: 'High', crime_index: '7.2' }),
      'safety-layer',
      null,
    );
    expect(html).toContain('Camps Bay');
    expect(html).toContain('High');
    expect(html).toContain('Crime Index:');
  });

  it('flood-layer shows risk_percentage', () => {
    const html = formatPopupContent(
      mkFeature({ suburb: 'Fish Hoek', risk_percentage: 45, flood_zone: 'A' }),
      'flood-layer',
      null,
    );
    expect(html).toContain('Fish Hoek');
    expect(html).toContain('45');
    expect(html).toContain('Zone:');
  });

  it('zoning-layer shows zone_name and type', () => {
    const html = formatPopupContent(
      mkFeature({ zone_name: 'General Residential', zone_type: 'GR1' }),
      'zoning-layer',
      null,
    );
    expect(html).toContain('General Residential');
    expect(html).toContain('GR1');
  });

  it('unknown layer uses default formatter with truncated props', () => {
    const props: Record<string, string> = {};
    for (let i = 0; i < 8; i++) props[`key${i}`] = `val${i}`;
    const html = formatPopupContent(
      mkFeature(props),
      'custom-layer',
      { name: 'Custom Data' },
    );
    expect(html).toContain('Custom Data');
    expect(html).toContain('...and more properties');
  });

  it('uses dataset name when feature has no name', () => {
    const html = formatPopupContent(
      mkFeature({}),
      'any-layer',
      { name: 'My Dataset' },
    );
    expect(html).toContain('My Dataset');
  });
});

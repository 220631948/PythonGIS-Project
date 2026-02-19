import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ClusterLayer from '../components/map/ClusterLayer';
import type { ClusterData } from '../hooks/usePostGISClusters';

// Hoist the spy so it can be used inside vi.mock
const { renderSpy, setStyleSpy } = vi.hoisted(() => {
  return {
    renderSpy: vi.fn(),
    setStyleSpy: vi.fn()
  };
});

// Mock react-leaflet
vi.mock('react-leaflet', async () => {
  return {
    useMap: () => ({
      setView: vi.fn(),
      getZoom: () => 10,
    }),
    CircleMarker: (props: any) => {
      renderSpy(props);

      // Mock the event handlers to support our imperative test
      const handleMouseOver = (e: any) => {
        // Mock the Leaflet layer object on the event target
        const layer = {
          setStyle: setStyleSpy,
          options: props.pathOptions || {}
        };
        // We need to ensure e.target is our layer
        Object.defineProperty(e, 'target', { value: layer, writable: true });

        if (props.eventHandlers?.mouseover) {
          props.eventHandlers.mouseover(e);
        }
      };

      const handleMouseOut = (e: any) => {
        const layer = {
          setStyle: setStyleSpy,
          options: props.pathOptions || {}
        };
        Object.defineProperty(e, 'target', { value: layer, writable: true });

        if (props.eventHandlers?.mouseout) {
          props.eventHandlers.mouseout(e);
        }
      };

      return (
        <div
          data-testid="circle-marker"
          onClick={props.eventHandlers?.click}
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
          data-opacity={props.pathOptions?.fillOpacity}
        >
          {props.children}
        </div>
      );
    },
    Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
    Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
  };
});

describe('ClusterLayer Performance', () => {
  const mockClusterData: ClusterData = {
    type: 'FeatureCollection',
    metadata: { cluster_count: 2, zoom: 10, total_points: 15 },
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: { cluster_id: 1, point_count: 10, is_cluster: true }
      },
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [10, 10] },
        properties: { cluster_id: 2, point_count: 5, is_cluster: true }
      }
    ]
  };

  beforeEach(() => {
    renderSpy.mockClear();
    setStyleSpy.mockClear();
  });

  it('renders markers without re-rendering the whole list on interaction (optimized behavior)', () => {
    // Render the component
    render(<ClusterLayer clusterData={mockClusterData} />);

    // Initial render: 2 markers -> renderSpy called 2 times
    expect(renderSpy).toHaveBeenCalledTimes(2);
    renderSpy.mockClear();

    // Find markers
    const markers = screen.getAllByTestId('circle-marker');
    expect(markers).toHaveLength(2);

    // Hover over the first marker
    fireEvent.mouseOver(markers[0]);

    // OPTIMIZED BEHAVIOR:
    // No state update in ClusterLayer -> No Re-render -> renderSpy called 0 times
    expect(renderSpy).toHaveBeenCalledTimes(0);

    // Verify that imperative style update was called
    expect(setStyleSpy).toHaveBeenCalledWith({ fillOpacity: 0.9 });
    setStyleSpy.mockClear();

    // Mouse out
    fireEvent.mouseOut(markers[0]);

    // Still no re-render
    expect(renderSpy).toHaveBeenCalledTimes(0);

    // Verify style reset
    expect(setStyleSpy).toHaveBeenCalledWith({ fillOpacity: 0.7 });
  });
});

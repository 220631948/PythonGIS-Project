import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import DashboardCanvas from '../modules/DashboardBuilder/components/DashboardCanvas';
import type { DashboardWidget, DashboardLayout } from '../types/api-2026';

// Mock react-grid-layout
vi.mock('react-grid-layout', () => {
  return {
    Responsive: ({ children, onLayoutChange }: any) => (
      <div data-testid="responsive-grid" onClick={() => onLayoutChange && onLayoutChange([], { lg: [] })}>
        {children}
      </div>
    ),
    WidthProvider: (Component: any) => (props: any) => <Component {...props} />,
  };
});

// Mock CSS imports
vi.mock('react-grid-layout/css/styles.css', () => ({}));
vi.mock('react-resizable/css/styles.css', () => ({}));

describe('DashboardCanvas', () => {
  const mockWidgets: DashboardWidget[] = [
    {
      id: 'widget1',
      type: 'chart',
      title: 'Test Widget',
      config: {},
      position: { x: 0, y: 0, w: 4, h: 4 },
    },
  ];

  const mockLayout: DashboardLayout = {
    lg: [],
    md: [],
    sm: [],
    xs: [],
  };

  const defaultProps = {
    widgets: mockWidgets,
    layout: mockLayout,
    onLayoutChange: vi.fn(),
    onWidgetUpdate: vi.fn(),
    onWidgetRemove: vi.fn(),
    onWidgetDuplicate: vi.fn(),
  };

  it('renders empty state when no widgets', () => {
    render(<DashboardCanvas {...defaultProps} widgets={[]} />);
    expect(screen.getByText('Your canvas is empty')).toBeInTheDocument();
  });

  it('renders widgets in grid', () => {
    render(<DashboardCanvas {...defaultProps} />);
    expect(screen.getByTestId('responsive-grid')).toBeInTheDocument();
    // Assuming DashboardWidget renders the title inside, we might need to check for content text
    // DashboardWidget renders widget.config.title || 'Untitled Widget'
    // Here we pass title 'Test Widget' in top level property, but DashboardWidget uses config.title
    // Wait, DashboardWidget interface has title, but DashboardWidget COMPONENT uses widget.config.title

    // Let's check DashboardWidget.tsx:
    // <div className="widget-title">{widget.config.title || 'Untitled Widget'}</div>

    // My mock widget has title in root, but config is empty.
    // So it might render 'Untitled Widget'.
    expect(screen.getByText('Untitled Widget')).toBeInTheDocument();
  });

  it('calls onLayoutChange when grid layout changes', () => {
    const onLayoutChange = vi.fn();
    render(<DashboardCanvas {...defaultProps} onLayoutChange={onLayoutChange} />);

    // Trigger layout change via mock click
    fireEvent.click(screen.getByTestId('responsive-grid'));

    expect(onLayoutChange).toHaveBeenCalled();
  });
});

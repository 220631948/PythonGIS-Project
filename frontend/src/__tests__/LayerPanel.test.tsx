import { LAYER_CONFIG } from '../components/Legend';
import LayerPanel from '../components/LayerPanel';
import { render, screen } from '@testing-library/react';

test('LayerPanel accessibility', () => {
  const activeLayers = ['zoning-layer'];
  render(<LayerPanel activeLayers={activeLayers} onLayerToggle={() => {}} />);

  const zoningConfig = LAYER_CONFIG['zoning-layer'];
  const toggleBtn = screen.getByRole('button', { name: `Toggle ${zoningConfig.name}` });
  expect(toggleBtn).toBeInTheDocument();
  expect(toggleBtn).toHaveAttribute('aria-pressed', 'true');
});

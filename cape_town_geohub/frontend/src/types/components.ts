/**
 * Component Prop Types for Cape Town GeoHub
 * Type definitions for React component props
 */

import type { GeoJSONFeature, GeoJSONFeatureCollection } from './geojson';
import type React from 'react';

// ============================================================================
// Map Components
// ============================================================================

/** Map view props */
export interface MapViewProps {
  /** Center coordinates [lat, lng] */
  center: [number, number];
  /** Zoom level */
  zoom: number;
  /** Layer configurations */
  layers: LayerConfig[];
  /** Callback when location is selected */
  onLocationSelect?: (lat: number, lng: number) => void;
  /** Callback when feature is clicked */
  onFeatureClick?: (feature: GeoJSONFeature) => void;
  /** Custom styles */
  style?: React.CSSProperties;
}

/** Layer type options */
export type LayerType = 'geojson' | 'tile' | 'marker';

/** Layer configuration */
export interface LayerConfig {
  /** Unique layer identifier */
  id: string;
  /** Layer display name */
  name: string;
  /** Layer type */
  type: LayerType;
  /** Layer visibility */
  visible: boolean;
  /** Layer opacity (0-1) */
  opacity: number;
  /** GeoJSON data for geojson layers */
  data?: GeoJSONFeatureCollection;
  /** Tile URL for tile layers */
  tileUrl?: string;
  /** Layer style configuration */
  style?: LayerStyleConfig;
  /** Whether layer is interactive */
  interactive?: boolean;
  /** Layer z-index */
  zIndex?: number;
}

/** Layer style configuration */
export interface LayerStyleConfig {
  /** Fill color */
  fillColor?: string;
  /** Fill opacity */
  fillOpacity?: number;
  /** Stroke color */
  color?: string;
  /** Stroke weight */
  weight?: number;
  /** Stroke opacity */
  opacity?: number;
  /** Dash array for dashed lines */
  dashArray?: string;
  /** Point radius */
  radius?: number;
}

// ============================================================================
// UI Components
// ============================================================================

/** Card component props */
export interface CardProps {
  /** Card title */
  title?: string;
  /** Card content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Elevated style */
  elevated?: boolean;
  /** Click handler */
  onClick?: () => void;
}

/** Modal component props */
export interface ModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Modal content */
  children: React.ReactNode;
  /** Modal size */
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  /** Close on backdrop click */
  closeOnBackdrop?: boolean;
}

/** Button variant options */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

/** Button size options */
export type ButtonSize = 'small' | 'medium' | 'large';

/** Button component props */
export interface ButtonProps {
  /** Button content */
  children: React.ReactNode;
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Button variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Icon element */
  icon?: React.ReactNode;
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
}

/** Input component props */
export interface InputProps {
  /** Input value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Input type */
  type?: 'text' | 'number' | 'email' | 'password' | 'search';
  /** Disabled state */
  disabled?: boolean;
  /** Error message */
  error?: string;
  /** Input label */
  label?: string;
}

/** Select option */
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

/** Select component props */
export interface SelectProps<T = string> {
  /** Selected value */
  value: T;
  /** Change handler */
  onChange: (value: T) => void;
  /** Available options */
  options: SelectOption<T>[];
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Label text */
  label?: string;
}

/** Toggle component props */
export interface ToggleProps {
  /** Checked state */
  checked: boolean;
  /** Change handler */
  onChange: (checked: boolean) => void;
  /** Label text */
  label?: string;
  /** Disabled state */
  disabled?: boolean;
}

// ============================================================================
// Panel Components
// ============================================================================

/** Sidebar props */
export interface SidebarProps {
  /** Whether sidebar is open */
  isOpen: boolean;
  /** Toggle handler */
  onToggle: () => void;
  /** Sidebar content */
  children: React.ReactNode;
  /** Sidebar position */
  position?: 'left' | 'right';
}

/** Tab configuration */
export interface TabConfig {
  /** Tab identifier */
  id: string;
  /** Tab label */
  label: string;
  /** Tab icon */
  icon?: React.ReactNode;
  /** Tab content */
  content: React.ReactNode;
  /** Disabled state */
  disabled?: boolean;
}

/** Tabs component props */
export interface TabsProps {
  /** Tab configurations */
  tabs: TabConfig[];
  /** Active tab ID */
  activeTab: string;
  /** Tab change handler */
  onTabChange: (tabId: string) => void;
}

// ============================================================================
// Data Display Components
// ============================================================================

/** Table column configuration */
export interface TableColumn<T> {
  /** Column key */
  key: keyof T | string;
  /** Column header */
  header: string;
  /** Custom render function */
  render?: (value: unknown, row: T) => React.ReactNode;
  /** Column width */
  width?: string | number;
  /** Sortable */
  sortable?: boolean;
}

/** Table component props */
export interface TableProps<T> {
  /** Data rows */
  data: T[];
  /** Column configurations */
  columns: TableColumn<T>[];
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Row click handler */
  onRowClick?: (row: T) => void;
}

/** List item props */
export interface ListItemProps {
  /** Primary text */
  primary: string;
  /** Secondary text */
  secondary?: string;
  /** Leading icon */
  icon?: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Selected state */
  selected?: boolean;
}

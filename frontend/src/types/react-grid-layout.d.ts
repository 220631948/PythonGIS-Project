declare module 'react-grid-layout' {
  import * as React from 'react';

  export interface Layout {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    maxW?: number;
    minH?: number;
    maxH?: number;
    static?: boolean;
    isDraggable?: boolean;
    isResizable?: boolean;
    isBounded?: boolean;
  }

  export interface Layouts {
    [P: string]: Layout[];
  }

  export interface ResponsiveProps {
    className?: string;
    style?: React.CSSProperties;
    width?: number;
    breakpoints?: { [key: string]: number };
    cols?: { [key: string]: number };
    layouts?: Layouts;
    onLayoutChange?: (currentLayout: Layout[], allLayouts: Layouts) => void;
    children?: React.ReactNode;
    margin?: [number, number];
    containerPadding?: [number, number];
    rowHeight?: number;
    isDraggable?: boolean;
    isResizable?: boolean;
    isBounded?: boolean;
    useCSSTransforms?: boolean;
    measureBeforeMount?: boolean;
    compactType?: 'vertical' | 'horizontal' | null;
    preventCollision?: boolean;
    draggableHandle?: string;
    draggableCancel?: string;
  }

  export class Responsive extends React.Component<ResponsiveProps, any> {}
  export function WidthProvider<P>(component: React.ComponentType<P>): React.ComponentType<P>;
}

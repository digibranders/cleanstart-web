declare module "react-simple-maps" {
  import type { ReactNode, SVGProps, CSSProperties } from "react";

  interface GeographyStyle {
    default?: CSSProperties;
    hover?: CSSProperties;
    pressed?: CSSProperties;
  }

  interface GeoObject {
    rsmKey: string;
    [key: string]: unknown;
  }

  interface ComposableMapProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    projection?: string;
    projectionConfig?: {
      scale?: number;
      center?: [number, number];
      rotate?: [number, number, number];
      parallels?: [number, number];
      precision?: number;
    };
    children?: ReactNode;
  }

  interface GeographiesProps {
    geography: string | object;
    children: (props: { geographies: GeoObject[] }) => ReactNode;
    parseGeographies?: (features: unknown[]) => GeoObject[];
  }

  interface GeographyProps extends SVGProps<SVGPathElement> {
    geography: GeoObject;
    style?: GeographyStyle;
    className?: string;
    tabIndex?: number;
  }

  interface MarkerProps extends SVGProps<SVGGElement> {
    coordinates: [number, number];
    children?: ReactNode;
  }

  interface LineProps extends SVGProps<SVGPathElement> {
    from: [number, number];
    to: [number, number];
    /** Array of [lon, lat] waypoints (alternative to from/to) */
    coordinates?: [number, number][];
    children?: ReactNode;
  }

  export function ComposableMap(props: ComposableMapProps): JSX.Element;
  export function Geographies(props: GeographiesProps): JSX.Element;
  export function Geography(props: GeographyProps): JSX.Element;
  export function Marker(props: MarkerProps): JSX.Element;
  export function Line(props: LineProps): JSX.Element;
}

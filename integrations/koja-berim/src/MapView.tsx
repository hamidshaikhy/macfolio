import { forwardRef, lazy, Suspense } from "react";
import type { Bounds, City, Place, Point, Route, MetroNetwork } from "./model";

export type MapHandle = {
  fly: (p: Point, zoom?: number) => void;
  zoom: (delta: number) => void;
  fitRoute: () => void;
  fitMetro: (lineId?: string) => void;
};
export type MapProps = {
  places: Place[];
  selected?: Place;
  hover?: string;
  city: City;
  location?: Point & { accuracy: number };
  route?: Route;
  onSelect: (p: Place) => void;
  onView: (center: Point, bounds: Bounds, zoom: number) => void;
  onPick?: (p: Point) => void;
  metro?: MetroNetwork;
  metroLine?: string;
  onMetroLine?: (lineId: string) => void;
};
const RasterMap = lazy(() => import("./RasterMapView"));
const MapView = forwardRef<MapHandle, MapProps>(function MapView(props, ref) {
  return (
    <Suspense fallback={<div className="map-loading" role="status"><span className="spinner" />در حال آماده‌کردن نقشه…</div>}>
      <RasterMap {...props} ref={ref} />
    </Suspense>
  );
});
export default MapView;

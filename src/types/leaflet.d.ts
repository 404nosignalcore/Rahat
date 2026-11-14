declare namespace L {
  type Map = any;
  type LayerGroup = any;
  type LatLngExpression = [number, number] | any;
  type PathOptions = any;
  type LeafletMouseEvent = any;
  function map(...args: any[]): any;
  function tileLayer(...args: any[]): any;
  function layerGroup(...args: any[]): any;
  function polygon(...args: any[]): any;
  function polyline(...args: any[]): any;
  function circleMarker(...args: any[]): any;
  function divIcon(...args: any[]): any;
  function marker(...args: any[]): any;
}

declare module 'leaflet' {
  export = L;
}

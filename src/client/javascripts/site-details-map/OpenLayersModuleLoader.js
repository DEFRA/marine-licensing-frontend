class OpenLayersModuleLoader {
  /**
   * Imports all required OpenLayers modules dynamically
   * @returns {Promise<object>} object containing all OpenLayers modules
   */
  async importModules() {
    const [
      ,
      { default: OpenLayersMap },
      { default: View },
      { default: TileLayer },
      { default: OSM },
      { default: VectorLayer },
      { default: VectorSource },
      { default: Feature },
      { default: Point },
      { default: CircleGeom },
      { Style, Fill, Stroke, Circle },
      { fromLonLat, toLonLat },
      { default: GeoJSON },
      { default: Polygon }
    ] = await Promise.all([
      import('ol/ol.css'),
      import('ol/Map.js'),
      import('ol/View.js'),
      import('ol/layer/Tile.js'),
      import('ol/source/OSM.js'),
      import('ol/layer/Vector.js'),
      import('ol/source/Vector.js'),
      import('ol/Feature.js'),
      import('ol/geom/Point.js'),
      import('ol/geom/Circle.js'),
      import('ol/style.js'),
      import('ol/proj.js'),
      import('ol/format/GeoJSON.js'),
      import('ol/geom/Polygon.js')
    ])

    return {
      OpenLayersMap,
      View,
      TileLayer,
      OSM,
      VectorLayer,
      VectorSource,
      Feature,
      Point,
      CircleGeom,
      Polygon,
      Style,
      Fill,
      Stroke,
      Circle,
      fromLonLat,
      toLonLat,
      GeoJSON
    }
  }
}

export default OpenLayersModuleLoader

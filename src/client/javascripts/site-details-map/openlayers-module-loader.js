/**
 * OpenLayers Module Loader
 *
 * Responsible for dynamically loading OpenLayers modules.
 * This separation allows for easy testing via dependency injection.
 */
class OpenLayersModuleLoader {
  /**
   * Load all required OpenLayers modules dynamically
   * @returns {Promise<object>} Object containing all OpenLayers modules
   */
  async loadModules() {
    // Core map components
    const [
      { default: OpenLayersMap },
      { default: View },
      { default: TileLayer },
      { default: OSM }
    ] = await Promise.all([
      import('ol/Map.js'),
      import('ol/View.js'),
      import('ol/layer/Tile.js'),
      import('ol/source/OSM.js')
    ])

    // Vector data and styling
    const [
      { default: VectorLayer },
      { default: VectorSource },
      { default: Feature },
      { Style, Fill, Stroke, Circle }
    ] = await Promise.all([
      import('ol/layer/Vector.js'),
      import('ol/source/Vector.js'),
      import('ol/Feature.js'),
      import('ol/style.js')
    ])

    // Geometry and projection utilities
    const [
      { default: Point },
      { default: Polygon },
      { fromLonLat, toLonLat },
      { default: GeoJSON }
    ] = await Promise.all([
      import('ol/geom/Point.js'),
      import('ol/geom/Polygon.js'),
      import('ol/proj.js'),
      import('ol/format/GeoJSON.js')
    ])

    // Map controls
    const [{ default: Attribution }, { defaults: defaultControls }] =
      await Promise.all([
        import('ol/control/Attribution.js'),
        import('ol/control/defaults.js')
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
      Polygon,
      Style,
      Fill,
      Stroke,
      Circle,
      fromLonLat,
      toLonLat,
      GeoJSON,
      Attribution,
      defaultControls
    }
  }
}

export default OpenLayersModuleLoader

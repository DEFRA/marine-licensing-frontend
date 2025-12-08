import { logger } from '../error-tracking/logger.js'

class OpenLayersModuleLoader {
  async loadModules() {
    try {
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

      const [
        { default: Attribution },
        { defaults: defaultControls },
        { default: ScaleLine }
      ] = await Promise.all([
        import('ol/control/Attribution.js'),
        import('ol/control/defaults.js'),
        import('ol/control/ScaleLine.js')
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
        defaultControls,
        ScaleLine
      }
    } catch (error) {
      logger.error('Failed to load OpenLayers modules:', error)
      throw new Error('OpenLayers module loading failed')
    }
  }
}

export default OpenLayersModuleLoader

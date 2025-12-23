import { logger } from '../error-tracking/logger.js'

class MapFactory {
  constructor(olModules) {
    this.olModules = olModules
  }

  createMap(target, options, vectorLayer) {
    try {
      const {
        OpenLayersMap,
        View,
        TileLayer,
        OSM,
        Attribution,
        defaultControls,
        ScaleLine
      } = this.olModules

      const attribution = new Attribution({
        collapsible: false,
        collapsed: false
      })

      const scaleLine = new ScaleLine({
        units: 'metric'
      })

      const map = new OpenLayersMap({
        target,
        layers: [
          new TileLayer({
            source: new OSM()
          }),
          vectorLayer
        ],
        controls: defaultControls({ attribution: false }).extend([
          attribution,
          scaleLine
        ]),
        view: new View({
          center: options.center,
          zoom: options.zoom
        })
      })

      return map
    } catch (error) {
      logger.error('Failed to create OpenLayers map:', error)
      throw error
    }
  }

  setupResponsiveAttribution(map, attribution) {
    const SMALL_MAP_SIZE = 600
    const checkSize = () => {
      const small = map.getSize()[0] < SMALL_MAP_SIZE
      attribution.setCollapsible(small)
      attribution.setCollapsed(small)
    }

    map.on('change:size', checkSize)
    checkSize()
  }

  createMapLayers() {
    const { VectorSource, VectorLayer } = this.olModules
    const vectorSource = new VectorSource()
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: this.createDefaultStyle()
    })

    return { vectorSource, vectorLayer }
  }

  createDefaultStyle() {
    const { Style, Fill, Stroke, Circle } = this.olModules
    const STROKE_WIDTH_PIXELS = 2

    return new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.2)'
      }),
      stroke: new Stroke({
        color: '#000000',
        width: STROKE_WIDTH_PIXELS
      }),
      image: new Circle({
        radius: 7,
        fill: new Fill({
          color: 'transparent'
        }),
        stroke: new Stroke({
          color: '#000000',
          width: STROKE_WIDTH_PIXELS
        })
      })
    })
  }

  initialiseGeoJSONFormat() {
    const { GeoJSON } = this.olModules
    return new GeoJSON()
  }
}

export default MapFactory

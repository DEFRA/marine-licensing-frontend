import CircleGeometryCalculator from './circle-geometry-calculator.js'
import CoordinateParser from './coordinate-parser.js'

class SiteVisualiser {
  constructor(olModules, vectorSource, geoJSONFormat, map) {
    this.olModules = olModules
    this.vectorSource = vectorSource
    this.geoJSONFormat = geoJSONFormat
    this.map = map
    this.coordinateParser = new CoordinateParser()
  }

  /**
   * Display a point site on the map
   * @param {Array} coordinates - Web Mercator coordinates [x, y]
   */
  displayPointSite(coordinates) {
    const { Feature, Point } = this.olModules
    const pointFeature = new Feature({
      geometry: new Point(coordinates)
    })
    this.vectorSource.addFeature(pointFeature)
  }

  /**
   * Display a circular site on the map
   * @param {Array} centreCoordinates - Web Mercator centre coordinates [x, y]
   * @param {number} radiusInMetres - Radius in metres
   */
  displayCircularSite(centreCoordinates, radiusInMetres) {
    const { Feature, Polygon, fromLonLat, toLonLat } = this.olModules
    const centreWGS84 = toLonLat(centreCoordinates)

    const circleCoords = CircleGeometryCalculator.createGeographicCircle(
      centreWGS84,
      radiusInMetres
    )

    const projectedCoords = circleCoords.map((coord) => fromLonLat(coord))

    const circlePolygon = new Polygon([projectedCoords])
    const circleFeature = new Feature({
      geometry: circlePolygon
    })

    this.vectorSource.addFeature(circleFeature)
  }

  /**
   * Display file upload data on the map
   * @param {object} geoJSON - GeoJSON data from file upload
   */
  displayFileUploadData(geoJSON) {
    const MAP_PADDING_PIXELS = 20
    const MAX_ZOOM_LEVEL = 16

    if (!geoJSON.features || !Array.isArray(geoJSON.features)) {
      return
    }

    const features = this.geoJSONFormat.readFeatures(geoJSON, {
      featureProjection: 'EPSG:3857'
    })

    this.vectorSource.addFeatures(features)

    if (features.length > 0) {
      const extent = this.vectorSource.getExtent()
      this.map.getView().fit(extent, {
        padding: [
          MAP_PADDING_PIXELS,
          MAP_PADDING_PIXELS,
          MAP_PADDING_PIXELS,
          MAP_PADDING_PIXELS
        ],
        maxZoom: MAX_ZOOM_LEVEL
      })
    }
  }

  /**
   * Display manual coordinates (point or circle)
   * @param {object} siteDetails - Site details with manual coordinates
   */
  displayManualCoordinates(siteDetails) {
    const DETAILED_ZOOM_LEVEL = 14
    const { coordinateSystem, coordinates, circleWidth } = siteDetails

    if (!coordinates) {
      return
    }

    const { fromLonLat } = this.olModules
    if (!fromLonLat) {
      return
    }

    const mapCoordinates = this.coordinateParser.parseCoordinates(
      coordinateSystem,
      coordinates,
      fromLonLat
    )

    if (!mapCoordinates) {
      return
    }

    if (circleWidth) {
      this.displayCircularSite(mapCoordinates, circleWidth)
    } else {
      this.displayPointSite(mapCoordinates)
    }

    this.centreMapView(mapCoordinates, DETAILED_ZOOM_LEVEL)
  }

  clearFeatures() {
    this.vectorSource.clear()
  }

  /**
   * Centre the map view on specific coordinates
   * @param {Array} mapCoordinates - Web Mercator coordinates [x, y]
   * @param {number} zoomLevel - Zoom level to set
   */
  centreMapView(mapCoordinates, zoomLevel = 14) {
    this.map.getView().setCenter(mapCoordinates)
    this.map.getView().setZoom(zoomLevel)
  }
}

export default SiteVisualiser

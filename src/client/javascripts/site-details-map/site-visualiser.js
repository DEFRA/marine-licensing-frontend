import CoordinateParser from './coordinate-parser.js'
import FeatureFactory from './feature-factory.js'
import MapViewManager from './map-view-manager.js'

class SiteVisualiser {
  constructor(olModules, vectorSource, geoJSONFormat, map) {
    this.olModules = olModules
    this.vectorSource = vectorSource
    this.geoJSONFormat = geoJSONFormat
    this.map = map
    this.coordinateParser = new CoordinateParser()
    this.mapViewManager = new MapViewManager()
    this.featureFactory = new FeatureFactory()
  }

  /**
   * Display a point site on the map
   * @param {Array} coordinates - Web Mercator coordinates [x, y]
   */
  displayPointSite(coordinates) {
    const pointFeature = this.featureFactory.createPointFeature(
      this.olModules,
      coordinates
    )
    this.vectorSource.addFeature(pointFeature)
  }

  /**
   * Display a circular site on the map
   * @param {Array} centreCoordinates - Web Mercator centre coordinates [x, y]
   * @param {number} diameterInMetres - Diameter (width) in metres
   */
  displayCircularSite(centreCoordinates, diameterInMetres) {
    const circleFeature = this.featureFactory.createCircleFeature(
      this.olModules,
      centreCoordinates,
      diameterInMetres
    )

    this.vectorSource.addFeature(circleFeature)

    this.mapViewManager.fitMapToGeometry(this.map, circleFeature.getGeometry())
  }

  /**
   * Display file upload data on the map
   * @param {object} geoJSON - GeoJSON data from file upload
   */
  displayFileUploadData(geoJSON) {
    const features = this.featureFactory.createFeaturesFromGeoJSON(
      this.geoJSONFormat,
      geoJSON
    )

    if (features.length === 0) {
      return
    }

    this.vectorSource.addFeatures(features)

    this.mapViewManager.fitMapToAllFeatures(this.map, this.vectorSource)
  }

  /**
   * Display manual coordinates (point, circle, or polygon)
   * @param {object} siteDetails - Site details with manual coordinates
   */
  displayManualCoordinates(siteDetails) {
    const POINT_ZOOM_LEVEL = 12
    const { coordinateSystem, coordinates, circleWidth, coordinatesEntry } =
      siteDetails

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

    if (coordinatesEntry === 'multiple' && Array.isArray(mapCoordinates)) {
      this.displayPolygonSite(mapCoordinates)
    } else if (circleWidth) {
      this.displayCircularSite(mapCoordinates, circleWidth)
    } else {
      this.displayPointSite(mapCoordinates)
      this.mapViewManager.centreMapView(
        this.map,
        mapCoordinates,
        POINT_ZOOM_LEVEL
      )
    }
  }

  /**
   * Display a polygon site on the map
   * @param {Array} coordinatesArray - Array of Web Mercator coordinates [[x, y], [x, y], ...]
   */
  displayPolygonSite(coordinatesArray) {
    const polygonFeature = this.featureFactory.createPolygonFeature(
      this.olModules,
      coordinatesArray
    )

    if (!polygonFeature) {
      return
    }

    this.vectorSource.addFeature(polygonFeature)

    this.mapViewManager.fitMapToGeometry(this.map, polygonFeature.getGeometry())
  }

  clearFeatures() {
    this.vectorSource.clear()
  }
}

export default SiteVisualiser

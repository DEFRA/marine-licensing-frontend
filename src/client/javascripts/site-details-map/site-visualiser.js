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
   * Display manual coordinates (circle, or polygon)
   * @param {object} siteDetails - Site details with manual coordinates
   * @returns {string} The action taken: 'polygon', 'circle', 'no-coordinates', 'modules-unavailable', 'invalid-coordinates', or 'no-action'
   */
  displayManualCoordinates(siteDetails) {
    const fromLonLat = this.olModules?.fromLonLat
    if (!fromLonLat) {
      return 'modules-unavailable'
    }

    const validationResult = this.validateSiteDetailsForDisplay(siteDetails)
    if (validationResult !== 'valid') {
      return validationResult
    }

    const { coordinateSystem, coordinates, circleWidth, coordinatesEntry } =
      siteDetails

    const mapCoordinates = this.coordinateParser.parseCoordinates(
      coordinateSystem,
      coordinates,
      fromLonLat
    )

    if (!mapCoordinates) {
      return 'invalid-coordinates'
    }

    return this.displayCoordinatesByType(
      mapCoordinates,
      coordinatesEntry,
      circleWidth
    )
  }

  validateSiteDetailsForDisplay(siteDetails) {
    if (!siteDetails.coordinates) {
      return 'no-coordinates'
    }

    return 'valid'
  }

  displayCoordinatesByType(mapCoordinates, coordinatesEntry, circleWidth) {
    if (coordinatesEntry === 'multiple' && Array.isArray(mapCoordinates)) {
      this.displayPolygonSite(mapCoordinates)
      return 'polygon'
    }

    if (circleWidth) {
      this.displayCircularSite(mapCoordinates, circleWidth)
      return 'circle'
    }

    return 'no-action'
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

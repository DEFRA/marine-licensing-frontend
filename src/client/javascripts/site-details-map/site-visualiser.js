import CoordinateParser from './coordinate-parser.js'
import FeatureFactory from './feature-factory.js'
import MapViewManager from './map-view-manager.js'
import { logger } from '../error-tracking/logger.js'

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

  displayCircularSite(centreCoordinates, diameterInMetres) {
    const circleFeature = this.featureFactory.createCircleFeature(
      this.olModules,
      centreCoordinates,
      diameterInMetres
    )

    this.vectorSource.addFeature(circleFeature)
    const MAX_DIAMETER_FOR_MIN_RESOLUTION = 5
    const MIN_RESOLUTION_MULTIPLIER = 2
    const options =
      diameterInMetres < MAX_DIAMETER_FOR_MIN_RESOLUTION
        ? { minResolution: diameterInMetres * MIN_RESOLUTION_MULTIPLIER }
        : {}

    this.mapViewManager.fitMapToGeometry(
      this.map,
      circleFeature.getGeometry(),
      options
    )
  }

  displayFileUploadData(geoJSON) {
    try {
      const features = this.featureFactory.createFeaturesFromGeoJSON(
        this.geoJSONFormat,
        geoJSON
      )

      if (features.length === 0) {
        logger.error('Map display failed: No features created from GeoJSON')
        return
      }

      this.vectorSource.addFeatures(features)

      this.mapViewManager.fitMapToAllFeatures(this.map, this.vectorSource)
    } catch (error) {
      logger.error('Failed to display file upload data on map:', error)
      throw error
    }
  }

  displayManualCoordinates(siteDetails) {
    try {
      const fromLonLat = this.olModules?.fromLonLat
      if (!fromLonLat) {
        logger.error('Map display failed: OpenLayers modules unavailable')
        return 'modules-unavailable'
      }

      const validationResult = this.validateSiteDetailsForDisplay(siteDetails)
      if (validationResult !== 'valid') {
        logger.error(
          `Map display failed: Invalid site details - ${validationResult}`
        )
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
        logger.error('Map display failed: Could not parse coordinates', {
          coordinateSystem,
          coordinates
        })
        return 'invalid-coordinates'
      }

      return this.displayCoordinatesByType(
        mapCoordinates,
        coordinatesEntry,
        circleWidth
      )
    } catch (error) {
      logger.error('Failed to display manual coordinates on map:', error)
      throw error
    }
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

import { Component } from 'govuk-frontend'

export class SiteDetailsMap extends Component {
  static moduleName = 'site-details-map'

  constructor($root, options = {}) {
    super($root)

    this.options = {
      center: [-3.5, 54.0],
      zoom: 6,
      ...options
    }

    this.map = null
    this.vectorSource = null
    this.vectorLayer = null
    this.geoJSONFormat = null
    this.olModules = null

    this.initializeMap().catch(() => {
      this.showError()
    })
  }

  async initializeMap() {
    try {
      // Dynamically import OpenLayers modules
      const [
        { default: Map },
        { default: View },
        { default: TileLayer },
        { default: OSM },
        { default: VectorLayer },
        { default: VectorSource },
        { default: Feature },
        { default: Point },
        { default: CircleGeom },
        { Style, Fill, Stroke, Circle },
        { fromLonLat },
        { default: GeoJSON }
      ] = await Promise.all([
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
        import('ol/format/GeoJSON.js')
      ])

      // Store modules for later use
      this.olModules = {
        Map,
        View,
        TileLayer,
        OSM,
        VectorLayer,
        VectorSource,
        Feature,
        Point,
        CircleGeom,
        Style,
        Fill,
        Stroke,
        Circle,
        fromLonLat,
        GeoJSON
      }

      this.vectorSource = new VectorSource()
      this.vectorLayer = new VectorLayer({
        source: this.vectorSource,
        style: this.createDefaultStyle()
      })

      this.map = new Map({
        target: this.$root,
        layers: [
          new TileLayer({
            source: new OSM({
              attributions: []
            })
          }),
          this.vectorLayer
        ],
        view: new View({
          center: fromLonLat(this.options.center),
          zoom: this.options.zoom
        }),
        controls: []
      })

      this.geoJSONFormat = new GeoJSON()
      this.loadSiteDetails()
    } catch (error) {
      this.showError()
    }
  }

  showError() {
    this.$root.innerHTML =
      '<div class="app-site-details-map__error">Failed to load map. Please refresh the page.</div>'
  }

  createDefaultStyle() {
    const { Style, Fill, Stroke, Circle } = this.olModules
    return new Style({
      fill: new Fill({
        color: 'transparent'
      }),
      stroke: new Stroke({
        color: '#000000',
        width: 2
      }),
      image: new Circle({
        radius: 7,
        fill: new Fill({
          color: 'transparent'
        }),
        stroke: new Stroke({
          color: '#000000',
          width: 2
        })
      })
    })
  }

  loadSiteDetails() {
    const siteDataElement = document.getElementById('site-details-data')
    if (!siteDataElement) {
      return
    }

    try {
      const siteDetails = JSON.parse(siteDataElement.textContent)
      this.displaySiteDetails(siteDetails)
    } catch (error) {
      // Site details data parsing failed
    }
  }

  displaySiteDetails(siteDetails) {
    this.vectorSource.clear()

    if (siteDetails.coordinatesType === 'file' && siteDetails.geoJSON) {
      this.displayFileUploadData(siteDetails.geoJSON)
    } else if (siteDetails.coordinatesType === 'coordinates') {
      this.displayManualCoordinates(siteDetails)
    }
  }

  displayFileUploadData(geoJSON) {
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
        padding: [20, 20, 20, 20],
        maxZoom: 16
      })
    }
  }

  displayManualCoordinates(siteDetails) {
    const { coordinateSystem, coordinates } = siteDetails
    const { fromLonLat } = this.olModules

    if (!coordinates) {
      return
    }

    let mapCoordinates

    if (coordinateSystem === 'WGS84' || coordinateSystem === 'wgs84') {
      if (coordinates.latitude && coordinates.longitude) {
        mapCoordinates = fromLonLat([
          parseFloat(coordinates.longitude),
          parseFloat(coordinates.latitude)
        ])
      }
    } else if (coordinateSystem === 'OSGB36' || coordinateSystem === 'osgb36') {
      if (coordinates.eastings && coordinates.northings) {
        mapCoordinates = this.convertOSGB36ToWebMercator(
          parseFloat(coordinates.eastings),
          parseFloat(coordinates.northings)
        )
      }
    }

    if (!mapCoordinates) {
      return
    }

    if (siteDetails.circleWidth) {
      this.displayCircularSite(mapCoordinates, siteDetails.circleWidth)
    } else {
      this.displayPointSite(mapCoordinates)
    }

    this.map.getView().setCenter(mapCoordinates)
    this.map.getView().setZoom(14)
  }

  displayPointSite(coordinates) {
    const { Feature, Point } = this.olModules
    const pointFeature = new Feature({
      geometry: new Point(coordinates)
    })
    this.vectorSource.addFeature(pointFeature)
  }

  displayCircularSite(centerCoordinates, radiusInMeters) {
    const { Feature, Point, CircleGeom } = this.olModules
    const circleFeature = new Feature({
      geometry: new CircleGeom(centerCoordinates, radiusInMeters)
    })
    this.vectorSource.addFeature(circleFeature)

    const pointFeature = new Feature({
      geometry: new Point(centerCoordinates)
    })
    this.vectorSource.addFeature(pointFeature)
  }

  convertOSGB36ToWebMercator(eastings, northings) {
    const { fromLonLat } = this.olModules
    const wgs84Coords = this.osgb36ToWgs84(eastings, northings)
    return fromLonLat(wgs84Coords)
  }

  osgb36ToWgs84(eastings, northings) {
    const a = 6377563.396
    const b = 6356256.909
    const F0 = 0.9996012717
    const lat0 = (49 * Math.PI) / 180
    const lon0 = (-2 * Math.PI) / 180
    const N0 = -100000
    const E0 = 400000
    const e2 = 1 - (b * b) / (a * a)
    const n = (a - b) / (a + b)

    const lat = lat0

    let latNew = lat
    for (let i = 0; i < 10; i++) {
      const Ma =
        (1 + n + (5 / 4) * n * n + (5 / 4) * n * n * n) * (latNew - lat0)
      const Mb =
        (3 * n + 3 * n * n + (21 / 8) * n * n * n) *
        Math.sin(latNew - lat0) *
        Math.cos(latNew + lat0)
      const Mc =
        ((15 / 8) * n * n + (15 / 8) * n * n * n) *
        Math.sin(2 * (latNew - lat0)) *
        Math.cos(2 * (latNew + lat0))
      const Md =
        (35 / 24) *
        n *
        n *
        n *
        Math.sin(3 * (latNew - lat0)) *
        Math.cos(3 * (latNew + lat0))
      const mNew = b * F0 * (Ma - Mb + Mc - Md)

      latNew = latNew + (northings - N0 - mNew) / (a * F0)
      if (Math.abs(northings - N0 - mNew) < 0.01) break
    }

    const v = (a * F0) / Math.sqrt(1 - e2 * Math.sin(latNew) * Math.sin(latNew))
    const rho =
      (a * F0 * (1 - e2)) /
      Math.pow(1 - e2 * Math.sin(latNew) * Math.sin(latNew), 1.5)
    const eta2 = v / rho - 1

    const tanLat = Math.tan(latNew)
    const secLat = 1 / Math.cos(latNew)

    const VII = tanLat / (2 * rho * v)
    const VIII =
      (tanLat / (24 * rho * Math.pow(v, 3))) *
      (5 + 3 * tanLat * tanLat + eta2 - 9 * tanLat * tanLat * eta2)
    const IX =
      (tanLat / (720 * rho * Math.pow(v, 5))) *
      (61 + 90 * tanLat * tanLat + 45 * tanLat * tanLat * tanLat * tanLat)

    const X = secLat / v
    const XI = (secLat / (6 * Math.pow(v, 3))) * (v / rho + 2 * tanLat * tanLat)
    const XII =
      (secLat / (120 * Math.pow(v, 5))) *
      (5 + 28 * tanLat * tanLat + 24 * tanLat * tanLat * tanLat * tanLat)

    const dE = eastings - E0
    const latFinal =
      latNew - VII * dE * dE + VIII * Math.pow(dE, 4) - IX * Math.pow(dE, 6)
    const lonFinal =
      lon0 + X * dE - XI * Math.pow(dE, 3) + XII * Math.pow(dE, 5)

    return [(lonFinal * 180) / Math.PI, (latFinal * 180) / Math.PI]
  }

  destroy() {
    if (this.map) {
      this.map.setTarget(null)
      this.map = null
    }
  }
}

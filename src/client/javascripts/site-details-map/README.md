# Site Details Map Module

Mapping of marine licensing site coordinates using OpenLayers. This module supports multiple coordinate systems, file uploads, and manual coordinate entry for displaying site boundaries on an interactive map.

## Architecture Overview

```mermaid
graph TB
    subgraph "Entry Point"
        SDM[SiteDetailsMap<br/>Component]
    end

    subgraph "Data Layer"
        SDL[SiteDataLoader<br/>DOM Data Extraction]
        CP[CoordinateParser<br/>Multi-System Support]
        GCC[GeographicCoordinateConverter<br/>OSGB36 ↔ WGS84]
    end

    subgraph "Map Layer"
        MF[MapFactory<br/>OpenLayers Setup]
        OML[OpenLayersModuleLoader<br/>Dynamic Loading]
        MVM[MapViewManager<br/>View Operations]
    end

    subgraph "Visualisation Layer"
        SV[SiteVisualiser<br/>Coordinate Display]
        FF[FeatureFactory<br/>Geometry Creation]
        CGC[CircleGeometryCalculator<br/>Geographic Circles]
    end

    subgraph "External"
        DOM[DOM Elements<br/>Site Details Data]
        OL[OpenLayers<br/>Mapping Library]
    end

    %% Entry point connections
    SDM --> SDL
    SDM --> MF
    SDM --> SV
    SDM --> OML

    %% Data layer connections
    SDL --> DOM
    CP --> GCC

    %% Map layer connections
    MF --> OL
    OML --> OL

    %% Visualisation connections
    SV --> FF
    SV --> MVM
    SV --> CP
    FF --> CGC

    %% Cross-layer dependencies
    SDM --> MVM
    SV --> MF

    classDef entryPoint fill:#e1f5fe
    classDef dataLayer fill:#f3e5f5
    classDef mapLayer fill:#e8f5e8
    classDef visualLayer fill:#fff3e0
    classDef external fill:#ffebee

    class SDM entryPoint
    class SDL,CP,GCC dataLayer
    class MF,OML,MVM mapLayer
    class SV,FF,CGC visualLayer
    class DOM,OL external
```

## Coordinate System Support

### **WGS84 (World Geodetic System 1984)**

- **Format**: Decimal degrees (latitude, longitude)
- **Example**: `51.550000, 0.700000`
- **Use Case**: GPS coordinates, international standards

### **OSGB36 (Ordnance Survey Great Britain 1936)**

- **Format**: Eastings and northings in metres
- **Example**: `577000, 178000`
- **Use Case**: UK mapping, marine licensing submissions

### **Web Mercator (EPSG:3857)**

- **Format**: Projected coordinates in metres
- **Use Case**: Web mapping display (internal use)

## Feature Types

### **Circular Sites**

Centre point with radius, displayed as accurate geographic circles

```javascript
// Example data structure
{
  coordinateSystem: 'WGS84',
  coordinates: { latitude: '51.5', longitude: '-0.1' },
  circleWidth: '500' // metres diameter
}
```

### **Polygon Sites**

Multiple coordinates forming site boundaries

```javascript
// Example data structure
{
  coordinateSystem: 'WGS84',
  coordinatesEntry: 'multiple',
  coordinates: [
    { latitude: '51.55', longitude: '0.70' },
    { latitude: '51.52', longitude: '1.00' },
    { latitude: '51.45', longitude: '1.10' }
  ]
}
```

### **File Upload Sites**

GeoJSON data from uploaded shapefiles or KML files

```javascript
// Example GeoJSON structure
{
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [[...]] },
      properties: {}
    }
  ]
}
```

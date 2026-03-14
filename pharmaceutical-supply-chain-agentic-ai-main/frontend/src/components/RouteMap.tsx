'use client'

import { useEffect, useRef } from 'react'
import type { LatLngExpression } from 'leaflet'

interface Marker {
  id: string
  position: [number, number]
  label: string
  type: 'depot' | 'destination'
}

export type MapStyle = 'street' | 'satellite' | 'terrain' | 'dark'

interface RouteMapProps {
  markers?: Marker[]
  routePolyline?: [number, number][]
  center?: [number, number]
  zoom?: number
  mapStyle?: MapStyle
}

const TILE_LAYERS: Record<MapStyle, { url: string; attribution: string }> = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
}

export default function RouteMap({
  markers = [],
  routePolyline = [],
  center = [28.6139, 77.2090], // Default: New Delhi
  zoom = 5,
  mapStyle = 'street',
}: RouteMapProps) {
  const mapRef     = useRef<any>(null)
  const mapInstanceRef  = useRef<any>(null)
  const layerGroupRef   = useRef<any>(null)
  const tileLayerRef    = useRef<any>(null)

  // ── Initialise map once ───────────────────────────────────────────────────
  useEffect(() => {
    const initMap = async () => {
      const L = (await import('leaflet')).default

      // Fix default icon paths
      if ((L.Icon.Default.prototype as any)._getIconUrl) {
        delete (L.Icon.Default.prototype as any)._getIconUrl
      }
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (!mapRef.current || mapInstanceRef.current) return

      const map = L.map(mapRef.current, {
        center,
        zoom,
        zoomControl: true,
      })

      const tile = TILE_LAYERS[mapStyle]
      tileLayerRef.current = L.tileLayer(tile.url, {
        attribution: tile.attribution,
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map
      layerGroupRef.current  = L.layerGroup().addTo(map)
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        layerGroupRef.current  = null
        tileLayerRef.current   = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Swap tile layer when mapStyle changes ─────────────────────────────────
  useEffect(() => {
    const swapTile = async () => {
      if (!mapInstanceRef.current) return
      const L = (await import('leaflet')).default

      if (tileLayerRef.current) {
        mapInstanceRef.current.removeLayer(tileLayerRef.current)
      }
      const tile = TILE_LAYERS[mapStyle]
      tileLayerRef.current = L.tileLayer(tile.url, {
        attribution: tile.attribution,
        maxZoom: 19,
      }).addTo(mapInstanceRef.current)
    }
    swapTile()
  }, [mapStyle])

  // ── Update markers + polyline ─────────────────────────────────────────────
  useEffect(() => {
    const updateLayers = async () => {
      if (!mapInstanceRef.current || !layerGroupRef.current) return
      const L = (await import('leaflet')).default

      layerGroupRef.current.clearLayers()

      // Draw markers
      markers.forEach((marker, idx) => {
        const isDepot = marker.type === 'depot'
        const label   = isDepot ? '⊕' : String.fromCharCode(65 + (idx - 1))
        const color   = isDepot ? '#059669' : '#3B82F6'

        const iconHtml = `
          <div style="
            width: 38px; height: 38px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 3px 10px rgba(0,0,0,0.35);
            font-size: 13px;
            font-weight: 800;
            color: white;
          ">${label}</div>
        `

        const icon = L.divIcon({
          html: iconHtml,
          className: '',
          iconSize:   [38, 38],
          iconAnchor: [19, 19],
          popupAnchor:[0, -22],
        })

        const m = L.marker(marker.position as LatLngExpression, { icon })
        m.bindPopup(`
          <div style="font-family: system-ui; min-width: 160px; padding: 4px 0;">
            <div style="font-weight: 700; font-size: 13px; color: #111;">${marker.label}</div>
            <div style="font-size: 11px; color: ${color}; font-weight: 600; margin-top: 3px;">
              ${isDepot ? '🏭 Depot / Start' : '📦 Delivery Stop ' + label}
            </div>
            <div style="font-size: 10px; color: #888; margin-top: 4px;">
              ${marker.position[0].toFixed(4)}°N, ${marker.position[1].toFixed(4)}°E
            </div>
          </div>
        `)
        layerGroupRef.current.addLayer(m)
      })

      // Draw route polyline
      if (routePolyline.length >= 2) {
        // Animated dashed line
        const polyline = L.polyline(routePolyline as LatLngExpression[], {
          color:     '#10B981',
          weight:    5,
          opacity:   0.9,
          dashArray: '10, 6',
        })
        layerGroupRef.current.addLayer(polyline)

        // Solid backing shadow for contrast on satellite/dark
        const shadow = L.polyline(routePolyline as LatLngExpression[], {
          color:   '#065F46',
          weight:  8,
          opacity: 0.25,
        })
        layerGroupRef.current.addLayer(shadow)

        mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] })
      } else if (markers.length > 0) {
        const bounds = L.latLngBounds(markers.map(m => m.position as LatLngExpression))
        if (bounds.isValid()) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60] })
        }
      }
    }

    updateLayers()
  }, [markers, routePolyline])

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '420px',
          borderRadius: '8px',
          zIndex: 0,
        }}
      />
    </>
  )
}

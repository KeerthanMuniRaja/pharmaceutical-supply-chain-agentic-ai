'use client'

import { useEffect, useRef } from 'react'
import type { LatLngExpression } from 'leaflet'

interface Marker {
  id: string
  position: [number, number]
  label: string
  type: 'depot' | 'destination'
}

interface RouteMapProps {
  markers?: Marker[]
  routePolyline?: [number, number][]
  center?: [number, number]
  zoom?: number
}

export default function RouteMap({
  markers = [],
  routePolyline = [],
  center = [35.6892, 51.3890],
  zoom = 11
}: RouteMapProps) {
  const mapRef = useRef<any>(null)
  const mapInstanceRef = useRef<any>(null)
  const layerGroupRef = useRef<any>(null)

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    const initMap = async () => {
      const L = (await import('leaflet')).default

      // Fix default marker icons
      if ((L.Icon.Default.prototype as any)._getIconUrl) {
        delete (L.Icon.Default.prototype as any)._getIconUrl
      }
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (!mapRef.current || mapInstanceRef.current) return

      // Init map
      const map = L.map(mapRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
      })

      // OpenStreetMap tiles (free, no API key needed)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map)

      mapInstanceRef.current = map
      layerGroupRef.current = L.layerGroup().addTo(map)
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        layerGroupRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers and polyline when data changes
  useEffect(() => {
    const updateLayers = async () => {
      if (!mapInstanceRef.current || !layerGroupRef.current) return
      const L = (await import('leaflet')).default

      layerGroupRef.current.clearLayers()

      // Add markers
      markers.forEach((marker, idx) => {
        const isDepot = marker.type === 'depot'

        const iconHtml = `
          <div style="
            width: 36px; height: 36px;
            background: ${isDepot ? '#059669' : '#3B82F6'};
            border: 3px solid white;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            font-size: 11px;
            font-weight: 700;
            color: white;
          ">${isDepot ? '⊕' : String.fromCharCode(65 + (idx - 1))}</div>
        `

        const icon = L.divIcon({
          html: iconHtml,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -18],
        })

        const m = L.marker(marker.position as LatLngExpression, { icon })
        m.bindPopup(`
          <div style="font-family: system-ui; min-width: 140px;">
            <div style="font-weight: 700; font-size: 13px; color: #111;">${marker.label}</div>
            <div style="font-size: 11px; color: ${isDepot ? '#059669' : '#3B82F6'}; font-weight: 600; margin-top: 2px;">
              ${isDepot ? '🏭 Depot / Start' : '📦 Delivery Stop'}
            </div>
            <div style="font-size: 10px; color: #888; margin-top: 4px;">
              ${marker.position[0].toFixed(4)}, ${marker.position[1].toFixed(4)}
            </div>
          </div>
        `)
        layerGroupRef.current.addLayer(m)
      })

      // Draw route polyline
      if (routePolyline.length >= 2) {
        const polyline = L.polyline(routePolyline as LatLngExpression[], {
          color: '#10B981',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 4',
        }).addTo(mapInstanceRef.current)

        layerGroupRef.current.addLayer(polyline)

        // Pan to fit the route
        mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [40, 40] })
      } else if (markers.length > 0) {
        // Fit to markers only
        const bounds = L.latLngBounds(markers.map(m => m.position as LatLngExpression))
        if (bounds.isValid()) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
        }
      }
    }

    updateLayers()
  }, [markers, routePolyline])

  return (
    <>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div
        ref={mapRef}
        style={{ width: '100%', height: '100%', minHeight: '420px', borderRadius: '8px', zIndex: 0 }}
      />
    </>
  )
}

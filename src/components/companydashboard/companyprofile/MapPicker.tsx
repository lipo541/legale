'use client'

import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { OpenStreetMapProvider } from 'leaflet-geosearch'
import { Search, MapPin, Loader2 } from 'lucide-react'

// Fix default marker icon issue in Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void
  initialPosition?: { lat: number; lng: number }
  isDark?: boolean
}

interface SearchResult {
  x: number
  y: number
  label: string
  bounds: [[number, number], [number, number]]
}

function LocationMarker({ 
  position,
  onLocationSelect 
}: { 
  position: L.LatLng | null
  onLocationSelect: (lat: number, lng: number) => void
}) {
  const map = useMap()

  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    }

    map.on('click', handleClick)

    return () => {
      map.off('click', handleClick)
    }
  }, [map, onLocationSelect])

  return position === null ? null : <Marker position={position} />
}

// Component to handle map flyTo
function MapController({ position }: { position: L.LatLng | null }) {
  const map = useMap()

  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, {
        duration: 1.5
      })
    }
  }, [position, map])

  return null
}

export default function MapPicker({ onLocationSelect, initialPosition, isDark = false }: MapPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [position, setPosition] = useState<L.LatLng | null>(
    initialPosition ? L.latLng(initialPosition.lat, initialPosition.lng) : null
  )

  const center: [number, number] = initialPosition 
    ? [initialPosition.lat, initialPosition.lng] 
    : [41.7151, 44.8271] // Tbilisi

  const provider = new OpenStreetMapProvider()

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) return

    setSearching(true)

    try {
      const results = await provider.search({ query: searchQuery })
      setSearchResults(results as SearchResult[])
      setShowResults(true)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }, [searchQuery, provider])

  // Auto-search as user types (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 3) {
        handleSearch()
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timer)
  }, [searchQuery, handleSearch])

  const handleSelectResult = (result: SearchResult) => {
    const newPosition = L.latLng(result.y, result.x)
    setPosition(newPosition)
    onLocationSelect(result.y, result.x)
    setShowResults(false)
    setSearchQuery(result.label)
  }

  const handleMapClick = (lat: number, lng: number) => {
    setPosition(L.latLng(lat, lng))
    onLocationSelect(lat, lng)
  }

  return (
    <div className="relative">
      {/* Search Bar */}
      <div className={`absolute top-3 left-16 right-3 z-[1000] max-w-md ${isDark ? 'bg-black/90 border-white/10' : 'bg-white/90 border-black/10'} rounded-lg shadow-lg border backdrop-blur-sm`}>
        <div className="flex items-center gap-2 px-3 py-2">
          <Search className={`h-4 w-4 flex-shrink-0 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim().length >= 3 && setShowResults(true)}
            placeholder="მოძებნეთ მისამართი..."
            className={`flex-1 bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder:text-white/40' : 'text-black placeholder:text-black/40'}`}
          />
          {searching && <Loader2 className={`h-4 w-4 animate-spin ${isDark ? 'text-white/60' : 'text-black/60'}`} />}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className={`border-t max-h-48 overflow-y-auto ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            {searchResults.slice(0, 5).map((result, index) => (
              <button
                key={index}
                onClick={() => handleSelectResult(result)}
                className={`w-full text-left px-3 py-2 text-xs flex items-start gap-2 transition-colors ${
                  isDark 
                    ? 'hover:bg-white/10 border-b border-white/5 last:border-0' 
                    : 'hover:bg-black/5 border-b border-black/5 last:border-0'
                }`}
              >
                <MapPin className={`h-3 w-3 mt-0.5 flex-shrink-0 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                <span className={`line-clamp-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                  {result.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* No Results */}
        {showResults && searchResults.length === 0 && searchQuery.trim().length >= 3 && !searching && (
          <div className={`border-t px-3 py-2 text-xs ${isDark ? 'border-white/10 text-white/60' : 'border-black/10 text-black/60'}`}>
            მისამართი ვერ მოიძებნა
          </div>
        )}
      </div>

      {/* Helper Text */}
      <div className={`absolute bottom-3 left-3 right-3 z-[1000] ${isDark ? 'bg-black/80 border-white/10' : 'bg-white/80 border-black/10'} rounded-lg shadow-lg px-3 py-2 flex items-center gap-2 text-xs border backdrop-blur-sm`}>
        <MapPin className={`h-3 w-3 flex-shrink-0 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
        <span className={isDark ? 'text-white/80' : 'text-black/80'}>
          💡 დააჭირეთ რუკაზე პინის დასამონიშნად
        </span>
      </div>
      
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '500px', width: '100%', borderRadius: '12px' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker 
          position={position}
          onLocationSelect={handleMapClick}
        />
        <MapController position={position} />
      </MapContainer>
    </div>
  )
}

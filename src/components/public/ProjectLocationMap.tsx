'use client'

import { useState } from 'react'

export type ProjectLocationMapProps = {
  projectName: string
  latitude?: number | null
  longitude?: number | null
  locationSummary?: string | null
  jurisdiction?: string | null
}

/** Valid WGS84-ish bounds; rejects NaN and impossible values. */
export function isValidMapCoordinate(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): latitude is number {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false
  if (latitude < -90 || latitude > 90) return false
  if (longitude < -180 || longitude > 180) return false
  return true
}

function osmEmbedUrl(latitude: number, longitude: number): string {
  const delta = 0.08
  const minLon = longitude - delta
  const maxLon = longitude + delta
  const minLat = latitude - delta
  const maxLat = latitude + delta
  const bbox = encodeURIComponent(`${minLon},${minLat},${maxLon},${maxLat}`)
  const marker = encodeURIComponent(`${latitude},${longitude}`)
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`
}

/**
 * Provider-neutral read-only location map (ADR-0010).
 * Uses an OSM embed when coordinates are valid — no API key.
 * Text location details are always present as the accessible fallback.
 */
export function ProjectLocationMap({
  projectName,
  latitude,
  longitude,
  locationSummary,
  jurisdiction,
}: ProjectLocationMapProps) {
  const [mapFailed, setMapFailed] = useState(false)
  const hasCoords = isValidMapCoordinate(latitude, longitude)
  const showMap = hasCoords && !mapFailed
  const lat = hasCoords ? latitude : null
  const lng = hasCoords ? longitude : null

  return (
    <section
      aria-labelledby="project-location-map-heading"
      className="border border-[color-mix(in_oklab,var(--ink)_14%,transparent)] bg-[var(--paper-deep)] p-6"
    >
      <h2 id="project-location-map-heading" className="display text-2xl">
        Location map
      </h2>
      <p className="mt-2 text-sm text-[var(--ink-soft)]">
        Illustrative location for orientation only — not a technical survey product.
      </p>

      <div className="mt-4 space-y-2 text-sm text-[var(--ink-soft)]">
        {jurisdiction ? (
          <p>
            <span className="font-medium text-[var(--ink)]">Jurisdiction: </span>
            {jurisdiction}
          </p>
        ) : null}
        {locationSummary ? (
          <p>
            <span className="font-medium text-[var(--ink)]">Location: </span>
            {locationSummary}
          </p>
        ) : (
          <p>Location summary will appear when published.</p>
        )}
        {hasCoords && lat != null && lng != null ? (
          <p>
            <span className="font-medium text-[var(--ink)]">Approximate coordinates: </span>
            {lat}, {lng}
          </p>
        ) : (
          <p role="status">No valid published coordinates for a map marker.</p>
        )}
      </div>

      {showMap && lat != null && lng != null ? (
        <div className="mt-4">
          <iframe
            title={`Illustrative map of ${projectName}`}
            src={osmEmbedUrl(lat, lng)}
            className="h-48 w-full border-0 bg-[color-mix(in_oklab,var(--ink)_8%,transparent)]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            onError={() => setMapFailed(true)}
          />
          <p className="mt-2 text-xs text-[var(--ink-soft)]">
            Map data ©{' '}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              OpenStreetMap
            </a>{' '}
            contributors.
          </p>
          <button
            type="button"
            className="mt-2 text-xs underline text-[var(--ink-soft)]"
            onClick={() => setMapFailed(true)}
          >
            Hide map and use text location only
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--ink-soft)]" role="status">
          {hasCoords
            ? 'Map unavailable. Use the location details above.'
            : 'Map marker omitted because coordinates are missing or invalid.'}
        </p>
      )}
    </section>
  )
}

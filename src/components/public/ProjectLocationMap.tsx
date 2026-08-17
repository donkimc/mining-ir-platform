'use client'

import { useEffect, useRef, useState } from 'react'

export type ProjectLocationMapProps = {
  projectName: string
  latitude?: number | null
  longitude?: number | null
  locationSummary?: string | null
  jurisdiction?: string | null
}

/** How long to wait for iframe `load` before treating the map as unavailable. */
export const MAP_LOAD_TIMEOUT_MS = 5000

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

/**
 * True when the iframe has already finished loading a real same-origin document.
 * Used so a load that completed before React attached `onLoad` does not arm the
 * failure timeout. Ignores the initial `about:blank` document (always "complete"
 * before the real navigation). Cross-origin frames return false (cannot inspect);
 * those rely on client-only mounting so React owns the element from creation.
 */
export function isIframeAlreadyLoaded(iframe: HTMLIFrameElement | null): boolean {
  if (!iframe) return false
  try {
    const doc = iframe.contentDocument
    if (!doc) return false
    if (doc.readyState !== 'complete') return false
    const url = doc.URL || ''
    if (!url || url === 'about:blank') return false
    return true
  } catch {
    return false
  }
}

/** Arm the failure timeout only when the frame has not already completed. */
export function shouldArmMapLoadTimeout(iframe: HTMLIFrameElement | null): boolean {
  return !isIframeAlreadyLoaded(iframe)
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
 *
 * Failure detection (verified in Chromium): CSP-blocked and unreachable iframe
 * targets fire neither `error` nor `load`. A successful cross-origin OSM embed
 * fires `load`. Therefore we clear a load-timeout on `load` / `error`, and
 * treat timeout as failure so visitors never see a silent blank rectangle.
 *
 * S4-6 approach: mount the iframe **client-side only** so React attaches `onLoad`
 * before navigation starts (SSR HTML previously raced ahead of hydration and missed
 * `load`). Also skip arming the timeout when `shouldArmMapLoadTimeout` is false
 * (already-complete same-origin/test frames). Do not raise MAP_LOAD_TIMEOUT_MS.
 */
export function ProjectLocationMap({
  projectName,
  latitude,
  longitude,
  locationSummary,
  jurisdiction,
}: ProjectLocationMapProps) {
  const [mapFailed, setMapFailed] = useState(false)
  const [clientMounted, setClientMounted] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasCoords = isValidMapCoordinate(latitude, longitude)
  const showMap = hasCoords && !mapFailed
  const lat = hasCoords ? latitude : null
  const lng = hasCoords ? longitude : null

  useEffect(() => {
    setClientMounted(true)
  }, [])

  useEffect(() => {
    if (!showMap || !clientMounted) {
      if (loadTimerRef.current) {
        clearTimeout(loadTimerRef.current)
        loadTimerRef.current = null
      }
      return
    }

    if (!shouldArmMapLoadTimeout(iframeRef.current)) {
      return
    }

    loadTimerRef.current = setTimeout(() => {
      setMapFailed(true)
    }, MAP_LOAD_TIMEOUT_MS)

    return () => {
      if (loadTimerRef.current) {
        clearTimeout(loadTimerRef.current)
        loadTimerRef.current = null
      }
    }
  }, [showMap, clientMounted, lat, lng])

  function clearLoadTimer() {
    if (loadTimerRef.current) {
      clearTimeout(loadTimerRef.current)
      loadTimerRef.current = null
    }
  }

  function handleMapLoad() {
    const iframe = iframeRef.current
    if (iframe) {
      try {
        const doc = iframe.contentDocument
        // Initial about:blank often fires `load` before the real embed navigation.
        // Keep the watchdog armed until a non-blank (or cross-origin) load occurs.
        if (doc && (!doc.URL || doc.URL === 'about:blank')) {
          return
        }
      } catch {
        // Cross-origin document — real embed load.
      }
    }
    clearLoadTimer()
  }

  function handleMapError() {
    clearLoadTimer()
    setMapFailed(true)
  }

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
        clientMounted ? (
          <div className="mt-4">
            <iframe
              ref={iframeRef}
              title={`Illustrative map of ${projectName}`}
              src={osmEmbedUrl(lat, lng)}
              className="h-48 w-full border-0 bg-[color-mix(in_oklab,var(--ink)_8%,transparent)]"
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={handleMapLoad}
              onError={handleMapError}
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
              onClick={() => {
                clearLoadTimer()
                setMapFailed(true)
              }}
            >
              Hide map and use text location only
            </button>
          </div>
        ) : (
          // Reserve space pre-hydration; do not SSR the iframe (S4-6 race).
          <div className="mt-4 h-48 w-full bg-[color-mix(in_oklab,var(--ink)_8%,transparent)]" aria-hidden="true" />
        )
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

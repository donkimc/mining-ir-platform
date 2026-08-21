/**
 * @vitest-environment jsdom
 */
import { createElement } from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  isIframeAlreadyLoaded,
  MAP_LOAD_TIMEOUT_MS,
  ProjectLocationMap,
  shouldArmMapLoadTimeout,
} from '@/components/public/ProjectLocationMap'

function alreadyLoadedIframe(): HTMLIFrameElement {
  const iframe = document.createElement('iframe')
  Object.defineProperty(iframe, 'contentDocument', {
    configurable: true,
    get() {
      return { readyState: 'complete', URL: 'https://example.test/map' } as Document
    },
  })
  return iframe
}

describe('isIframeAlreadyLoaded / shouldArmMapLoadTimeout (S4-6)', () => {
  it('detects an already-complete iframe and does not arm the timeout', () => {
    vi.useFakeTimers()
    const iframe = alreadyLoadedIframe()
    expect(isIframeAlreadyLoaded(iframe)).toBe(true)
    expect(shouldArmMapLoadTimeout(iframe)).toBe(false)

    const onTimeout = vi.fn()
    if (shouldArmMapLoadTimeout(iframe)) {
      setTimeout(onTimeout, MAP_LOAD_TIMEOUT_MS)
    }
    vi.advanceTimersByTime(MAP_LOAD_TIMEOUT_MS + 50)
    expect(onTimeout).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('arms the timeout when the iframe has not completed', () => {
    expect(shouldArmMapLoadTimeout(null)).toBe(true)
    const iframe = document.createElement('iframe')
    expect(isIframeAlreadyLoaded(iframe)).toBe(false)
    expect(shouldArmMapLoadTimeout(iframe)).toBe(true)
  })

  it('does not treat about:blank as already loaded', () => {
    const iframe = document.createElement('iframe')
    Object.defineProperty(iframe, 'contentDocument', {
      configurable: true,
      get() {
        return { readyState: 'complete', URL: 'about:blank' } as Document
      },
    })
    expect(isIframeAlreadyLoaded(iframe)).toBe(false)
    expect(shouldArmMapLoadTimeout(iframe)).toBe(true)
  })
})

describe('ProjectLocationMap load watchdog (S4-6)', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    vi.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    vi.useRealTimers()
  })

  it('keeps the map visible past the timeout after a successful onLoad', async () => {
    await act(async () => {
      root.render(
        createElement(ProjectLocationMap, {
          projectName: 'Northridge Belt',
          latitude: 53.12,
          longitude: -121.58,
          locationSummary: 'Cariboo',
          jurisdiction: 'British Columbia',
        }),
      )
    })

    await act(async () => {
      await Promise.resolve()
    })

    const iframe = container.querySelector('iframe')
    expect(iframe).not.toBeNull()

    await act(async () => {
      iframe!.dispatchEvent(new Event('load'))
    })

    await act(async () => {
      vi.advanceTimersByTime(MAP_LOAD_TIMEOUT_MS + 2000)
    })

    expect(container.querySelector('iframe')).not.toBeNull()
    expect(container.textContent).not.toContain('Map unavailable')
  })

  it('shows Map unavailable when the load timeout fires without onLoad', async () => {
    await act(async () => {
      root.render(
        createElement(ProjectLocationMap, {
          projectName: 'Northridge Belt',
          latitude: 53.12,
          longitude: -121.58,
        }),
      )
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(container.querySelector('iframe')).not.toBeNull()

    await act(async () => {
      vi.advanceTimersByTime(MAP_LOAD_TIMEOUT_MS + 100)
    })

    expect(container.querySelector('iframe')).toBeNull()
    expect(container.textContent).toContain('Map unavailable. Use the location details above.')
  })
})

import { describe, it, expect } from 'vitest'
import {
  edgesFrom,
  shortestPath,
  reach,
  predecessors
} from './journey-graph.js'

describe('journey-graph edgesFrom', () => {
  it('follows multi-select routing instead of treating answers as terminal', () => {
    const targets = edgesFrom('/dredging/activities').map((e) => e.to)
    expect(targets).toContain('/activity/completion')
    expect(targets).toContain('/standard-marine-licence-application/other-clearance-dredging')
  })

  it('follows outcome-fork (intermediate outcome) nextQuestionRoute', () => {
    const targets = edgesFrom('/exemption/dredging-exe-not-available-continue').map((e) => e.to)
    expect(targets).toContain('/dredging/activity')
  })

  it('emits one edge per answer for a single-select question', () => {
    const targets = edgesFrom('/sea').map((e) => e.to)
    expect(targets).toContain('/jurisdiction')
  })

  it('returns no edges for an unknown route', () => {
    expect(edgesFrom('/no-such-route')).toEqual([])
  })
})

describe('journey-graph shortestPath', () => {
  it('reaches /mod-permission from /sea via the multi-select bridge', () => {
    const steps = shortestPath('/mod-permission')
    expect(steps).not.toBeNull()
    expect(steps[0].from).toBe('/sea')
    expect(steps.at(-1).to).toBe('/mod-permission')
    // regression guard: without multi-select edges this page is unreachable
    expect(steps.some((s) => s.to === '/activity/completion')).toBe(true)
  })

  it('reaches the self-service grant /fast-track-mla from /sea', () => {
    const steps = shortestPath('/fast-track-mla')
    expect(steps).not.toBeNull()
    expect(steps.at(-1).to).toBe('/fast-track-mla')
  })

  it('returns null for an unreachable route', () => {
    expect(shortestPath('/no-such-route')).toBeNull()
  })

  it('returns an empty path when from === to', () => {
    expect(shortestPath('/sea', { from: '/sea' })).toEqual([])
  })
})

describe('journey-graph reach', () => {
  it('is true for a deep reachable page', () => {
    expect(reach('/mod-permission')).toBe(true)
  })
  it('is false for an unknown route', () => {
    expect(reach('/no-such-route')).toBe(false)
  })
})

describe('journey-graph predecessors', () => {
  it('lists pages that route directly into /military-defence-area', () => {
    const callers = predecessors('/military-defence-area').map((c) => c.route)
    expect(callers).toContain('/single-location')
  })

  it('returns an empty array for the entry point /sea', () => {
    expect(predecessors('/sea')).toEqual([])
  })
})

import { describe, it, expect } from 'vitest'
import { edgesFrom } from './journey-graph.js'

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

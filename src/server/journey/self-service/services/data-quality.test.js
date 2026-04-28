import { vi } from 'vitest'

describe('#reportLoadTimeIssue', () => {
  let reportLoadTimeIssue

  beforeEach(async () => {
    vi.resetModules()
    const mod =
      await import('#src/server/journey/self-service/services/data-quality.js')
    reportLoadTimeIssue = mod.reportLoadTimeIssue
  })

  test('emits ECS-shaped warn line with all required fields', () => {
    const warn = vi.fn()
    const logger = { warn }

    reportLoadTimeIssue(
      logger,
      'outcome-missing-heading',
      '/foo',
      "Set 'heading' on the /foo outcome in self-service.json",
      "outcome '/foo' has no heading; rendering fallback 'Result'"
    )

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(
      {
        event: {
          category: 'iat-data-quality',
          action: 'outcome-missing-heading',
          reference: '/foo',
          reason: "Set 'heading' on the /foo outcome in self-service.json",
          outcome: 'failure'
        }
      },
      "iat-data-quality: outcome '/foo' has no heading; rendering fallback 'Result'"
    )
  })
})

describe('#reportRuntimeIssue', () => {
  let reportRuntimeIssue

  beforeEach(async () => {
    vi.resetModules()
    const mod =
      await import('#src/server/journey/self-service/services/data-quality.js')
    reportRuntimeIssue = mod.reportRuntimeIssue
  })

  test('emits ECS-shaped warn line via request.logger.warn', () => {
    const warn = vi.fn()
    const request = { logger: { warn } }

    reportRuntimeIssue(
      request,
      'unknown-outcome-route',
      '/nope',
      'Add /nope as an outcome or fix the referring answer in self-service.json',
      'GET hit /nope but no outcome with that route exists'
    )

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(
      {
        event: {
          category: 'iat-data-quality',
          action: 'unknown-outcome-route',
          reference: '/nope',
          reason:
            'Add /nope as an outcome or fix the referring answer in self-service.json',
          outcome: 'failure'
        }
      },
      'iat-data-quality: GET hit /nope but no outcome with that route exists'
    )
  })

  test('per-process dedupe: same (action, reference) only logs once', () => {
    const warn = vi.fn()
    const request = { logger: { warn } }

    reportRuntimeIssue(
      request,
      'outcome-missing-heading',
      '/foo',
      'fix it',
      'summary'
    )
    reportRuntimeIssue(
      request,
      'outcome-missing-heading',
      '/foo',
      'fix it',
      'summary'
    )
    reportRuntimeIssue(
      request,
      'outcome-missing-heading',
      '/foo',
      'fix it',
      'summary'
    )

    expect(warn).toHaveBeenCalledTimes(1)
  })

  test('different (action, reference) pairs each log once', () => {
    const warn = vi.fn()
    const request = { logger: { warn } }

    reportRuntimeIssue(request, 'outcome-missing-heading', '/a', 'x', 'y')
    reportRuntimeIssue(request, 'outcome-missing-heading', '/b', 'x', 'y')
    reportRuntimeIssue(request, 'outcome-type-empty-text', '/a', 'x', 'y')

    expect(warn).toHaveBeenCalledTimes(3)
  })
})

describe('#runLoadTimeScan', () => {
  let runLoadTimeScan

  beforeEach(async () => {
    vi.resetModules()
    const mod =
      await import('#src/server/journey/self-service/services/data-quality.js')
    runLoadTimeScan = mod.runLoadTimeScan
  })

  function makeJourney() {
    return {
      firstQuestionRoute: '/q1',
      questions: [
        {
          route: '/q1',
          text: 'q1',
          answers: [
            { id: 'good', text: 'good', nextQuestionRoute: '/q2' },
            { id: 'broken', text: 'broken' }
          ]
        },
        {
          route: '/q2',
          text: 'q2',
          answers: [
            { id: 'a', text: 'a', outcomeRoute: '/o-good' },
            { id: 'b', text: 'b', outcomeRoute: '/o-missing-heading' },
            { id: 'c', text: 'c', outcomeRoute: '/o-empty-types' },
            { id: 'd', text: 'd', outcomeRoute: '/o-bad-ref' }
          ]
        },
        {
          route: '/q3',
          text: 'q3',
          answers: [{ id: 'x', text: 'x', outcomeRoute: '/o-good' }]
        },
        { route: '/q4', text: 'q4', answers: [] }
      ],
      outcomes: [
        {
          route: '/o-good',
          heading: 'Good',
          text: null,
          outcomeTypes: ['T_GOOD']
        },
        {
          route: '/o-missing-heading',
          heading: null,
          text: null,
          outcomeTypes: ['T_GOOD']
        },
        {
          route: '/o-empty-types',
          heading: 'Empty',
          text: null,
          outcomeTypes: []
        },
        {
          route: '/o-bad-ref',
          heading: 'Bad ref',
          text: null,
          outcomeTypes: ['T_GOOD', 'T_DOES_NOT_EXIST']
        },
        {
          route: '/o-orphan',
          heading: 'Orphan',
          text: null,
          outcomeTypes: ['T_GOOD']
        }
      ],
      outcomeTypes: [
        { id: 'T_GOOD', heading: 'Good', text: '<p>body</p>' },
        { id: 'T_EMPTY_TEXT', heading: 'Empty text', text: '' }
      ],
      sections: []
    }
  }

  test('emits at least one warn per detected issue category', () => {
    const warn = vi.fn()
    runLoadTimeScan({ warn }, makeJourney())

    const distinctActions = [
      ...new Set(warn.mock.calls.map(([obj]) => obj.event.action))
    ].sort()

    expect(distinctActions).toEqual(
      [
        'answer-no-route',
        'outcome-empty-outcome-types',
        'outcome-missing-heading',
        'outcome-orphan',
        'outcome-unknown-outcome-type-ref',
        'question-no-answers',
        'question-orphan'
      ].sort()
    )
  })

  test('emits a separate warn per orphan question (one per route)', () => {
    const warn = vi.fn()
    runLoadTimeScan({ warn }, makeJourney())

    const orphanRefs = warn.mock.calls
      .filter(([obj]) => obj.event.action === 'question-orphan')
      .map(([obj]) => obj.event.reference)
      .sort()

    expect(orphanRefs).toEqual(['/q3', '/q4'])
  })

  test('every emitted warn has a non-empty event.reference', () => {
    const warn = vi.fn()
    runLoadTimeScan({ warn }, makeJourney())

    for (const [obj] of warn.mock.calls) {
      expect(obj.event.reference).toBeTruthy()
    }
  })

  test('emits no warns for a clean journey', () => {
    const clean = {
      firstQuestionRoute: '/q1',
      questions: [
        {
          route: '/q1',
          text: 'q1',
          answers: [{ id: 'a', text: 'a', outcomeRoute: '/o' }]
        }
      ],
      outcomes: [
        { route: '/o', heading: 'OK', text: null, outcomeTypes: ['T'] }
      ],
      outcomeTypes: [{ id: 'T', heading: 'T', text: '<p>x</p>' }],
      sections: []
    }
    const warn = vi.fn()
    runLoadTimeScan({ warn }, clean)
    expect(warn).not.toHaveBeenCalled()
  })
})

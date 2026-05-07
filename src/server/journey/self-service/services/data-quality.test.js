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

  test('caps the dedupe Set at 100 entries with FIFO eviction', () => {
    const warn = vi.fn()
    const request = { logger: { warn } }

    for (let i = 0; i < 100; i++) {
      reportRuntimeIssue(request, 'action', `ref-${i}`, 'fix', 'summary')
    }
    expect(warn).toHaveBeenCalledTimes(100)

    reportRuntimeIssue(request, 'action', 'ref-100', 'fix', 'summary')
    expect(warn).toHaveBeenCalledTimes(101)

    reportRuntimeIssue(request, 'action', 'ref-0', 'fix', 'summary')
    expect(warn).toHaveBeenCalledTimes(102)

    reportRuntimeIssue(request, 'action', 'ref-50', 'fix', 'summary')
    expect(warn).toHaveBeenCalledTimes(102)
  })
})

describe('#reportRuntimeError', () => {
  let reportRuntimeError

  beforeEach(async () => {
    vi.resetModules()
    const mod =
      await import('#src/server/journey/self-service/services/data-quality.js')
    reportRuntimeError = mod.reportRuntimeError
  })

  test('emits ECS-shaped error line via request.logger.error (not warn)', () => {
    const error = vi.fn()
    const warn = vi.fn()
    const request = { logger: { error, warn } }

    reportRuntimeError(
      request,
      'answer-no-route',
      '/sea#broken',
      "Add nextQuestionRoute or outcomeRoute to answer 'broken' on /sea",
      "Answer 'broken' on /sea has no route"
    )

    expect(warn).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledTimes(1)
    expect(error).toHaveBeenCalledWith(
      {
        event: {
          action: 'answer-no-route',
          reference: '/sea#broken',
          reason:
            "Add nextQuestionRoute or outcomeRoute to answer 'broken' on /sea",
          outcome: 'failure'
        }
      },
      "iat-data-quality: Answer 'broken' on /sea has no route"
    )
  })

  test('per-process dedupe: same (action, reference) only logs once at error level', () => {
    const error = vi.fn()
    const request = { logger: { error, warn: vi.fn() } }

    reportRuntimeError(request, 'answer-no-route', '/sea#broken', 'fix', 's')
    reportRuntimeError(request, 'answer-no-route', '/sea#broken', 'fix', 's')
    reportRuntimeError(request, 'answer-no-route', '/sea#broken', 'fix', 's')

    expect(error).toHaveBeenCalledTimes(1)
  })

  test('warn-level and error-level dedupe keys do not collide', async () => {
    const mod =
      await import('#src/server/journey/self-service/services/data-quality.js')
    const error = vi.fn()
    const warn = vi.fn()
    const request = { logger: { error, warn } }

    mod.reportRuntimeIssue(request, 'answer-no-route', '/sea#broken', 'f', 's')
    mod.reportRuntimeError(request, 'answer-no-route', '/sea#broken', 'f', 's')

    expect(warn).toHaveBeenCalledTimes(1)
    expect(error).toHaveBeenCalledTimes(1)
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
            { id: 'd', text: 'd', outcomeRoute: '/o-bad-ref' },
            { id: 'e', text: 'e', outcomeRoute: '/o-multi-headingless' }
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
        },
        {
          route: '/o-multi-headingless',
          heading: 'Multi-terminal with a headingless option',
          text: null,
          outcomeTypes: ['T_NO_HEADING', 'T_HEADING_OK']
        }
      ],
      outcomeTypes: [
        { id: 'T_GOOD', heading: 'Good', text: '<p>body</p>' },
        { id: 'T_EMPTY_TEXT', heading: 'Empty text', text: '' },
        { id: 'T_NO_HEADING', text: '<p>no heading</p>', module: 'X' },
        {
          id: 'T_HEADING_OK',
          heading: 'Heading is here',
          text: '<p>ok</p>',
          module: 'Y'
        }
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
        'outcometype-missing-heading',
        'question-no-answers',
        'question-orphan'
      ].sort()
    )
  })

  test('flags only headingless outcomeTypes used on a multi-terminal outcome', () => {
    const warn = vi.fn()
    runLoadTimeScan({ warn }, makeJourney())

    const refs = warn.mock.calls
      .filter(([obj]) => obj.event.action === 'outcometype-missing-heading')
      .map(([obj]) => obj.event.reference)
      .sort()

    expect(refs).toEqual(['T_NO_HEADING'])
  })

  test('does NOT flag headingless outcomeType on a single-terminal outcome', () => {
    const warn = vi.fn()
    runLoadTimeScan(
      { warn },
      {
        firstQuestionRoute: '/q1',
        questions: [
          {
            route: '/q1',
            text: 'q1',
            answers: [{ id: 'a', text: 'a', outcomeRoute: '/single' }]
          }
        ],
        outcomes: [
          {
            route: '/single',
            heading: 'Single',
            text: null,
            outcomeTypes: ['T_NO_HEADING']
          }
        ],
        outcomeTypes: [{ id: 'T_NO_HEADING', text: '<p>x</p>', module: 'X' }],
        sections: []
      }
    )

    const refs = warn.mock.calls
      .filter(([obj]) => obj.event.action === 'outcometype-missing-heading')
      .map(([obj]) => obj.event.reference)

    expect(refs).toEqual([])
  })

  test('does NOT flag headingless outcomeType on an intermediate (fork) outcome', () => {
    const warn = vi.fn()
    runLoadTimeScan(
      { warn },
      {
        firstQuestionRoute: '/q1',
        questions: [
          {
            route: '/q1',
            text: 'q1',
            answers: [{ id: 'a', text: 'a', outcomeRoute: '/fork' }]
          },
          {
            route: '/onwards',
            text: 'onwards',
            answers: [{ id: 'a', text: 'a', outcomeRoute: '/single' }]
          }
        ],
        outcomes: [
          {
            route: '/fork',
            heading: 'Fork',
            text: null,
            outcomeTypes: ['T_NO_HEADING_INTERMEDIATE', 'T_HEADING_TERMINAL']
          },
          {
            route: '/single',
            heading: 'Single',
            text: null,
            outcomeTypes: ['T_HEADING_TERMINAL']
          }
        ],
        outcomeTypes: [
          {
            id: 'T_NO_HEADING_INTERMEDIATE',
            text: '<p>x</p>',
            nextQuestionRoute: '/onwards'
          },
          {
            id: 'T_HEADING_TERMINAL',
            heading: 'OK',
            text: '<p>y</p>',
            module: 'X'
          }
        ],
        sections: []
      }
    )

    const refs = warn.mock.calls
      .filter(([obj]) => obj.event.action === 'outcometype-missing-heading')
      .map(([obj]) => obj.event.reference)

    expect(refs).toEqual([])
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

  test('a multiSelect question reaches its multiSelect.questionRoute and outcomeRoute and skips the per-answer route check', () => {
    const warn = vi.fn()
    runLoadTimeScan(
      { warn },
      {
        firstQuestionRoute: '/q1',
        questions: [
          {
            route: '/q1',
            text: 'q1',
            answers: [
              { id: 'a', text: 'a' },
              { id: 'b', text: 'b' }
            ],
            multiSelect: { questionRoute: '/q2', outcomeRoute: '/o' }
          },
          {
            route: '/q2',
            text: 'q2',
            answers: [{ id: 'c', text: 'c', outcomeRoute: '/o' }]
          }
        ],
        outcomes: [
          { route: '/o', heading: 'O', text: null, outcomeTypes: ['T'] }
        ],
        outcomeTypes: [{ id: 'T', heading: 'T', text: '<p>x</p>' }],
        sections: []
      }
    )

    const actions = warn.mock.calls.map(([obj]) => obj.event.action)
    expect(actions).not.toContain('question-orphan')
    expect(actions).not.toContain('outcome-orphan')
    expect(actions).not.toContain('answer-no-route')
  })

  test('tolerates an answer pointing to a non-existent question route without crashing', () => {
    const warn = vi.fn()
    runLoadTimeScan(
      { warn },
      {
        firstQuestionRoute: '/q1',
        questions: [
          {
            route: '/q1',
            text: 'q1',
            answers: [
              { id: 'a', text: 'a', nextQuestionRoute: '/does-not-exist' },
              { id: 'b', text: 'b', outcomeRoute: '/o' }
            ]
          }
        ],
        outcomes: [
          { route: '/o', heading: 'O', text: null, outcomeTypes: ['T'] }
        ],
        outcomeTypes: [{ id: 'T', heading: 'T', text: '<p>x</p>' }],
        sections: []
      }
    )

    const orphanOutcomes = warn.mock.calls
      .filter(([obj]) => obj.event.action === 'outcome-orphan')
      .map(([obj]) => obj.event.reference)
    expect(orphanOutcomes).toEqual([])
  })

  test(
    'terminates on a cyclic journey (BFS dedup prevents infinite loop)',
    { timeout: 1000 },
    () => {
      const warn = vi.fn()
      runLoadTimeScan(
        { warn },
        {
          firstQuestionRoute: '/q1',
          questions: [
            {
              route: '/q1',
              text: 'q1',
              answers: [{ id: 'a', text: 'a', nextQuestionRoute: '/q2' }]
            },
            {
              route: '/q2',
              text: 'q2',
              answers: [{ id: 'a', text: 'a', nextQuestionRoute: '/q1' }]
            }
          ],
          outcomes: [],
          outcomeTypes: [],
          sections: []
        }
      )

      const orphans = warn.mock.calls
        .filter(([obj]) => obj.event.action === 'question-orphan')
        .map(([obj]) => obj.event.reference)
      expect(orphans).toEqual([])
    }
  )

  test('tolerates a reachable question with no answers field', () => {
    const warn = vi.fn()
    runLoadTimeScan(
      { warn },
      {
        firstQuestionRoute: '/q1',
        questions: [
          {
            route: '/q1',
            text: 'q1',
            answers: [{ id: 'a', text: 'a', nextQuestionRoute: '/q2' }]
          },
          { route: '/q2', text: 'q2' }
        ],
        outcomes: [],
        outcomeTypes: [],
        sections: []
      }
    )

    const noAnswersRefs = warn.mock.calls
      .filter(([obj]) => obj.event.action === 'question-no-answers')
      .map(([obj]) => obj.event.reference)
    const orphanRefs = warn.mock.calls
      .filter(([obj]) => obj.event.action === 'question-orphan')
      .map(([obj]) => obj.event.reference)

    expect(noAnswersRefs).toContain('/q2')
    expect(orphanRefs).not.toContain('/q2')
  })
})

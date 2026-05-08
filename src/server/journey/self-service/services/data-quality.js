const CATEGORY = 'iat-data-quality'

const MAX_SEEN_RUNTIME_ISSUES = 100
const seenRuntimeIssues = new Set()

function buildEvent(action, reference, fix) {
  return {
    action,
    reference,
    reason: fix,
    outcome: 'failure'
  }
}

export function reportLoadTimeIssue(logger, action, reference, fix, summary) {
  logger.warn(
    { event: buildEvent(action, reference, fix) },
    `${CATEGORY}: ${summary}`
  )
}

export function reportRuntimeIssue(request, action, reference, fix, summary) {
  emitRuntime(request, 'warn', action, reference, fix, summary)
}

export function reportRuntimeError(request, action, reference, fix, summary) {
  emitRuntime(request, 'error', action, reference, fix, summary)
}

function emitRuntime(request, level, action, reference, fix, summary) {
  const key = `${level}:${action}:${reference}`
  if (seenRuntimeIssues.has(key)) {
    return
  }
  if (seenRuntimeIssues.size >= MAX_SEEN_RUNTIME_ISSUES) {
    const oldest = seenRuntimeIssues.values().next().value
    seenRuntimeIssues.delete(oldest)
  }
  seenRuntimeIssues.add(key)
  request.logger[level](
    { event: buildEvent(action, reference, fix) },
    `${CATEGORY}: ${summary}`
  )
}

export function runLoadTimeScan(logger, journeyData) {
  const ctx = buildScanContext(journeyData)
  for (const question of journeyData.questions) {
    checkQuestion(logger, question, ctx)
  }
  for (const outcome of journeyData.outcomes) {
    checkOutcome(logger, outcome, ctx)
  }
}

function buildScanContext(journeyData) {
  const outcomeTypesById = new Map(
    journeyData.outcomeTypes.map((ot) => [ot.id, ot])
  )
  const outcomeTypeIds = new Set(outcomeTypesById.keys())
  const reachableQuestions = new Set()
  const reachableOutcomes = new Set()
  walkReachable(journeyData, reachableQuestions, reachableOutcomes)
  return {
    firstQuestionRoute: journeyData.firstQuestionRoute,
    outcomeTypesById,
    outcomeTypeIds,
    reachableQuestions,
    reachableOutcomes
  }
}

function checkQuestion(logger, question, ctx) {
  const hasAnswers =
    Array.isArray(question.answers) && question.answers.length > 0
  if (!hasAnswers) {
    reportLoadTimeIssue(
      logger,
      'question-no-answers',
      question.route,
      `Add at least one answer to question ${question.route} in self-service.json`,
      `question ${question.route} has no answers`
    )
  }
  if (hasAnswers && !question.multiSelect) {
    checkAnswerRoutes(logger, question)
  }
  checkQuestionReachability(logger, question, ctx)
}

function checkAnswerRoutes(logger, question) {
  for (const answer of question.answers) {
    if (answer.nextQuestionRoute || answer.outcomeRoute) {
      continue
    }
    reportLoadTimeIssue(
      logger,
      'answer-no-route',
      `${question.route}#${answer.id}`,
      `Add nextQuestionRoute or outcomeRoute to answer '${answer.id}' on ${question.route}`,
      `answer '${answer.id}' on question ${question.route} has neither nextQuestionRoute nor outcomeRoute`
    )
  }
}

function checkQuestionReachability(logger, question, ctx) {
  if (question.route === ctx.firstQuestionRoute) {
    return
  }
  if (ctx.reachableQuestions.has(question.route)) {
    return
  }
  reportLoadTimeIssue(
    logger,
    'question-orphan',
    question.route,
    `Either link to ${question.route} from an answer/outcomeType, or remove it from self-service.json`,
    `question ${question.route} is defined but unreachable from any answer or outcomeType`
  )
}

function checkOutcome(logger, outcome, ctx) {
  if (!outcome.heading) {
    reportLoadTimeIssue(
      logger,
      'outcome-missing-heading',
      outcome.route,
      `Set 'heading' on the ${outcome.route} outcome in self-service.json`,
      `outcome ${outcome.route} has no heading`
    )
  }
  checkOutcomeTypes(logger, outcome, ctx)
  checkOutcomeReachability(logger, outcome, ctx)
}

function checkOutcomeTypes(logger, outcome, ctx) {
  if (
    !Array.isArray(outcome.outcomeTypes) ||
    outcome.outcomeTypes.length === 0
  ) {
    reportLoadTimeIssue(
      logger,
      'outcome-empty-outcome-types',
      outcome.route,
      `Add at least one outcomeType to ${outcome.route} in self-service.json`,
      `outcome ${outcome.route} has an empty outcomeTypes array`
    )
    return
  }
  reportUnknownOutcomeTypeRefs(logger, outcome, ctx)
  if (isMultiTerminal(outcome, ctx.outcomeTypesById)) {
    reportHeadinglessMultiTerminalTypes(logger, outcome, ctx)
  }
}

function reportUnknownOutcomeTypeRefs(logger, outcome, ctx) {
  for (const id of outcome.outcomeTypes) {
    if (ctx.outcomeTypeIds.has(id)) {
      continue
    }
    reportLoadTimeIssue(
      logger,
      'outcome-unknown-outcome-type-ref',
      outcome.route,
      `Fix the id reference or add the '${id}' outcomeType definition in self-service.json`,
      `outcome ${outcome.route} references outcomeType '${id}', which is not defined`
    )
  }
}

function reportHeadinglessMultiTerminalTypes(logger, outcome, ctx) {
  for (const id of outcome.outcomeTypes) {
    const ot = ctx.outcomeTypesById.get(id)
    if (!ot || ot.heading) {
      continue
    }
    reportLoadTimeIssue(
      logger,
      'outcometype-missing-heading',
      id,
      `Set 'heading' on outcomeType ${id} in self-service.json — it renders as an option card on multi-terminal outcome ${outcome.route}`,
      `outcomeType ${id} has no heading; renders as a stranded "Option N" card on ${outcome.route}`
    )
  }
}

function checkOutcomeReachability(logger, outcome, ctx) {
  if (ctx.reachableOutcomes.has(outcome.route)) {
    return
  }
  reportLoadTimeIssue(
    logger,
    'outcome-orphan',
    outcome.route,
    `Either link to ${outcome.route} from an answer or outcomeType, or remove it from self-service.json`,
    `outcome ${outcome.route} is defined but unreachable from any answer or outcomeType`
  )
}

function isMultiTerminal(outcome, outcomeTypesById) {
  const types = (outcome.outcomeTypes ?? [])
    .map((id) => outcomeTypesById.get(id))
    .filter(Boolean)
  if (types.length < 2) {
    return false
  }
  return types.every((ot) => !ot.nextQuestionRoute)
}

/**
 * walkReachable() has 4 steps:--
 *   1. Building per-call lookup indexes (questionsByRoute, outcomesByRoute, outcomeTypesById) from the supplied
 *      journeyData rather than the module singleton — so the load-time scan can run against synthetic test fixtures
 *   2. Seeding a queue with the first question, then popping nodes one at a time and dispatching to visitQuestion or
 *      visitOutcome based on node.kind
 *   3. For each unvisited question, marking it reachable and enqueuing its successors — either the multi-select
 *      branches (questionRoute / outcomeRoute) or each answer's nextQuestionRoute / outcomeRoute
 *   4. For each unvisited outcome, marking it reachable and enqueuing any nextQuestionRoute exposed by its referenced
 *      outcomeTypes — that's how a terminal-typed outcome can loop back into another question
 *
 *   The two output sets it fills are then consumed by checkQuestionReachability and checkOutcomeReachability
 *   flag any question or outcome defined in self-service.json that no path from the entry point can reach — the
 *   "orphan" diagnostics.
 */
function walkReachable(journeyData, reachableQuestions, reachableOutcomes) {
  // Build indexes from the passed-in journeyData rather than reusing the ones
  // in journey-data.js — the scan must be runnable against synthetic fixtures
  // in tests, not just the singleton self-service.json.
  const idx = buildJourneyIndexes(journeyData)
  const queue = [{ kind: 'question', route: journeyData.firstQuestionRoute }]
  while (queue.length > 0) {
    const node = queue.shift()
    if (node.kind === 'question') {
      visitQuestion(node, queue, idx, reachableQuestions)
    } else {
      visitOutcome(node, queue, idx, reachableOutcomes)
    }
  }
}

function buildJourneyIndexes(journeyData) {
  return {
    questionsByRoute: new Map(journeyData.questions.map((q) => [q.route, q])),
    outcomesByRoute: new Map(journeyData.outcomes.map((o) => [o.route, o])),
    outcomeTypesById: new Map(journeyData.outcomeTypes.map((t) => [t.id, t]))
  }
}

function visitQuestion(node, queue, idx, reachableQuestions) {
  if (reachableQuestions.has(node.route)) {
    return
  }
  reachableQuestions.add(node.route)
  const q = idx.questionsByRoute.get(node.route)
  if (!q) {
    return
  }
  if (q.multiSelect) {
    enqueueMultiSelect(q.multiSelect, queue)
    return
  }
  for (const answer of q.answers ?? []) {
    enqueueAnswer(answer, queue)
  }
}

function enqueueMultiSelect(multiSelect, queue) {
  if (multiSelect.questionRoute) {
    queue.push({ kind: 'question', route: multiSelect.questionRoute })
  }
  if (multiSelect.outcomeRoute) {
    queue.push({ kind: 'outcome', route: multiSelect.outcomeRoute })
  }
}

function enqueueAnswer(answer, queue) {
  if (answer.nextQuestionRoute) {
    queue.push({ kind: 'question', route: answer.nextQuestionRoute })
  }
  if (answer.outcomeRoute) {
    queue.push({ kind: 'outcome', route: answer.outcomeRoute })
  }
}

function visitOutcome(node, queue, idx, reachableOutcomes) {
  if (reachableOutcomes.has(node.route)) {
    return
  }
  reachableOutcomes.add(node.route)
  const o = idx.outcomesByRoute.get(node.route)
  if (!o) {
    return
  }
  for (const id of o.outcomeTypes ?? []) {
    const ot = idx.outcomeTypesById.get(id)
    if (ot?.nextQuestionRoute) {
      queue.push({ kind: 'question', route: ot.nextQuestionRoute })
    }
  }
}

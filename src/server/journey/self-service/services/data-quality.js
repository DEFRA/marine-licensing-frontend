const CATEGORY = 'iat-data-quality'

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
  const key = `${action}:${reference}`
  if (seenRuntimeIssues.has(key)) return
  seenRuntimeIssues.add(key)
  request.logger.warn(
    { event: buildEvent(action, reference, fix) },
    `${CATEGORY}: ${summary}`
  )
}

export function runLoadTimeScan(logger, journeyData) {
  const outcomeTypesById = new Map(
    journeyData.outcomeTypes.map((ot) => [ot.id, ot])
  )
  const outcomeTypeIds = new Set(outcomeTypesById.keys())
  const reachableQuestions = new Set()
  const reachableOutcomes = new Set()

  walkReachable(journeyData, reachableQuestions, reachableOutcomes)

  for (const question of journeyData.questions) {
    if (!Array.isArray(question.answers) || question.answers.length === 0) {
      reportLoadTimeIssue(
        logger,
        'question-no-answers',
        question.route,
        `Add at least one answer to question ${question.route} in self-service.json`,
        `question ${question.route} has no answers`
      )
      continue
    }
    if (question.multiSelect) continue
    for (const answer of question.answers) {
      const hasRoute = answer.nextQuestionRoute || answer.outcomeRoute
      if (!hasRoute) {
        reportLoadTimeIssue(
          logger,
          'answer-no-route',
          `${question.route}#${answer.id}`,
          `Add nextQuestionRoute or outcomeRoute to answer '${answer.id}' on ${question.route}`,
          `answer '${answer.id}' on question ${question.route} has neither nextQuestionRoute nor outcomeRoute`
        )
      }
    }
  }

  for (const question of journeyData.questions) {
    if (
      question.route !== journeyData.firstQuestionRoute &&
      !reachableQuestions.has(question.route)
    ) {
      reportLoadTimeIssue(
        logger,
        'question-orphan',
        question.route,
        `Either link to ${question.route} from an answer/outcomeType, or remove it from self-service.json`,
        `question ${question.route} is defined but unreachable from any answer or outcomeType`
      )
    }
  }

  for (const outcome of journeyData.outcomes) {
    if (!outcome.heading) {
      reportLoadTimeIssue(
        logger,
        'outcome-missing-heading',
        outcome.route,
        `Set 'heading' on the ${outcome.route} outcome in self-service.json`,
        `outcome ${outcome.route} has no heading`
      )
    }
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
    } else {
      for (const id of outcome.outcomeTypes) {
        if (!outcomeTypeIds.has(id)) {
          reportLoadTimeIssue(
            logger,
            'outcome-unknown-outcome-type-ref',
            outcome.route,
            `Fix the id reference or add the '${id}' outcomeType definition in self-service.json`,
            `outcome ${outcome.route} references outcomeType '${id}', which is not defined`
          )
        }
      }
      if (isMultiTerminal(outcome, outcomeTypesById)) {
        for (const id of outcome.outcomeTypes) {
          const ot = outcomeTypesById.get(id)
          if (ot && !ot.heading) {
            reportLoadTimeIssue(
              logger,
              'outcometype-missing-heading',
              id,
              `Set 'heading' on outcomeType ${id} in self-service.json — it renders as an option card on multi-terminal outcome ${outcome.route}`,
              `outcomeType ${id} has no heading; renders as a stranded "Option N" card on ${outcome.route}`
            )
          }
        }
      }
    }
    if (!reachableOutcomes.has(outcome.route)) {
      reportLoadTimeIssue(
        logger,
        'outcome-orphan',
        outcome.route,
        `Either link to ${outcome.route} from an answer or outcomeType, or remove it from self-service.json`,
        `outcome ${outcome.route} is defined but unreachable from any answer or outcomeType`
      )
    }
  }
}

function isMultiTerminal(outcome, outcomeTypesById) {
  const types = (outcome.outcomeTypes ?? [])
    .map((id) => outcomeTypesById.get(id))
    .filter(Boolean)
  if (types.length < 2) return false
  return types.every((ot) => !ot.nextQuestionRoute)
}

function walkReachable(journeyData, reachableQuestions, reachableOutcomes) {
  // Build indexes from the passed-in journeyData rather than reusing the ones
  // in journey-data.js — the scan must be runnable against synthetic fixtures
  // in tests, not just the singleton self-service.json.
  const questionsByRoute = new Map(
    journeyData.questions.map((q) => [q.route, q])
  )
  const outcomesByRoute = new Map(journeyData.outcomes.map((o) => [o.route, o]))
  const outcomeTypesById = new Map(
    journeyData.outcomeTypes.map((t) => [t.id, t])
  )

  const queue = [{ kind: 'question', route: journeyData.firstQuestionRoute }]
  while (queue.length > 0) {
    const node = queue.shift()
    if (node.kind === 'question') {
      if (reachableQuestions.has(node.route)) continue
      reachableQuestions.add(node.route)
      const q = questionsByRoute.get(node.route)
      if (!q) continue
      if (q.multiSelect) {
        if (q.multiSelect.questionRoute) {
          queue.push({ kind: 'question', route: q.multiSelect.questionRoute })
        }
        if (q.multiSelect.outcomeRoute) {
          queue.push({ kind: 'outcome', route: q.multiSelect.outcomeRoute })
        }
        continue
      }
      for (const answer of q.answers ?? []) {
        if (answer.nextQuestionRoute) {
          queue.push({ kind: 'question', route: answer.nextQuestionRoute })
        }
        if (answer.outcomeRoute) {
          queue.push({ kind: 'outcome', route: answer.outcomeRoute })
        }
      }
    } else {
      if (reachableOutcomes.has(node.route)) continue
      reachableOutcomes.add(node.route)
      const o = outcomesByRoute.get(node.route)
      if (!o) continue
      for (const id of o.outcomeTypes ?? []) {
        const ot = outcomeTypesById.get(id)
        if (ot?.nextQuestionRoute) {
          queue.push({ kind: 'question', route: ot.nextQuestionRoute })
        }
      }
    }
  }
}

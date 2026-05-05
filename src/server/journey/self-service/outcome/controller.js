import Boom from '@hapi/boom'
import {
  getOutcome,
  getOutcomeType,
  getOutcomeTypesForOutcome,
  isIntermediateOutcome,
  ROUTE_PREFIX
} from '#src/server/journey/self-service/services/journey-data.js'
import {
  getBackLink,
  pushOutcomeSelection
} from '#src/server/journey/self-service/services/session-answers.js'
import { reportRuntimeIssue } from '#src/server/journey/self-service/services/data-quality.js'
import {
  buildIntermediateView,
  buildTerminalMultiView,
  buildTerminalSingleView,
  classifyOutcome,
  outcomeRouteFromRequest
} from '#src/server/journey/self-service/outcome/utils.js'

const VIEW_PATH = 'journey/self-service/outcome/index'

function loadOutcome(request) {
  const outcomeRoute = outcomeRouteFromRequest(request)
  const outcome = getOutcome(outcomeRoute)

  if (!outcome) {
    reportRuntimeIssue(
      request,
      'unknown-outcome-route',
      outcomeRoute,
      `Add ${outcomeRoute} as an outcome or fix the referring answer in self-service.json`,
      `unknown outcome route ${outcomeRoute}`
    )
    throw Boom.notFound('Outcome not found')
  }

  return { outcomeRoute, outcome }
}

function loadIntermediateOutcome(request) {
  const { outcomeRoute, outcome } = loadOutcome(request)
  if (!isIntermediateOutcome(outcome)) {
    reportRuntimeIssue(
      request,
      'post-on-non-intermediate-outcome',
      outcomeRoute,
      `If users should be able to choose an option on ${outcomeRoute}, add an outcomeType with nextQuestionRoute to it in self-service.json; otherwise investigate where the POST originated`,
      `POST ${outcomeRoute} hit but the outcome has no outcomeTypes with nextQuestionRoute`
    )
    throw Boom.notFound('Outcome not found')
  }
  return { outcomeRoute, outcome }
}

function loadOutcomeForGet(request) {
  const { outcomeRoute, outcome } = loadOutcome(request)

  const types = getOutcomeTypesForOutcome(outcome)
  if (types.length === 0) {
    reportRuntimeIssue(
      request,
      'outcome-empty-outcome-types',
      outcomeRoute,
      `Add at least one resolvable outcomeType to ${outcomeRoute} in self-service.json`,
      `outcome ${outcomeRoute} resolved to zero outcomeTypes`
    )
    throw Boom.notFound('Outcome has no resolvable outcomeTypes')
  }

  return { outcomeRoute, outcome, types }
}

function logEmptyTextIfNeeded(request, outcomeType) {
  if (outcomeType.text) {
    return
  }
  reportRuntimeIssue(
    request,
    'outcome-type-empty-text',
    outcomeType.id,
    `Set 'text' on outcomeType ${outcomeType.id} in self-service.json`,
    `outcomeType ${outcomeType.id} has empty text; rendering with no body`
  )
}

function logMissingHeadingIfNeeded(request, outcomeRoute, outcome) {
  if (outcome.heading) {
    return
  }
  reportRuntimeIssue(
    request,
    'outcome-missing-heading',
    outcomeRoute,
    `Set 'heading' on the ${outcomeRoute} outcome in self-service.json`,
    `outcome ${outcomeRoute} has no heading; rendering fallback 'Result'`
  )
}

export const outcomeController = {
  handler(request, h) {
    const { outcomeRoute, outcome, types } = loadOutcomeForGet(request)
    const classification = classifyOutcome(outcome)
    logMissingHeadingIfNeeded(request, outcomeRoute, outcome)
    const heading = outcome.heading ?? 'Result'

    const baseModel = {
      classification,
      heading,
      pageTitle: heading,
      outcome,
      backLink: getBackLink(request, outcomeRoute, 'outcome')
    }

    if (classification === 'intermediate') {
      return h.view(VIEW_PATH, buildIntermediateView(baseModel, outcome, types))
    }

    if (classification === 'terminal-single') {
      const [ot] = types
      logEmptyTextIfNeeded(request, ot)
      return h.view(VIEW_PATH, buildTerminalSingleView(baseModel, ot))
    }

    for (const ot of types) {
      logEmptyTextIfNeeded(request, ot)
    }
    return h.view(VIEW_PATH, buildTerminalMultiView(baseModel, types))
  }
}

export const outcomePostController = {
  handler(request, h) {
    const { outcomeRoute, outcome } = loadIntermediateOutcome(request)

    const outcomeTypeId = request.payload?.outcomeType
    const outcomeType = outcomeTypeId ? getOutcomeType(outcomeTypeId) : null

    const validChoice =
      outcomeType &&
      outcome.outcomeTypes.includes(outcomeTypeId) &&
      outcomeType.nextQuestionRoute

    if (!validChoice) {
      reportRuntimeIssue(
        request,
        'invalid-outcome-selection',
        outcomeRoute,
        `If outcomeType '${outcomeTypeId}' should be selectable on ${outcomeRoute}, add it to outcomeTypes in self-service.json or fix the form payload`,
        `POST ${outcomeRoute} rejected outcomeType '${outcomeTypeId}'`
      )
      throw Boom.badRequest('Invalid outcome selection')
    }

    pushOutcomeSelection(request, outcomeRoute, outcomeTypeId)

    const target = outcomeType.nextQuestionRoute.replace(/^\//, '')
    return h.redirect(`${ROUTE_PREFIX}/${target}`)
  }
}

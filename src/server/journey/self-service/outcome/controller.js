import Boom from '@hapi/boom'
import {
  getOutcome,
  getOutcomeType,
  getOutcomeTypesForOutcome,
  getSection,
  isIntermediateOutcome,
  ROUTE_PREFIX
} from '#src/server/journey/self-service/services/journey-data.js'
import {
  getBackLink,
  pushOutcomeSelection
} from '#src/server/journey/self-service/services/session-answers.js'
import { reportRuntimeIssue } from '#src/server/journey/self-service/services/data-quality.js'

const VIEW_PATH = 'journey/self-service/outcome/index'

function loadIntermediateOutcome(request) {
  const outcomeRoute = '/' + request.params.outcomePath
  const outcome = getOutcome(outcomeRoute)

  if (!outcome || !isIntermediateOutcome(outcome)) {
    // only log for a truly unknown route — terminal-outcome 404s are defence-in-depth against forged POSTs, not data errors
    if (!outcome) {
      reportRuntimeIssue(
        request,
        'unknown-outcome-route',
        outcomeRoute,
        `Add ${outcomeRoute} as an outcome or fix the referring answer in self-service.json`,
        `unknown outcome route ${outcomeRoute}`
      )
    }
    throw Boom.notFound('Outcome not found')
  }

  return { outcomeRoute, outcome }
}

export const outcomeController = {
  handler(request, h) {
    const { outcomeRoute, outcome } = loadIntermediateOutcome(request)
    const section = outcome.section ? getSection(outcome.section) : null

    const options = getOutcomeTypesForOutcome(outcome).map((ot) => ({
      id: ot.id,
      heading: ot.heading,
      text: ot.text,
      isTerminal: !ot.nextQuestionRoute
    }))

    return h.view(VIEW_PATH, {
      pageTitle: outcome.heading,
      outcome,
      section,
      options,
      backLink: getBackLink(request, outcomeRoute, 'outcome')
    })
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

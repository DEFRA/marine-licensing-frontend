import Boom from '@hapi/boom'
import {
  getOutcome,
  getOutcomeType,
  getOutcomeTypesForOutcome,
  isIntermediateOutcome
} from '#src/server/journey/self-service/services/journey-data.js'
import { getBackLink } from '#src/server/journey/self-service/services/journey-answer-log.js'
import { reportRuntimeIssue } from '#src/server/journey/self-service/services/data-quality.js'
import {
  buildIntermediateView,
  buildSnapshotPayload,
  buildTerminalMultiView,
  buildTerminalSingleView,
  classifyOutcome,
  outcomeRouteFromRequest
} from '#src/server/journey/self-service/outcome/utils.js'
import { iatContextService } from '#src/services/iat-service/iat-context.service.js'
import { iatOutcomeDocumentService } from '#src/services/iat-service/iat-outcome-document.service.js'
import { routes } from '#src/server/common/constants/routes.js'

const VIEW_PATH = 'journey/self-service/outcome/index'

function slugFromRequest(request) {
  return request.params.slug
}

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

function buildOutcomeAnswerPayload(outcomeRoute, outcome, outcomeType) {
  const questionText =
    outcomeType.text || outcome.heading || outcome.text || outcomeRoute
  return {
    questionRoute: outcomeRoute,
    questionText,
    answers: [
      { id: outcomeType.id, text: outcomeType.heading ?? outcomeType.id }
    ],
    mcmsAppFormMapping: null
  }
}

function renderTerminalSingle(request, h, baseModel, types) {
  const [ot] = types
  logEmptyTextIfNeeded(request, ot)
  return h.view(VIEW_PATH, buildTerminalSingleView(baseModel, ot))
}

function renderTerminalMulti(request, h, baseModel, types) {
  for (const ot of types) {
    logEmptyTextIfNeeded(request, ot)
  }
  return h.view(VIEW_PATH, buildTerminalMultiView(baseModel, types))
}

export const outcomeController = {
  async handler(request, h) {
    const { outcomeRoute, outcome, types } = loadOutcomeForGet(request)
    const slug = slugFromRequest(request)
    const classification = classifyOutcome(outcome)
    logMissingHeadingIfNeeded(request, outcomeRoute, outcome)
    const heading = outcome.heading ?? 'Result'

    const baseModel = {
      classification,
      heading,
      pageTitle: heading,
      outcome,
      outcomeRoute,
      slug,
      backLink: getBackLink(request, slug, outcomeRoute)
    }

    if (classification === 'intermediate') {
      return h.view(VIEW_PATH, buildIntermediateView(baseModel, outcome, types))
    }

    if (classification === 'terminal-single') {
      return renderTerminalSingle(request, h, baseModel, types)
    }

    return renderTerminalMulti(request, h, baseModel, types)
  }
}

function validateIntermediateChoice(
  outcomeTypeId,
  outcomeType,
  outcome,
  outcomeRoute,
  request
) {
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
}

export const outcomePostController = {
  async handler(request, h) {
    const { outcomeRoute, outcome } = loadIntermediateOutcome(request)
    const slug = slugFromRequest(request)

    const outcomeTypeId = request.payload?.outcomeType
    const outcomeType = outcomeTypeId ? getOutcomeType(outcomeTypeId) : null

    validateIntermediateChoice(
      outcomeTypeId,
      outcomeType,
      outcome,
      outcomeRoute,
      request
    )

    await iatContextService.patch(
      request,
      slug,
      buildOutcomeAnswerPayload(outcomeRoute, outcome, outcomeType)
    )

    const target = outcomeType.nextQuestionRoute.replace(/^\//, '')
    return h.redirect(`/journey/self-service/c/${slug}/${target}`)
  }
}

function validateOutcomeTypeId(
  outcomeTypeId,
  outcomeType,
  outcome,
  outcomeRoute,
  request
) {
  if (!outcomeType || !outcome.outcomeTypes.includes(outcomeTypeId)) {
    reportRuntimeIssue(
      request,
      'invalid-outcome-selection',
      outcomeRoute,
      `If outcomeType '${outcomeTypeId}' should be selectable on ${outcomeRoute}, add it to outcomeTypes in self-service.json or fix the trigger link`,
      `GET view-answers ${outcomeRoute} rejected outcomeType '${outcomeTypeId}'`
    )
    throw Boom.badRequest('Invalid outcome selection')
  }
}

export const outcomeViewAnswersController = {
  async handler(request, h) {
    const { outcomeRoute, outcome } = loadOutcome(request)
    const slug = slugFromRequest(request)
    const outcomeTypeId = request.params.outcomeTypeId
    const outcomeType = outcomeTypeId ? getOutcomeType(outcomeTypeId) : null

    validateOutcomeTypeId(
      outcomeTypeId,
      outcomeType,
      outcome,
      outcomeRoute,
      request
    )

    const payload = buildSnapshotPayload(outcome, outcomeRoute, outcomeTypeId)
    const minted = await iatOutcomeDocumentService.mint(request, slug, payload)
    if (!minted?.slug) {
      throw Boom.badImplementation('outcome-document mint returned no slug')
    }
    return h.redirect(routes.OUTCOME_DOCUMENT.replace('{slug}', minted.slug))
  }
}

import {
  getDocumentPreambleText,
  getOutcomeTypesForOutcome,
  getSection
} from '#src/server/journey/self-service/services/journey-data.js'

export function outcomeRouteFromRequest(request) {
  return '/' + request.params.outcomePath
}

export function classifyOutcome(outcome) {
  const types = getOutcomeTypesForOutcome(outcome)
  if (types.some((ot) => ot.nextQuestionRoute)) {
    return 'intermediate'
  }
  return types.length > 1 ? 'terminal-multi' : 'terminal-single'
}

export function ctaLabelFor(outcomeType) {
  if (outcomeType.overrideCtaButtonText) {
    return outcomeType.overrideCtaButtonText
  }
  if (outcomeType.link) {
    return 'Download'
  }
  return 'Continue'
}

export function hasContinueFor(outcomeType) {
  return Boolean(
    outcomeType.module ||
    outcomeType.nextQuestionRoute ||
    outcomeType.link ||
    outcomeType.overrideCtaButtonText
  )
}

function viewAnswersUrlFor(slug, outcomeRoute, outcomeTypeId) {
  const tail = outcomeRoute.replace(/^\//, '')
  return `/journey/self-service/c/${slug}/view-answers/${outcomeTypeId}/${tail}`
}

export function buildIntermediateView(baseModel, outcome, types) {
  const section = outcome.section ? getSection(outcome.section) : null
  return {
    ...baseModel,
    section,
    options: types.map((ot) => ({
      id: ot.id,
      heading: ot.heading,
      text: ot.text,
      isTerminal: !ot.nextQuestionRoute,
      ctaLabel: ctaLabelFor(ot),
      viewAnswersUrl: viewAnswersUrlFor(
        baseModel.slug,
        baseModel.outcomeRoute,
        ot.id
      )
    }))
  }
}

export function buildTerminalSingleView(baseModel, terminalType) {
  return {
    ...baseModel,
    body: terminalType.text,
    ctaLabel: ctaLabelFor(terminalType),
    hasContinue: hasContinueFor(terminalType),
    viewAnswersUrl: viewAnswersUrlFor(
      baseModel.slug,
      baseModel.outcomeRoute,
      terminalType.id
    )
  }
}

export function buildSnapshotPayload(outcome, outcomeRoute, outcomeTypeId) {
  const all = getOutcomeTypesForOutcome(outcome)
  const focused = all.find((ot) => ot.id === outcomeTypeId)
  if (!focused) {
    throw new Error(`Unknown outcomeTypeId: ${outcomeTypeId}`)
  }

  return {
    preamble: getDocumentPreambleText() ?? '',
    outcomeRoute,
    outcomeKind: classifyOutcome(outcome),
    outcomeHeading: outcome.heading ?? '',
    outcomeText: outcome.text ?? '',
    focusedOption: {
      id: focused.id,
      heading: focused.heading ?? '',
      text: focused.text ?? '',
      module: focused.module ?? null,
      link: focused.link ?? null,
      overrideCtaButtonUrl: focused.overrideCtaButtonUrl ?? null,
      params: focused.params ?? null
    }
  }
}

export function buildTerminalMultiView(baseModel, types) {
  return {
    ...baseModel,
    options: types.map((ot) => ({
      id: ot.id,
      heading: ot.heading,
      text: ot.text,
      ctaLabel: ctaLabelFor(ot),
      hasContinue: hasContinueFor(ot),
      viewAnswersUrl: viewAnswersUrlFor(
        baseModel.slug,
        baseModel.outcomeRoute,
        ot.id
      )
    }))
  }
}

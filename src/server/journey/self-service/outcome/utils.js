import {
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
      ctaLabel: ctaLabelFor(ot)
    }))
  }
}

export function buildTerminalSingleView(baseModel, terminalType) {
  return {
    ...baseModel,
    body: terminalType.text,
    ctaLabel: ctaLabelFor(terminalType),
    hasContinue: hasContinueFor(terminalType)
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
      hasContinue: hasContinueFor(ot)
    }))
  }
}

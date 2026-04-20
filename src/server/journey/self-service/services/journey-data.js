import { createRequire } from 'node:module'
import { sanitise, sanitiseRichText, stripHtml } from './sanitise.js'

const require = createRequire(import.meta.url)
const journeyData = require('../data/self-service.json')

const questionsByRoute = new Map()
const sectionsById = new Map()
const outcomesByRoute = new Map()
const outcomeTypesById = new Map()

for (const question of journeyData.questions) {
  question.text = stripHtml(question.text)
  question.hint = sanitise(question.hint)
  for (const answer of question.answers) {
    answer.hint = sanitise(answer.hint)
  }
  questionsByRoute.set(question.route, question)
}

for (const section of journeyData.sections) {
  section.text = stripHtml(section.text)
  sectionsById.set(section.id, section)
}

for (const outcome of journeyData.outcomes) {
  outcome.heading = stripHtml(outcome.heading)
  outcome.text = sanitiseRichText(outcome.text)
  outcomesByRoute.set(outcome.route, outcome)
}

for (const outcomeType of journeyData.outcomeTypes) {
  outcomeType.heading = stripHtml(outcomeType.heading)
  outcomeType.text = sanitiseRichText(outcomeType.text)
  outcomeTypesById.set(outcomeType.id, outcomeType)
}

export const ROUTE_PREFIX = '/journey/self-service'

export function getFirstQuestionRoute() {
  return journeyData.firstQuestionRoute
}

export function getQuestion(route) {
  return questionsByRoute.get(route) ?? null
}

export function hasQuestion(route) {
  return questionsByRoute.has(route)
}

export function getSection(id) {
  return sectionsById.get(id) ?? null
}

export function getOutcome(route) {
  return outcomesByRoute.get(route) ?? null
}

export function hasOutcome(route) {
  return outcomesByRoute.has(route)
}

export function getOutcomeType(id) {
  return outcomeTypesById.get(id) ?? null
}

export function getOutcomeTypesForOutcome(outcome) {
  const ids = outcome?.outcomeTypes ?? []
  return ids
    .map((id) => outcomeTypesById.get(id))
    .filter((ot) => ot !== undefined)
}

export function isIntermediateOutcome(outcome) {
  const outcomeTypes = getOutcomeTypesForOutcome(outcome)
  return outcomeTypes.some((ot) => ot.nextQuestionRoute)
}

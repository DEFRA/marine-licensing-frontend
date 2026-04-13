import { createRequire } from 'node:module'
import { sanitise, stripHtml } from './sanitise.js'

const require = createRequire(import.meta.url)
const journeyData = require('../data/self-service.json')

const questionsByRoute = new Map()
const sectionsById = new Map()

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

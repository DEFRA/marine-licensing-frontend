import { createRequire } from 'node:module'
import sanitizeHtml from 'sanitize-html'

const require = createRequire(import.meta.url)
const journeyData = require('../data/self-service.json')

const sanitizeOptions = {
  allowedTags: ['a', 'b', 'br', 'li', 'ol', 'p', 'strong', 'u', 'ul'],
  allowedAttributes: {
    a: ['href', 'target'],
    ol: ['type']
  },
  allowedSchemes: ['http', 'https']
}

function sanitize(text) {
  return text ? sanitizeHtml(text, sanitizeOptions) : text
}

const questionsByRoute = new Map()
const sectionsById = new Map()

for (const question of journeyData.questions) {
  question.hint = sanitize(question.hint)
  for (const answer of question.answers) {
    answer.hint = sanitize(answer.hint)
  }
  questionsByRoute.set(question.route, question)
}

for (const section of journeyData.sections) {
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

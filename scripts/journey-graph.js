import {
  getJourneyData,
  getQuestion,
  getOutcome,
  getOutcomeTypesForOutcome,
  getFirstQuestionRoute
} from '../src/server/journey/self-service/services/journey-data.js'
import { calculateNextRoute } from '../src/server/journey/self-service/services/journey-router.js'

const HEADING_LEN = 50

function truncate(text) {
  if (!text) {
    return ''
  }
  return text.length > HEADING_LEN ? text.slice(0, HEADING_LEN) + '…' : text
}

function safeNext(question, ids) {
  try {
    return calculateNextRoute(question, ids)
  } catch {
    return null
  }
}

function multiSelectEdges(question) {
  const { outcomeAnswerId } = question.multiSelect
  const edges = []
  const other = question.answers.find((a) => a.id !== outcomeAnswerId)
  if (other) {
    const next = safeNext(question, [other.id])
    if (next) {
      edges.push({
        label: `tick any activity except "${outcomeAnswerId}"`,
        to: next.route,
        kind: next.type
      })
    }
  }
  const special = safeNext(question, [outcomeAnswerId])
  if (special) {
    edges.push({ label: `tick "${outcomeAnswerId}"`, to: special.route, kind: special.type })
  }
  return edges
}

function singleSelectEdges(question) {
  const edges = []
  for (const answer of question.answers) {
    const next = safeNext(question, [answer.id])
    if (next) {
      edges.push({ label: `answer "${answer.text}"`, to: next.route, kind: next.type })
    }
  }
  return edges
}

function outcomeForkEdges(outcome) {
  const edges = []
  for (const ot of getOutcomeTypesForOutcome(outcome)) {
    if (ot.nextQuestionRoute) {
      edges.push({
        label: `continue: "${truncate(ot.heading)}"`,
        to: ot.nextQuestionRoute,
        kind: 'question'
      })
    }
  }
  return edges
}

export function edgesFrom(route) {
  const question = getQuestion(route)
  if (question) {
    return question.multiSelect ? multiSelectEdges(question) : singleSelectEdges(question)
  }
  const outcome = getOutcome(route)
  if (outcome) {
    return outcomeForkEdges(outcome)
  }
  return []
}

function reconstruct(prev, to) {
  const steps = []
  let cursor = to
  while (prev.get(cursor)) {
    const { from, edge } = prev.get(cursor)
    const question = getQuestion(from)
    steps.unshift({
      from,
      fromText: question ? question.text : null,
      label: edge.label,
      to: edge.to,
      kind: edge.kind
    })
    cursor = from
  }
  return steps
}

export function shortestPath(to, options = {}) {
  const from = options.from ?? getFirstQuestionRoute()
  if (from === to) {
    return []
  }
  const prev = new Map([[from, null]])
  const queue = [from]
  while (queue.length > 0) {
    const node = queue.shift()
    for (const edge of edgesFrom(node)) {
      if (prev.has(edge.to)) {
        continue
      }
      prev.set(edge.to, { from: node, edge })
      if (edge.to === to) {
        return reconstruct(prev, to)
      }
      queue.push(edge.to)
    }
  }
  return null
}

export function reach(to, options = {}) {
  return shortestPath(to, options) !== null
}

export function predecessors(route) {
  const data = getJourneyData()
  const nodes = [
    ...data.questions.map((q) => q.route),
    ...data.outcomes.map((o) => o.route)
  ]
  const callers = []
  for (const node of nodes) {
    for (const edge of edgesFrom(node)) {
      if (edge.to === route) {
        callers.push({ route: node, via: edge.label })
      }
    }
  }
  return callers
}

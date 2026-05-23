import { parseArgs } from 'node:util'
import {
  getJourneyData,
  getQuestion,
  getOutcome,
  getOutcomeType,
  getOutcomeTypesForOutcome
} from '../src/server/journey/self-service/services/journey-data.js'
import { classifyOutcome } from '../src/server/journey/self-service/outcome/utils.js'

const EXCERPT_LEN = 60

function excerpt(text) {
  if (!text) {
    return '-'
  }
  const stripped = text.replace(/<[^>]+>/g, '').trim()
  if (stripped.length <= EXCERPT_LEN) {
    return stripped
  }
  return stripped.slice(0, EXCERPT_LEN) + '…'
}

function dash(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return String(value)
}

function targetForAnswer(answer) {
  if (answer.nextQuestionRoute) {
    return `question ${answer.nextQuestionRoute}`
  }
  if (answer.outcomeRoute) {
    return `outcome ${answer.outcomeRoute}`
  }
  return 'terminal'
}

function paramsFlat(outcomeType) {
  const params = outcomeType.params
  if (!params || params.length === 0) {
    return '-'
  }
  return params.map((p) => `${p.name}=${p.value}`).join(' ')
}

function runQuestion(route, json) {
  const q = getQuestion(route)
  if (!q) {
    return { stdout: `Question not found: ${route}`, code: 1 }
  }
  if (json) {
    const doc = {
      route: q.route,
      text: q.text,
      mcmsAppFormMapping: q.mcmsAppFormMapping ?? null,
      multiSelect: q.multiSelect ?? false,
      section: q.section ?? null,
      answers: q.answers.map((a) => ({
        id: a.id,
        text: a.text,
        target: targetForAnswer(a)
      }))
    }
    return { stdout: JSON.stringify(doc, null, 2), code: 0 }
  }
  const lines = [
    `route          ${q.route}`,
    `text           ${q.text}`,
    `mapping        ${dash(q.mcmsAppFormMapping)}`,
    `multiSelect    ${q.multiSelect ? 'yes' : 'no'}`,
    `section        ${dash(q.section)}`,
    '',
    '  ANSWERS',
    '  id\ttext\ttarget'
  ]
  for (const a of q.answers) {
    lines.push(`  ${a.id}\t${excerpt(a.text)}\t${targetForAnswer(a)}`)
  }
  return { stdout: lines.join('\n'), code: 0 }
}

function runOutcome(route, json) {
  const o = getOutcome(route)
  if (!o) {
    return { stdout: `Outcome not found: ${route}`, code: 1 }
  }
  const classification = classifyOutcome(o)
  const types = getOutcomeTypesForOutcome(o)
  if (json) {
    const doc = {
      route: o.route,
      heading: o.heading,
      text: o.text ?? null,
      classification,
      outcomeTypes: types.map((ot) => ({
        id: ot.id,
        text: ot.text ?? null,
        params: ot.params ?? [],
        nextQuestionRoute: ot.nextQuestionRoute ?? null
      }))
    }
    return { stdout: JSON.stringify(doc, null, 2), code: 0 }
  }
  const lines = [
    `route            ${o.route}`,
    `heading          ${o.heading}`,
    `text             ${excerpt(o.text)}`,
    `classification   ${classification}`,
    '',
    '  OUTCOME TYPES',
    '  id\ttext\tparams\tnextQuestionRoute'
  ]
  for (const ot of types) {
    lines.push(
      `  ${ot.id}\t${excerpt(ot.text)}\t${paramsFlat(ot)}\t${dash(ot.nextQuestionRoute)}`
    )
  }
  return { stdout: lines.join('\n'), code: 0 }
}

function runOutcomeType(id, json) {
  const ot = getOutcomeType(id)
  if (!ot) {
    return { stdout: `OutcomeType not found: ${id}`, code: 1 }
  }
  if (json) {
    const doc = {
      id: ot.id,
      heading: ot.heading,
      text: ot.text ?? null,
      params: ot.params ?? [],
      nextQuestionRoute: ot.nextQuestionRoute ?? null,
      link: ot.link ?? null,
      module: ot.module ?? null,
      entryTheme: ot.entryTheme ?? null,
      overrideCtaButtonText: ot.overrideCtaButtonText ?? null
    }
    return { stdout: JSON.stringify(doc, null, 2), code: 0 }
  }
  const lines = [
    `id                    ${ot.id}`,
    `heading               ${ot.heading}`,
    `text                  ${excerpt(ot.text)}`,
    `params                ${paramsFlat(ot)}`,
    `nextQuestionRoute     ${dash(ot.nextQuestionRoute)}`,
    `link                  ${dash(ot.link)}`,
    `module                ${dash(ot.module)}`,
    `entryTheme            ${dash(ot.entryTheme)}`,
    `overrideCtaButtonText ${dash(ot.overrideCtaButtonText)}`
  ]
  return { stdout: lines.join('\n'), code: 0 }
}

function outcomeMatchesHasParam(outcome, paramName, paramValue) {
  const types = getOutcomeTypesForOutcome(outcome)
  return types.some((ot) => outcomeTypeMatchesHasParam(ot, paramName, paramValue))
}

function outcomeTypeMatchesHasParam(ot, paramName, paramValue) {
  if (!ot.params || ot.params.length === 0) {
    return false
  }
  return ot.params.some((p) => {
    if (p.name !== paramName) {
      return false
    }
    return paramValue === undefined || p.value === paramValue
  })
}

function runOutcomes(flags, json) {
  const { classify, hasParam } = flags
  const { name: paramName, value: paramValue } = parseHasParam(hasParam)
  const data = getJourneyData()
  const filtered = data.outcomes.filter((o) => {
    const classification = classifyOutcome(o)
    if (classify && classification !== classify) {
      return false
    }
    if (paramName && !outcomeMatchesHasParam(o, paramName, paramValue)) {
      return false
    }
    return true
  })
  if (json) {
    const docs = filtered.map((o) => ({
      route: o.route,
      classification: classifyOutcome(o),
      outcomeTypeIds: o.outcomeTypes ?? []
    }))
    return { stdout: JSON.stringify(docs, null, 2), code: 0 }
  }
  const lines = filtered.map((o) => {
    const classification = classifyOutcome(o)
    const ids = (o.outcomeTypes ?? []).join(',')
    return `${o.route}\t${classification}\t${ids}`
  })
  return { stdout: lines.join('\n'), code: 0 }
}

function parseHasParam(hasParam) {
  if (!hasParam) {
    return { name: null, value: undefined }
  }
  const eqIdx = hasParam.indexOf('=')
  if (eqIdx === -1) {
    return { name: hasParam, value: undefined }
  }
  return { name: hasParam.slice(0, eqIdx), value: hasParam.slice(eqIdx + 1) }
}

function runOutcomeTypes(flags, json) {
  const { hasParam, hasNextQuestion } = flags
  const { name: paramName, value: paramValue } = parseHasParam(hasParam)
  const data = getJourneyData()
  const filtered = data.outcomeTypes.filter((ot) => {
    if (paramName && !outcomeTypeMatchesHasParam(ot, paramName, paramValue)) {
      return false
    }
    if (hasNextQuestion && !ot.nextQuestionRoute) {
      return false
    }
    return true
  })
  if (json) {
    return { stdout: JSON.stringify(filtered, null, 2), code: 0 }
  }
  const lines = filtered.map((ot) => {
    return `${ot.id}\t${paramsFlat(ot)}\t${dash(ot.nextQuestionRoute)}`
  })
  return { stdout: lines.join('\n'), code: 0 }
}

function runQuestions(flags, json) {
  const { mapping, hasMapping } = flags
  const data = getJourneyData()
  const filtered = data.questions.filter((q) => {
    if (mapping && q.mcmsAppFormMapping !== mapping) {
      return false
    }
    if (hasMapping && !q.mcmsAppFormMapping) {
      return false
    }
    return true
  })
  if (json) {
    return { stdout: JSON.stringify(filtered, null, 2), code: 0 }
  }
  const lines = filtered.map((q) => {
    return `${q.route}\t${dash(q.mcmsAppFormMapping)}\t${q.multiSelect ? 'yes' : 'no'}\t${excerpt(q.text)}`
  })
  return { stdout: lines.join('\n'), code: 0 }
}

function runMappings(json) {
  const data = getJourneyData()
  const mappingMap = new Map()
  for (const q of data.questions) {
    if (!q.mcmsAppFormMapping) {
      continue
    }
    const existing = mappingMap.get(q.mcmsAppFormMapping)
    if (existing) {
      existing.push(q.route)
    } else {
      mappingMap.set(q.mcmsAppFormMapping, [q.route])
    }
  }
  const sortedKeys = [...mappingMap.keys()].sort()
  if (json) {
    const doc = {}
    for (const key of sortedKeys) {
      doc[key] = mappingMap.get(key)
    }
    return { stdout: JSON.stringify(doc, null, 2), code: 0 }
  }
  const lines = sortedKeys.map((key) => `${key}\t${mappingMap.get(key).join(',')}`)
  return { stdout: lines.join('\n'), code: 0 }
}

export function runCommand(argv) {
  const [subcommand, ...rest] = argv
  if (!subcommand) {
    return { stdout: 'Usage: iat-query <subcommand> [args] [--json]', code: 2 }
  }
  switch (subcommand) {
    case 'question': {
      const { values, positionals } = parseArgs({
        args: rest,
        options: { json: { type: 'boolean', default: false } },
        allowPositionals: true
      })
      const route = positionals[0]
      if (!route) {
        return { stdout: 'Usage: iat-query question <route> [--json]', code: 2 }
      }
      return runQuestion(route, values.json)
    }
    case 'outcome': {
      const { values, positionals } = parseArgs({
        args: rest,
        options: { json: { type: 'boolean', default: false } },
        allowPositionals: true
      })
      const route = positionals[0]
      if (!route) {
        return { stdout: 'Usage: iat-query outcome <route> [--json]', code: 2 }
      }
      return runOutcome(route, values.json)
    }
    case 'outcome-type': {
      const { values, positionals } = parseArgs({
        args: rest,
        options: { json: { type: 'boolean', default: false } },
        allowPositionals: true
      })
      const id = positionals[0]
      if (!id) {
        return { stdout: 'Usage: iat-query outcome-type <id> [--json]', code: 2 }
      }
      return runOutcomeType(id, values.json)
    }
    case 'outcomes': {
      const { values } = parseArgs({
        args: rest,
        options: {
          json: { type: 'boolean', default: false },
          classify: { type: 'string' },
          'has-param': { type: 'string' }
        },
        allowPositionals: false
      })
      return runOutcomes(
        { classify: values.classify, hasParam: values['has-param'] },
        values.json
      )
    }
    case 'outcome-types': {
      const { values } = parseArgs({
        args: rest,
        options: {
          json: { type: 'boolean', default: false },
          'has-param': { type: 'string' },
          'has-next-question': { type: 'boolean', default: false }
        },
        allowPositionals: false
      })
      return runOutcomeTypes(
        { hasParam: values['has-param'], hasNextQuestion: values['has-next-question'] },
        values.json
      )
    }
    case 'questions': {
      const { values } = parseArgs({
        args: rest,
        options: {
          json: { type: 'boolean', default: false },
          mapping: { type: 'string' },
          'has-mapping': { type: 'boolean', default: false }
        },
        allowPositionals: false
      })
      return runQuestions(
        { mapping: values.mapping, hasMapping: values['has-mapping'] },
        values.json
      )
    }
    case 'mappings': {
      const { values } = parseArgs({
        args: rest,
        options: { json: { type: 'boolean', default: false } },
        allowPositionals: false
      })
      return runMappings(values.json)
    }
    default: {
      return { stdout: `Unknown subcommand: ${subcommand}`, code: 2 }
    }
  }
}

const isMain =
  import.meta.url === `file://${process.argv[1]}`

if (isMain) {
  const { stdout, code } = runCommand(process.argv.slice(2))
  // eslint-disable-next-line no-console
  console.log(stdout)
  process.exit(code)
}

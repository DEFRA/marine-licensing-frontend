export const HANDOFF_ALLOWLISTS = {
  exemption: [
    'ACTIVITY_TYPE',
    'EXE_ACTIVITY_SUBTYPE_CONSTRUCTION',
    'EXE_ACTIVITY_SUBTYPE_DEPOSIT',
    'EXE_ACTIVITY_SUBTYPE_REMOVAL',
    'EXE_ACTIVITY_SUBTYPE_DREDGING',
    'ADV_TYPE',
    'ARTICLE'
  ]
}

export function projectMappedAnswers(questionLog, allowList) {
  const result = {}
  for (const entry of questionLog ?? []) {
    const mapping = entry?.mcmsAppFormMapping
    const answerId = entry?.answers?.[0]?.id
    if (mapping && allowList.includes(mapping) && answerId) {
      result[mapping] = answerId
    }
  }
  return result
}

export function projectOutcomeParams(focusedOption, allowList) {
  const result = {}
  for (const param of focusedOption?.params ?? []) {
    if (param?.name && allowList.includes(param.name) && param.value != null) {
      result[param.name] = param.value
    }
  }
  return result
}

export function buildHandoffRedirectUrl(overrideCtaButtonUrl, queryString) {
  const url = new URL(overrideCtaButtonUrl)
  const path = `${url.pathname}${url.search}`
  if (!queryString) {
    return path
  }
  const separator = url.search ? '&' : '?'
  return `${path}${separator}${queryString}`
}

export function buildHandoffQueryString({
  questionLog,
  focusedOption,
  answersUrl,
  allowList
}) {
  const merged = {
    ...projectMappedAnswers(questionLog, allowList),
    ...projectOutcomeParams(focusedOption, allowList)
  }
  const params = new URLSearchParams()
  for (const name of allowList) {
    if (Object.hasOwn(merged, name)) {
      params.append(name, merged[name])
    }
  }
  if (answersUrl) {
    params.append('pdfDownloadUrl', answersUrl)
  }
  return params.toString()
}

export function buildMcmsRedirectUrl(baseUrl, path, queryString) {
  const url = new URL(path || '', baseUrl)
  if (!queryString) {
    return url.toString()
  }
  const separator = url.search ? '&' : '?'
  return `${url.toString()}${separator}${queryString}`
}

export function buildMcmsHandoffQueryString({
  questionLog,
  focusedOption,
  journeyId,
  viewAnswersUrl
}) {
  const params = new URLSearchParams()
  params.append('journeyId', journeyId)
  if (viewAnswersUrl) {
    params.append('viewAnswersUrl', viewAnswersUrl)
  }
  for (const entry of questionLog ?? []) {
    const mapping = entry?.mcmsAppFormMapping
    const answerId = entry?.answers?.[0]?.id
    if (mapping && answerId) {
      params.append(mapping, answerId)
    }
  }
  for (const param of focusedOption?.params ?? []) {
    if (param?.name && param.value != null) {
      params.append(param.name, param.value)
    }
  }
  return params.toString()
}

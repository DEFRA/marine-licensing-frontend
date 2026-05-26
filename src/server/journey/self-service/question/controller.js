import { getSection } from '#src/server/journey/self-service/services/journey-data.js'
import { calculateNextRoute } from '#src/server/journey/self-service/services/journey-router.js'
import {
  getSelectedAnswerIdsForRoute,
  getBackLink
} from '#src/server/journey/self-service/services/journey-answer-log.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { reportRuntimeError } from '#src/server/journey/self-service/services/data-quality.js'
import {
  loadQuestion,
  toArray,
  VIEW_PATH
} from '#src/server/journey/self-service/question/utils.js'
import { iatContextService } from '#src/services/iat-service/iat-context.service.js'

function slugFromRequest(request) {
  return request.params.slug
}

function redirectTargetFor(slug, next) {
  const target = next.route.replace(/^\//, '')
  const prefix = next.type === 'outcome' ? 'outcome/' : ''
  return `/journey/self-service/c/${slug}/${prefix}${target}`
}

function buildErrorView(question, slug, request, questionRoute, isMulti) {
  const errorText = isMulti ? 'Select at least one option' : 'Select an option'
  const errorField = isMulti ? 'answers' : 'answer'
  const section = question.section ? getSection(question.section) : null
  return {
    pageTitle: question.text,
    question,
    section,
    backLink: getBackLink(request, slug, questionRoute),
    errors: { [errorField]: { text: errorText } },
    errorSummary: [{ text: errorText, href: `#${errorField}` }],
    selectedAnswers: []
  }
}

function buildAnswerPayload(question, questionRoute, submittedIds) {
  const selected = submittedIds
    .map((id) => question.answers?.find((a) => a.id === id))
    .filter(Boolean)
    .map((a) => ({ id: a.id, text: a.text }))

  return {
    questionRoute,
    questionText: question.text,
    answers: selected,
    mcmsAppFormMapping: question.mcmsAppFormMapping ?? null
  }
}

export const questionController = {
  handler(request, h) {
    const { questionRoute, question } = loadQuestion(request)
    const slug = slugFromRequest(request)
    const section = question.section ? getSection(question.section) : null

    return h.view(VIEW_PATH, {
      pageTitle: question.text,
      question,
      section,
      backLink: getBackLink(request, slug, questionRoute),
      selectedAnswers: question.multiSelect
        ? []
        : getSelectedAnswerIdsForRoute(request, questionRoute)
    })
  }
}

export const questionPostController = {
  async handler(request, h) {
    const { questionRoute, question } = loadQuestion(request)
    const slug = slugFromRequest(request)

    const isMulti = !!question.multiSelect
    const submittedIds = isMulti
      ? toArray(request.payload?.answers)
      : toArray(request.payload?.answer)

    if (submittedIds.length === 0) {
      return h
        .view(
          VIEW_PATH,
          buildErrorView(question, slug, request, questionRoute, isMulti)
        )
        .code(statusCodes.badRequest)
    }

    const answer = buildAnswerPayload(question, questionRoute, submittedIds)
    await iatContextService.patch(request, slug, answer)

    let next
    try {
      next = calculateNextRoute(question, submittedIds)
    } catch (err) {
      const answerId = submittedIds[0]
      reportRuntimeError(
        request,
        'answer-no-route',
        `${questionRoute}#${answerId}`,
        `Add nextQuestionRoute or outcomeRoute to answer '${answerId}' on question ${questionRoute} in self-service.json`,
        err.message
      )
      throw err
    }

    return h.redirect(redirectTargetFor(slug, next))
  }
}

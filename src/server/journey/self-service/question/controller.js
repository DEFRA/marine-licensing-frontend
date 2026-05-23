import { getSection } from '#src/server/journey/self-service/services/journey-data.js'
import { calculateNextRoute } from '#src/server/journey/self-service/services/journey-router.js'
import {
  getAnswerForRoute,
  pushAnswer,
  getBackLink
} from '#src/server/journey/self-service/services/journey-answer-log.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { reportRuntimeError } from '#src/server/journey/self-service/services/data-quality.js'
import {
  loadQuestion,
  toArray,
  VIEW_PATH
} from '#src/server/journey/self-service/question/utils.js'
import { iatAnswersService } from '#src/services/iat-answers-service/iat-answers.service.js'

function slugFromRequest(request) {
  return request.params.slug
}

function answersFromRequest(request) {
  return request.app.iatDoc?.answers ?? []
}

function redirectTargetFor(slug, next) {
  const target = next.route.replace(/^\//, '')
  const prefix = next.type === 'outcome' ? 'outcome/' : ''
  return `/journey/self-service/c/${slug}/${prefix}${target}`
}

function buildErrorView(question, slug, answers, questionRoute, isMulti) {
  const errorText = isMulti ? 'Select at least one option' : 'Select an option'
  const errorField = isMulti ? 'answers' : 'answer'
  const section = question.section ? getSection(question.section) : null
  return {
    pageTitle: question.text,
    question,
    section,
    backLink: getBackLink(answers, slug, questionRoute, 'question'),
    errors: { [errorField]: { text: errorText } },
    errorSummary: [{ text: errorText, href: `#${errorField}` }],
    selectedAnswers: []
  }
}

export const questionController = {
  handler(request, h) {
    const { questionRoute, question } = loadQuestion(request)
    const slug = slugFromRequest(request)
    const answers = answersFromRequest(request)
    const section = question.section ? getSection(question.section) : null

    return h.view(VIEW_PATH, {
      pageTitle: question.text,
      question,
      section,
      backLink: getBackLink(answers, slug, questionRoute, 'question'),
      selectedAnswers: question.multiSelect ? [] : getAnswerForRoute(answers, questionRoute)
    })
  }
}

export const questionPostController = {
  async handler(request, h) {
    const { questionRoute, question } = loadQuestion(request)
    const slug = slugFromRequest(request)
    const answers = answersFromRequest(request)

    const isMulti = !!question.multiSelect
    const submittedIds = isMulti
      ? toArray(request.payload?.answers)
      : toArray(request.payload?.answer)

    if (submittedIds.length === 0) {
      return h
        .view(VIEW_PATH, buildErrorView(question, slug, answers, questionRoute, isMulti))
        .code(statusCodes.badRequest)
    }

    const newAnswers = pushAnswer(answers, questionRoute, submittedIds)
    await iatAnswersService.patch(request, slug, { answers: newAnswers })

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

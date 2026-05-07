import {
  getSection,
  ROUTE_PREFIX
} from '#src/server/journey/self-service/services/journey-data.js'
import { calculateNextRoute } from '#src/server/journey/self-service/services/journey-router.js'
import {
  getBackLink,
  getAnswerForRoute,
  pushAnswer
} from '#src/server/journey/self-service/services/session-answers.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { reportRuntimeError } from '#src/server/journey/self-service/services/data-quality.js'
import {
  loadQuestion,
  toArray,
  VIEW_PATH
} from '#src/server/journey/self-service/question/utils.js'

export const questionController = {
  handler(request, h) {
    const { questionRoute, question } = loadQuestion(request)

    const section = question.section ? getSection(question.section) : null

    return h.view(VIEW_PATH, {
      pageTitle: question.text,
      question,
      section,
      backLink: getBackLink(request, questionRoute, 'question'),
      selectedAnswers: question.multiSelect
        ? []
        : getAnswerForRoute(request, questionRoute)
    })
  }
}

export const questionPostController = {
  handler(request, h) {
    const { questionRoute, question } = loadQuestion(request)

    const isMulti = !!question.multiSelect
    const submittedIds = isMulti
      ? toArray(request.payload?.answers)
      : toArray(request.payload?.answer)

    if (submittedIds.length === 0) {
      const errorText = isMulti
        ? 'Select at least one option'
        : 'Select an option'
      const errorField = isMulti ? 'answers' : 'answer'
      const section = question.section ? getSection(question.section) : null
      return h
        .view(VIEW_PATH, {
          pageTitle: question.text,
          question,
          section,
          backLink: getBackLink(request, questionRoute, 'question'),
          errors: { [errorField]: { text: errorText } },
          errorSummary: [{ text: errorText, href: `#${errorField}` }],
          selectedAnswers: []
        })
        .code(statusCodes.badRequest)
    }

    pushAnswer(request, questionRoute, submittedIds)

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
    const target = next.route.replace(/^\//, '')
    const prefix = next.type === 'outcome' ? 'outcome/' : ''

    return h.redirect(`${ROUTE_PREFIX}/${prefix}${target}`)
  }
}

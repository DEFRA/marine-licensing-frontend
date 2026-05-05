import { getSection } from '#src/server/journey/self-service/services/journey-data.js'
import {
  getBackLink,
  getAnswerForRoute
} from '#src/server/journey/self-service/services/session-answers.js'
import { loadQuestion } from '#src/server/journey/self-service/question/utils.js'

const VIEW_PATH = 'journey/self-service/question/index'

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

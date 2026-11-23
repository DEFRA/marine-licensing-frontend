import { WITHHOLD_REASON } from '#src/server/common/validation/marine-licence-public-register/constants.js'

const CHECK_ANSWERS_TITLE =
  'Check your answers for information published on the public register'

export const publicRegisterCheckAnswersSettings = {
  pageTitle: CHECK_ANSWERS_TITLE,
  heading: CHECK_ANSWERS_TITLE
}

export const publicRegisterCheckAnswersText = {
  withholdQuestion:
    'Do you want to ask us to withhold any information from the public register?',
  withholdAnswer: {
    [WITHHOLD_REASON.NATIONAL_SECURITY]: 'Yes – National security reasons',
    [WITHHOLD_REASON.COMMERCIAL_CONFIDENTIALITY]:
      'Yes – Commercial or industrial confidentiality reasons'
  },
  approvalQuestion:
    'Do you have approval from the Secretary of State for Defence to withhold information for national security reasons?',
  approvalAnswer: {
    yes: 'Yes',
    no: 'No – If you get approval later, you can come back and change your answer before you submit your application.'
  },
  reasonQuestion: {
    [WITHHOLD_REASON.NATIONAL_SECURITY]: 'What you want withheld',
    [WITHHOLD_REASON.COMMERCIAL_CONFIDENTIALITY]:
      'What you want withheld and why'
  }
}

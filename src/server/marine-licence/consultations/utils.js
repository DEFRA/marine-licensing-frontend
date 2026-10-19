import { formatDate } from '#src/config/nunjucks/filters/format-date.js'
import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { apiRoutes } from '#src/server/common/constants/routes.js'
import {
  CONSULTATION_STATUS,
  CONSULTATION_TYPE
} from '#src/server/common/constants/marine-licence.js'

export const fetchConsultations = async (request) => {
  const { payload } = await authenticatedGetRequest(
    request,
    apiRoutes.GET_CONSULTATIONS
  )

  return payload?.value?.consultations ?? []
}

export const getConsultationStatusCell = (status) => {
  const label = CONSULTATION_STATUS[status]

  if (!label) {
    return { text: '-' }
  }

  const tagClass =
    status === 'NO_RESPONSE_NEEDED' ? 'govuk-tag govuk-tag--grey' : 'govuk-tag'

  return { html: `<strong class="${tagClass}">${label}</strong>` }
}

export const formatConsultationsForDisplay = (consultations) =>
  consultations.map((consultation) => ({
    cells: [
      { text: consultation.projectName },
      { text: CONSULTATION_TYPE[consultation.consultationType] || '-' },
      { text: consultation.applicationReference || '-' },
      getConsultationStatusCell(consultation.consultationStatus),
      {
        text: consultation.consultationStartDate
          ? formatDate(consultation.consultationStartDate, 'd MMM yyyy')
          : '-'
      }
    ]
  }))

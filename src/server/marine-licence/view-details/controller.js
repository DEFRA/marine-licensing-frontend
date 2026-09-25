import Boom from '@hapi/boom'
import { errorMessages } from '#src/server/common/constants/error-messages.js'
import {
  routes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { isProjectViewable } from '#src/server/common/helpers/view-details/utils.js'
import { buildSummaryData } from '#src/server/common/helpers/marine-licence/summary-data.js'
import { buildSiteData } from '#src/server/common/helpers/marine-licence/site-data.js'
import { waterFrameworkReviewData } from '#src/server/common/helpers/marine-licence/water-framework-directive/water-framework-review-data.js'
import { buildMarinePlanPoliciesData } from '#src/server/common/helpers/marine-licence/marine-plan-policies-data.js'
import { PROJECT_STATUS } from '#src/server/common/constants/projects.js'
import { buildApplicationDetailsCardData } from '#src/server/marine-licence/view-details/utils.js'
import {
  FEE_ESTIMATE_AMOUNT,
  FEE_ESTIMATE_MONITORING_AMOUNT
} from '#src/server/common/validation/fee-estimate/constants.js'
import { buildApplicationTasks } from '#src/server/common/helpers/marine-licence/application-tasks/build.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'

export const VIEW_DETAILS_VIEW_ROUTE = 'marine-licence/view-details/index'

const getCurrentContactId = async (request) => {
  const userSession = await getUserSession(request, request.state?.userSession)
  return userSession?.contactId
}

const getApplicantBackLink = (status, marineLicenceId) => {
  if (status === PROJECT_STATUS.TRANSFERRED) {
    return `${marineLicenceRoutes.MARINE_LICENCE_APPLICATION_TRANSFERRED}/${marineLicenceId}`
  }

  if (status === PROJECT_STATUS.REJECTED) {
    return `${marineLicenceRoutes.MARINE_LICENCE_APPLICATION_REJECTED}/${marineLicenceId}`
  }

  return routes.DASHBOARD
}

const fetchViewableMarineLicence = async (
  request,
  marineLicenceId,
  isPublicView
) => {
  const service = getMarineLicenceService(request)
  const serviceMethod = isPublicView
    ? 'getPublicMarineLicenceById'
    : 'getMarineLicenceById'
  const marineLicence = await service[serviceMethod](marineLicenceId)

  if (!isProjectViewable(marineLicence)) {
    request.logger.error(
      {
        id: marineLicenceId,
        status: marineLicence.status,
        hasApplicationReference: !!marineLicence.applicationReference
      },
      errorMessages.MARINE_LICENCE_NOT_SUBMITTED
    )
    throw Boom.forbidden(errorMessages.MARINE_LICENCE_NOT_SUBMITTED)
  }

  return marineLicence
}

const buildViewModel = async ({
  request,
  marineLicence,
  marineLicenceId,
  isApplicantView
}) => {
  const formattedMarineLicence = buildSummaryData(marineLicence)
  const { coordinatesType, summaryData } = buildSiteData(marineLicence)

  const applicationTasks = buildApplicationTasks({
    marineLicence,
    currentContactId: isApplicantView
      ? await getCurrentContactId(request)
      : null,
    isApplicantView
  })

  return {
    pageTitle: formattedMarineLicence.projectName,
    specialLegalPowers: formattedMarineLicence.specialLegalPowers,
    publicRegister: formattedMarineLicence.publicRegister,
    harbourAuthority: formattedMarineLicence.harbourAuthority,
    otherAuthorities: formattedMarineLicence.otherAuthorities,
    preferredDates: formattedMarineLicence.preferredDates,
    projectName: formattedMarineLicence.projectName,
    projectBackground: formattedMarineLicence.projectBackground,
    publicConsultation: formattedMarineLicence.publicConsultation,
    coordinatesType,
    summaryData,
    isReadOnly: true,
    pageCaption: isApplicantView
      ? `${marineLicence.applicationReference} - Marine licence`
      : marineLicence.applicationReference,
    backLink: isApplicantView
      ? getApplicantBackLink(marineLicence.status, marineLicenceId)
      : null,
    isApplicantView,
    marineLicenceId,
    waterFrameworkDirectiveData: waterFrameworkReviewData(
      formattedMarineLicence.waterFrameworkDirective
    ),
    invoicingData: formattedMarineLicence.invoicing,
    invoicingChangeLink:
      marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS,
    marinePlanPolicies: buildMarinePlanPoliciesData(marineLicence),
    applicationTasks,
    amount: FEE_ESTIMATE_AMOUNT,
    monitoringAmount: FEE_ESTIMATE_MONITORING_AMOUNT,
    ...buildApplicationDetailsCardData(marineLicence)
  }
}

export const viewDetailsController = {
  async handler(request, h) {
    const { marineLicenceId } = request.params

    const isPublicView = request.path.startsWith(
      marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_PUBLIC
    )

    const isApplicantView = !isPublicView

    try {
      const marineLicence = await fetchViewableMarineLicence(
        request,
        marineLicenceId,
        isPublicView
      )

      const viewModel = await buildViewModel({
        request,
        marineLicence,
        marineLicenceId,
        isApplicantView
      })

      return h.view(VIEW_DETAILS_VIEW_ROUTE, viewModel)
    } catch (error) {
      if (error.isBoom) {
        throw error
      }

      request.logger.error(error, 'Error displaying marine licence details')
      throw Boom.internal('Error displaying marine licence details')
    }
  }
}

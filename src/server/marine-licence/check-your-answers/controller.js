import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  marineLicenceRoutes,
  routes
} from '#src/server/common/constants/routes.js'
import { buildSiteData } from '#src/server/common/helpers/marine-licence/site-data.js'
import { buildSummaryData } from '#src/server/common/helpers/marine-licence/summary-data.js'
import { setReturnToCache } from '#src/server/common/helpers/marine-licence/session-cache/return-to-cache.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { waterFrameworkReviewData } from '#src/server/common/helpers/marine-licence/water-framework-directive/water-framework-review-data.js'
import { getWaterFrameworkDirectiveChangeLink } from '#src/server/marine-licence/check-your-answers/utils.js'
import { buildMarinePlanPoliciesData } from '#src/server/common/helpers/marine-licence/marine-plan-policies-data.js'
import { buildMarinePlanPolicyDocumentsData } from '#src/server/common/helpers/marine-licence/marine-plan-policy-documents-data.js'
import { isMarineLicenceReadyToSend } from '#src/server/marine-licence/task-list/ready-to-send.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { USER_TYPES } from '#src/server/common/constants/user-types.js'
import {
  FEE_ESTIMATE_AMOUNT,
  FEE_ESTIMATE_MONITORING_AMOUNT
} from '#src/server/common/validation/fee-estimate/constants.js'

const checkYourAnswersViewContent = {
  pageTitle: 'Check your answers before sending your information',
  backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
}

export const CHECK_YOUR_ANSWERS_VIEW_ROUTE =
  'marine-licence/check-your-answers/index'

const isReadyToSend = async (request, marineLicence) => {
  const userSession = await getUserSession(request, request.state?.userSession)
  return isMarineLicenceReadyToSend(
    marineLicence,
    userSession?.userRelationshipType === USER_TYPES.CITIZEN
  )
}

const fetchMarineLicence = (request, id) =>
  getMarineLicenceService(request).getMarineLicenceById(id)

export const checkYourAnswersController = {
  async handler(request, h) {
    let marineLicence = getMarineLicenceCache(request)
    const completeMarineLicence = marineLicence.id
      ? await fetchMarineLicence(request, marineLicence.id)
      : null

    if (
      completeMarineLicence &&
      !(await isReadyToSend(request, completeMarineLicence))
    ) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
    }

    await setReturnToCache(
      request,
      h,
      marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
    )

    let siteData = { coordinatesType: null, summaryData: [] }
    let marinePlanPolicySections = []
    let marinePlanPolicyDocuments = []

    if (completeMarineLicence) {
      siteData = buildSiteData(completeMarineLicence)
      marinePlanPolicySections = buildMarinePlanPoliciesData(
        completeMarineLicence
      )
      marinePlanPolicyDocuments = buildMarinePlanPolicyDocumentsData(
        completeMarineLicence
      )

      // A user may have cancelled out of the WFD or withholding information flow
      // part way, so these must be reset to the server values
      marineLicence = {
        ...marineLicence,
        waterFrameworkDirective: completeMarineLicence.waterFrameworkDirective,
        publicRegister: completeMarineLicence.publicRegister
      }

      await setMarineLicenceCache(request, h, marineLicence)
    }

    const { waterFrameworkDirective } = marineLicence
    const formattedMarineLicence = buildSummaryData(marineLicence)

    const waterFrameworkDirectiveData = waterFrameworkReviewData(
      waterFrameworkDirective
    )

    return h.view(CHECK_YOUR_ANSWERS_VIEW_ROUTE, {
      ...checkYourAnswersViewContent,
      ...marineLicence,
      coordinatesType: siteData.coordinatesType,
      summaryData: siteData.summaryData,
      reviewSiteDetailsRoute:
        marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
      ...formattedMarineLicence,
      publicRegisterRoute: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
      waterFrameworkDirectiveData,
      waterFrameworkDirectiveChangeLink: getWaterFrameworkDirectiveChangeLink(
        waterFrameworkDirective
      ),
      invoicingData: formattedMarineLicence.invoicing,
      invoicingChangeLink:
        marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS,
      feeEstimateChangeLink: marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE,
      marinePlanPolicySections,
      marinePlanPolicyDocuments,
      marinePlanPolicyDocumentsChangeLink:
        marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENTS_REVIEW,
      amount: FEE_ESTIMATE_AMOUNT,
      monitoringAmount: FEE_ESTIMATE_MONITORING_AMOUNT
    })
  }
}

export const checkYourAnswersContinueController = {
  async handler(request, h) {
    const { id } = getMarineLicenceCache(request) ?? {}

    if (id) {
      const marineLicence = await fetchMarineLicence(request, id)
      if (!(await isReadyToSend(request, marineLicence))) {
        return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
      }
    }

    return h.redirect(routes.DECLARATION)
  }
}

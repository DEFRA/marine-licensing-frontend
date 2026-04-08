export const exemptionRoutes = {
  COORDINATES_TYPE_CHOICE:
    '/exemption/how-do-you-want-to-provide-the-coordinates',
  COORDINATES_ENTRY_CHOICE:
    '/exemption/how-do-you-want-to-enter-the-coordinates',
  MULTIPLE_SITES_CHOICE:
    '/exemption/does-your-project-involve-more-than-one-site',
  COORDINATE_SYSTEM_CHOICE: '/exemption/what-coordinate-system',
  CIRCLE_CENTRE_POINT: '/exemption/enter-the-coordinates-at-the-centre-point',
  ENTER_MULTIPLE_COORDINATES: '/exemption/enter-multiple-coordinates',
  REVIEW_SITE_DETAILS: '/exemption/review-site-details',
  PROJECT_NAME: '/exemption/project-name',
  PUBLIC_REGISTER: '/exemption/sharing-your-project-information-publicly',
  TASK_LIST: '/exemption/task-list',
  WIDTH_OF_SITE: '/exemption/width-of-site',
  CHOOSE_FILE_UPLOAD_TYPE: '/exemption/choose-file-type-to-upload',
  FILE_UPLOAD: '/exemption/upload-file',
  UPLOAD_AND_WAIT: '/exemption/upload-and-wait',
  ACTIVITY_DATES: '/exemption/activity-dates',
  ACTIVITY_DESCRIPTION: '/exemption/activity-description',
  CHECK_YOUR_ANSWERS: '/exemption/check-your-answers',
  VIEW_DETAILS: '/exemption/view-details',
  VIEW_DETAILS_INTERNAL_USER: '/view-details',
  VIEW_DETAILS_PUBLIC: '/exemption/view-public-details',
  CONFIRMATION: '/exemption/confirmation',
  SITE_DETAILS: '/exemption/site-details',
  SITE_NAME: '/exemption/site-name',
  SAME_ACTIVITY_DATES: '/exemption/same-activity-dates',
  SAME_ACTIVITY_DESCRIPTION: '/exemption/same-activity-description',
  DELETE_EXEMPTION: '/exemption/delete',
  WITHDRAW_EXEMPTION: '/exemption/withdraw',
  DELETE_SITE: '/exemption/delete-site',
  DELETE_ALL_SITES: '/exemption/delete-all-sites',
  COOKIES: '/help/cookies',
  PRIVACY: '/help/privacy',
  ADMIN_EXEMPTIONS: '/admin/exemptions',
  ADMIN_EMP: '/admin/emp',
  ADMIN_BACKFILL: '/admin/backfill-areas',
  EXEMPTION: '/exemption'
}

export const marineLicenceRoutes = {
  MARINE_LICENCE_CHECK_YOUR_ANSWERS: '/marine-licence/check-your-answers',
  MARINE_LICENCE_CONFIRMATION: '/marine-licence/confirmation',
  MARINE_LICENCE_PROJECT_NAME: '/marine-licence/project-name',
  MARINE_LICENCE_TASK_LIST: '/marine-licence/task-list',
  MARINE_LICENCE_DELETE: '/marine-licence/delete',
  MARINE_LICENCE_SPECIAL_LEGAL_POWERS: '/marine-licence/special-legal-powers',
  MARINE_LICENCE_OTHER_AUTHORITIES: '/marine-licence/other-authorities',
  MARINE_LICENCE_SITE_DETAILS: '/marine-licence/site-details',
  MARINE_LICENCE_COORDINATES_TYPE_CHOICE:
    '/marine-licence/how-do-you-want-to-provide-the-coordinates',
  MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE:
    '/marine-licence/choose-file-type-to-upload',
  MARINE_LICENCE_PUBLIC_REGISTER:
    '/marine-licence/sharing-your-project-information-publicly',
  MARINE_LICENCE_FILE_UPLOAD: '/marine-licence/upload-file',
  MARINE_LICENCE_SITE_NAME: '/marine-licence/site-name',
  MARINE_LICENCE_REVIEW_SITE_DETAILS: '/marine-licence/review-site-details',
  MARINE_LICENCE_UPLOAD_AND_WAIT: '/marine-licence/upload-and-wait',
  MARINE_LICENCE_VIEW_DETAILS: '/marine-licence/view-details',
  MARINE_LICENCE_VIEW_DETAILS_PUBLIC: '/marine-licence/view-public-details',
  MARINE_LICENCE_VIEW_DETAILS_INTERNAL_USER: '/view-marine-licence-details'
}

export const defraIdGuidanceRoutes = {
  WHO_IS_EXEMPTION_FOR: '/guidance/who-is-the-exemption-for',
  CHECK_SETUP_EMPLOYEE: '/guidance/check-setup-employee',
  CHECK_SETUP_CLIENT: '/guidance/check-setup-client',
  REGISTER_NEW_ORG: '/guidance/register-new-organisation',
  ADD_TO_ORG_ACCOUNT: '/guidance/add-to-org-account',
  ADD_TO_CLIENT_ACCOUNT: '/guidance/add-to-client-account'
}

export const postLoginRoutes = {
  CONFIRM_AGENT: '/confirm-agent',
  CONFIRM_EMPLOYEE: '/confirm-employee',
  CONFIRM_INDIVIDUAL: '/confirm-individual',
  GUIDANCE_INDIVIDUAL: '/need-to-create-defra-account-as-individual',
  GUIDANCE_ORG: '/need-to-create-defra-account-as-employee'
}

export const routes = {
  postLogin: postLoginRoutes,
  defraIdGuidance: defraIdGuidanceRoutes,
  ...exemptionRoutes,
  AUTH_DEFRA_ID_CALLBACK: '/signin-oidc',
  AUTH_ENTRA_ID_CALLBACK: '/auth',
  SIGNIN: '/signin',
  SIGNIN_ENTRA: '/signin-entra',
  SIGN_OUT: '/sign-out',
  CHANGE_ORGANISATION: '/change-organisation',
  DASHBOARD: '/projects',
  SERVICE_HOME: '/home',
  COOKIES: '/help/cookies',
  PRIVACY: '/help/privacy',
  DECLARATION: '/declaration'
}

export const entraIdRoutes = [
  routes.VIEW_DETAILS_INTERNAL_USER,
  routes.ADMIN_BACKFILL,
  routes.ADMIN_EMP,
  marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_INTERNAL_USER,
  routes.ADMIN_EXEMPTIONS
]

export const isEntraIdRoute = (route) => {
  if (!route) {
    return false
  }
  return entraIdRoutes.some((r) => r === route || route?.startsWith(r))
}

export const redirectPathCacheKey = 'redirectPath'

export const changeOrganisationQueryParam = 'change-organisation'

export const apiRoutes = {
  SUBMIT_EXEMPTION: '/exemption/submit',
  SUBMIT_MARINE_LICENCE: '/marine-licence/submit'
}

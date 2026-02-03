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
  DELETE_SITE: '/exemption/delete-site',
  DELETE_ALL_SITES: '/exemption/delete-all-sites',
  COOKIES: '/help/cookies',
  PRIVACY: '/help/privacy',
  ADMIN_EXEMPTIONS: '/admin/exemptions'
}

export const marineLicenseRoutes = {
  MARINE_LICENSE_PROJECT_NAME: '/marine-license/project-name',
  MARINE_LICENSE_TASK_LIST: '/marine-license/task-list'
}

export const preLoginRoutes = {
  CHECK_SETUP_EMPLOYEE: '/prelogin/check-setup-employee',
  ADD_TO_ORG_ACCOUNT: '/prelogin/add-to-org-account'
}

export const routes = {
  preLogin: preLoginRoutes,
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
  PRIVACY: '/help/privacy'
}

export const entraIdRoutes = [
  routes.VIEW_DETAILS_INTERNAL_USER,
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

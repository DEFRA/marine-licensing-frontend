import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const getBackLink = (action) =>
  action
    ? marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
    : marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS

export const getCancelLink = (action) =>
  action ? undefined : marineLicenceRoutes.MARINE_LICENCE_TASK_LIST

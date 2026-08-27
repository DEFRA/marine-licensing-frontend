import { INVOICING_ENTRY_POINTS_KEY } from '#src/server/common/constants/cache.js'

/**
 * Back links on the invoice address pages depend on how the user got there, which
 * the URL cannot say on its own: `?action=change` marks the change flow, not the
 * page behind. Each page that leads to one of these records itself here.
 */
export const INVOICING_ENTRY_POINT_PAGES = {
  UK_INVOICE_ADDRESS: 'ukInvoiceAddress',
  CONFIRM_ADDRESS: 'confirmAddress'
}

export const setInvoicingPageEntryPoint = async (
  request,
  h,
  pageKey,
  entryPoint
) => {
  const entryPoints = request.yar.get(INVOICING_ENTRY_POINTS_KEY) ?? {}

  request.yar.set(INVOICING_ENTRY_POINTS_KEY, {
    ...entryPoints,
    [pageKey]: entryPoint
  })
  await request.yar.commit(h)
}

export const getInvoicingPageEntryPoint = (request, pageKey) =>
  request.yar?.get(INVOICING_ENTRY_POINTS_KEY)?.[pageKey]

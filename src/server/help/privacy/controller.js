export const privacyController = {
  handler(_request, h) {
    return h.view('help/privacy/index', {
      pageTitle: 'Privacy notice – Get permission for marine work',
      heading: 'Privacy notice – Get permission for marine work'
    })
  }
}

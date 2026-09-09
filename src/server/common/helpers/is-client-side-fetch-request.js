export const isClientSideFetchRequest = (request) =>
  request.headers['x-requested-with'] === 'XMLHttpRequest'

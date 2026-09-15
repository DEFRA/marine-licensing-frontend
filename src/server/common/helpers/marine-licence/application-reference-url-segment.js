export const toApplicationReferenceUrlSegment = (applicationReference) =>
  applicationReference.replaceAll('/', '-')

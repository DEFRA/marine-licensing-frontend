export const expectedPageContentOrganisation = {
  invoiceAddressType: 'UK',
  invoiceAddress: '123 Example Street',
  fullName: 'Jon Doe',
  organisationName: 'Example Organisation',
  phoneNumber: '0191 111 1111',
  emailAddress: 'john.doe@example.com',
  purchaseOrderDetails: 'PO-12345'
}

export const expectedPageContentOrganisationPoNotRequired = {
  ...expectedPageContentOrganisation,
  purchaseOrderDetails: 'Not required'
}

export const expectedPageContentIndividual = {
  invoiceAddressType: 'UK',
  invoiceAddress: '123 Example Street',
  fullName: 'Jon Doe',
  phoneNumber: '0191 111 1111',
  emailAddress: 'john.doe@example.com'
}

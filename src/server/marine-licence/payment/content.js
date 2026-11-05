const NOT_CHARGED = 'You have not been charged.'
const SAVED = 'Your application has been saved.'

export const PAYMENT_PROBLEM_CONTENT = {
  P0010: {
    heading: 'Your payment was declined',
    paragraphs: [
      `${NOT_CHARGED} ${SAVED}`,
      'You can try again with a different card.'
    ],
    buttonText: 'Try again'
  },
  P0020: {
    heading: 'Your payment session timed out',
    paragraphs: [`${NOT_CHARGED} ${SAVED}`],
    buttonText: 'Try again'
  },
  P0030: {
    heading: 'You cancelled your payment',
    paragraphs: [`${NOT_CHARGED} ${SAVED}`],
    buttonText: 'Try again'
  },
  unfinished: {
    heading: 'Your payment is not complete',
    paragraphs: [SAVED, 'You need to pay before your application can be sent.'],
    buttonText: 'Continue to payment'
  },
  default: {
    heading: 'Sorry, there is a problem with the payment service',
    paragraphs: [`${NOT_CHARGED} ${SAVED}`, 'Try again later.'],
    buttonText: 'Try again'
  }
}

export const getPaymentProblemContent = ({ finished, code }) => {
  if (!finished) {
    return PAYMENT_PROBLEM_CONTENT.unfinished
  }
  return PAYMENT_PROBLEM_CONTENT[code] ?? PAYMENT_PROBLEM_CONTENT.default
}

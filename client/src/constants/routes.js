export default Object.freeze({

  // Public routes
  Form: '/',
  Login: '/login',
  Confirmation: '/confirmation',

  // Private routes
  Submissions: '/submissions',
  SubmissionDetails: {
    staticRoute: '/submission/:confirmationNumber',
    dynamicRoute: (confirmationNumber) => `/submission/${confirmationNumber}`,
  },
});

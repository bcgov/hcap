export default Object.freeze({
  // Hostname
  ParticipantHostname: RegExp('^(www\\.)?hcapparticipants\\..*'),
  EmployerHostname: RegExp('^(www\\.)?hcapemployers\\..*'),

  // Public routes
  Login: '/login',
  Keycloak: '/keycloak',
  Base: '/', // This routes to employer form or participant form based on hostname
  ParticipantForm: '/participant-form',
  ParticipantConfirmation: '/participant-confirmation',
  EmployerConfirmation: '/employer-confirmation',
<<<<<<< HEAD
  ConfirmInterest: '/confirm-interest',
=======
  ConfirmInterest: '/participant-otp',
>>>>>>> Remaned OTP.js to ConfirmInterest.js, cleaned up some variable names and updated copy

  // Private routes
  Admin: '/admin',
  UserPending: '/user-pending',
  UserEdit: '/user-edit',
  EOIView: '/eoi-view',
  EOIViewDetails: '/eoi-view/details/:id',
  SiteView: '/site-view',
  SiteViewDetails: '/site-view/:id',
  ParticipantView: '/participant-view',
  ParticipantUpload: '/participant-upload',
  ParticipantUploadResults: '/participant-upload-results',
  ReportingView: '/reporting-view',
});

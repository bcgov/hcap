export default Object.freeze({
  // Public routes
  Login: '/login',
  Keycloak: '/keycloak',
  EmployerForm: '/',
  ParticipantForm: '/participant-form',
  ParticipantConfirmation: '/participant-confirmation',
  EmployerConfirmation: '/employer-confirmation',

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

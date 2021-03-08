export default Object.freeze({
  // Hostname
  ParticipantHostname: 'hcapparticipants.gov.bc.ca',

  // Public routes
  Login: '/login',
  Keycloak: '/keycloak',
  Base: '/', // This routes to employer form or participant form based on hostname
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

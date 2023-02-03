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
  ConfirmInterest: '/confirm-interest',
  ParticipantLogin: '/participant-login',

  // Participant Private routes
  ParticipantLanding: '/participant-landing',
  ParticipantEOI: '/participant-eoi/:id',
  ParticipantEOIEdit: '/participant-eoi/:id/edit',
  ParticipantWithdrawConfirm: '/participant-withdraw-confirm',
  ParticipantFullWithdraw: '/participant-full-withdrawal',
  ParticipantActionSuccess: '/participant-eoi/:id/success',

  // Employer Private routes
  Admin: '/admin',
  UserPending: '/user-pending',
  UserEdit: '/user-edit',
  EOIView: '/eoi-view',
  EOIViewDetails: '/eoi-view/details/:id',
  SiteView: '/site-view',
  SiteViewDetails: '/site-view/:id',
  PSIView: '/psi-view',
  PSIViewDetails: '/psi-view/:id',
  CohortDetails: '/cohort/:id',
  ParticipantView: '/participant-view',
  ReportingView: '/reporting-view',
  ParticipantDetails: '/participant-details/:page/:pageId/:id',
  ParticipantDetailsTab: '/participant-details/:page/:pageId/:id/:tab',
  PhaseView: '/phase-view',
});

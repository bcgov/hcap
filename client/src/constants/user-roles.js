export const Role = {
  Superuser: 'superuser',
  MinistryOfHealth: 'ministry_of_health',
  HealthAuthority: 'health_authority',
  Employer: 'employer',
  Participant: 'participant',
  Pending: 'pending',
  Maximus: 'maximus',
  MHSUEmployer: 'mhsu-employer',
};

export const UserRoles = [
  Role.MinistryOfHealth,
  Role.HealthAuthority,
  Role.Employer,
  Role.MHSUEmployer,
];

export const EmployerRoles = [Role.Employer, Role.MHSUEmployer];

export const RolePriority = [Role.Superuser, ...UserRoles];

export const Role = {
  Superuser: 'superuser',
  MinistryOfHealth: 'ministry_of_health',
  HealthAuthority: 'health_authority',
  Employer: 'employer',
  Participant: 'participant',
  Pending: 'pending',
  Maximus: 'maximus',
};

export const UserRoles = [Role.MinistryOfHealth, Role.HealthAuthority, Role.Employer];

export const RolePriority = [Role.Superuser, ...UserRoles];

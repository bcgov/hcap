export enum Role {
  Superuser = 'superuser',
  MinistryOfHealth = 'ministry_of_health',
  HealthAuthority = 'health_authority',
  Employer = 'employer',
  Participant = 'participant',
  Pending = 'pending',
}

export const UserRoles = [Role.MinistryOfHealth, Role.HealthAuthority, Role.Employer];

export const AllRoles = [Role.Superuser, ...UserRoles, Role.Participant, Role.Pending];

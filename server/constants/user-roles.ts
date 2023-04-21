export enum Role {
  Superuser = 'superuser',
  HealthAuthority = 'health_authority',
  Employer = 'employer',
  MinistryOfHealth = 'ministry_of_health',
  Participant = 'participant',
  Pending = 'pending',
}

export const UserRoles = [Role.Employer, Role.HealthAuthority, Role.MinistryOfHealth];

export const AllRoles = [...UserRoles, Role.Pending, Role.Participant, Role.Superuser];

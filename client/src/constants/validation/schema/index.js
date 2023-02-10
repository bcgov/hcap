import * as yup from 'yup';

export * from './schema-approve-access-request';
export * from './schema-archive-hired-participant';
export * from './schema-create-psi';
export * from './schema-create-site';
export * from './schema-create-phase';
export * from './schema-edit-participant-form';
export * from './schema-edit-psi';
export * from './schema-edit-site';
export * from './schema-employer-form';
export * from './schema-external-hired-participant';
export * from './schema-hire-form';
export * from './schema-indigenous-declaration';
export * from './schema-interviewing-form';
export * from './schema-login';
export * from './schema-new-cohort';
export * from './schema-participant-assign-cohort';
export * from './schema-participant-edit-form';
export * from './schema-participant-form';
export * from './schema-participant-post-hire-status';
export * from './schema-rejected-form';
export * from './schema-return-of-service';
export * from './schema-select-prospecting-sites';
export * from './schema-edit-ros-date';
export * from './schema-edit-ros-site';
export * from './schema-edit-ros-start-date';
export * from './schema-set-allocation';

export const genericConfirm = yup.object().shape({
  confirmed: yup.boolean().test('is-true', 'Please confirm', (v) => v === true),
});

export const EmailSubmissionSchema = yup.object().shape({
  email: yup.string().email().required('Required'),
});

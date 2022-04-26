export const getDialogTitle = (activeModalForm) => {
  if (activeModalForm === 'prospecting') return 'Candidate Engaged';
  if (activeModalForm === 'hired') return 'Hire Participant';
  if (activeModalForm === 'interviewing') return 'Interview Participant';
  if (activeModalForm === 'rejected') return 'Archive Participant';
  if (activeModalForm === 'new-participant') return 'Add New Non-Portal Hire';
  if (activeModalForm === 'edit-participant') return 'Edit Participant';
  if (activeModalForm === 'archive') return 'Archive Participant';
  if (activeModalForm === 'single-select-site') return 'Select Site';
  if (activeModalForm === 'multi-select-site') return 'Select Site';
  if (activeModalForm === 'return-of-service') return '';
  return 'Change Participant Status';
};

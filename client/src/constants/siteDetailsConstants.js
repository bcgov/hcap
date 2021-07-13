export const tabColumns = {
  // Tabs, associated allowed roles, displayed statuses
  'Site Details': {
    columns: [],
  },
  'Hired Participants': {
    columns: [
      { id: 'participantId', name: 'ID' },
      { id: 'participantName', name: 'Name' },
      { id: 'hiredDate', name: 'Hire Date' },
      { id: 'startDate', name: 'Start Date' },
      { id: 'nonHCAP', name: 'Position' },
      { id: 'archive', name: 'Archive' },
    ],
  },
  'Withdrawn Participants': {
    columns: [
      { id: 'participantId', name: 'ID' },
      { id: 'participantName', name: 'Name' },
      { id: 'withdrawnDate', name: 'Withdrawn Date' },
      { id: 'reason', name: 'Reason' },
    ],
  },
};

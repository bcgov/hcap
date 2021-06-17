import React, { useReducer } from 'react';

import { columnsByRole } from '../constants/participantTableConstants';

const ParticipantsContext = React.createContext();

const types = {
  CHANGE_COLUMNS: 'CHANGE_COLUMNS',
};

const participantsReducer = (state, action) => {
  const { type, payload } = action;
  const { CHANGE_COLUMNS } = types;

  switch (type) {
    case CHANGE_COLUMNS:
      const columns = columnsByRole?.[payload.role]?.[payload.tab];
      columns?.sort((a, b) => a.sortOrder - b.sortOrder);
      return {
        user: payload,
        columns,
      };
    default:
      return state;
  }
};

/**
 * For more: https://kentcdodds.com/blog/how-to-use-react-context-effectively
 */

const ParticipantsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(participantsReducer, {
    columns: null,
  });

  const value = { state, dispatch };

  return <ParticipantsContext.Provider value={value}>{children}</ParticipantsContext.Provider>;
};

function useParticipantsContext() {
  const context = React.useContext(ParticipantsContext);
  if (context === undefined) {
    throw new Error('useParticipants must be used within a ParticipantsProvider');
  }
  return context;
}

export { ParticipantsProvider, useParticipantsContext, types };

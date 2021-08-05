import React, { useEffect, useReducer } from 'react';

import { columnsByRole, tabStatuses, tabsByRole } from '../constants/participantTableConstants';

const ParticipantsContext = React.createContext();

const types = {
  UPDATE_ROLE: 'UPDATE_ROLE',
  SELECT_TAB: 'SELECT_TAB',
  CHANGE_PAGE: 'CHANGE_PAGE',
};

const participantsReducer = (state, action) => {
  const { type, payload } = action;
  const { UPDATE_ROLE, SELECT_TAB, CHANGE_PAGE } = types;

  switch (type) {
    case UPDATE_ROLE: {
      const tabs = tabsByRole[payload];
      const defaultTab = tabs[0];
      const columns = columnsByRole[payload][defaultTab];
      columns?.sort((a, b) => a.sortOrder - b.sortOrder);
      return {
        ...state,
        role: payload,
        columns,
        tabs,
        selectedTab: defaultTab,
        selectedTabStatuses: tabStatuses[defaultTab],
        currentPage: 0,
      };
    }
    case SELECT_TAB: {
      const columns = columnsByRole[state.role][payload];
      columns?.sort((a, b) => a.sortOrder - b.sortOrder);
      return {
        ...state,
        columns,
        selectedTab: payload,
        selectedTabStatuses: tabStatuses[payload],
        currentPage: 0,
      };
    }
    case CHANGE_PAGE: {
      return {
        ...state,
        currentPage: payload,
      };
    }
    default:
      return state;
  }
};

/**
 * For more: https://kentcdodds.com/blog/how-to-use-react-context-effectively
 */

const ParticipantsProvider = ({ role, children }) => {
  const [state, dispatch] = useReducer(participantsReducer, {
    role,
    columns: null,
    tabs: null,
    selectedTab: null,
    selectedTabStatuses: null,
    currentPage: 0,
  });

  useEffect(() => {
    dispatch({
      type: types.UPDATE_ROLE,
      payload: role,
    });
  }, [role]);

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

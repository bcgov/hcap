import React, { useEffect, useReducer } from 'react';

import { columnsByRole, tabStatuses, tabsByRole } from '../constants/participantTableConstants';

const ParticipantsContext = React.createContext();

const types = {
  UPDATE_ROLE: 'UPDATE_ROLE',
  SELECT_TAB: 'SELECT_TAB',
  UPDATE_PAGINATION: 'UPDATE_PAGINATION',
  UPDATE_FILTER: 'UPDATE_FILTER',
  UPDATE_SITE_SELECTOR: 'UPDATE_SITE_SELECTOR',
  UPDATE_TABLE_ORDER: 'UPDATE_TABLE_ORDER',
};

const DEFAULT_SORT_ORDER = { field: 'id', direction: 'asc' };

const participantsReducer = (state, action) => {
  const { type, payload } = action;
  const {
    UPDATE_ROLE,
    SELECT_TAB,
    UPDATE_PAGINATION,
    UPDATE_FILTER,
    UPDATE_SITE_SELECTOR,
    UPDATE_TABLE_ORDER,
  } = types;

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
        pagination: {
          page: 0,
          total: 0,
          offset: 0,
        },
        order: { ...DEFAULT_SORT_ORDER }, // Clearing the sort order when changing tabs
      };
    }
    case UPDATE_PAGINATION: {
      return {
        ...state,
        pagination: {
          ...state.pagination,
          ...payload,
        },
      };
    }
    case UPDATE_FILTER: {
      const { key, value } = payload;
      return {
        ...state,
        filter: {
          ...state.filter,
          [payload.key]: {
            key,
            value: typeof value === 'string' ? value.trim() : value,
          },
        },
      };
    }
    case UPDATE_SITE_SELECTOR: {
      return {
        ...state,
        order: {
          field: 'distance',
          direction: 'asc',
        },
        siteSelector: payload,
      };
    }
    case UPDATE_TABLE_ORDER: {
      return {
        ...state,
        order: {
          ...state.order,
          ...payload,
        },
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
    filter: {},
    siteSelector: '',
    pagination: {
      page: 0,
      total: 0,
      offset: 0,
    },
    order: { ...DEFAULT_SORT_ORDER },
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

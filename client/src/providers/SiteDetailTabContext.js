import React, { useEffect, useReducer } from 'react';
import { tabColumns } from '../constants';

const SiteDetailTabContext = React.createContext();

const types = {
  SELECT_TAB: 'SELECT_TAB',
  LOAD_SITE: 'LOAD_SITE',
  UPDATE_SITE: 'UPDATE_SITE',
};

const tabs = {
  SITE_DETAILS: 'Site Details',
  HIRED_PARTICIPANTS: 'Hired Participants',
  WITHDRAWN_PARTICIPANTS: 'Withdrawn Participants',
  ALLOCATION: 'Allocation',
};

const participantsReducer = (state, action) => {
  const {
    type,
    payload: { tab, roles, site },
  } = action;
  const { SELECT_TAB, LOAD_SITE, UPDATE_SITE } = types;

  switch (type) {
    case SELECT_TAB: {
      let columns = tabColumns[tab]?.columns || [];
      const isHA = roles?.includes('health_authority') || false;
      if (!isHA) {
        columns = columns.filter((col) => col.id !== 'archive');
      }

      return {
        ...state,
        columns,
        selectedTab: tab,
      };
    }

    case LOAD_SITE: {
      return {
        ...state,
        site: {},
      };
    }

    case UPDATE_SITE: {
      return {
        ...state,
        site,
      };
    }

    default:
      return state;
  }
};

/**
 * For more: https://kentcdodds.com/blog/how-to-use-react-context-effectively
 */

const TabProvider = ({ selectedTab, site, children }) => {
  const [state, dispatch] = useReducer(participantsReducer, {
    columns: [],
    selectedTab: null,
    site: {},
  });

  useEffect(() => {
    dispatch({
      type: types.SELECT_TAB,
      payload: { tab: selectedTab },
    });
  }, [selectedTab]);

  useEffect(() => {
    dispatch({
      type: types.UPDATE_SITE,
      payload: { site: site },
    });
  }, [site]);

  const value = { state, dispatch };

  return <SiteDetailTabContext.Provider value={value}>{children}</SiteDetailTabContext.Provider>;
};

function useTabContext() {
  const context = React.useContext(SiteDetailTabContext);
  if (context === undefined) {
    throw new Error('useTabContext must be used within a TabProvider');
  }
  return context;
}

export { TabProvider, useTabContext, types, tabs };

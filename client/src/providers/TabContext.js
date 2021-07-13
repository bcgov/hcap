import React, { useEffect, useReducer } from 'react';

import { tabColumns } from '../constants/siteDetailsConstants';

const TabContext = React.createContext();

const types = {
  SELECT_TAB: 'SELECT_TAB',
};

const participantsReducer = (state, action) => {
  const {
    type,
    payload: { tab, roles },
  } = action;
  const { SELECT_TAB } = types;

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

    default:
      return state;
  }
};

/**
 * For more: https://kentcdodds.com/blog/how-to-use-react-context-effectively
 */

const TabProvider = ({ selectedTab, children }) => {
  const [state, dispatch] = useReducer(participantsReducer, {
    columns: [],
    selectedTab: null,
  });

  useEffect(() => {
    dispatch({
      type: types.SELECT_TAB,
      payload: { tab: selectedTab },
    });
  }, [selectedTab]);

  const value = { state, dispatch };

  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
};

function useTabContext() {
  const context = React.useContext(TabContext);
  if (context === undefined) {
    throw new Error('useTabContext must be used within a TabProvider');
  }
  return context;
}

export { TabProvider, useTabContext, types };

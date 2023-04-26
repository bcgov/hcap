import React, { useReducer } from 'react';

import { RolePriority } from '../constants';

const AuthContext = React.createContext();

const USER_LOADING = 'USER_LOADING';
const USER_LOADED = 'USER_LOADED';
const USER_NOTIFICATIONS_UPDATED = 'USER_NOTIFICATIONS_UPDATED';

const authReducer = (state, action) => {
  switch (action.type) {
    case USER_LOADING:
      return {
        ...state,
        user: null,
        isLoading: true,
      };
    case USER_LOADED:
      return {
        ...state,
        user: action.payload,
        notifications: action.payload.notifications ?? state.notifications,
        isLoading: false,
        // find first role in above array that is included in the user object (highest permission role)
        permissionRole: RolePriority.find((role) => action.payload?.roles.includes(role)),
      };

    case USER_NOTIFICATIONS_UPDATED:
      return {
        ...state,
        notifications: action.payload.notifications,
      };
    default:
      return state;
  }
};

/**
 * For more: https://kentcdodds.com/blog/how-to-use-react-context-effectively
 */

const AuthProvider = ({ children }) => {
  const [auth, dispatch] = useReducer(authReducer, {
    user: null,
    notifications: null,
    isLoading: true,
    permissionRole: null,
  });

  const value = { auth, dispatch };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
}

export { AuthProvider, useAuth, USER_LOADING, USER_LOADED, USER_NOTIFICATIONS_UPDATED };

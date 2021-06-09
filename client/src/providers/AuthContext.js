import React, { useReducer } from 'react';

const AuthContext = React.createContext();

const USER_LOADING = 'USER_LOADING';
const USER_LOADED = 'USER_LOADED';

const authReducer = (state, action) => {
  switch (action.type) {
    case USER_LOADING:
      return {
        user: null,
        isLoading: true,
      };
    case USER_LOADED:
      return {
        user: action.payload,
        isLoading: false,
      };
    default:
      return state;
  }
};

/**
 * For more: https://kentcdodds.com/blog/how-to-use-react-context-effectively
 */

const AuthProvider = ({ children }) => {
  const [auth, dispatch] = useReducer(authReducer, { user: null, isLoading: true });

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

export { AuthProvider, useAuth, USER_LOADING, USER_LOADED };

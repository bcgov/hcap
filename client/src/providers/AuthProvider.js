import React, { useState } from 'react';

const AuthContext = React.createContext();

/**
 * For more: https://kentcdodds.com/blog/how-to-use-react-context-effectively
 */

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState();

  const value = { user, setUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
}

export { AuthProvider, useAuth };

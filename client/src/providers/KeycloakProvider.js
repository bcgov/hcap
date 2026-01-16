import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import Keycloak from 'keycloak-js';
import LinearProgress from '@mui/material/LinearProgress';
import { API_URL } from '../constants';
import storage from '../utils/storage';
import { useAuth, USER_LOADED } from './AuthContext';

const KeycloakContext = createContext();

export const useKeycloak = () => {
  const context = useContext(KeycloakContext);
  if (!context) {
    throw new Error('useKeycloak must be used within a KeycloakProvider');
  }
  return context;
};

export const KeycloakProvider = ({ children, onTokens }) => {
  const [keycloak, setKeycloak] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { dispatch } = useAuth();
  const initialized = useRef(false);
  const refreshTimerRef = useRef(null);

  const initKeycloak = useCallback(async () => {
    // Prevent re-initialization
    if (initialized.current) {
      return;
    }
    initialized.current = true;

    try {
      setLoading(true);
      setError(null);

      // Fetch Keycloak configuration
      const response = await fetch(`${API_URL}/api/v1/keycloak-realm-client-info`, {
        headers: {
          Accept: 'application/json',
          'Content-type': 'application/json',
        },
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.realm || !result.url || !result.clientId) {
        throw new Error('Invalid Keycloak configuration received');
      }

      // Create Keycloak instance
      let keycloakInstance = new Keycloak({
        realm: result.realm,
        url: result.url,
        clientId: result.clientId,
      });

      // Initialize Keycloak
      // Disable iframe check on localhost to avoid CORS/iframe issues
      const isLocalhost =
        window.location.hostname.includes('localhost') ||
        window.location.hostname.includes('127.0.0.1');

      let authenticated;

      if (isLocalhost) {
        console.log('Running on localhost - disabling iframe check');
        authenticated = await keycloakInstance.init({
          pkceMethod: 'S256',
          checkLoginIframe: false,
        });
      } else {
        try {
          authenticated = await keycloakInstance.init({
            pkceMethod: 'S256',
            checkLoginIframe: true,
            checkLoginIframeInterval: 30, // Check every 30 seconds
            messageReceiveTimeout: 10000, // Wait up to 10 seconds for iframe
          });
        } catch (initError) {
          console.warn(
            'Keycloak iframe initialization failed, falling back to token-only mode:',
            initError,
          );
          // Create a new instance for fallback since Keycloak can only be initialized once
          keycloakInstance = new Keycloak({
            realm: result.realm,
            url: result.url,
            clientId: result.clientId,
          });
          authenticated = await keycloakInstance.init({
            pkceMethod: 'S256',
            checkLoginIframe: false,
          });
        }
      }

      if (authenticated) {
        // Extract user data from Keycloak token
        const tokenParsed = keycloakInstance.tokenParsed;

        if (tokenParsed) {
          // Debug token expiration times
          const now = Math.floor(Date.now() / 1000);
          const tokenExp = tokenParsed.exp;
          const tokenMinutesLeft = Math.floor((tokenExp - now) / 60);
          console.log('=== TOKEN DEBUG INFO ===');
          console.log('Current time:', new Date(now * 1000).toLocaleTimeString());
          console.log('Token expires at:', new Date(tokenExp * 1000).toLocaleTimeString());
          console.log('Token valid for:', tokenMinutesLeft, 'minutes');
          console.log('checkLoginIframe enabled:', !keycloakInstance.checkLoginIframe === false);
          console.log('========================');

          // Check different possible locations for roles
          const realmRoles = tokenParsed.realm_access?.roles || [];
          const clientRoles = tokenParsed.resource_access?.[tokenParsed.aud]?.roles || [];
          const hcapClientRoles = tokenParsed.resource_access?.['HCAP-FE']?.roles || [];
          const allRoles = [...realmRoles, ...clientRoles, ...hcapClientRoles];

          // Prepare basic user data from token
          const basicUserData = {
            id: tokenParsed.sub,
            username: tokenParsed.preferred_username || tokenParsed.name,
            name: tokenParsed.name || tokenParsed.preferred_username,
            email: tokenParsed.email,
            roles: allRoles,
          };

          // Store token for API calls
          storage.set('TOKEN', keycloakInstance.token);

          // Fetch additional user data including sites from server
          try {
            const userResponse = await fetch(`${API_URL}/api/v1/user`, {
              headers: {
                Authorization: `Bearer ${keycloakInstance.token}`,
                'Content-Type': 'application/json',
              },
              method: 'GET',
            });

            if (userResponse.ok) {
              const serverUserData = await userResponse.json();

              // Merge token data with server data
              const completeUserData = {
                ...basicUserData,
                sites: serverUserData.sites || [],
                notifications: serverUserData.notifications || [],
                // Any other properties from server
              };

              dispatch({
                type: USER_LOADED,
                payload: completeUserData,
              });
            } else {
              console.warn('Failed to fetch user data from server, using basic token data only');
              dispatch({
                type: USER_LOADED,
                payload: basicUserData,
              });
            }
          } catch (error) {
            console.error('Error fetching user data from server:', error);
            dispatch({
              type: USER_LOADED,
              payload: basicUserData,
            });
          }
        } else {
          console.log('No tokenParsed available, cannot extract user data');
        }
      } else {
        console.log('User is not authenticated');
      }

      setKeycloak(keycloakInstance);
      setAuthenticated(authenticated);

      // Set up global fetch interceptor for 401 errors
      if (authenticated) {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
          try {
            const response = await originalFetch(...args);

            // If we get 401 Unauthorized, session has expired
            if (response.status === 401 && storage.get('TOKEN')) {
              console.error('401 Unauthorized - clearing session');
              storage.remove('TOKEN');
              setAuthenticated(false);
              alert('Your session has expired. Please login again.');
              keycloakInstance.login({
                redirectUri: window.location.href,
              });
              return response;
            }

            return response;
          } catch (error) {
            // Handle network errors (CORS, network failure, etc.)
            // These often happen when token is expired and server rejects the request
            if (
              storage.get('TOKEN') &&
              (error.message.includes('Failed to fetch') || error.message.includes('CORS'))
            ) {
              console.error('Network error with expired token - clearing session');
              storage.remove('TOKEN');
              setAuthenticated(false);
              alert('Your session has expired. Please login again.');
              keycloakInstance.login({
                redirectUri: window.location.href,
              });
            }
            throw error; // Re-throw for other types of errors
          }
        };
      }

      // Set up token refresh
      if (authenticated) {
        const tokens = {
          token: keycloakInstance.token,
          refreshToken: keycloakInstance.refreshToken,
          idToken: keycloakInstance.idToken,
        };

        if (onTokens) {
          onTokens(tokens);
        }

        // Helper function to handle token refresh
        const refreshToken = () => {
          keycloakInstance
            .updateToken(60) // Refresh if token expires in less than 60 seconds
            .then((refreshed) => {
              if (refreshed) {
                console.log('Token refreshed successfully');
                const newTokens = {
                  token: keycloakInstance.token,
                  refreshToken: keycloakInstance.refreshToken,
                  idToken: keycloakInstance.idToken,
                };
                if (onTokens) {
                  onTokens(newTokens);
                }
                storage.set('TOKEN', keycloakInstance.token);

                // Schedule next refresh after successful refresh
                scheduleTokenRefresh();
              } else {
                console.log('Token not refreshed, still valid');
                // Token still valid, check again in 10 seconds
                // This prevents tight loops when token is close to but not within refresh threshold
                refreshTimerRef.current = setTimeout(() => {
                  refreshToken();
                }, 10000);
              }
            })
            .catch((error) => {
              console.error('Failed to refresh token - session expired', error);
              // Clear stored token to prevent further API calls with expired token
              storage.remove('TOKEN');
              // Alert user and redirect to login
              alert('Your session has expired. You will be redirected to login.');
              keycloakInstance.login({
                redirectUri: window.location.href,
              });
            });
        };

        // Schedule token refresh before expiration
        const scheduleTokenRefresh = () => {
          // Clear any existing timer
          if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
          }

          // Calculate when to refresh (e.g., 1 minute before expiration)
          const tokenParsed = keycloakInstance.tokenParsed;
          if (tokenParsed && tokenParsed.exp) {
            const now = Math.floor(Date.now() / 1000);
            const tokenExp = tokenParsed.exp;
            const timeUntilExpiry = tokenExp - now;

            // Refresh 60 seconds before expiration
            // Add minimum delay of 10 seconds to prevent tight loops
            const refreshTime = Math.max(10000, (timeUntilExpiry - 60) * 1000);

            console.log(`Next token refresh check in ${Math.floor(refreshTime / 1000)} seconds`);

            refreshTimerRef.current = setTimeout(() => {
              refreshToken();
            }, refreshTime);
          }
        };

        // Start the refresh schedule
        scheduleTokenRefresh();

        // Set up automatic token refresh as fallback (in case timer misses)
        keycloakInstance.onTokenExpired = () => {
          console.warn('Token expired - refreshing immediately (fallback handler)');
          refreshToken();
        };

        // Monitor SSO session state when checkLoginIframe is enabled
        keycloakInstance.onAuthLogout = () => {
          console.log('SSO logout detected');
          if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
          }
          storage.remove('TOKEN');
          setAuthenticated(false);
          alert('You have been logged out. Please login again.');
          window.location.reload();
        };
      }

      // Save environment variables
      if (result.envVariables && Object.keys(result.envVariables).length > 0) {
        for (const key of Object.keys(result.envVariables)) {
          storage.set(key, result.envVariables[key]);
        }
      }
    } catch (err) {
      console.error('Failed to initialize Keycloak:', err);
      setError(err.message);
      // Set a fallback null keycloak to prevent crashes
      setKeycloak(null);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [onTokens, dispatch]);

  useEffect(() => {
    initKeycloak();

    // Cleanup function to clear refresh timer
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [initKeycloak]);

  const login = useCallback(() => {
    if (keycloak) {
      keycloak.login({
        redirectUri: window.location.href,
      });
    }
  }, [keycloak]);

  const logout = useCallback(() => {
    if (keycloak) {
      keycloak.logout();
    }
  }, [keycloak]);

  const value = {
    keycloak,
    authenticated,
    loading,
    error,
    login,
    logout,
  };

  if (loading) {
    return <LinearProgress />;
  }

  if (error) {
    return <div>Error initializing authentication: {error}</div>;
  }

  return <KeycloakContext.Provider value={value}>{children}</KeycloakContext.Provider>;
};

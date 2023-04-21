import keycloak from '../keycloak';
import { employer } from './util/keycloak';

describe('authenticates keycloak service-account', () => {
  it('authenticate and cache token by service account', async () => {
    keycloak.access_token = null;

    const user = await keycloak.getUser(employer.username);
    expect(user).toBeTruthy();
    expect(keycloak.access_token).toBeTruthy();
    expect(keycloak.expiresAt).toBeGreaterThan(0);

    const token = keycloak.access_token;
    keycloak.expiresAt = undefined;
    await keycloak.getUser(employer.username);
    expect(keycloak.access_token).toBeTruthy();
    expect(token).not.toEqual(keycloak.access_token);
  });

  it('refreshes token if it is about to expire', async () => {
    if (!keycloak.access_token) {
      await keycloak.getUser(employer.username);
    }

    keycloak.expiresAt = Date.now() / 1000 + 20;

    const token = keycloak.access_token;
    expect(token).toBeDefined();

    await keycloak.getUser(employer.username);
    expect(token).not.toEqual(keycloak.access_token);
  });
});

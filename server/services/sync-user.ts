import { UserRoles } from '../constants';
import { dbClient, collections } from '../db';
import keycloak from '../keycloak';
import logger from '../logger';

export const syncUser = async ({ log }: { log: boolean }) => {
  // Fetch all db users
  const allUsers: { id: string; keycloakId: string }[] = await dbClient.db[
    collections.USERS
  ].findDoc();
  // Fetch all keycloak users
  const keycloakUsers: { id: string }[] = await keycloak.getUsers(UserRoles);
  // Sync
  const resp = await Promise.all(
    allUsers.map(async (user) => {
      const keycloakUser = keycloakUsers.find((item) => item.id === user.keycloakId);
      if (keycloakUser) {
        const { id, ...details } = keycloakUser;
        if (log) logger.info(`Syncing user ${user.id} and keycloak user ${id}`);
        return dbClient.db[collections.USERS].updateDoc(user.id, {
          userInfo: details,
        });
      }
      return user;
    })
  );
  return resp;
};

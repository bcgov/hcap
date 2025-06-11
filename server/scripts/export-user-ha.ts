/* eslint-disable no-console, no-restricted-syntax, no-await-in-loop */
import { PromisePool } from '@supercharge/promise-pool';
import fs from 'fs';
import { AllRoles } from '../constants';
import keycloak from '../keycloak';
import { dbClient } from '../db';
import { getUserSites } from '../services/user';
import { EmployerSite } from '../services/employers';

type UserWithHAArray = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  sites?: string[];
  HA?: string[];
};

const HA_VALUES = ['Fraser', 'Interior', 'Vancouver Island', 'Northern', 'Vancouver Coastal'];

export const cacheUserBCeIDRoles = async (includeAll: boolean) => {
  if (includeAll) {
    console.info('Extracting all users');
  }

  const users = [];

  const keycloakUsers: { id: string }[] = await keycloak.getUsers(AllRoles);
  await PromisePool.for(keycloakUsers)
    .withConcurrency(10)
    .process(async (user) => {
      users.push({ ...user, roles: await keycloak.getUserRoles(user.id) });
    });

  if (users.length > 0) {
    await dbClient.connect();

    if (!('db' in dbClient) || !dbClient.db) throw new Error('Database failed to initialize!');

    const usersWithSites: UserWithHAArray[] = await Promise.all(
      users.map(async (user) => {
        if (!user.username.includes('bceid') && !includeAll) {
          return null;
        }
        const userSites = await getUserSites(user.id);
        const HAs: string[] = userSites.map((site: EmployerSite) => site.healthAuthority);
        if (user.roles.includes('ministry_of_health')) {
          // If the user is a Ministry of Health user, they have access to all HAs
          return {
            ...user,
            sites: userSites.map((site: EmployerSite) => site.siteId),
            HA: HA_VALUES,
          };
        }
        return {
          ...user,
          sites: userSites.map((site: EmployerSite) => site.siteId),
          HA: [...new Set(HAs)],
        };
      })
    ).then((results) => results.filter((user) => user !== null));

    console.info(`Found ${usersWithSites.length} users with sites`);

    const finalUserList: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      email: string;
      roles: string[];
      sites?: string[];
      HA?: string;
    }[] = [];

    usersWithSites.forEach((user) => {
      if (user.HA.length === 0) {
        finalUserList.push({
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          roles: user.roles,
          sites: user.sites,
          HA: '',
        });
        return;
      }
      user.HA.forEach((ha) => {
        finalUserList.push({
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          roles: user.roles,
          sites: user.sites,
          HA: ha,
        });
      });
    });

    // Write to CSV file
    // Format: id,roles
    const csv = finalUserList
      .map((user) => `${user.username},${user.firstName},${user.lastName},${user.email},${user.HA}`)
      .join('\n');
    await fs.promises
      .writeFile('./server/build/bceid-users.csv', csv)
      .then(() => {
        console.info('BCeID users cached successfully to ./server/build/bceid-users.csv');
      })
      .catch((err) => {
        console.error('Error writing to ./server/build/bceid-users.csv:', err);
      });
  }

  // find user's HA association
};

(async function main() {
  if (require.main === module) {
    const includeAll = process.argv.includes('--all');
    await keycloak.buildInternalIdMap();
    await cacheUserBCeIDRoles(includeAll);
  }
})();

/* eslint-disable no-console, no-restricted-syntax, no-await-in-loop */
import { PromisePool } from '@supercharge/promise-pool';
import fs from 'fs';
import path from 'path';
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

// Function to cache BCeID user roles and sites
export const exportUserHAs = async (includeAll: boolean) => {
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

    // Check if the database client is initialized correctly
    if (!('db' in dbClient) || !dbClient.db) throw new Error('Database failed to initialize!');

    // For all users with BCeID roles, get their sites and health authorities
    const usersWithSites: UserWithHAArray[] = await Promise.all(
      users.map(async (user) => {
        // Check if the user has a business BCeID or if we are including all users
        if (!user.username.includes('@bceid_business') && !includeAll) {
          return null;
        }
        // Get all sites for the user
        const userSites = await getUserSites(user.id);
        // Get the HAs for those sites
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
      // Generate a row for each health authority the user has access to
      // This allows users with access to multiple HAs to have multiple rows in the CSV
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

    // Create output directory if it doesn't exist
    if (!fs.existsSync(path.join(__dirname, 'output'))) {
      fs.mkdirSync(path.join(__dirname, 'output'), { recursive: true });
    }
    // Write to CSV file
    // Format: username,firstName,lastName,email,HA
    const csv = finalUserList
      .map((user) => `${user.username},${user.firstName},${user.lastName},${user.email},${user.HA}`)
      .join('\n');
    await fs.promises
      .writeFile(path.join(__dirname, 'output/business-bceid-users.csv'), csv)
      .then(() => {
        console.info(
          'Business BCeID users cached successfully to ./server/scripts/output/business-bceid-users.csv'
        );
      })
      .catch((err) => {
        console.error('Error writing to ./server/scripts/output/business-bceid-users.csv:', err);
      });
  }
};

(async function main() {
  if (require.main === module) {
    const includeAll = process.argv.includes('--all');
    await keycloak.buildInternalIdMap();
    await exportUserHAs(includeAll);
  }
})();

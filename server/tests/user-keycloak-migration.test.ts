import { constants } from 'http2';
import request from 'supertest';
import { v4 } from 'uuid';
import { collections, dbClient } from '../db';
import keycloak from '../keycloak';
import { cacheUserRoles } from '../scripts/cache-user-roles';
import { app } from '../server';
import { makeParticipant } from '../services/participants';
import { closeDB, startDB } from './util/db';
import {
  approveUsers,
  employer,
  employerBceid,
  getKeycloakToken,
  healthAuthority,
  ministryOfHealth,
  participant,
  superuser,
  TestUser,
} from './util/keycloak';
import { participantData } from './util/testData';

describe('Keycloak User Migration', () => {
  beforeAll(async () => {
    await startDB();
    await cacheUserRoles();
  });

  afterAll(closeDB);

  const testUsers = [healthAuthority, employer, ministryOfHealth, participant, superuser];

  const triggerMiddlewareToMigrateUser = async (user: TestUser) => {
    const header = await getKeycloakToken(user);

    const res = await request(app).get('/api/v1/user').set(header);
    expect(res.status).toEqual(constants.HTTP_STATUS_OK);
  };

  it.each(testUsers)(`migrates keycloak user: $username`, async (testUser) => {
    const isParticipant = testUser.username.includes('participant');
    if (isParticipant) {
      await makeParticipant(participantData({ emailAddress: 'cristiano.ronaldo@hcap.club' }));
    } else {
      await approveUsers(testUser);
    }

    const [migrationStatus] = await dbClient.db[collections.USER_MIGRATION].find({
      username: testUser.username,
    });

    expect(migrationStatus).toBeDefined();

    const keycloakId = migrationStatus.id;

    // prepare condition before migration
    const oldKeycloakId = v4();

    let user;
    if (!isParticipant) {
      [user] = await dbClient.db[collections.USERS].findDoc({
        keycloakId,
      });

      await dbClient.db[collections.USERS].updateDoc(user.id, {
        userInfo: user.userInfo,
        keycloakId: oldKeycloakId,
      });
    }

    await dbClient.db[collections.USER_MIGRATION].update(keycloakId, {
      id: oldKeycloakId,
    });

    await keycloak.deleteUserRoles(keycloakId);
    await triggerMiddlewareToMigrateUser(testUser);

    // check results
    const [newMigrationStatus] = await dbClient.db[collections.USER_MIGRATION].find({
      id: oldKeycloakId,
    });
    expect(newMigrationStatus.status).toEqual('complete');

    if (!participant) {
      const [updatedUser] = await dbClient.db[collections.USERS].findDoc({ keycloakId });
      expect(updatedUser.id).toEqual(user.id);
    }
    const roles = await keycloak.getUserRoles(keycloakId);
    const roleUpdated = newMigrationStatus.roles.every((role) => roles.includes(role));
    expect(roleUpdated).toBe(true);
  });

  it('maps business bceid to basic bceid', async () => {
    await approveUsers(employerBceid);
    const { username } = employerBceid;

    // change username to standard bceid
    const oldKeycloakId = v4();

    let migrationStatus = await dbClient.db[collections.USER_MIGRATION].findOne({ username });

    const keycloakId = migrationStatus.id;

    const oldUserName = `${employerBceid.username.split('@')[0]}@bceid`;
    await dbClient.db[collections.USER_MIGRATION].update(keycloakId, { username: oldUserName });

    let [user] = await dbClient.db[collections.USERS].findDoc({ keycloakId });

    user.userInfo.username = oldUserName;
    user.userInfo.id = oldKeycloakId;
    await dbClient.db[collections.USERS].updateDoc(user.id, {
      sites: user.sites ?? [],
      userInfo: user.userInfo,
      keycloakId: oldKeycloakId,
    });

    await keycloak.deleteUserRoles(keycloakId);

    // migrate user
    await triggerMiddlewareToMigrateUser(employerBceid);

    // verify
    migrationStatus = await dbClient.db[collections.USER_MIGRATION].findOne(keycloakId);
    expect(migrationStatus.username).toEqual(username);

    [user] = await dbClient.db[collections.USERS].findDoc({ keycloakId });
    expect(user.userInfo.username).toEqual(username);
  });

  it.each(testUsers)(`ignores user with roles other than pending: $username`, async (user) => {
    keycloak.migrateUser = jest.fn();
    await triggerMiddlewareToMigrateUser(user);
    expect(keycloak.migrateUser).not.toHaveBeenCalled();
  });
});

const { getEmployeeSiteSchema, errorMessage } = require('../../validators');

describe('Test Employer site schema', () => {
  it('should validate employer site object', async () => {
    const test = {
      siteId: 67,
      siteName: 'Test site',
      earlyAdaptorAllocation: 1,
      address: '123 XYZ',
      city: 'Victoria',
      healthAuthority: 'Vancouver Island',
      postalCode: 'V8V 1M5',
      registeredBusinessName: 'AAA',
      operatorContactFirstName: 'AABB',
      operatorContactLastName: 'CCC',
      operatorEmail: 'test@hcpa.fresh',
      operatorPhone: '2219909090',
      siteContactFirstName: 'NNN',
      siteContactLastName: 'PCP',
      siteContactPhoneNumber: '2219909091',
      siteContactEmailAddress: 'test.site@hcpa.fresh',

    };
    const schema = getEmployeeSiteSchema(errorMessage);
    expect(getEmployeeSiteSchema).toBeDefined();
    expect(schema.isValidSync(test, { strict: true })).toEqual(true);
  });
  it('should not validate employer site object', async () => {
    const test = {
      siteId: 67,
      siteName: 'Test site',
      earlyAdaptorAllocation: 1,
      address: '123 XYZ',
      city: 'Victoria',
      healthAuthority: 'Vancouver Island',
      postalCode: 'V8V',
      registeredBusinessName: 'AAA',
      operatorContactFirstName: 'AABB',
      operatorContactLastName: 'CCC',
      operatorEmail: 'test@hcpa.fresh',
      operatorPhone: '2219909091',
      siteContactFirstName: 'NNN',
      siteContactLastName: 'PCP',
      siteContactPhoneNumber: '2219909091',
      siteContactEmailAddress: 'test.site@hcpa.fresh',
    };
    const schema = getEmployeeSiteSchema(errorMessage);
    expect(getEmployeeSiteSchema).toBeDefined();
    expect(schema.isValidSync(test, { strict: true })).toEqual(false);
  });
});

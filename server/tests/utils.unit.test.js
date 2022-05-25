const { addYearToDate } = require('../utils');

describe('Unit test: utils -> Add year to date', () => {
  const addYearToDateTestData = [
    {
      description: 'Can add a year to Feb 29th on a leap year',
      given: '2020/02/29',
      expected: '2021/03/01',
    },
    {
      description: 'Can add a year to Feb 28th on a leap year',
      given: '2020/02/28',
      expected: '2021/02/28',
    },
    {
      description: 'Can add a year to Mar 1st on a leap year',
      given: '2020/03/01',
      expected: '2021/03/01',
    },
    {
      description: 'Can add a year to Mar 1st before a leap year',
      given: '2019/03/01',
      expected: '2020/03/01',
    },
    {
      description: 'Can add a year to Feb 28th before a leap year',
      given: '2019/02/28',
      expected: '2020/02/28',
    },
  ];

  addYearToDateTestData.forEach((scenario) => {
    it(scenario.description, () => {
      expect(addYearToDate(scenario.given).format('YYYY/MM/DD')).toBe(scenario.expected);
    });
  });
});

const { addYearToDate } = require('../../server/utils');

describe('Unit test date utilities', () => {
  before(() => {
    expect(addYearToDate).to.be.a('function');
  });

  context('Add year to date', () => {
    it('Can add a year to Feb 29th', () => {
      expect(addYearToDate('2020/02/29').format('YYYY/MM/DD')).to.eq('2021/03/01');
    });

    it('Can add a year normally', () => {
      expect(addYearToDate('2020/02/28').format('YYYY/MM/DD')).to.eq('2021/02/28');
    });
  });
});

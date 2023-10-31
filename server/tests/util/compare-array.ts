import _ from 'lodash';

export const compareArray = (left: any[], right: any[]): boolean =>
  _.difference(left, right).length === 0 && _.difference(right, left).length === 0;

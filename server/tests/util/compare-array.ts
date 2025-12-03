import _ from 'lodash';

export const compareArray = (left: unknown[], right: unknown[]): boolean =>
  _.difference(left, right).length === 0 && _.difference(right, left).length === 0;

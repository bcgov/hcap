export enum InsertStatus {
  SUCCESS = 'Success',
  DUPLICATE = 'Duplicate',
  MISSING_FK = 'Missing Foreign Key',
}

/**
 * Result from a table insertion. See `feed-data` for examples of functions that return this.
 * */
export type InsertResult = {
  table: string;
  id: string;
  status: InsertStatus;
};

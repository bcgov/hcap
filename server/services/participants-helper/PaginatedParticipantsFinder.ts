import { run } from './core';

export class PaginatedParticipantsFinder {
  context;

  constructor(context) {
    this.context = context;
  }

  async run() {
    return run(this.context);
  }
}

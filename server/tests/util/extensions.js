expect.extend({
  // Compares participants as returned to employers from API to raw date
  // The id field is ignore; order of participants is ignored
  toMatchRaw(received, rawParticipants) {
    const employerColumns = [
      // Fields expected to be returned to employers
      'firstName',
      'lastName',
      'postalCodeFsa',
      'preferredLocation',
      'nonHCAP',
      'statusInfo',
      'progressStats',
    ];
    // This massages the raw participants data to the format returned to employers
    // Defaults to undefined nonHCAP field
    const expected = rawParticipants.map((i) =>
      Object.keys(i)
        .filter((k) => employerColumns.includes(k))
        .reduce((o, k) => ({ ...o, [k]: i[k] }), { nonHCAP: undefined })
    );
    // Removes the id field from participants returned to employers
    // This field is arbitrarily assigned and therefore difficult to match in expected array
    const trimIds = (a) =>
      a.map((i) =>
        Object.keys(i)
          .filter((k) => k !== 'id')
          .reduce((o, k) => ({ ...o, [k]: i[k] }), { nonHCAP: undefined })
      );
    // Wrapping expect like this does not actually work
    // The expect function does not function as expected, making wrapping expect matchers difficult
    // We can return {message: string|function, pass: bool} as per https://jestjs.io/docs/en/expect#expectextendmatchers
    return expect(trimIds(received)).toEqual(expect.arrayContaining(expected));
  },
});

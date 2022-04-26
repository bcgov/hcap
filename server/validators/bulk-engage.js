const yup = require('yup');

const BulkEngageParticipantSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    participants: yup.array().of(yup.number().required()).required(),
    sites: yup
      .array()
      .of(
        yup.object().shape({
          id: yup.number().required(),
        })
      )
      .required(),
  });

module.exports = {
  BulkEngageParticipantSchema,
};

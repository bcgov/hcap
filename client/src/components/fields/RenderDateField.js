import React, { Fragment } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ErrorMessage, useField } from 'formik';

import { formatShortDate, stringToDate } from '../../utils';

import { InputFieldError, InputFieldLabel } from '../generic';

export const RenderDateField = ({ field, form, label, boldLabel, placeholder, ...props }) => {
  const [, , helpers] = useField(field.name);
  const { setValue, setTouched } = helpers;
  return (
    <Fragment>
      {label && <InputFieldLabel label={label} boldLabel={boldLabel} />}
      <DatePicker
        format='YYYY/MM/DD'
        name={label.replace(/[ *]/g, '')}
        value={!field.value ? null : stringToDate(field.value)}
        onChange={(value) => setValue(formatShortDate(value))}
        onBlur={() => setTouched(true)}
        slotProps={{
          textField: {
            placeholder: placeholder || 'Please Select',
            variant: 'filled',
            fullWidth: true,
          },
        }}
        disabled={props.disabled ?? false}
        {...props}
      />
      <InputFieldError error={<ErrorMessage name={field.name} />} />
    </Fragment>
  );
};

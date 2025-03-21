import React, { Fragment } from 'react';
import { KeyboardDatePicker } from '@material-ui/pickers';
import { ErrorMessage, useField } from 'formik';

import { formatShortDate, stringToDate } from '../../utils';

import { InputFieldError, InputFieldLabel } from '../generic';

export const RenderDateField = ({ field, form, label, boldLabel, placeholder, ...props }) => {
  const [, , helpers] = useField(field.name);
  const { setValue, setTouched } = helpers;
  return (
    <Fragment>
      {label && <InputFieldLabel label={label} boldLabel={boldLabel} />}
      <KeyboardDatePicker
        format='YYYY/MM/DD'
        name={label.replace(/[ *]/g, '')}
        value={!field.value ? null : stringToDate(field.value)}
        onChange={(value) => setValue(formatShortDate(value))}
        onBlur={() => setTouched(true)}
        invalidDateMessage={null}
        minDateMessage={null}
        maxDateMessage={null}
        placeholder={placeholder || 'Please Select'}
        openTo='date'
        variant='dialog'
        inputVariant='filled'
        fullWidth
        disabled={props.disabled ?? false}
        {...props}
      />
      <InputFieldError error={<ErrorMessage name={field.name} />} />
    </Fragment>
  );
};

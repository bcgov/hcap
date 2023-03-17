import React, { Fragment } from 'react';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import { ErrorMessage } from 'formik';

import { InputFieldError, InputFieldLabel } from '../generic';

export const RenderRadioGroup = ({
  field,
  form,
  label,
  options,
  disabled,
  setTouched,
  hiddenCheckbox,
  boldLabel,
  ...props
}) => {
  const handleChange = (e) => {
    const value = e.target.value;

    if (setTouched) {
      form.setFieldTouched(field.name, true);
    }

    if (value === 'true' || value === 'false') {
      field.onChange({ target: { name: field.name, value: value === 'true' } });
    } else {
      field.onChange({ target: { name: field.name, value } });
    }

    if (props.onChange) {
      if (value === 'true' || value === 'false') {
        props.onChange({ target: { name: field.name, value: value === 'true' } });
      } else {
        props.onChange({ target: { name: field.name, value } });
      }
    }
  };

  return (
    <Fragment>
      {label && <InputFieldLabel label={label} boldLabel={boldLabel} />}
      <RadioGroup {...field} {...props} onChange={handleChange}>
        {options.map(
          (option) =>
            option && (
              <Fragment key={option.value}>
                <FormControlLabel
                  value={option.value}
                  checked={field.value === option.value}
                  label={option.label}
                  disabled={disabled}
                  labelPlacement='end'
                  control={<Radio color={option.color || 'primary'} />}
                />
                {hiddenCheckbox?.fields.includes(field.value) &&
                  option.value === field.value &&
                  hiddenCheckbox.node}
              </Fragment>
            )
        )}
      </RadioGroup>
      <InputFieldError error={<ErrorMessage name={field.name} />} />
    </Fragment>
  );
};

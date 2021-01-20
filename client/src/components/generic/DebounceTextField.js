import React, { useEffect, useState, useRef } from 'react';
import { TextField } from '@material-ui/core';

export const DebounceTextField = ({
  time,
  onDebounce,
  onChange,
  ...props
}) => {
  const [text, setText] = useState(null);
  //wrapping onDebounce using useRef to avoid adding it in the useEffect dependecy list
  const onDebounceRef = useRef(onDebounce);

  useEffect(() => {
    if (!text && text !== '') return;
    const timeout = setTimeout(() => {
      onDebounceRef.current(text)
    }, time);

    return () => clearTimeout(timeout);
  }, [text, time]);

  const handleOnChange = (element) => {
    setText(element.target.value);
    onChange(element);
  };

  return (
    <TextField
      {...props}
      onChange={(element) => handleOnChange(element)}
    />
  )
};
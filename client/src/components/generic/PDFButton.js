import React, { useState } from 'react';

import { ToastStatus } from '../../constants';
import { useToast } from '../../hooks';
import { convertElementToPDF } from '../../utils';

import { Button } from '../../components/generic';

export const PDFButton = ({ onStart = () => {}, onFinish = () => {}, target, fileName, filter }) => {

  const { openToast } = useToast();
  const [isPDFLoading, setPDFLoading] = useState(false);

  const handlePDFClick = async () => {
    const form = document.getElementById(target);
    try {
      setPDFLoading(true);
      onStart();
      await convertElementToPDF(form, fileName, filter);
    } catch (e) {
      openToast({ status: ToastStatus.Error, message: 'Failed to download PDF' });
    } finally {
      setPDFLoading(false);
      onFinish();
    }
  };

  return (
    <Button
      id="downloadBtn"
      text="Download PDF"
      onClick={handlePDFClick}
      loading={isPDFLoading}
    />
  );
};

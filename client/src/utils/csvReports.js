import { saveAs } from 'file-saver';
import {
  ToastStatus,
  DOWNLOAD_DEFAULT_ERROR_MESSAGE,
  DOWNLOAD_DEFAULT_SUCCESS_MESSAGE,
} from '../constants';

export const onReportDownloadResult = async (response, reportFileName) => {
  if (response.ok) {
    const blob = await response.blob();
    saveAs(blob, reportFileName);
    return {
      status: ToastStatus.Success,
      message: response.message || DOWNLOAD_DEFAULT_SUCCESS_MESSAGE,
    };
  }

  return {
    status: ToastStatus.Error,
    message: response.error || response.statusText || DOWNLOAD_DEFAULT_ERROR_MESSAGE,
  };
};

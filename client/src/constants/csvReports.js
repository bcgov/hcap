import { saveAs } from 'file-saver';
import { ToastStatus, DOWNLOAD_DEFAULT_ERROR_MESSAGE, DOWNLOAD_DEFAULT_SUCCESS_MESSAGE } from './';

export const onReportDownloadResult = async (response, reportFileName, openToast) => {
  if (response.ok) {
    const blob = await response.blob();
    saveAs(blob, reportFileName);
    openToast({
      status: ToastStatus.Success,
      message: response.message || DOWNLOAD_DEFAULT_SUCCESS_MESSAGE,
    });
  } else {
    openToast({
      status: ToastStatus.Error,
      message: response.error || response.statusText || DOWNLOAD_DEFAULT_ERROR_MESSAGE,
    });
  }
};

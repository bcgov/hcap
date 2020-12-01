import domtoimage from 'dom-to-image';
import jsPDF from 'jspdf';

export const convertElementToPDF = async (element, fileName, filter = () => true) => {
  const dataUrl = await domtoimage.toPng(element, { filter });
  const i = new Image();
  i.src = dataUrl;
  i.onload = () => {
    let pdf;
    let width = i.width;
    let height = i.height;

    // Set the orientation
    if (width > height) {
      pdf = new jsPDF('l', 'px', [width, height]);
    } else {
      pdf = new jsPDF('p', 'px', [height, width]);
    }

    // Then get the dimensions from the 'pdf' file itself
    width = pdf.internal.pageSize.getWidth();
    height = pdf.internal.pageSize.getHeight();
    pdf.addImage(i.src, 'PNG', 0, 0, width, height);
    pdf.save(fileName);
  };
};

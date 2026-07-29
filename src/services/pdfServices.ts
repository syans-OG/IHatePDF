import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { pdfjsLib } from './pdfWorker';
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';
import PptxGenJS from 'pptxgenjs';
import JSZip from 'jszip';

export interface ProcessingProgress {
  status: string;
  progress: number; // 0 - 100
}

/**
 * Format byte sizes into human readable strings (KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 1. MERGE PDFs (Gabungkan PDF)
 */
export async function mergePDFs(
  files: File[],
  onProgress?: (progress: number, msg: string) => void
): Promise<Uint8Array> {
  onProgress?.(10, 'Creating master PDF document...');
  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(
      10 + Math.floor(((i + 1) / files.length) * 70),
      `Processing file ${i + 1} of ${files.length}: ${file.name}`
    );
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  onProgress?.(90, 'Finalizing merged document...');
  const resultBytes = await mergedPdf.save();
  onProgress?.(100, 'Complete!');
  return resultBytes;
}

/**
 * 2. SPLIT PDF (Pisah PDF)
 */
export async function splitPDF(
  file: File,
  rangeStr?: string,
  onProgress?: (progress: number, msg: string) => void
): Promise<{ filename: string; bytes: Uint8Array }[]> {
  onProgress?.(10, 'Loading PDF for splitting...');
  const arrayBuffer = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(arrayBuffer);
  const totalPages = sourcePdf.getPageCount();

  let pageIndicesToExtract: number[] = [];

  if (rangeStr && rangeStr.trim()) {
    const parts = rangeStr.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map((n) => parseInt(n.trim(), 10));
        if (!isNaN(start) && !isNaN(end)) {
          for (let p = Math.max(1, start); p <= Math.min(totalPages, end); p++) {
            pageIndicesToExtract.push(p - 1);
          }
        }
      } else {
        const p = parseInt(trimmed, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
          pageIndicesToExtract.push(p - 1);
        }
      }
    }
    pageIndicesToExtract = Array.from(new Set(pageIndicesToExtract)).sort((a, b) => a - b);
  } else {
    pageIndicesToExtract = Array.from({ length: totalPages }, (_, i) => i);
  }

  if (pageIndicesToExtract.length === 0) {
    throw new Error('No valid page range specified or pages out of bounds.');
  }

  const results: { filename: string; bytes: Uint8Array }[] = [];

  for (let i = 0; i < pageIndicesToExtract.length; i++) {
    const pageIdx = pageIndicesToExtract[i];
    onProgress?.(
      20 + Math.floor(((i + 1) / pageIndicesToExtract.length) * 70),
      `Extracting page ${pageIdx + 1} of ${totalPages}...`
    );

    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageIdx]);
    newPdf.addPage(copiedPage);

    const pdfBytes = await newPdf.save();
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    results.push({
      filename: `${baseName}_page_${pageIdx + 1}.pdf`,
      bytes: pdfBytes,
    });
  }

  onProgress?.(100, 'Splitting complete!');
  return results;
}

/**
 * 3. JPG TO PDF (Image to PDF)
 */
export async function jpgToPdf(
  files: File[],
  onProgress?: (progress: number, msg: string) => void
): Promise<Uint8Array> {
  onProgress?.(10, 'Initializing PDF canvas...');
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(
      10 + Math.floor(((i + 1) / files.length) * 70),
      `Embedding image ${i + 1} of ${files.length}: ${file.name}`
    );

    const arrayBuffer = await file.arrayBuffer();
    let image;
    if (file.type === 'image/png') {
      image = await pdfDoc.embedPng(arrayBuffer);
    } else {
      image = await pdfDoc.embedJpg(arrayBuffer);
    }

    const { width, height } = image.scale(1.0);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  onProgress?.(90, 'Generating final PDF file...');
  const pdfBytes = await pdfDoc.save();
  onProgress?.(100, 'Complete!');
  return pdfBytes;
}

/**
 * 4. PDF TO JPG (PDF to Images)
 */
export async function pdfToJpg(
  file: File,
  onProgress?: (progress: number, msg: string) => void
): Promise<{ pageNum: number; blob: Blob; dataUrl: string }[]> {
  onProgress?.(10, 'Loading PDF document...');
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const results: { pageNum: number; blob: Blob; dataUrl: string }[] = [];

  for (let i = 1; i <= numPages; i++) {
    onProgress?.(
      10 + Math.floor((i / numPages) * 80),
      `Rendering page ${i} of ${numPages} as high-res image...`
    );

    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (context) {
      await page.render({
        canvasContext: context,
        viewport,
        canvas,
      } as any).promise;

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.92)
      );

      results.push({ pageNum: i, blob, dataUrl });
    }
  }

  onProgress?.(100, 'Conversion complete!');
  return results;
}

/**
 * 5. WORD TO PDF (DOCX to PDF)
 */
export async function wordToPdf(
  file: File,
  onProgress?: (progress: number, msg: string) => void
): Promise<Uint8Array> {
  onProgress?.(15, 'Extracting text content from Word document...');

  const text = await extractTextFromDocx(file);

  onProgress?.(50, 'Building formatted PDF document...');
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  let page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { height, width } = page.getSize();
  let y = height - margin;

  const titleText = file.name.replace(/\.[^/.]+$/, '');
  page.drawText(titleText, {
    x: margin,
    y: y - 20,
    size: 20,
    font: boldFont,
    color: rgb(0.1, 0.15, 0.3),
  });
  y -= 50;

  const lines = text.split('\n');
  const fontSize = 11;
  const lineHeight = 16;

  for (let line of lines) {
    line = line.trim();
    if (!line) {
      y -= lineHeight;
      continue;
    }

    const maxWidth = width - margin * 2;
    const words = line.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const lineWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (lineWidth > maxWidth) {
        if (y < margin + 40) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = height - margin;
        }
        page.drawText(currentLine, {
          x: margin,
          y,
          size: fontSize,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
        y -= lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      if (y < margin + 40) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = height - margin;
      }
      page.drawText(currentLine, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= lineHeight;
    }
  }

  onProgress?.(90, 'Finalizing PDF output...');
  const pdfBytes = await pdfDoc.save();
  onProgress?.(100, 'Word to PDF complete!');
  return pdfBytes;
}

/**
 * 6. PDF TO WORD (PDF to DOCX)
 */
export async function pdfToWord(
  file: File,
  onProgress?: (progress: number, msg: string) => void
): Promise<Blob> {
  onProgress?.(15, 'Reading PDF pages...');
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const paragraphs: Paragraph[] = [];

  paragraphs.push(
    new Paragraph({
      text: file.name.replace(/\.[^/.]+$/, ''),
      heading: HeadingLevel.TITLE,
      spacing: { after: 300 },
    })
  );

  for (let i = 1; i <= numPages; i++) {
    onProgress?.(
      20 + Math.floor((i / numPages) * 60),
      `Extracting text from PDF page ${i} of ${numPages}...`
    );

    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    let lastY: number | null = null;
    let lineText = '';

    for (const item of textContent.items) {
      if ('str' in item) {
        const itemY = Math.round(item.transform[5]);
        if (lastY !== null && Math.abs(itemY - lastY) > 5) {
          if (lineText.trim()) {
            paragraphs.push(
              new Paragraph({
                children: [new TextRun({ text: lineText, size: 24 })],
                spacing: { after: 120 },
              })
            );
          }
          lineText = item.str;
        } else {
          lineText += (lineText ? ' ' : '') + item.str;
        }
        lastY = itemY;
      }
    }

    if (lineText.trim()) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: lineText, size: 24 })],
          spacing: { after: 120 },
        })
      );
    }
  }

  onProgress?.(85, 'Creating Word (.docx) document structure...');
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  onProgress?.(95, 'Packing DOCX file...');
  const blob = await Packer.toBlob(doc);
  onProgress?.(100, 'PDF to Word complete!');
  return blob;
}

/**
 * 7. PPT TO PDF (PPTX to PDF)
 */
export async function pptToPdf(
  file: File,
  onProgress?: (progress: number, msg: string) => void
): Promise<Uint8Array> {
  onProgress?.(20, 'Reading PowerPoint slides...');
  const text = await extractTextFromPptx(file);

  onProgress?.(50, 'Converting slides to landscape PDF...');
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const slidesText = text.split(/Slide \d+:/i).filter((t) => t.trim());

  if (slidesText.length === 0) {
    slidesText.push(text || 'PowerPoint Presentation');
  }

  for (let i = 0; i < slidesText.length; i++) {
    const slideContent = slidesText[i].trim();
    const page = pdfDoc.addPage([960, 540]);
    
    page.drawRectangle({
      x: 0,
      y: 480,
      width: 960,
      height: 60,
      color: rgb(0.08, 0.12, 0.22),
    });

    page.drawText(`Slide ${i + 1}`, {
      x: 40,
      y: 500,
      size: 20,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    const lines = slideContent.split('\n');
    let y = 430;
    for (const line of lines) {
      if (!line.trim()) continue;
      page.drawText(line.trim(), {
        x: 50,
        y,
        size: 14,
        font,
        color: rgb(0.2, 0.2, 0.25),
      });
      y -= 24;
      if (y < 40) break;
    }
  }

  onProgress?.(90, 'Saving presentation PDF...');
  const bytes = await pdfDoc.save();
  onProgress?.(100, 'PPT to PDF complete!');
  return bytes;
}

/**
 * 8. PDF TO PPT (PDF to PPTX)
 */
export async function pdfToPpt(
  file: File,
  onProgress?: (progress: number, msg: string) => void
): Promise<Blob> {
  onProgress?.(15, 'Loading PDF for presentation export...');
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  for (let i = 1; i <= numPages; i++) {
    onProgress?.(
      20 + Math.floor((i / numPages) * 65),
      `Rendering page ${i} as high-res slide image...`
    );

    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (context) {
      await page.render({
        canvasContext: context,
        viewport,
        canvas,
      } as any).promise;
      const imgDataUrl = canvas.toDataURL('image/jpeg', 0.95);

      const slide = pptx.addSlide();
      slide.background = { fill: '0B0F19' };
      slide.addImage({
        data: imgDataUrl,
        x: 0.5,
        y: 0.5,
        w: 9.0,
        h: 4.6,
      });
    }
  }

  onProgress?.(90, 'Compiling PPTX file...');
  const blob = (await pptx.write({ outputType: 'blob' })) as Blob;
  onProgress?.(100, 'PDF to PPTX complete!');
  return blob;
}

/**
 * 9. COMPRESS PDF (Kompres PDF)
 */
export async function compressPdf(
  file: File,
  _qualityLevel: 'low' | 'medium' | 'high' = 'medium',
  onProgress?: (progress: number, msg: string) => void
): Promise<Uint8Array> {
  onProgress?.(15, 'Analyzing PDF structures for compression...');
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  onProgress?.(50, 'Optimizing streams and re-encoding page objects...');
  const compressedBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  onProgress?.(100, 'Compression complete!');
  return compressedBytes;
}

/**
 * 10. 🔥 TROLL FEATURE: INFLATE PDF / FILE BLOATER
 */
export async function inflatePdf(
  file: File,
  targetMB: number,
  trollMessage?: string,
  onProgress?: (progress: number, msg: string) => void
): Promise<Uint8Array> {
  onProgress?.(10, 'Initializing PDF Heavy Particle Synthesizer...');

  const originalBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(originalBuffer);

  const targetBytes = Math.max(originalBuffer.byteLength + 1024 * 1024, targetMB * 1024 * 1024);
  let bytesNeeded = targetBytes - originalBuffer.byteLength;

  onProgress?.(25, `Injecting ${formatBytes(bytesNeeded)} of heavy dummy streams...`);

  if (trollMessage) {
    const sanitizedText = trollMessage.replace(/[^\x00-\x7F]/g, '');
    if (sanitizedText) {
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const lastPage = pages[pages.length - 1];
      lastPage.drawText(`[iHatePDF Bloat Notice]: ${sanitizedText}`, {
        x: 10,
        y: 10,
        size: 7,
        font,
        color: rgb(0.8, 0, 0.2),
      });
    }
  }

  const CHUNK_SIZE = 5 * 1024 * 1024;
  let addedSoFar = 0;

  while (bytesNeeded > 0) {
    const thisChunkSize = Math.min(bytesNeeded, CHUNK_SIZE);
    const junkData = new Uint8Array(thisChunkSize);

    for (let i = 0; i < thisChunkSize; i += 128) {
      junkData[i] = (i % 254) + 1;
    }

    const junkStream = pdfDoc.context.stream(junkData, {
      Type: 'XObject',
      Subtype: 'Form',
      BBox: [0, 0, 100, 100],
      Length: thisChunkSize,
      TrollComment: pdfDoc.context.obj(`BloatPayloadChunk_${addedSoFar}`),
    });

    pdfDoc.context.register(junkStream);

    bytesNeeded -= thisChunkSize;
    addedSoFar += thisChunkSize;

    const percent = 25 + Math.floor((addedSoFar / (targetBytes - originalBuffer.byteLength)) * 65);
    onProgress?.(percent, `Bloating... Synthesized ${formatBytes(addedSoFar)} of fake payload.`);
  }

  onProgress?.(92, 'Packing heavy swollen PDF binary...');
  const swollenBytes = await pdfDoc.save({ useObjectStreams: false });
  
  onProgress?.(100, 'PDF Inflation complete! Ready to bomb storage limits!');
  return swollenBytes;
}

/**
 * Internal Helper: Extract text from DOCX using JSZip + XML parsing
 */
async function extractTextFromDocx(file: File): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const docXml = await zip.file('word/document.xml')?.async('text');
    if (!docXml) return 'Could not read document.xml inside file.';

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docXml, 'text/xml');
    const pElements = xmlDoc.getElementsByTagName('w:p');

    const lines: string[] = [];
    for (let i = 0; i < pElements.length; i++) {
      const tElements = pElements[i].getElementsByTagName('w:t');
      let pText = '';
      for (let j = 0; j < tElements.length; j++) {
        pText += tElements[j].textContent || '';
      }
      lines.push(pText);
    }
    return lines.join('\n');
  } catch (err) {
    console.error('Docx parse error:', err);
    return 'Text extracted from file ' + file.name;
  }
}

/**
 * Internal Helper: Extract text from PPTX using JSZip + XML parsing
 */
async function extractTextFromPptx(file: File): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const slideFiles = Object.keys(zip.files).filter(
      (path) => path.startsWith('ppt/slides/slide') && path.endsWith('.xml')
    );

    slideFiles.sort((a, b) => {
      const numA = parseInt(a.replace(/[^0-9]/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/[^0-9]/g, ''), 10) || 0;
      return numA - numB;
    });

    const slidesContent: string[] = [];
    const parser = new DOMParser();

    for (let i = 0; i < slideFiles.length; i++) {
      const slideXml = await zip.file(slideFiles[i])?.async('text');
      if (!slideXml) continue;

      const xmlDoc = parser.parseFromString(slideXml, 'text/xml');
      const tElements = xmlDoc.getElementsByTagName('a:t');
      let slideText = '';
      for (let j = 0; j < tElements.length; j++) {
        slideText += (tElements[j].textContent || '') + ' ';
      }
      slidesContent.push(`Slide ${i + 1}:\n${slideText.trim()}`);
    }

    return slidesContent.join('\n\n');
  } catch (err) {
    console.error('PPTX parse error:', err);
    return 'PowerPoint file content extracted from ' + file.name;
  }
}

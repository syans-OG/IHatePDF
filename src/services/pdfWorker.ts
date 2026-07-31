import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Use local bundled worker to guarantee version match and avoid CDN issues
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

export { pdfjsLib };
